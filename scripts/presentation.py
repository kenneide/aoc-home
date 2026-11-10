"""Build a private, loopback-only preview; never add project files to dist."""
from pathlib import Path
import json, shutil, subprocess, sys
from html import escape as e
root=Path(__file__).resolve().parent.parent
subprocess.run(['npm','run','build'],cwd=root,check=True)
project=root/'projects/ai-for-fun-and-profit'
slides=json.loads((project/'slides.json').read_text())
assert len({s['id'] for s in slides})==len(slides)==16
out=root/'output/presentation-preview'
shutil.rmtree(out,ignore_errors=True)
shutil.copytree(root/'dist',out)
target=out/'projects/ai-for-fun-and-profit';target.mkdir(parents=True)
sections=[];notes=['# AI for Fun & Profit — presenter notes','Proposed narration based on owner-supplied facts. Missing materials are placeholders.']
def placeholder(label):
 return f'<div class="media-slot"><span class="slot-mark">＋</span><p>[PLACEHOLDER: {e(label)}]</p></div>'
def columns(items, cls='columns'):
 return '<div class="'+cls+'">'+''.join(f'<div><span class="ordinal">{j:02}</span><h3>{e(title)}</h3><p>{e(body)}</p></div>' for j,(title,body) in enumerate(items,1))+'</div>'
layouts=['opening','constraints','manifesto','case','roadmap','import','comparison','gym','demo','business','gallery','review','process','opportunities','question','closing']
for idx,s in enumerate(slides):
 n=s['notes'];assert all(n.values())
 number=idx+1;layout=layouts[idx]
 title=e(s['title']);body=f'<p class="message">{e(s["body"]).replace(chr(10),"<br>")}</p>'
 visual='';caption=''
 if number==1:
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
 sections.append(f'<section id="{s["id"]}" class="slide layout-{layout}" aria-labelledby="title-{number}"><div class="slide-inner"><p class="eyebrow">AI for Fun & Profit / {number:02}</p><h2 id="title-{number}">{title}</h2>{body}'+(f'<p class="caption">{caption}</p>' if caption else '')+f'<div class="slide-footer"><span>Alan O Cinneide Software BV</span><span>{number:02} / 16</span></div></div>{visual}</section>')
 notes.append('\n## '+s['id']+' — '+s['title']+'\n'+'\n'.join(f'\n**{k.title()}:** {v}' for k,v in n.items()))
(target/'notes.txt').write_text('\n'.join(notes))
(target/'index.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex,nofollow"><title>AI for Fun & Profit — local draft</title><script src="../../theme.js"></script><link rel="stylesheet" href="../../design/tokens.css"><link rel="stylesheet" href="../../styles.css"><link rel="stylesheet" href="deck.css"><header><img class="spectrum" src="../../assets/spectrum.svg" alt=""><div class="wrap header-row"><a href="/">Alan O Cinneide Software BV</a><button class="theme-toggle" aria-pressed="false" hidden>Dark mode</button></div></header><nav class="controls"><a href="/#projects">Back to site</a><button id="prev">← Previous</button><output aria-live="polite"></output><button id="next">Next →</button><button id="present">Present</button><button id="full">Full screen</button><a href="notes.txt" target="_blank">Notes</a></nav><main>'''+''.join(sections)+'''</main><footer><img class="spectrum" src="../../assets/spectrum.svg" alt=""><p>Alan O Cinneide Software BV · Local presentation draft</p></footer><script src="deck.js"></script></html>''')
for name in ['deck.js','deck.css']:shutil.copy2(project/name,target/name)
print('Preview: http://127.0.0.1:4174/projects/ai-for-fun-and-profit/')
if '--serve' in sys.argv:
 from preview_server import serve
 serve(out)
