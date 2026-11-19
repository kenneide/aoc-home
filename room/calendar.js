import ICAL from 'ical.js';
import { calendarProvider as caldav } from '../meet/calendar.js';

import config from './settings.js';

const eventDomain = new URL(config.site.origin).hostname;
const product = '-//' + eventDomain + '//Room Booking//EN';

export function roomEvent(booking) {
  const calendar = new ICAL.Component('vcalendar');
  calendar.updatePropertyWithValue('version', '2.0');
  calendar.updatePropertyWithValue('prodid', product);
  const event = new ICAL.Event();
  event.uid = booking.id + '@' + eventDomain;
  event.summary = config.site.roomName + ' booking — ' + booking.name;
  event.description = [booking.email && 'Email: ' + booking.email, booking.phone && 'Phone: ' + booking.phone]
    .filter(Boolean).join('\n');
  event.component.updatePropertyWithValue('class', 'PRIVATE');
  for (const [key, value] of [['dtstart', booking.start], ['dtend', booking.end], ['dtstamp', booking.created]]) {
    event.component.updatePropertyWithValue(key, ICAL.Time.fromJSDate(new Date(value), true));
  }
  calendar.addSubcomponent(event.component);
  return calendar.toString() + '\r\n';
}

// Each adapter returns busy(range), exists(booking), and idempotent create(booking).
const adapters = {
  caldav: (env, calendar) => caldav({
    CALENDAR_PROVIDER: 'caldav',
    CALENDAR_USER: env.CALENDAR_USER,
    CALENDAR_PASSWORD: env.CALENDAR_PASSWORD,
    WRITE_CALENDAR: env.WRITE_CALENDAR,
    BUSY_CALENDARS: env.BUSY_CALENDARS ?? '[]',
    CALENDAR_HOSTS: JSON.stringify(calendar.hosts),
  }, { eventDomain, serialize: roomEvent, calendarZone: config.schedule.zone }),
};

export function roomCalendar(env, calendar = config.calendar) {
  if (!Object.hasOwn(adapters, calendar.provider)) throw Error('Calendar provider is not configured');
  return adapters[calendar.provider](env, calendar);
}

export function availabilityCalendar(intervals, range) {
  const calendar = new ICAL.Component('vcalendar');
  calendar.updatePropertyWithValue('version', '2.0');
  calendar.updatePropertyWithValue('prodid', product);
  calendar.updatePropertyWithValue('x-wr-calname', config.site.roomName + ' availability');
  const utc = instant => ICAL.Time.fromJSDate(new Date(instant), true);
  const seen = new Set();
  for (const { start, end } of intervals) {
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) ||
        end <= start || end <= range.start || start >= range.end) continue;
    const uid = start + '-' + end + '@' + eventDomain;
    if (seen.has(uid)) continue;
    seen.add(uid);
    const event = new ICAL.Event();
    event.uid = uid;
    event.summary = 'Busy';
    event.startDate = utc(start);
    event.endDate = utc(end);
    event.component.updatePropertyWithValue('dtstamp', utc(range.start));
    calendar.addSubcomponent(event.component);
  }
  return calendar.toString() + '\r\n';
}
