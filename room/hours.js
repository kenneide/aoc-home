import config from './settings.js';

export const minute = 60_000;
export const day = 1440 * minute;
export const { zone, timeLabel, slotMinutes, opensAt, closesAt, days, windowDays } = config.schedule;
export const clock = hour => String(Math.floor(hour)).padStart(2, '0') + ':' +
  String(Math.round((hour % 1) * 60)).padStart(2, '0');
const date = new Intl.DateTimeFormat('sv-SE', { timeZone: zone, dateStyle: 'short' });
const offset = new Intl.DateTimeFormat('en-GB', { timeZone: zone, timeZoneName: 'longOffset' });

export function roomDay(key) {
  const midnight = Date.parse(key + 'T00:00:00Z');
  function instant(hour) {
    const wall = midnight + Math.round(hour * 60) * minute;
    const shift = value => {
      const part = offset.formatToParts(value).find(item => item.type === 'timeZoneName').value;
      const [, sign, hours, minutes] = /^GMT([+-])(\d\d):(\d\d)$/.exec(part) ?? [];
      return hours ? (Number(hours) * 60 + Number(minutes)) * minute * (sign === '-' ? -1 : 1) : 0;
    };
    return wall - shift(wall - shift(wall));
  }
  return { start: instant(opensAt), end: instant(closesAt), instant };
}

export function bookingWindow(now) {
  return { start: now, end: now + windowDays * day };
}

export function validBooking(start, end, now) {
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start % minute || end % minute ||
      start <= now || end <= start || end > bookingWindow(now).end) return false;
  const key = date.format(start);
  const weekday = new Date(key + 'T00:00:00Z').getUTCDay();
  if (!days.includes(weekday)) return false;
  const hours = roomDay(key);
  return start >= hours.start && end <= hours.end;
}
