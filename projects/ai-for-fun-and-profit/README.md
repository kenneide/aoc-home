# AI for Fun & Profit

Local first draft: 16 slides, approximately 27 minutes plus discussion.

Install the site's requirements in a Python environment (`pip install -r requirements.txt`), then run `npm run presentation:dev`. Open http://127.0.0.1:4174/projects/ai-for-fun-and-profit/ . The server binds only to loopback. `npm run presentation:build` generates without serving.

Edit slides.json for copy, placeholders and per-slide notes. The Notes link opens generated notes in a separate tab. Present enables single-slide mode; arrows, Space, Page Up/Down and Home/End navigate when the slide area has focus. Escape returns to overview. Full screen is optional. Hashes such as #slide-09 select slides.

Supply approved old/new Zoundio screenshots, gym screenshots and a demo with fallback captures, and one or two actual creative experiments. Zoundio process descriptions are conceptual, not disclosures of internal implementation. No performance or commercial results are claimed. Review all narration before the event.

The normal build excludes this directory and all notes/media. Preview output lives under ignored output/presentation-preview. Do not move materials into public assets. Future publication requires explicit approval, a deliberate production allowlist change, metadata review and a Projects link; nothing here publishes automatically. Do not deploy or push this draft.

## VS Code launch

Select **Presentation: local preview** in Run and Debug and press **F5**. This uses `.venv/bin` when available, builds the preview and opens its local URL in your browser after the loopback server starts. Stop the terminal with Ctrl+C when finished. Install `requirements.txt` in `.venv` first if setting up a new checkout.
