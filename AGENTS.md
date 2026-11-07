# Website maintenance

Follow the sibling design system at `../aoc-design-system`. Read its `AGENTS.md`, `design/README.md`, `design/PROVENANCE.md` and `design/tokens.json` before visual changes. Remote source: https://github.com/kenneide/aoc-design-system.

Use its semantic light/dark roles, shared motion and unchanged eight-color spectrum artwork. `theme.js` is copied from that repo; keep behavior aligned with its implementation and tests. See README.md for provenance and update steps.

Edit `scripts/build.py` for shared page markup; homepage and CV HTML are generated. Run `npm run build` to rebuild and check links, CV and PDF. Inspect desktop/mobile, keyboard toggle, saved preference and reduced motion after interaction changes. Publishing is a push to `main` followed by successful `.github/workflows/pages.yml` deployment. Preserve public content and the asset allowlist.
