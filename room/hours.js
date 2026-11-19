export const minute = 60_000;
export const day = 1440 * minute;
export const opensAt = 8;
export const closesAt = 23;
// The Hague uses the Netherlands' IANA time zone.
export const zone = 'Europe/Amsterdam';
const date = new Intl.DateTimeFormat('sv-SE', { timeZone: zone, dateStyle: 'short' });
const offset = new Intl.DateTimeFormat('en-GB', { timeZone: zone, timeZoneName: 'longOffset' });

export function roomDay(key) {
  const midnight = Date.parse(key + 'T00:00:00Z');
  const noon = midnight + 12 * 60 * minute;
  const part = offset.formatToParts(noon).find(item => item.type === 'timeZoneName').value;
  const [, sign, hours, minutes] = /^GMT([+-])(\d\d):(\d\d)$/.exec(part);
  const shift = (Number(hours) * 60 + Number(minutes)) * minute * (sign === '-' ? -1 : 1);
  return { start: midnight + opensAt * 60 * minute - shift, end: midnight + closesAt * 60 * minute - shift };
}

export function bookingWindow(now) {
  return { start: now, end: now + 30 * day };
}

export function validBooking(start, end, now) {
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start % minute || end % minute ||
      start <= now || end <= start || end > bookingWindow(now).end) return false;
  const key = date.format(start);
  const weekday = new Date(key + 'T00:00:00Z').getUTCDay();
  if (weekday === 0 || weekday === 6) return false;
  const hours = roomDay(key);
  return start >= hours.start && end <= hours.end;
}
