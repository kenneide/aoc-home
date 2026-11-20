const status = document.querySelector('#status');
const list = document.querySelector('#requests');
const format = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Amsterdam', dateStyle: 'full', timeStyle: 'short',
});

function element(tag, text) {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}

function render(request) {
  const item = element('article', '');
  item.className = 'request';
  item.append(element('h2', request.name), element('p', request.email),
    element('p', `${format.format(request.start)} (Amsterdam time) · ${(request.end - request.start) / 60_000} minutes`),
    element('p', 'Status: ' + request.state));
  if (request.note) item.append(element('p', request.note));
  if (request.location) item.append(element('p', request.location));
  if (request.state === 'writing' && request.calendarError) item.append(element('p', 'Calendar write is pending verification.'));
  if (request.mailError) item.append(element('p', 'Email could not be sent. Contact the guest directly if needed.'));
  if (request.state !== 'pending') return item;
  const form = element('form', '');
  const label = element('label', 'Location or call link');
  const location = element('input', '');
  location.required = true;
  location.maxLength = 500;
  label.append(location);
  const approve = element('button', 'Approve');
  approve.className = 'button';
  const decline = element('button', 'Decline');
  decline.className = 'button';
  decline.formNoValidate = true;
  form.append(label, approve, decline);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    approve.disabled = decline.disabled = true;
    try {
      const reply = await fetch('/owner/api/decision', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: request.id, decision: event.submitter === decline ? 'decline' : 'approve', location: location.value,
        }),
      });
      const result = await reply.json();
      await load();
      status.textContent = reply.ok ? 'Request ' + result.status + '.' : result.error;
      status.tabIndex = -1;
      status.focus();
    } catch {
      status.textContent = 'The decision could not be saved. Refresh the inbox to check its status.';
      approve.disabled = decline.disabled = false;
    }
  });
  item.append(form);
  return item;
}

async function load() {
  const response = await fetch('/owner/api/requests');
  if (!response.ok) throw Error('Unable to load the inbox. Check your sign-in and refresh.');
  const requests = await response.json();
  list.replaceChildren(...requests.map(render));
  status.textContent = requests.length ? '' : 'No meeting requests.';
}

load().catch(error => { status.textContent = error.message; });
