"""Build the static website and PDF from one factual CV source."""
from pathlib import Path
from html import escape as e
import json, shutil
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
ROOT=Path(__file__).resolve().parent.parent
cv=json.loads((ROOT/'content/cv.json').read_text())
company=json.loads((ROOT/'design/company.json').read_text())
linkedin='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.45 2H3.55C2.69 2 2 2.68 2 3.52v16.96c0 .84.69 1.52 1.55 1.52h16.9c.86 0 1.55-.68 1.55-1.52V3.52c0-.84-.69-1.52-1.55-1.52ZM7.93 18.75H4.98V9.2h2.95v9.55ZM6.45 7.9a1.71 1.71 0 1 1 0-3.42 1.71 1.71 0 0 1 0 3.42Zm12.3 10.85H15.8V14.1c0-1.11-.02-2.54-1.55-2.54-1.55 0-1.79 1.21-1.79 2.46v4.73H9.51V9.2h2.83v1.3h.04c.4-.76 1.36-1.56 2.8-1.56 3 0 3.57 1.98 3.57 4.55v5.26Z"/></svg>'
def social(): return f'<a class="social" aria-label="LinkedIn" href="{cv["linkedin"]}">{linkedin}<span>LinkedIn</span></a>'
def shell(title,desc,body,prefix='',is_cv=False):
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(title)}</title><meta name="description" content="{e(desc)}"><meta name="theme-color" content="#f6f5ef"><script src="{prefix}theme.js"></script><link rel="icon" href="{prefix}assets/favicon.svg" type="image/svg+xml"><link rel="preload" href="{prefix}assets/fonts/SpaceGrotesk.ttf" as="font" type="font/ttf" crossorigin><link rel="stylesheet" href="{prefix}design/tokens.css"><link rel="stylesheet" href="{prefix}styles.css"></head>
<body><a class="skip" href="#main">Skip to content</a><header><img class="spectrum" src="{prefix}assets/spectrum.svg" alt="" width="1280" height="48"><div class="wrap header-row"><a class="brand" href="{prefix or './'}">Alan O Cinneide<span>Software BV</span></a><nav aria-label="Main navigation"><a href="{ './' if is_cv else 'cv/'}" {'aria-current="page"' if is_cv else ''}>CV</a>{social()}<button class="theme-toggle" type="button" aria-pressed="false" hidden>Dark mode</button></nav></div></header>
{body}
<footer><img class="spectrum" src="{prefix}assets/spectrum.svg" alt="" width="1280" height="48"><div class="wrap footer-row"><strong>{e(company['name'])}</strong><div class="footer-links"><a href="mailto:{cv['email']}">{cv['email']}</a><a href="{e(company['kvk']['url'])}">KVK {company['kvk']['number']} ↗</a></div></div></footer></body></html>'''
home=f'''<main id="main" class="wrap"><section class="hero" aria-labelledby="headline"><div><p class="eyebrow">Independent thinking. Thoughtful software.</p><h1 id="headline">Good ideas.<br>Built to work.</h1><p class="intro">Software development and technical leadership, with a focus on digital audio.</p><a class="button" href="mailto:{e(company['inquiriesEmail'])}">Get in touch <span aria-hidden="true">↗</span></a></div><div><div class="hero-art"><img src="assets/bands.svg" width="1280" height="640" alt=""></div><div class="art-caption" aria-hidden="true"><span>Clear thinking.</span><span>Colourful possibilities.</span></div></div></section><div class="hero-meta"><span>The Hague, Netherlands</span><a href="cv/">Explore my experience <span aria-hidden="true">↗</span></a></div><section class="projects" aria-labelledby="projects-heading" id="projects"><p class="eyebrow">Selected work</p><h2 id="projects-heading">Projects</h2><div class="project-list"><article><h3><a href="https://gym.alanocinneide.com/">Gym Circuit Logger <span aria-hidden="true">↗</span></a></h3><p>A phone-first workout logger, with a demo and gym setup tools.</p></article><article><h3><a href="https://design.alanocinneide.com/">Design system <span aria-hidden="true">↗</span></a></h3><p>Shared colours, typography and reusable presentation templates.</p></article><article><h3><a href="https://maestro.alanocinneide.com/">Maestro <span aria-hidden="true">↗</span></a></h3><p>A DJ-to-musician performance tool, built at the ADE Lab Hackathon.</p></article></div></section></main>'''
def job(item):
    date,title,employer,place,description=item
    return f'<article class="job"><time>{e(date)}</time><h3>{e(title)}</h3><p class="employer">{e(employer)}</p><p class="place">{e(place)}</p><p>{e(description)}</p></article>'
cvbody=f'''<main id="main" class="wrap"><section class="cv-heading" aria-labelledby="cv-name"><div><p class="eyebrow">Experience / Curriculum vitae</p><h1 id="cv-name">{e(cv['name'])}</h1><p class="intro">{cv['title']}<br>{cv['qualification']}</p><div class="cv-contact"><span>{cv['location']}</span><a href="mailto:{cv['email']}">{cv['email']}</a><a href="{cv['linkedin']}">LinkedIn ↗</a></div></div><a class="button" href="../assets/AlanOCinneide_CV.pdf" download>Download CV <span>PDF ↓</span></a></section><div class="cv-body"><h2>Profile</h2><p class="profile">{e(cv['profile'])}</p><h2>Experience</h2><div class="jobs">{''.join(job(x) for x in cv['experience'])}</div><h2>Education</h2><div>{job(cv['education'])}</div><h2>References</h2><p class="references">{e(cv['references'])}</p></div></main>'''
(ROOT/'index.html').write_text(shell(company['name'], 'Software development and technical leadership with a focus on digital audio. Get in touch with Alan O Cinneide Software BV.', home))
(ROOT/'cv/index.html').write_text(shell('CV | Alan O Cinneide Software BV',cv['profile'],cvbody,'../',True))
# PDF: two deliberate pages, using the same content as the website.
pdfmetrics.registerFont(TTFont('Space',str(ROOT/'assets/fonts/SpaceGrotesk.ttf')))
out=ROOT/'output/pdf/AlanOCinneide_CV.pdf';out.parent.mkdir(parents=True,exist_ok=True)
c=canvas.Canvas(str(out),pagesize=A4);c.setTitle('Alan Ó Cinnéide | Curriculum vitae');c.setAuthor(cv['name'])
W,H=A4; ink=HexColor('#20231d'); muted=HexColor('#5d6257')
colours=['#e5312c','#038bcd','#009037','#b2c906','#96845c','#ffffff','#f7a800','#ffee16']
style=ParagraphStyle('body',fontName='Space',fontSize=10.4,leading=15.5,textColor=ink)
def para(text,x,y,width,size=10.4,leading=15.5,color=ink):
    s=ParagraphStyle('p',parent=style,fontSize=size,leading=leading,textColor=color)
    obj=Paragraph(text,s);_,h=obj.wrap(width,H);obj.drawOn(c,x,y-h);return y-h

def frame(page):
    c.setFillColor(HexColor('#f6f5ef'));c.rect(0,0,W,H,fill=1,stroke=0)
    for i,color in enumerate(colours):
        c.setFillColor(HexColor(color));c.rect(i*W/8,H-18,W/8,18,fill=1,stroke=0);c.rect(i*W/8,0,W/8,10,fill=1,stroke=0)
    c.setFillColor(muted);c.setFont('Space',8)
    c.drawString(42,29,'Alan O Cinneide Software BV');c.drawRightString(W-42,29,f'CV / {page:02d}')
    c.linkURL(company['kvk']['url'],(42,24,200,39),relative=0)

def label(text,y):
    c.setFillColor(ink);c.setFont('Space',8.5);c.drawString(42,y,text.upper());return y-22

def pdfjob(item,y):
    date,title,employer,place,description=item
    y=para(e(date),42,y,124,8.5,12,muted)
    top=y+12
    right=para(e(title),181,top,W-223,13,17)
    right=para(e(employer),181,right-3,W-223,10.4,15)
    right=para(e(place),181,right-2,W-223,8.5,12,muted)
    right=para(e(description),181,right-9,W-223)
    y=min(y,right)-20
    c.setStrokeColor(HexColor('#d8d9ce'));c.line(42,y+7,W-42,y+7)
    return y
frame(1)
y=para(e(cv['name']),42,H-57,W-84,35,40)
y=para(e(cv['title']+' / '+cv['qualification'].replace(' · ',' - ')),42,y-8,W-84,12,17)
y=para(e(cv['location']),42,y-12,W-84,9,13,muted)
y=para(f'<link href="mailto:{cv["email"]}">{cv["email"]}</link>   /   <link href="{cv["linkedin"]}">LinkedIn</link>',42,y-3,W-84,9,13)
y=para(e(cv['profile']),42,y-26,W-84,13,19)
y=label('Experience',y-35)
for item in cv['experience'][:3]:y=pdfjob(item,y)
if y<58:raise ValueError('First PDF page overflow')
c.showPage();frame(2)
y=label('Experience / continued',H-65)
for item in cv['experience'][3:]:y=pdfjob(item,y)
y=label('Education',y-10)
y=pdfjob(cv['education'],y)
y=para('References: '+e(cv['references']),42,y-3,W-84,9,13,muted)
if y<58:raise ValueError('Second PDF page overflow')
c.save()
# Publish allowlist; never copy source CV, content files or working documents.
dist=ROOT/'dist';shutil.rmtree(dist,ignore_errors=True);dist.mkdir()
for name in ['index.html','styles.css','theme.js','assets','design','cv']:
    source=ROOT/name; dest=dist/name
    if source.is_dir():shutil.copytree(source,dest)
    else:shutil.copy2(source,dest)
shutil.copy2(out,dist/'assets/AlanOCinneide_CV.pdf')
shutil.copy2(out,ROOT/'assets/AlanOCinneide_CV.pdf')
(dist/'.nojekyll').touch()
print('Built homepage, CV page and two-page PDF in dist/')
