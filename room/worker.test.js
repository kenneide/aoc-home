import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { slots } from '../meet/calendar.js';

const hook = registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'cloudflare:workers') {
      return { shortCircuit: true, url: 'data:text/javascript,export class DurableObject { constructor(ctx, env) { this.ctx = ctx; this.env = env; } }' };
    }
    return next(specifier, context);
  },
});
const { Bookings, default: worker } = await import('./worker.js');
hook.deregister();

function database(t) {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  const storage = {
    sql: {
      exec(query, ...args) {
        if (args.length) return db.prepare(query).run(...args);
        return query.startsWith('SELECT') ? db.prepare(query).all() : db.exec(query);
      },
    },
    deleteAlarm: async () => {},
    setAlarm: async () => {},
  };
  const collection = 'https://calendar.example/meetings/';
  const bookings = new Bookings({ storage }, {
    CALENDAR_PROVIDER: 'caldav', CALENDAR_USER: 'test', CALENDAR_PASSWORD: 'test',
    WRITE_CALENDAR: collection, BUSY_CALENDARS: '[]', CALENDAR_HOSTS: '["calendar.example"]',
  });
  return { bookings, collection };
}

const free = () => new Response('BEGIN:VCALENDAR\r\nBEGIN:VFREEBUSY\r\nEND:VFREEBUSY\r\nEND:VCALENDAR');
const booking = (id, start) => ({ id, start, duration: 30, name: 'Visitor', email: '', phone: '' });

test('reserves overlapping submissions and allows the calendar owner to reopen a slot', async t => {
  const { bookings } = database(t);
  let event;
  let writes = 0;
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    if (options.method === 'REPORT') {
      if (!event) return free();
      const times = ['DTSTART', 'DTEND'].map(key => event.match(new RegExp(key + ':([^\r\n]+)'))[1]);
      return new Response('BEGIN:VCALENDAR\r\nBEGIN:VFREEBUSY\r\nFREEBUSY:' + times.join('/') +
        '\r\nEND:VFREEBUSY\r\nEND:VCALENDAR');
    }
    if (options.method === 'GET') return event ? new Response(event) : new Response(null, { status: 404 });
    assert.equal(options.headers['If-None-Match'], '*');
    writes++;
    event = options.body;
    return new Response(null, { status: 201 });
  });
  const start = slots(Date.now(), 30, [])[0];
  const first = bookings.submit(booking('one', start));
  assert.equal((await bookings.submit(booking('two', start))).code, 409);
  assert.deepEqual(await first, {});
  assert.deepEqual(await bookings.submit(booking('one', start)), {});
  assert.equal(writes, 1);
  assert.match(event, /CLASS:PRIVATE/);
  assert.deepEqual(bookings.records(), [{ id: 'one', start, end: start + 1_800_000 }]);
  assert.ok(!(await bookings.available(30)).includes(start));
  event = undefined;
  assert.ok((await bookings.available(30)).includes(start));
});

test('recovers a lost write response by looking up the stable event ID', async t => {
  const { bookings } = database(t);
  let event;
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    if (options.method === 'REPORT') return free();
    if (options.method === 'GET') return event ? new Response(event) : new Response(null, { status: 404 });
    assert.equal(event, undefined);
    event = options.body;
    throw Error('Connection lost after write');
  });
  const data = { ...booking('one', slots(Date.now(), 30, [])[0]), email: 'visitor@example.com', phone: '+31 1234' };
  await assert.rejects(bookings.submit(data), /Connection lost/);
  assert.deepEqual(await bookings.submit(data), {});
  assert.match(event, /visitor@example.com/);
  assert.match(event, /\+31 1234/);
  assert.ok(!JSON.stringify(bookings.records()).includes('visitor@example.com'));
});
