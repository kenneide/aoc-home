"""Build a private, loopback-only preview; never add project files to dist."""
from pathlib import Path
import json, shutil, subprocess, sys, hashlib
from html import escape as e
root=Path(__file__).resolve().parent.parent
subprocess.run(['npm','run','build'],cwd=root,check=True)
project=root/'projects/ai-for-fun-and-profit'
slides=json.loads((project/'slides.json').read_text())
assert len({s['id'] for s in slides})==len(slides)
out=root/'output/presentation-preview'
shutil.rmtree(out,ignore_errors=True)
shutil.copytree(root/'dist',out)
target=out/'projects/ai-for-fun-and-profit';target.mkdir(parents=True)
shutil.copytree(project/'media',target/'media',dirs_exist_ok=True)
sections=[];notes=['# AI for Fun & Profit — presenter notes','Proposed narration based on owner-supplied facts. Missing materials are placeholders.']
def placeholder(label):
 return f'<div class="media-slot"><span class="slot-mark">＋</span><p>[PLACEHOLDER: {e(label)}]</p></div>'
def columns(items, cls='columns'):
 return '<div class="'+cls+'">'+''.join(f'<div><span class="ordinal">{j:02}</span><h3>{e(title)}</h3><p>{e(body)}</p></div>' for j,(title,body) in enumerate(items,1))+'</div>'
def hiring_model(days, stage):
 rate, weeks, cost, scale = 500, 4, 5000, 8000
 revenue = days * rate * weeks
 difference = revenue - cost
 money = lambda amount: f'€{amount:,}'
 result = f'{money(abs(difference))} {"below" if difference < 0 else "above"}'
 rows = [
     ('Billable days per week', days),
     ('Revenue per billable day', money(rate)),
     ('Additional monthly revenue', money(revenue)),
     ('Monthly cost of the hire', money(cost)),
     ('Result against monthly cost', result),
 ]
 table = '<table><caption>Illustrative four-week month</caption><tbody>' + ''.join(
     f'<tr><th scope="row">{label}</th><td>{value}</td></tr>' for label, value in rows
 ) + '</tbody></table>'
 return (f'<div class="hiring-model stage-{stage}">{table}'
         f'<figure class="hire-revenue"><figcaption>Monthly revenue · <strong>{money(revenue)}</strong></figcaption>'
         f'<div class="revenue-track" aria-hidden="true" style="--revenue:{revenue / scale:.1%};'
         f'--break-even:{cost / scale:.1%}"><span class="revenue-fill"></span>'
         f'<span class="break-even">{money(cost)}<br>break-even</span></div>'
         f'<div class="revenue-scale" aria-hidden="true"><span>€0</span><span>{money(scale)}</span></div></figure></div>')

def diagram_text(lines, x, y):
 first, *rest = lines
 return f'<text x="{x}" y="{y}">{e(first)}' + ''.join(
     f'<tspan x="{x}" dy="20"> {e(line)}</tspan>' for line in rest
 ) + '</text>'

def possibilities(quote_beat, ideas=None):
 example = ''
 if ideas:
  existing, new = ideas
  example = diagram_text(existing, 359, 223 - 10 * len(existing)) + diagram_text(new, 275, 298 - 8 * len(new))

 return (f'''<figure class="possibility-figure">
  <svg class="possibility-diagram {'quote-diagram' if quote_beat else 'example-diagram' if ideas else ''}" viewBox="0 -32 700 494"
       role="group" aria-label="Overlap between worth exploring and practical to try">
    <circle class="worth-circle" cx="235" cy="215" r="173"/>
    <circle class="practical-circle" cx="440" cy="215" r="125"/>
    <g class="diagram-labels">
      <text x="137" y="209">Worth</text><text x="137" y="233">exploring</text>
      <text x="493" y="209">Practical</text><text x="493" y="233">to try</text>
    </g>
    {example}
    <g class="hiring-questions">
      <text x="359" y="194">Will the<tspan x="359" dy="20">hire cover</tspan><tspan x="359" dy="20">its cost?</tspan></text>
      <text x="277" y="129">What if work<tspan x="277" dy="21">starts slowly?</tspan></text>
      <text x="277" y="285">What if we<tspan x="277" dy="21">hire part-time?</tspan></text>
    </g>
    <g class="quote-questions">
      <text x="359" y="194">Reusable<tspan x="359" dy="20">quote</tspan><tspan x="359" dy="20">template</tspan></text>
      <g class="quote-tool">
        <rect x="203" y="258" width="148" height="62" rx="2"/>
        <text x="277" y="281">Brief → draft<tspan x="277" dy="21">quote + checklist</tspan></text>
      </g>
    </g>
  </svg>
  <figcaption class="quote-next-step">{'Show a draft quote to someone who writes quotes. Does it save them work?' if quote_beat else ''}</figcaption>
 </figure>''')

def capture(file, alt, label):
 return (f'<figure><img src="media/{file}" alt="{e(alt)}">'
         f'<figcaption>{e(label)}</figcaption></figure>')

def gymnative():
 log = capture('haguegym-log.webp', 'Leg press set entered as 35 kg and 12 reps', 'Log a set')
 progress = capture('haguegym-progress.webp', 'The sample leg press history rises from 25 kg to 35 kg', 'Look back at progress')
 home = capture('haguegym-home.webp', 'Haguegym-branded start screen with Machine Circuit and Leg press selected', 'Haguegym’s ready-to-start circuit')
 return (f'<div class="case-state case-before capture-pair">{log}{progress}</div>'
         f'<div class="case-state case-after gym-tailoring">{home}'
         '<p class="message">The gym sets up the circuit. Members can get straight to logging.</p></div>'
         '<p class="caption sample-credit">Haguegym · Sample workout data</p>')

def zoundio_web():
 return ('''<div class="case-state case-before gibson-gameplay">
   <img src="media/gibson-mobile.webp" alt="Gibson App mobile guitar gameplay showing scrolling notes">
   <div class="gibson-platforms">
     <img src="media/gibson-app-store.png" alt="iPhone · App Store">
     <img src="media/gibson-google-play.png" alt="Android · Google Play">
   </div>
 </div>
 <div class="case-state case-after gibson-gameplay">
   <figure>
     <figcaption>Web gameplay · gibson.app</figcaption>
     <img src="media/gibson-browser.webp" alt="Add Index Finger in Gibson’s desktop browser player, with the browser frame and guitar fretboard visible">
   </figure>
 </div>''')

layouts=['opening','constraints','manifesto','case','roadmap','import','comparison','gym','demo','business','gallery','review','process','opportunities','question','closing']
for idx,s in enumerate(slides):
 n=s['notes'];assert all(n.values())
 number=idx+1;layout=s["layout"]; number={"case":4,"roadmap":5,"import":6,"comparison":7,"gym":8,"demo":9,"business":10,"gallery":11,"review":12,"process":13,"opportunities":14,"question":15,"closing":16}.get(layout,0)
 title=e(s['title']);body=f'<p class="message">{e(s["body"]).replace(chr(10),"<br>")}</p>'
 visual='';caption=''
 if layout=='clipping':
  body = ('<figure class="clipping"><img src="media/aoc-1892-nytimes.png" '
          'alt="Newspaper clipping headed A COMPUTER WANTED.">'
          '<figcaption class="caption">The New York Times · May 2, 1892 · p. 8 · Scan via Dan Nguyen</figcaption></figure>')
 elif layout=='historical':
  body = ('<figure class="computer-room"><img class="history-photo" src="media/computers.jpg" '
          'alt="NACA staff at desks with papers and a covered Friden calculator">'
          '<figcaption class="caption">1949 · <a href="https://www.flickr.com/photos/nasacommons/7538108706">NASA E49-54</a></figcaption></figure>')
 elif layout=='calculation':
  stops = [
      ('1949 · Human computers', 'People work through flight-test calculations.',
       'computers.jpg', 'NACA staff working at desks', 'NASA E49-54'),
      ('1959 · IBM 1401', 'Businesses process payroll and billing.',
       'aoc-ibm1401.jpg', 'IBM card reader, processing unit and printer', 'U.S. Ballistic Research Laboratories · 1961'),
      ('1979 · VisiCalc on the Apple II', 'Change a budget assumption and see totals update.',
       'visicalc.png', 'VisiCalc spreadsheet with a column of totals', 'Gortu / apple2history.org · Later capture'),
  ]
  body = '<ol class="calculation-timeline">' + ''.join(
      f'<li><img src="media/{image}" alt="{alt}"><h3>{label}</h3>'
      f'<p>{description}</p><p class="caption">{credit}</p></li>'
      for label, description, image, alt, credit in stops
  ) + '</ol>'
 elif layout=='hiring':
  body = hiring_model(2, 0) + hiring_model(3, 1)
 elif layout=='possibilities':
  body = possibilities(s['id'] == 'worth-building', s.get('ideas'))
 elif layout=='gymnative':
  body = gymnative()
 elif layout=='zoundio-web':
  body = zoundio_web()
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
 if s.get('source'): body+=f'<a class="source-link" href="{e(s["source"])}">Source ↗</a>'
 number=idx+1
 sections.append(f'<section id="{s["id"]}" data-chapter="{e(s.get("chapter",""))}" data-steps="{s.get("steps",1)}" class="slide layout-{layout}" aria-labelledby="title-{number}"><div class="slide-inner"><p class="eyebrow">AI for Fun & Profit / {number:02}</p><h2 id="title-{number}">{title}</h2>{body}'+(f'<p class="caption">{caption}</p>' if caption else '')+f'<div class="slide-footer"><span>Alan O Cinneide Software BV</span><span>{number:02} / {len(slides)}</span></div></div>{visual}</section>')
 notes.append('\n## '+s['id']+' — '+s['title']+'\n'+'\n'.join(f'\n**{k.title()}:** {v}' for k,v in n.items()))
(target/'notes.txt').write_text('\n'.join(notes))
(target/'index.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex,nofollow"><title>AI for Fun & Profit — local draft</title><script src="../../theme.js"></script><link rel="stylesheet" href="../../design/tokens.css"><link rel="stylesheet" href="../../styles.css"><link rel="stylesheet" href="deck.css"><header><img class="spectrum" src="../../assets/spectrum.svg" alt=""><div class="wrap header-row"><a href="/">Alan O Cinneide Software BV</a><button class="theme-toggle" aria-pressed="false" hidden>Dark mode</button></div></header><nav class="controls"><a href="/#projects">Back to site</a><button id="prev">← Previous</button><output aria-live="polite"></output><button id="next">Next →</button><button id="present">Present</button><button id="full">Full screen</button><a href="notes.txt" target="_blank">Notes</a></nav><main>'''+''.join(sections)+'''</main><footer><img class="spectrum" src="../../assets/spectrum.svg" alt=""><p>Alan O Cinneide Software BV · Local presentation draft</p></footer><script src="deck.js"></script></html>''')
for name in ['deck.js','deck.css']:
 shutil.copy2(project/name,target/name)
 version=hashlib.sha256((project/name).read_bytes()).hexdigest()[:12]
 page=target/'index.html'
 page.write_text(page.read_text().replace(f'"{name}"',f'"{name}?v={version}"'))
print('Preview: http://127.0.0.1:4174/projects/ai-for-fun-and-profit/')
if '--serve' in sys.argv:
 from preview_server import serve
 serve(out)
