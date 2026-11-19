import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarProvider, meetingFile, readBusy, slots } from './calendar.js';

const utc = Date.parse;
const lines = (...items) => items.join('\r\n');

test('slots respect Amsterdam DST, duration, notice, weekends and conflicts', () => {
  const now = utc('2026-03-26T07:30:01Z');
  const fridayConflict = { start: utc('2026-03-27T09:00Z'), end: utc('2026-03-27T09:30Z') };
  const result = slots(now, 60, [fridayConflict]);
  assert.equal(result[0], utc('2026-03-27T08:00Z'));
  assert.ok(!result.includes(utc('2026-03-27T08:30Z')));
  assert.ok(result.includes(utc('2026-03-27T09:30Z')));
  assert.ok(result.includes(utc('2026-03-30T07:00Z')));
  assert.ok(!result.includes(utc('2026-03-30T14:30Z')));
  assert.ok(!result.includes(utc('2026-03-28T08:00Z')));
  assert.ok(!result.includes(utc('2026-05-01T08:00Z')));
});

test('availability extracts only busy intervals and ignores cancelled and transparent events', () => {
  const calendar = lines('BEGIN:VCALENDAR', 'VERSION:2.0',
    'BEGIN:VEVENT', 'UID:a', 'SUMMARY:Private', 'DTSTART;VALUE=DATE:20260330', 'DTEND;VALUE=DATE:20260331', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:b', 'STATUS:CANCELLED', 'DTSTART:20260331T100000Z', 'DTEND:20260331T110000Z', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:c', 'TRANSP:TRANSPARENT', 'DTSTART:20260331T110000Z', 'DTEND:20260331T120000Z', 'END:VEVENT',
    'END:VCALENDAR');
  assert.deepEqual(readBusy(calendar), [{ start: utc('2026-03-29T22:00Z'), end: utc('2026-03-30T22:00Z') }]);
});

test('calendar file preserves UTC times, location and stable UID', () => {
  const booking = { id: 'test', start: utc('2026-03-30T09:00Z'), end: utc('2026-03-30T10:00Z'),
    approvedAt: utc('2026-03-28T08:00Z'), location: 'Room 4, Amsterdam' };
  const file = meetingFile(booking);
  assert.match(file, /UID:test@meet\.alanocinneide\.com/);
  assert.match(file, /LOCATION:Room 4\\, Amsterdam/);
  assert.deepEqual(readBusy(file), [{ start: booking.start, end: booking.end }]);
});

test('CalDAV uses selected sources and falls back to expanded instances', async t => {
  const collection = 'https://calendar.example/meeting/';
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, collection);
    assert.equal(options.method, 'REPORT');
    if (options.body.includes('free-busy-query')) return new Response(null, { status: 405 });
    assert.match(options.body, /<c:expand start=/);
    return new Response(`<d:multistatus xmlns:d="DAV:"><d:response><d:propstat>
      <d:status>HTTP/1.1 200 OK</d:status><d:prop><calendar-data>BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:series
RECURRENCE-ID:20260330T090000Z
DTSTART:20260330T100000Z
DTEND:20260330T110000Z
END:VEVENT
END:VCALENDAR
</calendar-data></d:prop></d:propstat></d:response></d:multistatus>`, { status: 207 });
  });
  const provider = calendarProvider({
    CALENDAR_PROVIDER: 'caldav', CALENDAR_USER: 'guest', CALENDAR_PASSWORD: 'test',
    BUSY_CALENDARS: JSON.stringify([collection]), WRITE_CALENDAR: collection,
    CALENDAR_HOSTS: '["calendar.example"]',
  });
  assert.deepEqual(await provider.busy({ start: utc('2026-03-30'), end: utc('2026-03-31') }),
    [{ start: utc('2026-03-30T10:00Z'), end: utc('2026-03-30T11:00Z') }]);
});

test('CalDAV preserves REPORT across Apple shard redirects and rejects untrusted destinations', async t => {
  const path = '/account/calendars/room/';
  const source = 'https://p131-caldav.icloud.com' + path;
  const destination = 'https://p30-caldav.icloud.com' + path;
  let redirect = destination;
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, method: options.method });
    if (url === source) return new Response(null, { status: 302, headers: { Location: redirect } });
    assert.equal(url, destination);
    return new Response('BEGIN:VCALENDAR\r\nBEGIN:VFREEBUSY\r\nEND:VFREEBUSY\r\nEND:VCALENDAR');
  });
  const provider = calendarProvider({
    CALENDAR_PROVIDER: 'caldav', CALENDAR_USER: 'test', CALENDAR_PASSWORD: 'test',
    WRITE_CALENDAR: source, BUSY_CALENDARS: '[]', CALENDAR_HOSTS: '["p131-caldav.icloud.com"]',
  });
  const range = { start: Date.now(), end: Date.now() + 60_000 };
  assert.deepEqual(await provider.busy(range), []);
  assert.deepEqual(calls, [{ url: source, method: 'REPORT' }, { url: destination, method: 'REPORT' }]);
  redirect = 'https://example.com' + path;
  await assert.rejects(provider.busy(range), /Calendar redirect rejected/);
  assert.equal(calls.length, 3);
});
