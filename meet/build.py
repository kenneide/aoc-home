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
    ('index.html', 'Request a meeting', 'booking.js', '''
<p>Choose an available time. Your meeting is confirmed by email approval.</p>
<p id="status" role="status">Loading availability…</p>
<noscript>Enable JavaScript to check availability and request a meeting.</noscript>
<form id="booking" hidden>
<div class="options">
<label>Duration<select id="duration"><option value="30">30 minutes</option><option value="60">60 minutes</option></select></label>
<label>Time zone<select id="zone"></select></label>
</div>
<label>Date<select id="date" required></select></label>
<label>Time<select id="time" required></select></label>
<div class="options">
<label>Name<input name="name" autocomplete="name" required maxlength="100"></label>
<label>Email<input name="email" type="email" autocomplete="email" required maxlength="254"></label>
</div>
<label>Meeting note (optional)<textarea name="note" maxlength="1000" rows="3"></textarea></label>
<p>We use your details to review the request and email you about it. Please keep sensitive information out of the note.</p>
<div id="challenge"></div>
<button class="button" id="submit" disabled>Request meeting</button>
</form>'''),
    ('inbox.html', 'Meeting requests', 'inbox.js', '<p id="status" role="status">Loading requests…</p><div id="requests"></div>'),
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
