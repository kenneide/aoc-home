import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { slots } from './calendar.js';

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
  let alarm = null;
  const storage = {
    sql: {
      exec(query, ...args) {
        if (args.length) return db.prepare(query).run(...args);
        return query.startsWith('SELECT') ? db.prepare(query).all() : db.exec(query);
      },
    },
    transactionSync(action) {
      db.exec('BEGIN');
      try {
        const result = action();
        db.exec('COMMIT');
        return result;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
    getAlarm: async () => alarm,
    setAlarm: async time => { alarm = time; },
  };
  const collection = 'https://calendar.example/meetings/';
  const bookings = new Bookings({ storage }, {
    CALENDAR_PROVIDER: 'caldav', CALENDAR_USER: 'test', CALENDAR_PASSWORD: 'test',
    WRITE_CALENDAR: collection, BUSY_CALENDARS: '[]', CALENDAR_HOSTS: '["calendar.example"]',
  });
  return { bookings, collection };
}

const free = () => new Response('BEGIN:VCALENDAR\r\nBEGIN:VFREEBUSY\r\nEND:VFREEBUSY\r\nEND:VCALENDAR');
const booking = (id, start) => ({ id, start, duration: 30, name: id, email: id + '@example.com', note: '' });

test('pending requests do not write or hide slots and concurrent approval writes once', async t => {
  const { bookings } = database(t);
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let writes = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (options.method === 'REPORT') return free();
    if (options.method === 'GET') return new Response(null, { status: 404 });
    assert.equal(options.method, 'PUT');
    assert.equal(options.headers['If-None-Match'], '*');
    writes++;
    await gate;
    return new Response(null, { status: 201 });
  });
  const start = slots(Date.now(), 30, [])[1];
  assert.deepEqual(await bookings.submit(booking('one', start)), { status: 'pending' });
  assert.deepEqual(await bookings.submit(booking('one', start)), { status: 'pending' });
  await bookings.submit(booking('two', start));
  assert.equal(writes, 0);
  assert.ok((await bookings.available(30)).includes(start));
  const first = bookings.decide({ id: 'one', decision: 'approve', location: 'Room 4' });
  const second = await bookings.decide({ id: 'two', decision: 'approve', location: 'Room 4' });
  release();
  assert.equal(second.status, 409);
  assert.deepEqual(await first, { status: 'approved' });
  assert.equal(writes, 1);
  assert.deepEqual(bookings.list().map(item => item.state), ['approved', 'declined']);
  assert.deepEqual(bookings.rows('mail').map(job => job.kind), ['new', 'new', 'approved', 'declined']);
});

test('a lost calendar response is reconciled by event UID before confirmation', async t => {
  const { bookings } = database(t);
  let saved;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (options.method === 'REPORT') return free();
    if (options.method === 'GET') return saved ? new Response(saved) : new Response(null, { status: 404 });
    saved = options.body;
    throw Error('connection reset after write');
  });
  const start = slots(Date.now(), 30, [])[1];
  await bookings.submit(booking('one', start));
  const result = await bookings.decide({ id: 'one', decision: 'approve', location: 'Room 4' });
  assert.equal(result.status, 503);
  const [writing] = bookings.list();
  assert.equal(writing.state, 'writing');
  assert.deepEqual(bookings.rows('mail').map(job => job.kind), ['new']);
  assert.deepEqual(await bookings.finish(writing), { status: 'approved' });
  assert.deepEqual(bookings.rows('mail').map(job => job.kind), ['new', 'approved']);
});

test('anonymous inbox requests are rejected before accessing booking data', async () => {
  for (const path of ['/owner', '/owner/api/requests', '/owner/api/decision']) {
    const result = await worker.fetch(new Request('https://meet.example' + path), {});
    assert.equal(result.status, 403);
  }
});
