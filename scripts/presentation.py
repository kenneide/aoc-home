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
for s in slides:
 n=s['notes'];assert all(n.values())
 sections.append(f'<section id="{s["id"]}" class="slide"><p class="eyebrow">AI for Fun & Profit / {s["id"][-2:]}</p><h2>{e(s["title"])}</h2><p class="message">{e(s["body"]).replace(chr(10),"<br>")}</p>'+ (f'<p class="placeholder">[PLACEHOLDER: {e(s["placeholder"])}]</p>' if s['placeholder'] else '')+ ('<p>Drink & Discover · Alan O Cinneide<br>MyWorkLounge, Weimarstraat, The Hague · 20 November 2026</p>' if s==slides[0] else '')+('<a href="mailto:hello@alanocinneide.com">hello@alanocinneide.com</a>' if s==slides[-1] else '')+'</section>')
 notes.append('\n## '+s['id']+' — '+s['title']+'\n'+'\n'.join(f'\n**{k.title()}:** {v}' for k,v in n.items()))
(target/'notes.txt').write_text('\n'.join(notes))
(target/'index.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex,nofollow"><title>AI for Fun & Profit — local draft</title><script src="../../theme.js"></script><link rel="stylesheet" href="../../design/tokens.css"><link rel="stylesheet" href="../../styles.css"><link rel="stylesheet" href="deck.css"><header><img class="spectrum" src="../../assets/spectrum.svg" alt=""><div class="wrap header-row"><a href="/">Alan O Cinneide Software BV</a><button class="theme-toggle" aria-pressed="false" hidden>Dark mode</button></div></header><nav class="controls"><a href="/#projects">Back to site</a><button id="prev">← Previous</button><output aria-live="polite"></output><button id="next">Next →</button><button id="present">Present</button><button id="full">Full screen</button><a href="notes.txt" target="_blank">Notes</a></nav><main>'''+''.join(sections)+'''</main><footer><img class="spectrum" src="../../assets/spectrum.svg" alt=""><p>Alan O Cinneide Software BV · Local presentation draft</p></footer><script src="deck.js"></script></html>''')
for name in ['deck.js','deck.css']:shutil.copy2(project/name,target/name)
print('Preview: http://127.0.0.1:4174/projects/ai-for-fun-and-profit/')
if '--serve' in sys.argv:
 subprocess.run([sys.executable,'-m','http.server','4174','--bind','127.0.0.1','--directory',str(out)],check=True)
