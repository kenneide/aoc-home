const form = document.querySelector('#booking');
const status = document.querySelector('#status');
const schedule = document.querySelector('#schedule');
const week = document.querySelector('#week');
const weekLabel = document.querySelector('#week-label');
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
const duration = document.querySelector('#duration');
const selection = document.querySelector('#selection');
const submit = document.querySelector('#submit');

const zone = 'Europe/Amsterdam';
const halfHour = 30 * 60_000;
const day = 48 * halfHour;
const amsterdamDate = new Intl.DateTimeFormat('sv-SE', { timeZone: zone, dateStyle: 'short' });
const amsterdamTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
const heading = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric' });
const range = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
const chosenDay = new Intl.DateTimeFormat('en-GB', { timeZone: zone, weekday: 'long', day: 'numeric', month: 'long' });
const today = Date.parse(amsterdamDate.format(Date.now()));
const firstWeek = today - ((new Date(today).getUTCDay() + 6) % 7) * day;
const lastWeek = firstWeek + Math.floor(((today - firstWeek) / day + 30) / 7) * 7 * day;
let monday = firstWeek;
let starts = new Map();
let hourStarts = new Set();
let selected;
let confirmed;
let gesture;
let token;
let widget;
let loading = false;
let submitting = false;
let id = crypto.randomUUID();

function describe({ start, length }) {
  return `${chosenDay.format(start)}, ${amsterdamTime.format(start)}–${amsterdamTime.format(start + length * 60_000)} Amsterdam time`;
}

function updateControls() {
  duration.disabled = loading || submitting || !selected;
  duration.options[1].disabled = !selected || !hourStarts.has(selected.start);
  submit.disabled = loading || submitting || !token || !selected;
  previous.disabled = submitting || monday === firstWeek;
  next.disabled = submitting || monday === lastWeek;
  week.toggleAttribute('inert', loading || submitting);
}

function markSelection() {
  const current = gesture?.preview ?? selected;
  for (const button of week.querySelectorAll('[data-start]')) {
    const start = Number(button.dataset.start);
    const pressed = Boolean(current && start >= current.start && start < current.start + current.length * 60_000);
    if (button.getAttribute('aria-pressed') !== String(pressed)) button.setAttribute('aria-pressed', String(pressed));
  }
}

function choose(start, length) {
  if (selected?.start !== start || selected.length !== length) id = crypto.randomUUID();
  selected = { start, length };
  duration.value = String(length);
  selection.textContent = describe(selected);
  markSelection();
  updateControls();
}

function cell(tag, className, value = '') {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = value;
  week.append(element);
  return element;
}

function render() {
  weekLabel.textContent = range.formatRange(monday, monday + 4 * day);
  week.replaceChildren();
  cell('span', 'week-heading');
  const dates = Array.from({ length: 5 }, (_, index) => monday + index * day);
  for (const date of dates) cell('span', 'week-heading', heading.format(date));
  for (let row = 0; row < 16; row++) {
    const clock = String(9 + Math.floor(row / 2)).padStart(2, '0') + (row % 2 ? ':30' : ':00');
    cell('span', 'week-time', clock);
    for (const date of dates) {
      const key = new Date(date).toISOString().slice(0, 10) + 'T' + clock;
      const start = starts.get(key);
      if (confirmed?.cells.includes(key)) {
        cell('span', 'week-slot week-confirmed', 'Booked').setAttribute('aria-label', heading.format(date) + ' ' + clock + ' booked');
      } else if (start !== undefined) {
        const button = cell('button', 'week-slot week-open', clock);
        button.type = 'button';
        button.dataset.start = start;
        button.setAttribute('aria-label', heading.format(date) + ' at ' + clock);
      } else {
        cell('span', 'week-slot week-unavailable').setAttribute('aria-label', heading.format(date) + ' ' + clock + ' unavailable');
      }
    }
  }
  markSelection();
  updateControls();
}

previous.addEventListener('click', () => { monday -= 7 * day; render(); });
next.addEventListener('click', () => { monday += 7 * day; render(); });
duration.addEventListener('change', () => choose(selected.start, Number(duration.value)));
form.addEventListener('input', event => {
  if (event.target.matches('input')) id = crypto.randomUUID();
});

week.addEventListener('click', event => {
  const button = event.target.closest('[data-start]');
  // Pointer selections are committed on pointerup. Keyboard and assistive clicks use detail zero.
  if (button && event.detail === 0) choose(Number(button.dataset.start), 30);
});

week.addEventListener('pointerdown', event => {
  const button = event.target.closest('[data-start]');
  if (gesture || !button || event.button !== 0 || !event.isPrimary) return;
  const start = Number(button.dataset.start);
  gesture = { pointer: event.pointerId, anchor: start, preview: { start, length: 30 } };
  button.setPointerCapture(event.pointerId);
  markSelection();
});

week.addEventListener('pointermove', event => {
  if (gesture?.pointer !== event.pointerId) return;
  const button = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-start]');
  const target = Number(button?.dataset.start);
  const start = Math.min(gesture.anchor, target);
  gesture.preview = Math.abs(target - gesture.anchor) === halfHour && hourStarts.has(start)
    ? { start, length: 60 } : { start: gesture.anchor, length: 30 };
  markSelection();
});

week.addEventListener('pointerup', event => {
  if (gesture?.pointer !== event.pointerId) return;
  const { start, length } = gesture.preview;
  gesture = undefined;
  choose(start, length);
});

week.addEventListener('pointercancel', event => {
  if (gesture?.pointer !== event.pointerId) return;
  gesture = undefined;
  markSelection();
});

async function fetchStarts(length) {
  const response = await fetch('/api/slots?duration=' + length);
  const data = await response.json();
  if (!response.ok) throw Error(data.error);
  return data.starts;
}

function keyFor(start) {
  return amsterdamDate.format(start) + 'T' + amsterdamTime.format(start);
}

async function load() {
  loading = true;
  updateControls();
  try {
    const [half, full] = await Promise.all([fetchStarts(30), fetchStarts(60)]);
    starts = new Map(half.map(start => [keyFor(start), start]));
    hourStarts = new Set(full);
    status.textContent = starts.size ? '' : 'No times are available in the booking window.';
    if (selected && (!starts.has(keyFor(selected.start)) || (selected.length === 60 && !hourStarts.has(selected.start)))) {
      selected = undefined;
      selection.textContent = 'Select a time in the calendar.';
    }
    schedule.hidden = false;
  } catch (error) {
    selected = undefined;
    selection.textContent = 'Select a time in the calendar.';
    schedule.hidden = true;
    status.textContent = error.message || 'Availability could not be loaded.';
  } finally {
    loading = false;
    render();
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submit.disabled) return;
  const { start, length } = selected;
  const fields = new FormData(form);
  const controls = [...form.elements];
  submitting = true;
  controls.forEach(control => { control.disabled = true; });
  updateControls();
  try {
    const response = await fetch('/api/bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id, token, start, duration: length, name: fields.get('name'),
        email: fields.get('email'), phone: fields.get('phone'),
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 409) await load();
      throw Error(result.error);
    }
    confirmed = { cells: length === 60 ? [keyFor(start), keyFor(start + halfHour)] : [keyFor(start)] };
    selected = undefined;
    form.hidden = true;
    render();
    status.textContent = 'Room booked for ' + describe({ start, length }) + '.';
    status.tabIndex = -1;
    status.focus();
  } catch (error) {
    status.textContent = error.message || 'Your booking could not be confirmed. Retry to check the same booking.';
  } finally {
    submitting = false;
    token = undefined;
    controls.forEach(control => { control.disabled = false; });
    if (!confirmed) window.turnstile.reset(widget);
    updateControls();
  }
});

try {
  const config = await (await fetch('/api/config')).json();
  if (!config.open || !config.siteKey) throw Error('Booking is temporarily unavailable.');
  const script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  await new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = () => reject(Error('Verification could not load. Please refresh and try again.'));
    document.head.append(script);
  });
  await load();
  if (schedule.hidden) throw Error(status.textContent);
  form.hidden = false;
  widget = window.turnstile.render('#challenge', {
    sitekey: config.siteKey, action: 'booking',
    callback(value) { token = value; updateControls(); },
    'expired-callback'() { token = undefined; updateControls(); },
    'error-callback'() { token = undefined; updateControls(); },
  });
} catch (error) {
  status.textContent = error.message || 'Booking is temporarily unavailable.';
}
