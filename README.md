# Alan O Cinneide Software BV

Company homepage and public CV. Custom domain: https://alanocinneide.com/. Cloudflare Pages hosts production and manages DNS. GitHub Pages remains a fallback.

## Build and preview

Python 3.12+ is recommended. Install `pip install -r requirements.txt`, then run:

```
python3 scripts/build.py
python3 scripts/check.py
python3 -m http.server 4173 --directory dist
```

Open http://localhost:4173. Cloudflare builds and deploys `dist/` on pushes to `main`. The existing GitHub Actions workflow also maintains the GitHub Pages fallback.

## Content

Public copy is maintained in two files:

- `content/site.json`: homepage wording and project links, page metadata, navigation, accessibility labels, and shared web/PDF section labels.
- `content/cv.json`: personal details, profile, experience, education and references, shared by the HTML CV and PDF.

Company identity and registration details remain in `design/company.json`, the existing design provenance record. Repository documentation, font licence text and build diagnostics are not website copy. Edit the content files rather than generated HTML or strings in `scripts/build.py`, then run `npm run build`. Text is escaped by the templates; headline lines are separate array entries to preserve the existing line break.

The homepage introduction and CV profile describe creative problem solving through software and an assertive, candid approach to partnership. Audio remains an area of expertise rather than the scope of all services. For further voice edits, start with `home.eyebrow`, `home.headline`, `home.intro` and `home.artCaptions` in `content/site.json`, then `profile` and the role descriptions in `content/cv.json`. Keep factual dates, qualifications and experience claims grounded in the owner-supplied CV. The build writes `index.html`, `cv/index.html`, `assets/AlanOCinneide_CV.pdf` and the ignored `dist/` and `output/pdf/` folders. The two-page PDF uses an explicit page break after Sonion; reassess pagination when adding roles. Overflow fails the build.

CV wording derives from the owner-supplied CV. Director and Zoundio date ranges confirmed current by the owner on 7 November 2026. No additional experience, skills or metrics are asserted. Street address and mobile are intentionally excluded from all public output. The original CV is not included.

## Design provenance

Tokens, spectrum, flowing bands, favicon and Space Grotesk font copied from the sibling `aoc-design-system` repository on 7 November 2026. Source: https://github.com/kenneide/aoc-design-system. Company identity is recorded in `design/company.json`. The source design-system repository is unchanged.

For future design updates, first read [`../aoc-design-system/AGENTS.md`](../aoc-design-system/AGENTS.md), `design/README.md`, `design/PROVENANCE.md` and `design/tokens.json` there. The upstream [theme implementation](https://github.com/kenneide/aoc-design-system/blob/main/theme.js) is copied here as `theme.js` (7 November 2026). Keep it aligned with upstream when updating theme behavior. The local `design/tokens.css` already contains the shared light/dark roles and 700 ms motion token; update generated tokens in the design repo and copy its output here rather than hand-editing them.

The theme follows system preference until a visitor chooses light or dark, stores that choice locally, and applies it before styles load. Changes blend semantic colors over 700 ms; reduced motion settles immediately. Spectrum ribbons and artwork keep their original colors. With JavaScript disabled, system theming still works and the toggle stays hidden. Header markup is generated in `scripts/build.py`; edit that source rather than the generated HTML. Run `npm run build` and inspect both pages at phone and desktop widths before publishing.

Brand artwork remains the property of its rights holders. Space Grotesk is distributed under the SIL Open Font License in `assets/fonts/OFL.txt`. The LinkedIn icon identifies a link to the owner's supplied profile; LinkedIn is a trademark of its respective owner.

The site has no runtime dependencies, analytics, forms or external font requests. Its standalone `theme.js` provides the accessible dark-mode toggle on both pages. PDF creation uses ReportLab and verification uses pypdf. Only the explicit website allowlist is copied into `dist/`.

## Custom domains

Production uses the GitHub-connected Cloudflare Pages project `aoc-home`. Preserve the existing website domain configuration, iCloud mail records and GitHub domain verification records. Verify HTTPS and the www redirect after hosting changes; GitHub Pages settings apply only to the fallback.

The homepage Projects section links to `https://gym.alanocinneide.com/`, `https://design.alanocinneide.com/` and `https://maestro.alanocinneide.com/`, each independently published from its own repository. All contact links remain `hello@alanocinneide.com`.


## Production hosting and updates

The public website is https://alanocinneide.com/, hosted by the GitHub-connected Cloudflare Pages project `aoc-home`. Push to this repository’s `main` branch to trigger an automatic Cloudflare build and deployment; no dashboard upload is needed. The build command is `pip install -r requirements.txt && npm run build`, and only `dist` is published. Cloudflare manages custom-domain certificates and HTTP-to-HTTPS redirects. Check the Cloudflare status on the GitHub commit before treating an update as live. Existing GitHub Pages workflows remain as a fallback; production DNS points to Cloudflare. Do not change mail records when maintaining website DNS.

## Website finishing assets

The build generates `404.html`, `robots.txt`, `sitemap.xml` and Cloudflare `_headers` directly in `dist/`. Error copy and production metadata live in `content/site.json`. The 404 uses root-relative links for nested missing paths. Canonical URLs point to production; the error page is marked noindex. Sharing artwork and browser icons are committed under `assets/`, derived from the existing spectrum colours and local Space Grotesk font. No analytics, forms or additional external requests are introduced.
