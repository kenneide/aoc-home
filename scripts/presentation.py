"""Render the public slide deck or a local preview with speaker notes."""
from pathlib import Path
import json, shutil, subprocess, sys, hashlib
from html import escape as e
root=Path(__file__).resolve().parent.parent
publish = '--publish' in sys.argv
project=root/'projects/what-becomes-worth-building'
slides=json.loads((project/'slides.json').read_text())
assert len({s['id'] for s in slides})==len(slides)
out = root/'dist' if publish else root/'output/presentation-preview'
if not publish:
 subprocess.run(['npm','run','build'],cwd=root,check=True)
 shutil.rmtree(out,ignore_errors=True)
 shutil.copytree(root/'dist',out)
target = out/'projects/what-becomes-worth-building'
media = target/'media'
media.mkdir(parents=True, exist_ok=True)
for name in (
 'aoc-1892-nytimes.png', 'naca-lewis.jpg', 'aoc-ibm1401.jpg', 'visicalc.png',
 'gibson-icon.png', 'gibson-mobile.webp', 'gibson-app-store.png', 'gibson-google-play.png', 'gibson-browser.webp',
 'haguegym-log.webp', 'haguegym-progress.webp', 'haguegym-home.webp', 'haguegym-qr.png',
 'room-door.webp', 'room-quarter-hour.webp', 'room-calendar.webp',
):
 shutil.copy2(project/'media'/name, media/name)
talk = json.loads((project/'talk.json').read_text())
deck_title, deck_subtitle = talk['title'], talk['subtitle']
if publish:
 origin = json.loads((root/'content/site.json').read_text())['site']['origin']
 metadata = f'<link rel="canonical" href="{e(origin)}/projects/what-becomes-worth-building/">'
 notes_link = ''
 footer_status = 'Presentation'
else:
 metadata = '<meta name="robots" content="noindex,nofollow">'
 notes_link = ('<a href="notes.txt" target="_blank" rel="noopener">Notes</a>'
               '<a href="print-notes.html" target="_blank" rel="noopener">Print with notes</a>')
 footer_status = 'Local presentation preview'
sections=[];notes=[f'# {deck_title}', deck_subtitle,'Proposed narration based on owner-supplied facts. Missing materials are placeholders.']
def placeholder(label):
 return f'<div class="media-slot"><span class="slot-mark">＋</span><p>[PLACEHOLDER: {e(label)}]</p></div>'
def columns(items, cls='columns'):
 return '<div class="'+cls+'">'+''.join(f'<div><span class="ordinal">{j:02}</span><h3>{e(title)}</h3><p>{e(body)}</p></div>' for j,(title,body) in enumerate(items,1))+'</div>'
def analogy(kind):
 outcome = {'calculation': 'More questions businesses can ask',
            'software': 'More tools businesses can try'}[kind]
 return (f'<p class="analogy"><strong>Cheaper {kind}</strong>'
         f' <span>→</span> {outcome}</p>')

def hiring_model(questions):
 rate, weeks, cost, scale = 500, 4, 5000, 8000
 days = (2, 3)
 first, second = (count * rate * weeks for count in days)
 money = lambda amount: f'€{amount:,}'
 def states(before, after):
  return f'<span class="hire-before">{before}</span><span class="hire-after">{after}</span>'
 def result(revenue):
  difference = revenue - cost
  if difference == 0:
   return 'At break-even'
  direction = 'above' if difference > 0 else 'below'
  return f'{money(abs(difference))} {direction} break-even'
 rows = [('Billable days per week', states(*days)), ('Per billable day', money(rate)),
         ('Monthly revenue', states(money(first), money(second)))]
 table = '<table><caption>Illustrative four-week month</caption><tbody>' + ''.join(
     f'<tr><th scope="row">{label}</th><td>{value}</td></tr>' for label, value in rows
 ) + '</tbody></table>'
 chart = (
     '<figure class="hire-revenue" aria-label="Monthly revenue chart">'
     f'<div class="revenue-track" style="--first:{first/scale:.1%};--second:{second/scale:.1%};'
     f'--break-even:{cost/scale:.1%}"><span class="revenue-fill"></span>'
     f'<span class="break-even">{money(cost)}<br>break-even</span></div>'
     f'<div class="revenue-scale"><span>€0</span><span>{money(scale)}</span></div>'
     f'<strong class="hire-result">{states(result(first), result(second))}</strong></figure>'
 )
 follow_ups = '<ul>' + ''.join(
     f'<li><strong>{e(topic)}</strong> {e(question)}</li>' for topic, question in questions
 ) + '</ul>'
 return (f'<div class="hiring-model"><div class="hire-calculation">{table}{chart}</div>'
         f'<section class="hire-questions hire-after"><h3>What else could we ask?</h3>'
         f'{follow_ups}</section></div>')

def diagram_text(lines, x, accent=False):
 line_height = 24
 y = 188 - (len(lines) - 1) * line_height / 2
 label = '<text>' + ''.join(
     f'<tspan x="{x}" y="{y + i * line_height}">{e(line)}</tspan>'
     for i, line in enumerate(lines)
 ) + '</text>'
 if not accent:
  return label
 return (f'<g class="reachable"><rect x="{x-65}" y="{y-22}" width="130" '
         f'height="{len(lines)*line_height+6}" rx="2"/>{label}</g>')

def possibilities(ideas=()):
 labels = ''
 if ideas:
  existing, new = ideas
  labels = diagram_text(existing, 316) + diagram_text(new, 181, accent=True)
 return f'''<figure class="possibility-figure">
  <svg class="possibility-diagram" viewBox="-10 -64 625 488"
       role="group" aria-label="Overlap between valuable and practical">
    <circle class="worth-circle" cx="190" cy="180" r="195"/>
    <circle class="practical-circle" cx="370" cy="180" r="122"/>
    <g class="diagram-labels">
      <text x="203" y="94">Valuable</text>
      <text x="438" y="187">Practical</text>
    </g>
    {labels}
  </svg>
 </figure>'''

def quote_template():
 return (
     '<div class="quote-template"><strong>Reusable quote template</strong>'
     '<dl><dt>Client</dt><dd>Client name</dd><dt>Scope</dt><dd>Work to deliver</dd>'
     '<dt>Price</dt><dd>Project total</dd></dl></div>'
 )

def capture(file, alt, label):
 return (f'<figure><img src="media/{file}" alt="{e(alt)}">'
         f'<figcaption>{e(label)}</figcaption></figure>')

def gymnative():
 log = capture('haguegym-log.webp', 'Leg press set entered as 35 kg and 12 reps', 'Log a set')
 progress = capture('haguegym-progress.webp', 'The sample leg press history rises from 25 kg to 35 kg', 'Look back at progress')
 home = capture('haguegym-home.webp', 'Haguegym-branded start screen with Machine Circuit and Leg press selected', 'Haguegym’s ready-to-start circuit')
 return (f'<div class="case-state case-before capture-pair">{log}{progress}</div>'
         f'<div class="case-state case-after gym-tailoring">{home}'
         '<div><img class="gym-qr" src="media/haguegym-qr.png" alt="QR code for the Haguegym app">'
         '<p class="message">Scan. Open your gym’s app. Start logging.</p>'
         '<p>Your gym’s equipment and workouts are already set up.</p></div></div>')

def gibson_web():
 return ('''<div class="case-state case-before gibson-gameplay">
   <img src="media/gibson-mobile.webp" alt="Gibson App mobile guitar gameplay showing scrolling notes">
   <div class="gibson-platforms">
     <img src="media/gibson-app-store.png" alt="iPhone · App Store">
     <img src="media/gibson-google-play.png" alt="Android · Google Play">
   </div>
   <p class="case-cue">Another platform to build, test and support.</p>
 </div>
 <div class="case-state case-after gibson-browser">
   <img src="media/gibson-browser.webp" alt="Add Index Finger in Gibson’s desktop browser player, with the browser frame and guitar fretboard visible">
   <p class="case-cue">Browser gameplay launches next week.</p>
 </div>''')

def room_walkthrough():
 def evidence(file, size, crop, alt, label):
  width, height = size
  x, y, crop_width, crop_height = crop
  return (f'<figure><svg viewBox="{x} {y} {crop_width} {crop_height}" '
          f'role="img" aria-label="{e(alt)}">'
          f'<image href="media/{file}" width="{width}" height="{height}"/></svg>'
          f'<figcaption>{e(label)}</figcaption></figure>')
 booking = evidence('room-quarter-hour.webp', (1664, 492), (701, 143, 648, 340),
                    'Selected 14:00–14:15 slot on the booking page', 'Book 14:00–14:15')
 calendar = evidence('room-calendar.webp', (910, 575), (15, 282, 537, 138),
                     'Anonymous busy blocks in the subscribed room calendar',
                     'See room availability in your calendar')
 return (f'<div class="room-pair">{booking}{calendar}</div>'
         '<a class="room-link" href="https://room.alanocinneide.com/">room.alanocinneide.com ↗</a>')

layouts=['opening','constraints','manifesto','case','roadmap','import','comparison','gym','demo','business','gallery','review','process','opportunities','question','closing']
for idx,s in enumerate(slides):
 n=s['notes'];assert all(n.values())
 number=idx+1;layout=s["layout"]; number={"case":4,"roadmap":5,"import":6,"comparison":7,"gym":8,"demo":9,"business":10,"gallery":11,"review":12,"process":13,"opportunities":14,"question":15,"closing":16}.get(layout,0)
 slide_title = deck_title if layout == 'title-ribbon' else s['title']
 title=e(slide_title);body=f'<p class="message">{e(s["body"]).replace(chr(10),"<br>")}</p>'
 visual='';caption=''
 if layout in ('title-ribbon', 'thanks-ribbon'):
  body = '<p class="message">' + e(deck_subtitle if layout == 'title-ribbon' else s['body']) + '</p>'
  if layout == 'title-ribbon':
   body += '<p class="ribbon-byline">Alan O Cinneide</p>'
  visual = '<img class="deck-ribbon" src="../../assets/bands.svg" alt="">'
 elif layout=='clipping':
  body = ('<figure class="clipping"><img src="media/aoc-1892-nytimes.png" '
          'alt="Newspaper clipping headed A COMPUTER WANTED.">'
          '<figcaption class="caption">The New York Times · May 2, 1892</figcaption></figure>')
 elif layout=='historical':
  body = ('<figure class="computer-room"><img class="history-photo" src="media/naca-lewis.jpg" '
          'alt="Women working at rows of desks in the NACA Lewis computing office">'
          '<figcaption class="caption">1957 · <a href="https://www.flickr.com/photos/44494372@N05/53912325323">NASA Glenn Research Center · GRC-1957-C-43712</a></figcaption></figure>')
 elif layout=='calculation':
  stops = [
      ('Government research and other large institutions', 'Analyze flight tests.',
       'naca-lewis.jpg', 'NACA staff working at desks', '1957 · NACA Lewis office'),
      ('Large businesses', 'Run payroll and billing.',
       'aoc-ibm1401.jpg', 'IBM card reader, processing unit and printer', '1959 · IBM 1401'),
      ('Smaller businesses', 'Explore a hiring decision at your desk.',
       'visicalc.png', 'VisiCalc spreadsheet with a column of totals', '1979 · VisiCalc on the Apple II'),
  ]
  body = '<ol class="calculation-timeline">' + ''.join(
      f'<li><img src="media/{image}" alt="{alt}"><h3>{label}</h3>'
      f'<p>{description}</p><p class="caption">{credit}</p></li>'
      for label, description, image, alt, credit in stops
  ) + '</ol>' + analogy('calculation')
 elif layout=='hiring':
  body = hiring_model(s['questions'])
 elif layout=='possibilities':
  if s['id'] == 'worth-building':
   body = analogy('software') + '<div class="diagram-pair">' + quote_template() + possibilities([
       ['Reusable', 'quote', 'template'], ['Brief to', 'draft quote', '+ checklist']]) + '</div>'
  else:
   body = possibilities(s['ideas'])
 elif layout=='gymnative':
  body = gymnative()
 elif layout=='gibson-web':
  body = gibson_web()
  title = '<img class="gibson-icon" src="media/gibson-icon.png" alt="">' + title
 elif layout=='room-door':
  body = '<img class="room-door-photo" src="media/room-door.webp" alt="A paper booking sheet attached to the glass meeting-room door">'
 elif layout=='room-walkthrough':
  body = room_walkthrough()
 elif layout=='audience-close':
  body = analogy('calculation') + analogy('software') + '<div class="close-pair">' + possibilities() + '<ul class="audience-questions">' + ''.join(
      f'<li>{e(question)}</li>' for question in s['body'].splitlines()
  ) + '</ul></div>'
 elif layout=='quote':
  body=body+'<p>Sam Altman · July 2025</p><p class="caption">100–1,000×: Altman’s speculation</p>'
 elif layout=='chart':
  body='<div class="bars" role="img" aria-label="Submissions reviewed in millions: 2022 6.10, 2023 6.89, 2024 7.77, 2025 9.10. Zero baseline.">'+''.join(f'<div><strong>{v/1e6:.2f}m</strong><span style="height:{v/1e7*23}cqw"></span><b>{y}</b></div>' for y,v in s['chart'])+'</div><p class="caption">Apple Transparency Reports · Includes updates and resubmissions · Baseline: 0</p>'
 elif layout=='experiment':
  body=body+'<p class="caption">An illustration, not an estimate</p><p>Gym logging · Guitar lesson editing · Kitchen planning · Business automation</p>'
 elif number==1:
  body='<p class="message">Because software felt too expensive?</p><p class="event">Drink & Discover / 20 November 2026<br>Alan O Cinneide · MyWorkLounge, The Hague</p>';visual='<img class="hero-wave" src="../../assets/bands.svg" alt="">'
 elif number==2:
  body=columns([('Expertise','The technologies we knew'),('Budget','The investment we could justify'),('Time','The capacity we had')]);caption='These constraints shaped the solution'
 elif number==3:
  body=columns([('Think','Beyond your constraints'),('Build','With AI'),('Deliver','With discipline')]);visual='<img class="wave-edge" src="../../assets/bands.svg" alt="">'
 elif number==4:
  body='<div class="split"><div><p class="case-number">01</p><p class="message">Music education.<br>Interactive guitar lessons.</p><p>The lesson author’s experience matters.</p></div>'+placeholder(s['placeholder'])+'</div>'
 elif number==5:
  body=columns([('A practical choice','Solve today’s problem'),('A specialized workflow','Build around available skills'),('A lasting habit','Keep using what works')]);caption='Conceptual workflow / not an internal system diagram'
 elif number==6:
  body='<div class="pipeline"><span>Familiar<br>authoring tools</span><b>→</b><span>Import &<br>conversion</span><b>→</b><span>Native<br>lesson data</span></div>'+placeholder(s['placeholder']);caption='Let musicians work in tools they already know'
 elif number==7:
  body=columns([('Tool-led','Specialized authoring → lesson content'),('Experience-led','Familiar authoring → import → lesson content')]);caption='A better workflow can improve everything downstream'
 elif number==8:
  body='<div class="split"><div class="checklist"><p>No registration</p><p>No setup ritual</p><strong>Start logging →</strong></div><div class="phone">'+placeholder(s['placeholder'])+'</div></div>'
 elif number==9:
  body='<div class="demo-stage">'+placeholder(s['placeholder'])+'</div><div class="demo-steps"><span>01 / Open</span><span>02 / Log an exercise</span><span>03 / Inspect progress</span></div>'
 elif number==10:
  body=columns([('The gym configures','Equipment · Workouts · Branding'),('The member opens','A ready-to-use experience')]);caption='Working personal product / potential commercial opportunity'
 elif number==11:
  body='<div class="gallery-grid">'+placeholder('Real AI-assisted creative experiment 1')+placeholder('Real AI-assisted creative experiment 2')+'</div>';caption='Try something. Learn something. Follow the interesting part.'
 elif number==12:
  body='<div class="review-grid">'+''.join('<div><span>Review /</span><h3>'+x+'</h3></div>' for x in ['Assumptions','Bugs','Abstractions','System design'])+'</div>';caption='Generated code still needs engineering judgment'
 elif number==13:
  body='<ol class="process-loop">'+''.join('<li><span>'+str(j)+'</span>'+x+'</li>' for j,x in enumerate(['Understand the problem','Define the experience','Specify requirements','Break into tasks','Build with agents','Review · test · debug','Learn from feedback ↻'],1))+'</ol>';caption='Version control / Clear architecture / Automated tests / Incremental changes'
 elif number==14:
  body='<div class="opportunity-list">'+''.join('<span>'+x+'</span>' for x in ['Administration','Spreadsheets','Internal tools','Business data','Small services','Prototypes'])+'</div>';caption='An existing product, simpler workflow or lightweight automation may be enough'
 elif number==15:
  body='<div class="question-prompts"><p>Who needs it?</p><p>What gets in their way?</p><p>What would better look like?</p></div>'
 elif number==16:
  body='<p class="message">Think beyond your constraints.<br>Build with AI.<br>Deliver with discipline.</p><a class="contact" href="mailto:hello@alanocinneide.com">hello@alanocinneide.com ↗</a>';visual='<img class="wave-edge" src="../../assets/bands.svg" alt="">'
 if s.get('cue'):
  body = f'<p class="slide-cue">{e(s["cue"])}</p>' + body
 if s.get('source'): body+=f'<a class="source-link" href="{e(s["source"])}">Source ↗</a>'
 number=idx+1
 sections.append(f'<section id="{s["id"]}" data-chapter="{e(s.get("chapter",""))}" data-steps="{s.get("steps",1)}" class="slide layout-{layout}" aria-labelledby="title-{number}"><div class="slide-inner"><p class="eyebrow">{e(deck_title)} / {number:02}</p><h2 id="title-{number}">{title}</h2>{body}'+(f'<p class="caption">{caption}</p>' if caption else '')+f'<div class="slide-footer"><span>Alan O Cinneide Software BV</span><span>{number:02} / {len(slides)}</span></div></div>{visual}</section>')
 notes.append('\n## '+s['id']+' — '+s['title']+'\n'+'\n'.join(f'\n**{k.title()}:** {v}' for k,v in n.items()))
if not publish:
 (target/'notes.txt').write_text('\n'.join(notes))
 sheets = []
 for number, (slide, preview) in enumerate(zip(slides, sections), 1):
  note = slide['notes']
  paragraphs = ''.join(
      f'<p><strong>{label}</strong> {e(note[key])}</p>'
      for key, label in [('optional answers', 'Optional answers'), ('transition', 'Next'), ('materials', 'Materials')]
      if note.get(key)
  )
  sheets.append(f'<article class="speaker-sheet">{preview}<div class="speaker-notes">'
                f'<h2>Notes · {number:02} / {len(slides):02}</h2>'
                f'<p>{e(note["story"])}</p>{paragraphs}</div></article>')
 (target/'print-notes.html').write_text(f'''<!doctype html>
<html lang="en" data-theme="light">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
{metadata}
<title>{e(deck_title)} — Print with notes</title>
<link rel="stylesheet" href="../../design/tokens.css">
<link rel="stylesheet" href="../../styles.css">
<link rel="stylesheet" href="deck.css">
<body class="print-notes">
<div class="controls"><h1>Print with notes</h1><button type="button" onclick="window.print()">Print or save PDF</button></div>
<main>{''.join(sheets)}</main>
</body>
</html>''')
(target/'index.html').write_text(f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width">{metadata}<title>{e(deck_title)} — {e(deck_subtitle)}</title><meta name="description" content="{e(deck_subtitle)}"><script src="../../theme.js"></script><link rel="stylesheet" href="../../design/tokens.css"><link rel="stylesheet" href="../../styles.css"><link rel="stylesheet" href="deck.css"><header><img class="spectrum" src="../../assets/spectrum.svg" alt=""><div class="wrap header-row"><a href="/">Alan O Cinneide Software BV</a><button class="theme-toggle" aria-pressed="false" hidden>Dark mode</button></div><div class="wrap deck-heading"><h1>{e(deck_title)}</h1><p>{e(deck_subtitle)}</p></div></header><nav class="controls"><a href="/#projects">Back to site</a><button id="prev">← Previous</button><output aria-live="polite"></output><button id="next">Next →</button><button id="present">Present</button><button id="full">Full screen</button>{notes_link}</nav><main>'''+''.join(sections)+f'''</main><footer><img class="spectrum" src="../../assets/spectrum.svg" alt=""><p>Alan O Cinneide Software BV · {footer_status}</p></footer><script src="deck.js"></script></html>''')
for name in ['deck.js','deck.css']:
 shutil.copy2(project/name,target/name)
 version=hashlib.sha256((project/name).read_bytes()).hexdigest()[:12]
 pages = ['index.html'] if publish else ['index.html', 'print-notes.html']
 for file in pages:
  page = target/file
  page.write_text(page.read_text().replace(f'"{name}"', f'"{name}?v={version}"'))
if not publish:
 handout = root/'output/pdf/what-becomes-worth-building-speaker-notes.pdf'
 checksum = handout.with_suffix('.sha256')
 if handout.is_file() and checksum.is_file():
  fingerprint = hashlib.sha256((target/'print-notes.html').read_bytes()).hexdigest()
  if checksum.read_text().strip() == fingerprint:
   shutil.copy2(handout, target/handout.name)
   page = target/'index.html'
   page.write_text(page.read_text().replace('href="print-notes.html"', f'href="{handout.name}"'))
if '--serve' in sys.argv:
 from preview_server import serve
 serve(out, open_browser='--open' in sys.argv)
