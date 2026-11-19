import ICAL from 'ical.js';
import { XMLParser } from 'fast-xml-parser';

export const zone = 'Europe/Amsterdam';
const minute = 60_000;
const day = 1440 * minute;
const grid = 30 * minute;
const local = new Intl.DateTimeFormat('en-GB', {
  timeZone: zone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function overlaps(a, b) {
  return a.start < b.end && b.start < a.end;
}

export function slots(now, duration, busy) {
  const result = [];
  for (let start = Math.ceil((now + day) / grid) * grid; start + duration * minute <= now + 30 * day; start += grid) {
    const parts = Object.fromEntries(local.formatToParts(start).map(({ type, value }) => [type, value]));
    const time = Number(parts.hour) * 60 + Number(parts.minute);
    const slot = { start, end: start + duration * minute };
    if (!['Sat', 'Sun'].includes(parts.weekday) && time >= 540 && time + duration <= 1020 &&
        !busy.some(interval => overlaps(slot, interval))) result.push(start);
  }
  return result;
}

function timestamp(value) {
  return new Date(value).toISOString().replace(/[-:]|\.\d{3}/g, '');
}

function millis(time) {
  if (time.zone.tzid !== 'floating') return time.toUnixTime() * 1000;
  const wall = Date.UTC(time.year, time.month - 1, time.day, time.hour, time.minute, time.second);
  const offset = new Intl.DateTimeFormat('en', {
    timeZone: zone, timeZoneName: 'shortOffset',
  });
  const getOffset = instant => {
    const value = offset.formatToParts(instant).find(part => part.type === 'timeZoneName').value;
    const [, sign, hours, minutes = '0'] = value.match(/^GMT([+-])(\d+)(?::(\d+))?$/) ?? [];
    return hours ? (sign === '-' ? -1 : 1) * (Number(hours) * 60 + Number(minutes)) * minute : 0;
  };
  return wall - getOffset(wall - getOffset(wall));
}

export function readBusy(source) {
  const calendar = new ICAL.Component(ICAL.parse(source));
  if (calendar.name !== 'vcalendar') throw Error('Unexpected calendar response');
  const intervals = [];
  for (const component of calendar.getAllSubcomponents('vfreebusy')) {
    for (const property of component.getAllProperties('freebusy')) {
      if (property.getParameter('fbtype') === 'FREE') continue;
      for (const period of property.getValues()) {
        intervals.push({ start: millis(period.start), end: millis(period.getEnd()) });
      }
    }
  }
  for (const component of calendar.getAllSubcomponents('vevent')) {
    if (component.getFirstPropertyValue('status') === 'CANCELLED' ||
        component.getFirstPropertyValue('transp') === 'TRANSPARENT') continue;
    const event = new ICAL.Event(component);
    if (event.isRecurring()) throw Error('Calendar did not expand recurrence');
    const start = millis(event.startDate);
    const end = millis(event.endDate);
    if (end > start) intervals.push({ start, end });
  }
  return intervals;
}

export function meetingFile(booking) {
  const calendar = new ICAL.Component('vcalendar');
  calendar.updatePropertyWithValue('version', '2.0');
  calendar.updatePropertyWithValue('prodid', '-//Alan O Cinneide Software BV//Meetings//EN');
  const event = new ICAL.Event();
  event.uid = booking.id + '@meet.alanocinneide.com';
  event.summary = 'Meeting with Alan O Cinneide';
  event.location = booking.location;
  for (const [key, value] of [['dtstart', booking.start], ['dtend', booking.end], ['dtstamp', booking.approvedAt]]) {
    event.component.updatePropertyWithValue(key, ICAL.Time.fromJSDate(new Date(value), true));
  }
  calendar.addSubcomponent(event.component);
  return calendar.toString() + '\r\n';
}

export function calendarProvider(env) {
  if (env.CALENDAR_PROVIDER !== 'caldav' || !env.CALENDAR_USER || !env.CALENDAR_PASSWORD) throw Error('Calendar setup required');
  function collection(value) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
        !url.pathname.endsWith('/') || !JSON.parse(env.CALENDAR_HOSTS).includes(url.hostname)) {
      throw Error('Invalid calendar collection');
    }
    return url.href;
  }
  const target = collection(env.WRITE_CALENDAR);
  const calendars = [...new Set([...JSON.parse(env.BUSY_CALENDARS).map(collection), target])];
  const auth = 'Basic ' + btoa(String.fromCharCode(...new TextEncoder().encode(env.CALENDAR_USER + ':' + env.CALENDAR_PASSWORD)));
  async function request(url, method, headers, body) {
    return fetch(url, {
      method, headers: { Authorization: auth, ...headers }, body,
      redirect: 'error', signal: AbortSignal.timeout(8000),
    });
  }
  async function busyAt(url, { start, end }) {
    const range = `start="${timestamp(start)}" end="${timestamp(end)}"`;
    const report = xml => request(url, 'REPORT', { Depth: '1', 'Content-Type': 'application/xml' }, xml);
    const free = await report(`<c:free-busy-query xmlns:c="urn:ietf:params:xml:ns:caldav"><c:time-range ${range}/></c:free-busy-query>`);
    if (free.ok) {
      const body = await free.text();
      if (body.includes('BEGIN:VFREEBUSY')) return readBusy(body);
    } else if (![400, 403, 405, 501].includes(free.status)) {
      throw Error('Free/busy unavailable');
    }
    const response = await report(`<c:calendar-query xmlns:c="urn:ietf:params:xml:ns:caldav" xmlns:d="DAV:">
      <d:prop><c:calendar-data><c:expand ${range}/></c:calendar-data></d:prop>
      <c:filter><c:comp-filter name="VCALENDAR"><c:comp-filter name="VEVENT"><c:time-range ${range}/></c:comp-filter></c:comp-filter></c:filter>
      </c:calendar-query>`);
    if (response.status !== 207) throw Error('Calendar query unavailable');
    const parser = new XMLParser({
      removeNSPrefix: true, parseTagValue: false, trimValues: false,
      isArray: name => ['response', 'propstat'].includes(name),
      processEntities: { maxTotalExpansions: 0 },
    });
    const xml = await response.text();
    if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw Error('Unsupported calendar response');
    const result = parser.parse(xml).multistatus;
    if (result === undefined) throw Error('Invalid calendar response');
    return (result.response ?? []).flatMap(item => {
      const data = item.propstat?.find(prop => /\s200\s/.test(prop.status))?.prop?.['calendar-data'];
      if (typeof data !== 'string') throw Error('Calendar data missing');
      return readBusy(data);
    });
  }
  const eventUrl = booking => target + encodeURIComponent(booking.id) + '.ics';
  return {
    async busy(range) {
      return (await Promise.all(calendars.map(url => busyAt(url, range)))).flat();
    },
    async exists(booking) {
      const result = await request(eventUrl(booking), 'GET');
      if (result.status === 404) return false;
      if (!result.ok) throw Error('Calendar event lookup unavailable');
      const event = new ICAL.Component(ICAL.parse(await result.text())).getFirstSubcomponent('vevent');
      if (event?.getFirstPropertyValue('uid') !== booking.id + '@meet.alanocinneide.com') throw Error('Unexpected calendar event');
      return true;
    },
    async create(booking) {
      const result = await request(eventUrl(booking), 'PUT', {
        'If-None-Match': '*', 'Content-Type': 'text/calendar; charset=utf-8',
      }, meetingFile(booking));
      if (!result.ok && !(result.status === 412 && await this.exists(booking))) throw Error('Calendar write unavailable');
    },
  };
}
