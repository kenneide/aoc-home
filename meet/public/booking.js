const form = document.querySelector('#booking');
const status = document.querySelector('#status');
const duration = document.querySelector('#duration');
const zone = document.querySelector('#zone');
const date = document.querySelector('#date');
const time = document.querySelector('#time');
const submit = document.querySelector('#submit');
const visitorZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const amsterdam = 'Europe/Amsterdam';
for (const value of new Set([visitorZone, amsterdam])) {
  zone.add(new Option(value.replaceAll('_', ' '), value));
}
let starts = [];
let byDate;
let token;
let widget;
let loading = false;
let submitting = false;
let id = crypto.randomUUID();

function setButton() {
  submit.disabled = loading || submitting || !token || !time.value;
}

function displayTimes() {
  const format = new Intl.DateTimeFormat('en', {
    timeZone: zone.value, hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  });
  time.replaceChildren(...(byDate.get(date.value) ?? []).map(start => new Option(format.format(start), start)));
  setButton();
}

function displayDates() {
  const format = new Intl.DateTimeFormat('en', {
    timeZone: zone.value, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  byDate = new Map();
  for (const start of starts) {
    const label = format.format(start);
    if (!byDate.has(label)) byDate.set(label, []);
    byDate.get(label).push(start);
  }
  date.replaceChildren(...Array.from(byDate.keys(), value => new Option(value, value)));
  displayTimes();
}

async function load() {
  loading = true;
  duration.disabled = true;
  setButton();
  status.textContent = 'Loading availability…';
  try {
    const response = await fetch('/api/slots?duration=' + duration.value);
    const data = await response.json();
    if (!response.ok) throw Error(data.error);
    starts = data.starts;
    status.textContent = starts.length ? '' : 'No times are available for this duration.';
  } catch (error) {
    starts = [];
    status.textContent = error.message || 'Availability could not be loaded.';
  } finally {
    loading = false;
    duration.disabled = false;
    displayDates();
  }
}

duration.addEventListener('change', load);
zone.addEventListener('change', displayDates);
date.addEventListener('change', displayTimes);
form.addEventListener('input', () => { id = crypto.randomUUID(); });

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submit.disabled) return;
  submitting = true;
  setButton();
  let completed = false;
  try {
    const data = new FormData(form);
    const response = await fetch('/api/requests', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id, token, start: Number(time.value), duration: Number(duration.value),
        name: data.get('name'), email: data.get('email'), note: data.get('note'),
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 409) await load();
      throw Error(result.error);
    }
    completed = true;
    form.hidden = true;
    status.textContent = 'Request received. You’ll receive an email when Alan reviews it.';
    status.tabIndex = -1;
    status.focus();
  } catch (error) {
    status.textContent = error.message || 'Your request could not be sent.';
  } finally {
    submitting = false;
    token = undefined;
    if (!completed) window.turnstile.reset(widget);
    setButton();
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
  form.hidden = false;
  widget = window.turnstile.render('#challenge', {
    sitekey: config.siteKey, action: 'booking',
    callback(value) { token = value; setButton(); },
    'expired-callback'() { token = undefined; setButton(); },
    'error-callback'() { token = undefined; setButton(); },
  });
  await load();
} catch (error) {
  status.textContent = error.message || 'Booking is temporarily unavailable.';
}
