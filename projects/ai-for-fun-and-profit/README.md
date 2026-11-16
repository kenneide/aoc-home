# AI for Fun & Profit

Local first draft: 18 slides, approximately 27 minutes plus discussion.

Install the site's requirements in a Python environment (`pip install -r requirements.txt`), then run `npm run presentation:dev`. Open http://127.0.0.1:4174/projects/ai-for-fun-and-profit/ . The server binds only to loopback. `npm run presentation:build` generates without serving.

Edit slides.json for copy, placeholders and per-slide notes. The Notes link opens generated notes in a separate tab. Present enables single-slide mode; arrows, Space, Page Up/Down and Home/End navigate when the slide area has focus. Escape returns to overview. Full screen is optional. Hashes such as #slide-09 select slides.

Supply approved old/new Zoundio screenshots, gym screenshots and a demo with fallback captures, and one or two actual creative experiments. Zoundio process descriptions are conceptual, not disclosures of internal implementation. No performance or commercial results are claimed. Review all narration before the event.

The normal build excludes this directory and all notes/media. Preview output lives under ignored output/presentation-preview. Do not move materials into public assets. Future publication requires explicit approval, a deliberate production allowlist change, metadata review and a Projects link; nothing here publishes automatically. Do not deploy or push this draft.

## VS Code launch

Select **Presentation: local preview** in Run and Debug and press **F5**. This uses `.venv/bin` when available, builds the preview and opens its local URL in your browser after the loopback server starts. Stop the terminal with Ctrl+C when finished. Install `requirements.txt` in `.venv` first if setting up a new checkout.

## Visual direction

The deck adapts the sibling design system’s title, section, comparison, roadmap, visual and closing compositions. Sixteen slides use individual layouts: spectrum opening, constraints, manifesto, case study, stepped workflow, import pipeline, comparison, phone stage, demonstration, business roles, creative gallery, review grid, iteration process, opportunities, audience question and closing. Lime, yellow, orange and ink specimen surfaces retain their artwork palettes; ordinary reading surfaces follow the shared semantic theme. Media slots remain explicit placeholders, never simulated product screenshots.

Repeated launches reuse a server on port 4174 when it serves the matching presentation. Refresh the browser to see rebuilt content. If another application owns the port, the launcher reports the conflict without stopping that application.

## Motion and small details

Presentation mode draws the existing spectrum artwork into view once, then settles. Workflow and process nodes receive a short, sequential accent; media placeholders receive a quiet outline response. Text stays still, all content is always available, and nothing loops or auto-advances. A chapter rail shows actual talk progress and lets you jump between acts. “Replay details” repeats the current visual entrance for rehearsal. Reduced motion skips the choreography and rail transitions, including cancelling an entrance when the preference changes. No animation libraries or external assets are required.

## Opening sources and assets

- NASA E49-54, 1949 computer room: https://www.flickr.com/photos/nasacommons/7538108706 — NASA credit; no known copyright restrictions. Editorial historical use under https://www.nasa.gov/nasa-brand-center/images-and-media/ . Locally stored, no image alterations.
- VisiCalc screenshot: https://commons.wikimedia.org/wiki/File:Visicalc.png — public-domain text screenshot, credited to Gortu / apple2history.org; later capture, not a launch photograph.
- VisiCalc history: https://www.bricklin.com/history/saiproduct1_m.htm
- Altman quotation: https://www.federalreserve.gov/mediacenter/files/capital-framework-conference-fireside-chat-transcript.pdf — July 22, 2025, page 19; speculative.
- Apple exact annual counts and report links: https://www.apple.com/legal/app-store/transparency/ . Updates and resubmissions included; no causal claim about AI.

Opening replaces the old introduction; gym now precedes Zoundio. Existing demonstration media remain placeholders.
