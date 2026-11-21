"""Check public links, factual CV coverage and omitted private contact data."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json
from html import escape
from pypdf import PdfReader
root=Path(__file__).resolve().parent.parent
public=root/'dist';cv=json.loads((root/'content/cv.json').read_text())
copy=json.loads((root/'content/site.json').read_text())
class Links(HTMLParser):
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        for key in ['href','src']:
            link=attrs.get(key,'');url=urlsplit(link)
            if url.scheme or not url.path:continue
            target=((public/unquote(url.path).lstrip('/')) if url.path.startswith('/') else (self.file.parent/unquote(url.path))).resolve()
            assert target.is_relative_to(public.resolve()),link
            assert target.exists(),f'{self.file}: broken {link}'
for file in public.rglob('*.html'):
    parser=Links();parser.file=file;parser.feed(file.read_text())
    text=file.read_text()
    assert 'Alan O Cinneide' in text and 'Software BV' in text
    assert text.count('class="spectrum"')==2
    if file != public/'projects/what-becomes-worth-building/index.html':
        assert cv['linkedin'] in text
    assert text.count('class="theme-toggle"') == 1
    assert f'aria-pressed="false" hidden>{escape(copy["shared"]["themeToggle"])}</button>' in text
    assert text.index('theme.js') < text.index('design/tokens.css')
    for private in ['Laan van','2593','11 44 8026','11448026']:assert private not in text
reader=PdfReader(public/'assets/AlanOCinneide_CV.pdf')
assert len(reader.pages)==2
pdf='\n'.join(page.extract_text() for page in reader.pages)
web=(public/'cv/index.html').read_text()
for item in cv['experience']+[cv['education']]:
    for field in item[:3]:
        assert field in pdf,field
        assert escape(field) in web,field
for private in ['Laan van','2593','11 44 8026','11448026']:assert private not in pdf
for page in reader.pages:assert page.get('/Annots')
assert not list(public.rglob('*.json')) or {f.name for f in public.rglob('*.json')}=={'company.json'}
print('Checks passed: local links, identity, spectrum frames, CV coverage, PDF links and public contact details')
# Website metadata and recovery routes.
import xml.etree.ElementTree as ET
origin=copy['site']['origin']
for path,route in [('index.html','/'),('cv/index.html','/cv/')]:
    html=(public/path).read_text()
    assert f'rel="canonical" href="{origin}{route}"' in html
    for marker in ['og:title','og:description','og:image','twitter:card','apple-touch-icon']:
        assert marker in html,marker
missing=(public/'404.html').read_text()
assert 'content="noindex"' in missing and 'rel="canonical"' not in missing
assert 'href="/cv/"' in missing and 'src="/theme.js"' in missing
assert copy['notFound']['title'] in missing
urls=ET.parse(public/'sitemap.xml').findall('{*}url/{*}loc')
assert {x.text for x in urls}=={origin+'/',origin+'/cv/',origin+'/projects/what-becomes-worth-building/'}
assert f'Sitemap: {origin}/sitemap.xml' in (public/'robots.txt').read_text()
for name in ['social-preview.png','favicon.ico','favicon-32.png','apple-touch-icon.png']:
    assert (public/'assets'/name).stat().st_size>0
assert 'X-Content-Type-Options: nosniff' in (public/'_headers').read_text()
print('Checks passed: canonical metadata, sharing, icons, sitemap and 404 recovery')
# Only rendered slides and their assets belong in the public deck.
deck = public/'projects/what-becomes-worth-building'
assert f'rel="canonical" href="{origin}/projects/what-becomes-worth-building/"' in (deck/'index.html').read_text()
assert {file.name for file in deck.iterdir()} == {'index.html', 'deck.js', 'deck.css', 'media'}
assert not list(public.rglob('notes.txt'))

# Publish only the browser runtime for the direct-link maths practice page.
practice = public/'wiskunde'
assert {file.name for file in practice.iterdir()} == {
    'index.html', 'practice.css', 'app.mjs', 'graph.mjs', 'language.mjs', 'lesson.mjs',
    'maths.mjs', 'session.mjs', 'stories.mjs', 'lineaire-formules-en-vergelijkingen',
}
practice_html = (practice/'index.html').read_text()
assert '<html lang="nl">' in practice_html and 'content="noindex"' in practice_html
assert f'rel="canonical" href="{origin}/wiskunde/"' in practice_html
tool_slug = 'lineaire-formules-en-vergelijkingen'
tool = practice/tool_slug
assert {file.name for file in tool.iterdir()} == {'index.html'}
tool_html = (tool/'index.html').read_text()
assert f'href="{tool_slug}/"' in practice_html and 'src="language.mjs"' in practice_html
for page in (practice_html, tool_html):
    assert 'id="languages"' in page and 'id="nl"' in page and 'id="en"' in page
assert f'rel="canonical" href="{origin}/wiskunde/{tool_slug}/"' in tool_html
assert 'id="practice-back" href="../"' in tool_html and 'src="../app.mjs"' in tool_html
assert not list(public.rglob('quiz.jpeg'))
