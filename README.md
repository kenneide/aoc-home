# Alan O Cinneide Software BV

Company homepage and public CV. Published at https://kenneide.github.io/aoc-home/.

## Build and preview

Python 3.12+ is recommended. Install `pip install -r requirements.txt`, then run:

```
python3 scripts/build.py
python3 scripts/check.py
python3 -m http.server 4173 --directory dist
```

Open http://localhost:4173. GitHub Actions builds and deploys `dist/` to Pages on pushes to `main`; Pages must use GitHub Actions as its source.

## Content

`content/cv.json` is the factual source for both the HTML CV and PDF. Update that file, then rebuild. The build writes `index.html`, `cv/index.html`, `assets/AlanOCinneide_CV.pdf` and the ignored `dist/` and `output/pdf/` folders. The two-page PDF uses an explicit page break after Sonion; reassess pagination when adding roles. Overflow fails the build.

CV wording derives from the owner-supplied CV. Director and Zoundio date ranges confirmed current by the owner on 7 November 2026. No additional experience, skills or metrics are asserted. Street address and mobile are intentionally excluded from all public output. The original CV is not included.

## Design provenance

Tokens, spectrum, flowing bands, favicon and Space Grotesk font copied from the sibling `aoc-design-system` repository on 7 November 2026. Source: https://github.com/kenneide/aoc-design-system. Company identity is recorded in `design/company.json`. The source design-system repository is unchanged.

Brand artwork remains the property of its rights holders. Space Grotesk is distributed under the SIL Open Font License in `assets/fonts/OFL.txt`. The LinkedIn icon identifies a link to the owner's supplied profile; LinkedIn is a trademark of its respective owner.

The site has no runtime dependencies, JavaScript, analytics, forms or external font requests. PDF creation uses ReportLab and verification uses pypdf. Only the explicit website allowlist is copied into `dist/`.
