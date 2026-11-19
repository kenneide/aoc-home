import { clock, closesAt, day, days, minute, opensAt, roomDay, slotMinutes, timeLabel, validBooking, zone } from './hours.js';

const form = document.querySelector('#booking');
const status = document.querySelector('#status');
const schedule = document.querySelector('#schedule');
const week = document.querySelector('#week');
const weekLabel = document.querySelector('#week-label');
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
const startTime = document.querySelector('#start-time');
const endTime = document.querySelector('#end-time');
const selection = document.querySelector('#selection');
const submit = document.querySelector('#submit');
const confirmation = document.querySelector('#confirmation');
const confirmationTitle = document.querySelector('#confirmation-title');
const confirmationTime = document.querySelector('#confirmation-time');

const slotsPerHour = 60 / slotMinutes;
const localDate = new Intl.DateTimeFormat('sv-SE', { timeZone: zone, dateStyle: 'short' });
const localTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
const heading = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric' });
const range = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
const chosenDay = new Intl.DateTimeFormat('en-GB', { timeZone: zone, weekday: 'long', day: 'numeric', month: 'long' });
const weekDays = [...days].sort((a, b) => (a + 6) % 7 - (b + 6) % 7);
const key = date => new Date(date).toISOString().slice(0, 10);
const weekday = date => new Date(date).getUTCDay();
const weekOf = date => date - ((weekday(date) + 6) % 7) * day;
let draftLabel;
let firstWeek;
let lastWeek;
let monday;
let availability;
let selected;
let selectedDate;
let confirmed;
let gesture;
let token;
let widget;
let loading = false;
let submitting = false;
let id = crypto.randomUUID();

function describe({ start, length }) {
  return `${chosenDay.format(start)}, ${localTime.format(start)}–${localTime.format(start + length * minute)} ${timeLabel}`;
}

const intersects = (start, end, block) => start < block.end && block.start < end;

function free(start, end) {
  return validBooking(start, end, Math.max(Date.now(), availability.start)) && end <= availability.end &&
    !availability.busy.some(block => intersects(start, end, block));
}

function openPart(start, end) {
  let next = Math.max(start, (Math.floor(Math.max(Date.now(), availability.start) / minute) + 1) * minute);
  const limit = Math.min(end, Math.floor(availability.end / minute) * minute);
  for (const block of availability.busy) {
    if (block.end <= next) continue;
    if (block.start >= limit) break;
    const until = Math.floor(block.start / minute) * minute;
    if (until > next) return { start: next, end: until };
    next = Math.ceil(block.end / minute) * minute;
  }
  return next < limit ? { start: next, end: limit } : undefined;
}

function updateControls() {
  startTime.disabled = endTime.disabled = loading || submitting || !selectedDate;
  submit.disabled = loading || submitting || !token || !selected;
  previous.disabled = submitting || monday === firstWeek;
  next.disabled = submitting || monday === lastWeek;
  week.toggleAttribute('inert', loading || submitting);
}

function markSelection() {
  const current = gesture?.preview ?? selected;
  draftLabel?.remove();
  draftLabel = undefined;
  let firstSelected;
  for (const button of week.querySelectorAll('[data-start]')) {
    const start = Number(button.dataset.start);
    const pressed = Boolean(current && intersects(start, Number(button.dataset.end), current));
    if (pressed) firstSelected ??= button;
    if (button.getAttribute('aria-pressed') !== String(pressed)) button.setAttribute('aria-pressed', String(pressed));
  }
  if (firstSelected) {
    draftLabel = blockLabel('Book', current);
    draftLabel.classList.add('week-draft-label');
    firstSelected.append(draftLabel);
  }
}

function choose(start, end) {
  if (selected?.start !== start || selected.end !== end) id = crypto.randomUUID();
  selectedDate = localDate.format(start);
  selected = { start, end, length: (end - start) / minute };
  startTime.value = localTime.format(start);
  endTime.value = localTime.format(end);
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

function occupiedStretches() {
  const blocks = confirmed ? [...availability.busy, confirmed] : availability.busy;
  const stretches = [];
  for (const block of [...blocks].sort((a, b) => a.start - b.start)) {
    const previous = stretches.at(-1);
    if (previous && block.start < previous.end) previous.end = Math.max(previous.end, block.end);
    else stretches.push({ ...block });
  }
  return stretches;
}

function blockLabel(heading, { start, end }) {
  const label = document.createElement('span');
  label.className = 'week-block-label';
  const title = document.createElement('strong');
  title.textContent = heading;
  const time = document.createElement('span');
  time.textContent = localTime.format(start) + '–' + localTime.format(end);
  label.title = heading + ' ' + time.textContent;
  label.append(title, time);
  return label;
}

function labelBusySlot(slot, blocks, start, dayStart) {
  if (!blocks.length) return;
  slot.classList.add('week-occupied');
  for (const block of blocks) {
    if (Math.max(block.start, dayStart) < start) continue;
    const label = blockLabel('Busy', block);
    slot.title = label.title;
    slot.append(label);
    break;
  }
}

function render() {
  const dates = weekDays.map(dayOfWeek => monday + ((dayOfWeek + 6) % 7) * day);
  weekLabel.textContent = range.formatRange(dates[0], dates.at(-1));
  week.replaceChildren();
  cell('span', 'week-heading');
  for (const date of dates) {
    const label = cell('span', 'week-heading');
    const parts = heading.formatToParts(date);
    for (const type of ['weekday', 'day']) {
      const line = document.createElement('span');
      line.textContent = parts.find(part => part.type === type).value;
      label.append(line);
    }
  }
  const hoursByDate = dates.map(date => roomDay(key(date)));
  const stretches = occupiedStretches();
  const period = hour => hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
  for (let row = 0; row < (closesAt - opensAt) * slotsPerHour; row++) {
    const hour = opensAt + row / slotsPerHour;
    const startsHour = row % slotsPerHour === 0;
    if (row === 0 || hour === 12 || hour === 18) cell('span', 'week-period', period(hour));
    cell('span', 'week-time', startsHour ? clock(hour) : '');
    const slotClass = startsHour ? 'week-slot week-hour ' : 'week-slot ';
    for (const [index, hours] of hoursByDate.entries()) {
      const start = hours.instant(hour);
      const end = hours.instant(hour + slotMinutes / 60);
      const label = heading.format(dates[index]) + ' ' + clock(hour);
      const part = end > start ? openPart(start, end) : undefined;
      const occupied = end > start ? stretches.filter(block => intersects(start, end, block)) : [];
      let slot;
      if (confirmed && intersects(start, end, confirmed)) {
        slot = cell('span', slotClass + 'week-confirmed');
        slot.setAttribute('aria-label', label + ' booked');
      } else if (part) {
        const partial = part.start > start || part.end < end;
        slot = cell('button', slotClass + 'week-open' + (partial ? ' week-partial' : ''));
        slot.type = 'button';
        Object.assign(slot.dataset, { start, end, from: part.start, to: part.end });
        slot.setAttribute('aria-label', label + (partial ? ', partially available' : ''));
      } else {
        slot = cell('span', slotClass + (occupied.length ? 'week-busy' : 'week-unavailable'));
        slot.setAttribute('aria-label', label + (occupied.length ? ' occupied' : ' unavailable'));
      }
      labelBusySlot(slot, occupied, start, hours.start);
    }
  }
  cell('span', 'week-time', clock(closesAt));
  markSelection();
  updateControls();
}

previous.addEventListener('click', () => { monday -= 7 * day; render(); });
next.addEventListener('click', () => { monday += 7 * day; render(); });

function editTimes() {
  const hours = roomDay(selectedDate);
  const instant = value => {
    if (!value) return NaN;
    const [h, m] = value.split(':').map(Number);
    return hours.instant(h + m / 60);
  };
  const start = instant(startTime.value);
  const end = instant(endTime.value);
  if (free(start, end)) {
    choose(start, end);
  } else {
    selected = undefined;
    selection.textContent = `Choose an available future time between ${clock(opensAt)} and ${clock(closesAt)} on ` +
      chosenDay.format(hours.start) + '.';
    markSelection();
    updateControls();
  }
}
for (const input of [startTime, endTime]) input.addEventListener('input', editTimes);
form.addEventListener('input', event => {
  if (event.target.matches('input[name]')) id = crypto.randomUUID();
});

const partOf = button => ({ start: Number(button.dataset.from), end: Number(button.dataset.to) });

week.addEventListener('click', event => {
  const button = event.target.closest('[data-start]');
  if (button && event.detail === 0) {
    const { start, end } = partOf(button);
    choose(start, end);
  }
});

week.addEventListener('pointerdown', event => {
  const button = event.target.closest('[data-start]');
  if (gesture || !button || event.button !== 0 || !event.isPrimary) return;
  const anchor = partOf(button);
  gesture = { pointer: event.pointerId, anchor, preview: anchor };
  button.setPointerCapture(event.pointerId);
  markSelection();
});

week.addEventListener('pointermove', event => {
  if (gesture?.pointer !== event.pointerId) return;
  const button = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-start]');
  if (button) {
    const target = partOf(button);
    const start = Math.min(gesture.anchor.start, target.start);
    const end = Math.max(gesture.anchor.end, target.end);
    if (free(start, end)) gesture.preview = { start, end };
  }
  markSelection();
});

week.addEventListener('pointerup', event => {
  if (gesture?.pointer !== event.pointerId) return;
  const { start, end } = gesture.preview;
  gesture = undefined;
  choose(start, end);
});

function cancelGesture(event) {
  if (gesture?.pointer !== event.pointerId) return;
  gesture = undefined;
  markSelection();
}
week.addEventListener('pointercancel', cancelGesture);
week.addEventListener('lostpointercapture', cancelGesture);

async function load() {
  loading = true;
  updateControls();
  try {
    const response = await fetch('/api/availability');
    const data = await response.json();
    if (!response.ok) throw Error(data.error);
    data.busy.sort((a, b) => a.start - b.start);
    availability = data;
    const today = Date.parse(localDate.format(data.start));
    const offsets = Array.from({ length: 7 }, (_, index) => index * day);
    firstWeek = weekOf(today + offsets.find(offset => days.includes(weekday(today + offset))));
    const finalDate = Date.parse(localDate.format(data.end));
    lastWeek = Math.max(firstWeek, weekOf(finalDate - offsets.find(offset => days.includes(weekday(finalDate - offset)))));
    monday = Math.min(lastWeek, Math.max(firstWeek, monday ?? firstWeek));
    if (selected && !free(selected.start, selected.end)) {
      selected = undefined;
      selection.textContent = 'Choose a different time.';
    }
    status.textContent = '';
    schedule.hidden = false;
    render();
  } catch (error) {
    selected = undefined;
    schedule.hidden = true;
    status.textContent = error.message || 'Availability could not be loaded.';
  } finally {
    loading = false;
    updateControls();
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
    confirmed = { start, end: start + length * minute };
    monday = weekOf(Date.parse(localDate.format(start)));
    selected = undefined;
    form.hidden = true;
    status.textContent = '';
    confirmationTime.textContent = describe({ start, length });
    confirmationTitle.setAttribute('aria-describedby', confirmationTime.id);
    confirmation.hidden = false;
    render();
    confirmationTitle.focus({ preventScroll: true });
    confirmation.scrollIntoView({ block: 'nearest', behavior: 'instant' });
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
