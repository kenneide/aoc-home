import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { validBooking } from './hours.js';
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

test('calendar subscription emits only busy blocks and no private event details', async () => {
  const start = Math.floor(Date.now() / 1000) * 1000 + 3600_000;
  const privateEvent = { start, end: start + 1800_000, id: 'internal-id', name: 'Private guest',
    email: 'private@example.com', phone: '123456789', location: 'Private location' };
  const env = {
    BOOKING_OPEN: 'true',
    PUBLIC_LIMIT: { limit: async () => ({ success: true }) },
    BOOKINGS: { getByName: () => ({ busy: async () => [privateEvent, privateEvent] }) },
  };
  const response = await worker.fetch(new Request('https://room.alanocinneide.com/availability.ics'), env);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('Content-Type'), /^text\/calendar/);
  const feed = await response.text();
  assert.equal(feed.match(/BEGIN:VEVENT/g).length, 1);
  assert.match(feed, /SUMMARY:Busy\r\n/);
  assert.match(feed, /DTSTART:\d{8}T\d{6}Z/);
  assert.match(feed, /DTEND:\d{8}T\d{6}Z/);
  assert.doesNotMatch(feed, /Private|example\.com|internal-id|123456789|DESCRIPTION|ATTENDEE|LOCATION/);
});


test('booking hours allow same-day and non-grid bookings on weekdays across daylight saving changes', () => {
  const utc = value => Date.parse(value);
  const now = utc('2026-03-30T06:01Z');
  assert.ok(validBooking(utc('2026-03-30T06:02Z'), utc('2026-03-30T13:57Z'), now));
  assert.ok(validBooking(utc('2026-03-30T15:59Z'), utc('2026-03-30T16:00Z'), now));
  assert.ok(!validBooking(now, now + 60_000, now));
  assert.ok(!validBooking(utc('2026-03-30T05:59Z'), utc('2026-03-30T06:01Z'), now - 3600_000));
  assert.ok(!validBooking(utc('2026-03-30T15:59Z'), utc('2026-03-30T16:01Z'), now));
  assert.ok(!validBooking(utc('2026-05-01T08:00Z'), utc('2026-05-01T08:30Z'), now));
  assert.ok(validBooking(utc('2026-10-26T07:00Z'), utc('2026-10-26T17:00Z'), utc('2026-10-26T06:59Z')));
});

test('submission rejects Saturday and Sunday before contacting the calendar', async t => {
  const { bookings } = database(t);
  const now = Date.parse('2026-03-27T08:00Z');
  t.mock.method(Date, 'now', () => now);
  const saturday = Date.parse('2026-03-28T09:00Z');
  const sunday = Date.parse('2026-03-29T09:00Z');
  for (const start of [saturday, sunday]) {
    assert.equal((await bookings.submit(booking('weekend', start))).code, 409);
  }
  assert.deepEqual(bookings.records(), []);
});
