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
