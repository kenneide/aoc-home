# AI for Fun & Profit

Local draft for the talk and discussion.

Install the site's requirements in a Python environment (`pip install -r requirements.txt`), then run `npm run presentation:dev`. Open http://127.0.0.1:4174/projects/ai-for-fun-and-profit/ . The server binds only to loopback. `npm run presentation:build` generates without serving.

Edit slides.json for copy, placeholders and per-slide notes. The Notes link opens generated notes in a separate tab. Present enables single-slide mode; arrows, Space, Page Up/Down and Home/End navigate when the slide area has focus. Escape returns to overview. Full screen is optional. Hashes such as #slide-09 select slides.

The GymNative slides use local captures of the Haguegym build with three fictional leg-press workouts. Confirm the pilot status in the notes before presenting. The Zoundio slide uses public Gibson assets stored locally. The shared mobile gameplay crop comes from https://www.gibson.app/images/sales_funnel/example_screens.png, with Gibson’s App Store and Google Play badges. The browser image is the presenter-supplied Add Index Finger capture, cropped to the browser window with personal browser labels removed. Confirm the broader release wording and timing in rehearsal. The creative experiment media remain pending.

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

In Present mode, the existing navigation advances through the hiring calculation and the two overlap diagrams. Stepping back reverses each reveal. Direct slide links start at the first state. The overview and print show the final states. The Altman quote and App Store chart are retained in `backup-slides.json` for future use.

- The New York Times, May 2, 1892, p. 8. The supplied F13 lecture URL returns 404. The local clipping comes from Dan Nguyen’s reproduction of the archive scan at https://danwin.com/2013/02/the-first-mention-of-computer-in-the-new-york-times/ . The publication date and page were cross-checked against the ProQuest attribution in https://srtate.github.io/old/100.f17/lectures/UNCG-CSC100-F17-LECT3-ComputerScience.pdf .
- IBM 1401 system photo: U.S. Ballistic Research Laboratories, Report 1115, 1961. Public-domain image via https://commons.wikimedia.org/wiki/File:BRL61-IBM_1401.jpg . The timeline year refers to the introduction of the 1401, documented at https://www.ibm.com/history/1401 .
