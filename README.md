# Alan O Cinneide Software BV

Company homepage and public CV. Custom domain: https://alanocinneide.com/. GitHub Pages hosts the site; Cloudflare manages DNS.

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

For future design updates, first read [`../aoc-design-system/AGENTS.md`](../aoc-design-system/AGENTS.md), `design/README.md`, `design/PROVENANCE.md` and `design/tokens.json` there. The upstream [theme implementation](https://github.com/kenneide/aoc-design-system/blob/main/theme.js) is copied here as `theme.js` (7 November 2026). Keep it aligned with upstream when updating theme behavior. The local `design/tokens.css` already contains the shared light/dark roles and 700 ms motion token; update generated tokens in the design repo and copy its output here rather than hand-editing them.

The theme follows system preference until a visitor chooses light or dark, stores that choice locally, and applies it before styles load. Changes blend semantic colors over 700 ms; reduced motion settles immediately. Spectrum ribbons and artwork keep their original colors. With JavaScript disabled, system theming still works and the toggle stays hidden. Header markup is generated in `scripts/build.py`; edit that source rather than the generated HTML. Run `npm run build` and inspect both pages at phone and desktop widths before publishing.

Brand artwork remains the property of its rights holders. Space Grotesk is distributed under the SIL Open Font License in `assets/fonts/OFL.txt`. The LinkedIn icon identifies a link to the owner's supplied profile; LinkedIn is a trademark of its respective owner.

The site has no runtime dependencies, analytics, forms or external font requests. Its standalone `theme.js` provides the accessible dark-mode toggle on both pages. PDF creation uses ReportLab and verification uses pypdf. Only the explicit website allowlist is copied into `dist/`.

## Custom domains

GitHub Pages settings map `alanocinneide.com` to this repository. The existing Actions workflow remains the publisher; a `CNAME` file is not needed for workflow-based Pages sites. Cloudflare uses DNS-only apex A records for `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153`. `www` is a DNS-only CNAME to `kenneide.github.io`; GitHub redirects it to the apex. Enable Enforce HTTPS once the certificate is issued. Preserve the iCloud MX and email TXT records, and the GitHub domain-verification TXT record.

The homepage Projects section links to `https://gym.alanocinneide.com/` and `https://design.alanocinneide.com/`, each independently published from its own repository. All contact links remain `hello@alanocinneide.com`.
