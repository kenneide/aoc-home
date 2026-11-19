import { DurableObject } from 'cloudflare:workers';
import { overlaps } from '../meet/calendar.js';
import { availabilityCalendar, roomCalendar } from './calendar.js';

import { bookingWindow, closesAt, minute, opensAt, slotMinutes, validBooking } from './hours.js';
const json = (body, status = 200) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
});
const failure = (error, status) => json({ error }, status);
const unavailable = () => failure('Booking is temporarily unavailable. Please try again.', 503);
const conflict = () => ({ code: 409, error: 'That time is no longer available.' });

async function body(request) {
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder();
  let length = 0;
  let value = '';
  while (true) {
    const { done, value: chunk } = await reader.read();
    if (done) break;
    length += chunk.length;
    if (length > 8192) {
      await reader.cancel();
      return null;
    }
    value += decoder.decode(chunk, { stream: true });
  }
  try { return JSON.parse(value + decoder.decode()); } catch { return null; }
}

function validText(value, length) {
  return typeof value === 'string' && value.length <= length && !/[\u0000-\u001f\u007f]/.test(value);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const feed = path === '/availability.ics';
    if (!feed && !path.startsWith('/api/')) {
      return env.ASSETS.fetch(path === '/' ? new Request(new URL('/index.html', url), request) : request);
    }
    const open = env.BOOKING_OPEN === 'true';
    if (path === '/api/config' && request.method === 'GET') return json({ open, siteKey: env.TURNSTILE_SITE_KEY });
    if (!open) return unavailable();
    try {
      const ip = request.headers.get('CF-Connecting-IP') || 'local';
      if (!(await env.PUBLIC_LIMIT.limit({ key: ip })).success) return failure('Too many requests. Try again shortly.', 429);
      const service = env.BOOKINGS.getByName('room');
      if (feed && ['GET', 'HEAD'].includes(request.method)) {
        const now = Date.now();
        const range = bookingWindow(now);
        const calendar = availabilityCalendar(await service.busy(range), range);
        return new Response(request.method === 'HEAD' ? null : calendar, { headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Cache-Control': 'public, max-age=60',
          'X-Content-Type-Options': 'nosniff',
        } });
      }
      if (path === '/api/availability' && request.method === 'GET') {
        const range = bookingWindow(Date.now());
        const busy = (await service.busy(range)).filter(interval => overlaps(interval, range))
          .map(({ start, end }) => ({ start: Math.max(start, range.start), end: Math.min(end, range.end) }));
        return json({ ...range, busy });
      }
      if (path === '/api/slots' && request.method === 'GET') {
        const duration = Number(url.searchParams.get('duration'));
        if (![slotMinutes, 30, 60].includes(duration)) return failure('Choose 15, 30 or 60 minutes.', 400);
        return json({ starts: await service.available(duration) });
      }
      if (path === '/api/bookings' && request.method === 'POST') {
        if (request.headers.get('Origin') !== env.PUBLIC_ORIGIN || url.origin !== env.PUBLIC_ORIGIN) {
          return failure('Invalid request origin.', 403);
        }
        const data = await body(request);
        if (data && typeof data === 'object') {
          data.email ??= '';
          data.phone ??= '';
        }
        if (!data || !Number.isSafeInteger(data.start) || !Number.isSafeInteger(data.duration) || data.duration < 1 || data.duration > (closesAt - opensAt) * 60 ||
            !validText(data.name, 100) || !data.name.trim() || !validText(data.email, 254) ||
            (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) ||
            !validText(data.phone, 50) || !validText(data.token, 2048) ||
            typeof data.id !== 'string' || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/.test(data.id)) {
          return failure('Check the booking details.', 400);
        }
        const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST', body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: data.token, remoteip: ip }),
          signal: AbortSignal.timeout(5000),
        });
        const challenge = await verification.json();
        if (!challenge.success || challenge.hostname !== url.hostname || challenge.action !== 'booking') {
          return failure('Complete the verification and try again.', 400);
        }
        const result = await service.submit({
          id: data.id, start: data.start, duration: data.duration, name: data.name.trim(),
          email: data.email, phone: data.phone.trim(),
        });
        return result.error ? failure(result.error, result.code) : json({ status: 'confirmed' });
      }
      return failure('Page unavailable.', 404);
    } catch (error) {
      const message = error?.message ?? '';
      const reason = /^(?:Calendar setup required|Invalid calendar collection|Calendar provider is not configured|(?:Free\/busy|Calendar query) unavailable: HTTP \d{3}|Calendar data missing|Invalid calendar response|Unexpected calendar response|Calendar did not expand recurrence|Calendar redirect (?:rejected|limit reached))$/.test(message)
        ? message : 'Unexpected upstream error';
      console.warn('Room booking request failed:', (feed || path === '/api/availability' || path === '/api/slots') ? 'availability' : 'booking', reason);
      return unavailable();
    }
  },
};

export class Bookings extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY, data TEXT NOT NULL)');
    this.active = new Map();
  }

  records() {
    return [...this.sql.exec('SELECT data FROM bookings')].map(row => JSON.parse(row.data));
  }

  save(record) {
    this.sql.exec('INSERT OR REPLACE INTO bookings VALUES (?, ?)', record.id, JSON.stringify(record));
  }

  async available(duration) {
    const range = bookingWindow(Date.now());
    const busy = await this.busy(range);
    const step = slotMinutes * minute;
    const length = duration * minute;
    const starts = [];
    for (let start = Math.ceil(range.start / step) * step; start + length <= range.end; start += step) {
      const end = start + length;
      if (validBooking(start, end, range.start) && !busy.some(block => overlaps(block, { start, end }))) {
        starts.push(start);
      }
    }
    return starts;
  }

  async busy(range) {
    const busy = await roomCalendar(this.env).busy(range);
    const pending = this.records().filter(record => record.name && overlaps(record, range));
    return busy.concat(pending.map(({ start, end }) => ({ start, end })));
  }

  async submit(data) {
    const end = data.start + data.duration * minute;
    const existing = this.records().find(record => record.id === data.id);
    if (existing) {
      if (existing.start !== data.start || existing.end !== end) return conflict();
      return existing.name ? this.finish(existing) : {};
    }
    const now = Date.now();
    if (!validBooking(data.start, end, now)) return conflict();
    if (this.records().some(record => record.name && overlaps(record, { start: data.start, end }))) return conflict();

    const booking = { id: data.id, start: data.start, end, name: data.name, email: data.email,
      phone: data.phone, created: now };
    // Reserve synchronously before awaiting any calendar operations.
    this.save(booking);
    return this.finish(booking);
  }

  finish(booking) {
    if (!this.active.has(booking.id)) {
      this.active.set(booking.id, this.write(booking).finally(() => this.active.delete(booking.id)));
    }
    return this.active.get(booking.id);
  }

  async write(booking) {
    await this.ctx.storage.setAlarm(Date.now() + minute);
    const calendar = roomCalendar(this.env);
    if (!await calendar.exists(booking)) {
      const busy = await calendar.busy(booking);
      if (!validBooking(booking.start, booking.end, Date.now()) || busy.some(interval => overlaps(interval, booking))) {
        this.sql.exec('DELETE FROM bookings WHERE id = ?', booking.id);
        return conflict();
      }
      await calendar.create(booking);
    }
    const { id, start, end } = booking;
    this.save({ id, start, end });
    return {};
  }

  async alarm() {
    await this.ctx.storage.setAlarm(Date.now() + minute);
    for (const record of this.records()) {
      if (this.active.has(record.id)) continue;
      if (record.end <= Date.now()) this.sql.exec('DELETE FROM bookings WHERE id = ?', record.id);
      else if (record.name) {
        // Reconcile uncertain responses without creating a booking after the visitor left.
        try {
          const exists = await roomCalendar(this.env).exists(record);
          const current = this.records().find(booking => booking.id === record.id);
          if (this.active.has(record.id) || !current?.name || current.created !== record.created) continue;
          if (exists) {
            const { id, start, end } = record;
            this.save({ id, start, end });
          } else if (Date.now() - record.created >= 5 * minute) {
            this.sql.exec('DELETE FROM bookings WHERE id = ?', record.id);
          }
        } catch {
          // Keep the reservation while the provider cannot establish the outcome.
        }
      }
    }
    const records = this.records();
    if (!records.length && !this.active.size) await this.ctx.storage.deleteAlarm();
    else if (!records.some(record => record.name) && !this.active.size) {
      await this.ctx.storage.setAlarm(Math.min(...records.map(record => record.end)));
    }
  }
}
