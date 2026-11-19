import { DurableObject } from 'cloudflare:workers';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { calendarProvider, meetingFile, overlaps, slots } from './calendar.js';

const minute = 60_000;
const day = 1440 * minute;
const json = (body, status = 200) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
});
const failure = (error, status) => json({ error }, status);
const unavailable = () => failure('Booking is temporarily unavailable. Please try again.', 503);
const keys = new Map();

async function owner(request, env) {
  try {
    const issuer = 'https://' + env.ACCESS_TEAM_DOMAIN;
    if (!env.OWNER_EMAIL || !env.ACCESS_AUDIENCE || !env.ACCESS_TEAM_DOMAIN) return false;
    if (!keys.has(issuer)) keys.set(issuer, createRemoteJWKSet(new URL('/cdn-cgi/access/certs', issuer)));
    const { payload } = await jwtVerify(request.headers.get('Cf-Access-Jwt-Assertion'), keys.get(issuer), {
      issuer, audience: env.ACCESS_AUDIENCE, algorithms: ['RS256'], requiredClaims: ['exp'],
    });
    return payload.email?.toLowerCase() === env.OWNER_EMAIL.toLowerCase();
  } catch {
    return false;
  }
}

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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const admin = path === '/owner' || path.startsWith('/owner/');
    if (admin && !await owner(request, env)) return failure('Owner sign-in required.', 403);
    if (path === '/inbox.html') return failure('Page unavailable.', 404);
    if (!path.startsWith('/api/') && !path.startsWith('/owner/api/')) {
      return env.ASSETS.fetch(path === '/owner' || path === '/owner/'
        ? new Request(new URL('/inbox.html', url), request)
        : path === '/' ? new Request(new URL('/index.html', url), request) : request);
    }
    if (request.method === 'POST' && request.headers.get('Origin') !== url.origin) {
      return failure('Invalid request origin.', 403);
    }
    const service = env.BOOKINGS.getByName('owner');
    try {
      if (path === '/api/config' && request.method === 'GET') {
        return json({ siteKey: env.TURNSTILE_SITE_KEY, open: env.BOOKING_OPEN === 'true' });
      }
      if (path === '/owner/api/requests' && request.method === 'GET') return json(await service.list());
      if (path === '/owner/api/decision' && request.method === 'POST') {
        const data = await body(request);
        if (!data || typeof data.id !== 'string' || !['approve', 'decline'].includes(data.decision) ||
            (data.decision === 'approve' && (typeof data.location !== 'string' || !data.location.trim() ||
             data.location.length > 500 || /[\r\n]/.test(data.location)))) return failure('Check the decision details.', 400);
        return jsonResult(await service.decide(data));
      }
      if (env.BOOKING_OPEN !== 'true') return unavailable();
      const ip = request.headers.get('CF-Connecting-IP') || 'local';
      if (!(await env.PUBLIC_LIMIT.limit({ key: ip })).success) return failure('Too many requests. Try again shortly.', 429);
      if (path === '/api/slots' && request.method === 'GET') {
        const duration = Number(url.searchParams.get('duration'));
        if (![30, 60].includes(duration)) return failure('Choose 30 or 60 minutes.', 400);
        return json({ starts: await service.available(duration) });
      }
      if (path === '/api/requests' && request.method === 'POST') {
        const data = await body(request);
        if (!data || !Number.isSafeInteger(data.start) || ![30, 60].includes(data.duration) ||
            typeof data.name !== 'string' || !data.name.trim() || data.name.length > 100 ||
            typeof data.email !== 'string' || data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
            typeof data.note !== 'string' || data.note.length > 1000 ||
            typeof data.token !== 'string' || data.token.length > 2048 ||
            typeof data.id !== 'string' || !/^[0-9a-f-]{36}$/.test(data.id)) return failure('Check the booking details.', 400);
        const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST', body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: data.token, remoteip: ip }),
          signal: AbortSignal.timeout(5000),
        });
        const challenge = await verification.json();
        if (!challenge.success || challenge.hostname !== url.hostname || challenge.action !== 'booking') {
          return failure('Complete the verification and try again.', 400);
        }
        return jsonResult(await service.submit(data));
      }
      return failure('Page unavailable.', 404);
    } catch {
      return unavailable();
    }
  },
};

function jsonResult(result) {
  return result.error ? failure(result.error, result.status) : json({ status: result.status }, result.status === 'pending' ? 202 : 200);
}

export class Bookings extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS requests (id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS mail (id TEXT PRIMARY KEY, data TEXT NOT NULL)`);
    this.calendarWork = new Set();
  }

  rows(table) {
    return [...this.sql.exec(table === 'mail' ? 'SELECT data FROM mail' : 'SELECT data FROM requests')]
      .map(row => JSON.parse(row.data));
  }

  save(request) {
    this.sql.exec('INSERT OR REPLACE INTO requests VALUES (?, ?)', request.id, JSON.stringify(request));
  }

  queue(request, kind) {
    const id = request.id + '-' + kind;
    const job = { id, requestId: request.id, kind, created: Date.now(), attempts: 0 };
    this.sql.exec('INSERT OR IGNORE INTO mail VALUES (?, ?)', id, JSON.stringify(job));
  }

  list() {
    return this.rows('requests').sort((a, b) => a.start - b.start);
  }

  async wake() {
    if (await this.ctx.storage.getAlarm() === null) await this.ctx.storage.setAlarm(Date.now() + 1000);
  }

  async available(duration) {
    const now = Date.now();
    const busy = await calendarProvider(this.env).busy({ start: now, end: now + 30 * day });
    busy.push(...this.list().filter(request => ['approved', 'writing'].includes(request.state)));
    return slots(now, duration, busy);
  }

  async submit(data) {
    const email = data.email.toLowerCase();
    const duplicate = () => this.list().some(request => request.id === data.id ||
      (request.email === email && request.start === data.start &&
        request.state === 'pending' && request.end === data.start + data.duration * minute));
    if (duplicate()) return { status: 'pending' };
    const starts = await this.available(data.duration);
    if (!starts.includes(data.start)) return { status: 409, error: 'That time is no longer available.' };
    await this.wake();
    if (duplicate()) return { status: 'pending' };
    if (this.list().some(request => ['approved', 'writing'].includes(request.state) &&
        overlaps(request, { start: data.start, end: data.start + data.duration * minute }))) {
      return { status: 409, error: 'That time is no longer available.' };
    }
    if (this.list().filter(request => request.email === email && request.state === 'pending').length >= 3) {
      return { status: 429, error: 'This email already has three pending requests.' };
    }
    const request = {
      id: data.id, name: data.name.trim(), email, note: data.note.trim(), start: data.start,
      end: data.start + data.duration * minute, state: 'pending',
    };
    this.ctx.storage.transactionSync(() => {
      this.save(request);
      this.queue(request, 'new');
    });
    return { status: 'pending' };
  }

  transition(request, state) {
    request.state = state;
    request.closedAt = Date.now();
    this.save(request);
    this.queue(request, state);
  }

  async decide(data) {
    await this.wake();
    const requests = this.list();
    const request = requests.find(item => item.id === data.id);
    if (!request) return { status: 404, error: 'Request unavailable.' };
    if (request.state === 'writing') return { status: 409, error: 'Calendar write is being checked.' };
    if (request.state !== 'pending') return { status: request.state };
    if (Date.now() >= request.start || data.decision === 'decline') {
      this.ctx.storage.transactionSync(() => this.transition(request, Date.now() >= request.start ? 'expired' : 'declined'));
      return { status: request.state };
    }
    if (requests.some(item => ['approved', 'writing'].includes(item.state) && overlaps(item, request))) {
      return { status: 409, error: 'That time is already booked or being approved.' };
    }
    Object.assign(request, { state: 'writing', location: data.location.trim(), approvedAt: Date.now() });
    this.save(request);
    return await this.finish(request);
  }

  async finish(request) {
    if (this.calendarWork.has(request.id)) return { status: 'writing' };
    this.calendarWork.add(request.id);
    try {
      const provider = calendarProvider(this.env);
      if (!await provider.exists(request)) {
        const busy = await provider.busy(request);
        if (Date.now() >= request.start || busy.some(interval => overlaps(interval, request))) {
          this.ctx.storage.transactionSync(() => this.transition(request, Date.now() >= request.start ? 'expired' : 'declined'));
          return { status: request.state };
        }
        await provider.create(request);
      }
      this.ctx.storage.transactionSync(() => {
        this.transition(request, 'approved');
        for (const other of this.list()) {
          if (other.state === 'pending' && overlaps(request, other)) this.transition(other, 'declined');
        }
      });
      return { status: 'approved' };
    } catch {
      request.calendarError = true;
      this.save(request);
      return { status: 503, error: 'Calendar write is pending verification. Check the inbox shortly.' };
    } finally {
      this.calendarWork.delete(request.id);
    }
  }

  async send(job, request) {
    const time = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Amsterdam', dateStyle: 'full', timeStyle: 'short',
    }).format(request.start) + ' (Amsterdam time)';
    const messages = {
      new: ['New meeting request', `${time}. Review the request at ${this.env.PUBLIC_ORIGIN}/owner`],
      approved: ['Meeting confirmed', `${time}\n\nLocation or call link\n${request.location}\n\nImport the attached file to add the meeting to your calendar.`],
      declined: ['Meeting request declined', `Your request for ${time} was declined. Request another time at ${this.env.PUBLIC_ORIGIN}.`],
      expired: ['Meeting request expired', `Your request for ${time} expired. Request another time at ${this.env.PUBLIC_ORIGIN}.`],
    };
    const [subject, text] = messages[job.kind];
    const message = { from: this.env.MAIL_FROM, to: [job.kind === 'new' ? this.env.OWNER_EMAIL : request.email], subject, text };
    if (job.kind === 'approved') {
      const bytes = new TextEncoder().encode(meetingFile(request));
      message.attachments = [{ filename: 'meeting.ics', content: btoa(String.fromCharCode(...bytes)) }];
    }
    const result = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: {
        Authorization: 'Bearer ' + this.env.RESEND_API_KEY, 'Content-Type': 'application/json',
        'Idempotency-Key': job.id,
      }, body: JSON.stringify(message), signal: AbortSignal.timeout(8000),
    });
    if (!result.ok) throw Error('Email provider unavailable');
  }

  async alarm() {
    // Arm the next pass before external calls so a stopped isolate leaves recoverable work.
    await this.ctx.storage.setAlarm(Date.now() + minute);
    for (const request of this.list()) {
      if (request.state === 'writing') await this.finish(request);
      if (request.state === 'pending' && request.start <= Date.now()) {
        const current = this.list().find(item => item.id === request.id);
        if (current?.state === 'pending') this.ctx.storage.transactionSync(() => this.transition(current, 'expired'));
      }
    }
    const requests = new Map(this.list().map(request => [request.id, request]));
    for (const job of this.rows('mail')) {
      if (job.failed || job.next > Date.now()) continue;
      const request = requests.get(job.requestId);
      try {
        if (Date.now() - job.created >= 23 * 60 * minute) throw Error('Email retry window expired');
        await this.send(job, request);
        this.sql.exec('DELETE FROM mail WHERE id = ?', job.id);
      } catch {
        job.attempts++;
        job.failed = job.attempts >= 8 || Date.now() - job.created >= 23 * 60 * minute;
        job.next = Date.now() + 2 ** job.attempts * minute;
        this.sql.exec('UPDATE mail SET data = ? WHERE id = ?', JSON.stringify(job), job.id);
        if (job.failed && request) {
          const current = this.list().find(item => item.id === request.id);
          current.mailError = true;
          this.save(current);
        }
      }
    }
    for (const request of this.list()) {
      if (request.closedAt && Date.now() - Math.max(request.closedAt, request.end) > 30 * day) {
        this.ctx.storage.transactionSync(() => {
          this.sql.exec('DELETE FROM requests WHERE id = ?', request.id);
          for (const job of this.rows('mail').filter(item => item.requestId === request.id)) {
            this.sql.exec('DELETE FROM mail WHERE id = ?', job.id);
          }
        });
      }
    }
  }
}
