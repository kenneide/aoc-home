"""Build the booking site separately from the homepage publish allowlist."""
from html import escape
import json
from pathlib import Path
import shutil

meet = Path(__file__).resolve().parent
root = meet.parent
out = meet / 'dist'
out.mkdir(exist_ok=True)
company = json.loads((root / 'design/company.json').read_text())
name = escape(company['name'])
email = escape(company['inquiriesEmail'])
registry = company['kvk']

for asset in ('theme.js', 'styles.css', 'design/tokens.css', 'assets/spectrum.svg',
              'assets/favicon.svg', 'assets/fonts/SpaceGrotesk.ttf', 'assets/fonts/OFL.txt'):
    target = out / asset
    target.parent.mkdir(exist_ok=True, parents=True)
    shutil.copyfile(root / asset, target)
shutil.copytree(meet / 'public', out, dirs_exist_ok=True)

ribbon = '<img class="spectrum" src="/assets/spectrum.svg" alt="" width="1280" height="48">'
for path, title, script, content in (
    ('index.html', 'Book the room', 'booking.js', '''
<p>Times are shown in Amsterdam time. Select a start time or drag across two half-hour slots.</p>
<p id="status" role="status">Loading availability…</p>
<noscript>Enable JavaScript to check availability and book the room.</noscript>
<section id="schedule" aria-label="Room availability" hidden>
<div class="week-navigation">
<button type="button" id="previous">Previous week</button>
<h2 id="week-label" aria-live="polite"></h2>
<button type="button" id="next">Next week</button>
</div>
<p id="legend">Open cells are available. Shaded cells are unavailable.</p>
<div id="week" class="week" aria-describedby="legend"></div>
</section>
<form id="booking" hidden>
<p id="selection" role="status">Select a time in the calendar.</p>
<label>Duration<select id="duration" disabled><option value="30">30 minutes</option><option value="60">60 minutes</option></select></label>
<div class="options">
<label>Name<input name="name" autocomplete="name" required maxlength="100"></label>
<label>Email (optional)<input name="email" type="email" autocomplete="email" maxlength="254"></label>
</div>
<label>Phone (optional)<input name="phone" type="tel" autocomplete="tel" maxlength="50"></label>
<p>Only the calendar owner can see your booking details.</p>
<div id="challenge"></div>
<button class="button" id="submit" disabled>Book room</button>
</form>'''),
):
    target = out / path
    target.write_text(f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>{title} | {name}</title><link rel="icon" href="/assets/favicon.svg">
<script src="/theme.js"></script><link rel="stylesheet" href="/design/tokens.css"><link rel="stylesheet" href="/styles.css">
<link rel="stylesheet" href="/meet.css"><script type="module" src="/{script}"></script></head>
<body><a class="skip" href="#main">Skip to content</a>
<header>{ribbon}<div class="wrap header-row"><a class="brand" href="https://alanocinneide.com/">{name}</a>
<button class="theme-toggle" type="button" aria-pressed="false" hidden>Dark mode</button></div></header>
<main class="wrap meeting" id="main"><h1>{title}</h1>{content}</main>
<footer>{ribbon}<div class="wrap footer-row"><strong>{name}</strong><div class="footer-links"><a href="mailto:{email}">{email}</a>
<a href="{escape(registry['url'])}">KVK {escape(str(registry['number']))}</a></div></div></footer>
</body></html>""", encoding='utf-8')
