"""Build the booking site separately from the homepage publish allowlist."""
from html import escape
import json
from pathlib import Path
import shutil
from urllib.parse import urlsplit
from zoneinfo import ZoneInfo

meet = Path(__file__).resolve().parent
root = meet.parent
out = meet / 'dist'
out.mkdir(exist_ok=True)
config = json.loads((meet / 'room.config.json').read_text())
site = config['site']
schedule = config['schedule']
deployment = config['deployment']
brand = site.get('brand') or {}
name = escape(brand.get('name', site['roomName']))
title = escape(site['title'])
origin = site['origin']
origin_url = urlsplit(origin)
if (origin_url.scheme != 'https' or origin_url.netloc != origin_url.hostname
        or origin_url.path or origin_url.query or origin_url.fragment):
    raise ValueError('Use an HTTPS origin with a hostname and no trailing slash or path.')
ZoneInfo(schedule['zone'])
subscription = escape(origin.replace('https://', 'webcal://', 1) + '/availability.ics')
opens, closes = schedule['opensAt'], schedule['closesAt']
days = sorted(schedule['days'], key=lambda day: (day + 6) % 7)
step = schedule['slotMinutes']
if not (isinstance(opens, int) and isinstance(closes, int) and 0 <= opens < closes <= 23
        and isinstance(step, int) and step > 0 and 60 % step == 0 and days
        and isinstance(schedule['windowDays'], int) and schedule['windowDays'] > 0
        and len(set(days)) == len(days) and all(0 <= day <= 6 for day in days)):
    raise ValueError('Use distinct weekday numbers from 0 to 6, whole-hour opening times and a slot size that divides 60.')
day_names = ('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')
day_text = 'Monday through Friday' if days == [1, 2, 3, 4, 5] else ', '.join(day_names[day] for day in days)
time_label = escape(schedule['timeLabel'])
website = brand.get('website')
wordmark = f'<a class="brand" href="{escape(website)}">{name}</a>' if website else f'<span class="brand">{name}</span>'
links = []
if brand.get('email'):
    email = escape(brand['email'])
    links.append(f'<a href="mailto:{email}">{email}</a>')
if brand.get('registration'):
    registration = brand['registration']
    links.append(f'<a href="{escape(registration["url"])}">{escape(registration["label"])}</a>')
footer_links = '<div class="footer-links">' + ''.join(links) + '</div>' if links else ''

wrangler = json.loads((meet / 'wrangler.jsonc').read_text())
wrangler.update({
    'name': deployment['workerName'],
    'main': '../worker.js',
    'routes': [{'pattern': origin.removeprefix('https://'), 'custom_domain': True}],
    'vars': {'BOOKING_OPEN': str(deployment['open']).lower()},
})
wrangler['assets']['directory'] = '../dist'
wrangler_out = meet / '.wrangler'
wrangler_out.mkdir(exist_ok=True)
(wrangler_out / 'room.json').write_text(json.dumps(wrangler, indent=2) + '\n')

assets = ['theme.js', 'styles.css', 'design/tokens.css', 'assets/fonts/SpaceGrotesk.ttf', 'assets/fonts/OFL.txt']
if brand.get('spectrum'):
    assets += ['assets/spectrum.svg', 'assets/favicon.svg']
else:
    for asset in ('assets/spectrum.svg', 'assets/favicon.svg'):
        (out / asset).unlink(missing_ok=True)
for asset in assets:
    target = out / asset
    target.parent.mkdir(exist_ok=True, parents=True)
    shutil.copyfile(root / asset, target)
shutil.copytree(meet / 'public', out, dirs_exist_ok=True)
shutil.copyfile(meet / 'hours.js', out / 'hours.js')

(out / 'settings.js').write_text('export default ' + json.dumps({'schedule': schedule}) + ';\n')
ribbon = '<img class="spectrum" src="/assets/spectrum.svg" alt="" width="1280" height="48">' if brand.get('spectrum') else ''
favicon = '<link rel="icon" href="/assets/favicon.svg">' if ribbon else ''
content = f'''
<p>Book {day_text}, {opens:02}:00–{closes:02}:00 {time_label}. Tap or drag on the calendar, then adjust the start and end times if needed.</p>
<p><a href="{subscription}">Subscribe to room availability</a></p>
<p id="status" role="status">Loading availability…</p>
<noscript>Enable JavaScript to check availability and book the room.</noscript>
<section id="schedule" aria-label="Room availability" hidden>
<div class="week-navigation">
<button type="button" id="previous">Previous week</button>
<h2 id="week-label" aria-live="polite"></h2>
<button type="button" id="next">Next week</button>
</div>
<ul class="week-legend" id="legend" aria-label="Calendar key">
<li><span class="week-key week-open" aria-hidden="true"></span>Available</li>
<li><span class="week-key week-busy" aria-hidden="true"></span>Occupied</li>
<li><span class="week-key week-unavailable" aria-hidden="true"></span>Outside booking window</li>
</ul>
<div id="week" class="week" style="--week-days: {len(days)}" aria-describedby="legend"></div>
</section>
<form id="booking" hidden>
<p id="selection" role="status">Select a time in the calendar.</p>
<div class="options">
<label>Start time<input id="start-time" type="time" min="{opens:02}:00" max="{closes - 1:02}:59" required disabled></label>
<label>End time<input id="end-time" type="time" min="{opens:02}:01" max="{closes:02}:00" required disabled></label>
</div>
<div class="options">
<label>Name<input name="name" autocomplete="name" required maxlength="100"></label>
<label>Email (optional)<input name="email" type="email" autocomplete="email" maxlength="254"></label>
</div>
<label>Phone (optional)<input name="phone" type="tel" autocomplete="tel" maxlength="50"></label>
<p>Only the calendar owner can see your booking details.</p>
<div id="challenge"></div>
<button class="button" id="submit" disabled>Book room</button>
</form>
<section id="confirmation" class="booking-confirmation" aria-labelledby="confirmation-title" hidden>
<h2 id="confirmation-title" tabindex="-1">Room booked</h2>
<p id="confirmation-time"></p>
</section>'''
(out / 'index.html').write_text(f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>{title} | {name}</title>{favicon}
<script src="/theme.js"></script><link rel="stylesheet" href="/design/tokens.css"><link rel="stylesheet" href="/styles.css">
<link rel="stylesheet" href="/meet.css"><script type="module" src="/booking.js"></script></head>
<body><a class="skip" href="#main">Skip to content</a>
<header>{ribbon}<div class="wrap header-row">{wordmark}
<button class="theme-toggle" type="button" aria-pressed="false" hidden>Dark mode</button></div></header>
<main class="wrap meeting" id="main"><h1>{title}</h1>{content}</main>
<footer>{ribbon}<div class="wrap footer-row"><strong>{name}</strong>{footer_links}</div></footer>
</body></html>""", encoding='utf-8')
