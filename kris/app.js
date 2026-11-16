import { createShow } from './show.js';
let show;
let muted = false;
const $ = selector => document.querySelector(selector);
let recipient = null;
const encoder = new TextEncoder();
const hex = buffer => Array.from(new Uint8Array(buffer), x => x.toString(16).padStart(2, '0')).join('');
const hash = text => crypto.subtle.digest('SHA-256', encoder.encode(text));
const bytes = text => Uint8Array.from(atob(text), c => c.charCodeAt(0));

$('form').onsubmit = async event => {
  event.preventDefault();
  $('#error').textContent = '';
  // Accept both a bare code and a complete line from the organiser's code file.
  const code = $('#code').value.trim().replace(/^[^:]*:\s*/, '').replace(/[\s-]/g, '').toLowerCase();
  if (location.protocol === 'file:') {
    $('#error').textContent = 'Open this demo at http://localhost:4174 after running npm run dev in the kris folder. Opening the HTML file directly cannot load the sealed deliveries.';
    return;
  }
  if (!globalThis.crypto?.subtle) {
    $('#error').textContent = 'Private reveals need HTTPS or localhost. On this computer, use http://localhost:4174.';
    return;
  }
  if (!/^[a-f0-9]{32}$/.test(code)) {
    $('#error').textContent = 'Paste the complete 32-character delivery code. You can also paste the whole name-and-code line.';
    return;
  }
  let entries;
  try {
    const response = await fetch('reveals.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Delivery file unavailable');
    entries = await response.json();
  } catch {
    $('#error').textContent = 'The sealed deliveries could not be loaded. Run npm run build, then npm run dev in the kris folder, and open http://localhost:4174.';
    return;
  }
  try {
    const record = entries[hex(await hash('kris-id:' + code))];
    if (!record) throw new Error('Unknown code');
    const key = await crypto.subtle.importKey('raw', await hash('kris-key:' + code), 'AES-GCM', false, ['decrypt']);
    recipient = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(record.iv) }, key, bytes(record.data))));
    $('#code').value = '';
    $('#login').hidden = true;
    $('#gift').hidden = false;
    $('#lock').hidden = false;
    $('#unwrap').focus();
  } catch {
    $('#error').textContent = 'This code does not open a delivery in this draw. Check you have the current code and try again.';
  }
};
function startShow() {
  show?.stop();
  $('#gift').hidden = true;
  $('#reveal').hidden = false;
  $('#name').textContent = '';
  $('#replay').hidden = true;
  show = createShow($('#elf'), recipient, () => {
    $('#name').textContent = 'YOUR KRIS KINDLE IS… ' + recipient.name + '!';
    $('#replay').hidden = false;
  }, { muted });
  show.start();
}
$('#unwrap').textContent = 'Reveal My Kris Kindle!';
$('#unwrap').onclick = startShow;
$('#replay').onclick = startShow;
const skip = document.createElement('button'); skip.textContent = 'Skip animation';
skip.onclick = () => show?.skip(); $('#reveal').append(skip);
const mute = document.createElement('button'); mute.textContent = 'Mute';
mute.onclick = () => { muted = show ? show.mute() : !muted; mute.textContent = muted ? 'Unmute' : 'Mute'; mute.setAttribute('aria-pressed', String(muted)); }; $('#reveal').append(mute);
$('#lock').onclick = () => {
  show?.stop(); recipient = null; $('#name').textContent = '';
  for (const selector of ['#gift', '#reveal', '#lock']) $(selector).hidden = true;
  $('#login').hidden = false; $('#code').focus();
};
