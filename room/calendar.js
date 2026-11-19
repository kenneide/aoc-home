import ICAL from 'ical.js';
import { calendarProvider as caldav } from '../meet/calendar.js';

const eventDomain = 'room.alanocinneide.com';

export function roomEvent(booking) {
  const calendar = new ICAL.Component('vcalendar');
  calendar.updatePropertyWithValue('version', '2.0');
  calendar.updatePropertyWithValue('prodid', '-//Alan O Cinneide Software BV//Room//EN');
  const event = new ICAL.Event();
  event.uid = booking.id + '@' + eventDomain;
  event.summary = 'Room booking — ' + booking.name;
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
const adapters = { caldav: env => caldav(env, { eventDomain, serialize: roomEvent }) };

export function roomCalendar(env) {
  if (!Object.hasOwn(adapters, env.CALENDAR_PROVIDER)) throw Error('Calendar provider is not configured');
  return adapters[env.CALENDAR_PROVIDER](env);
}
