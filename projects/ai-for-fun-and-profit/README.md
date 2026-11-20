# What Becomes Worth Building?

From spreadsheets to AI-assisted software

Slides for the talk and discussion.

Install the site's requirements in a Python environment (`pip install -r requirements.txt`), then run `npm run presentation:dev`. Open http://127.0.0.1:4174/projects/ai-for-fun-and-profit/ . The server binds only to loopback. `npm run presentation:build` generates without serving.

Edit `talk.json` for the title and subtitle shared by the deck and preview homepage. Edit `slides.json` for copy, placeholders and per-slide notes. The Notes link opens generated notes in a separate tab. Present enables single-slide mode; arrows, Space, Page Up/Down and Home/End navigate when the slide area has focus. Escape returns to overview. Full screen is optional. Hashes such as #slide-09 select slides.

The examples run in this order: The Gibson App, GymNative, then room booking. The Gibson App uses a shared mobile gameplay image from https://www.gibson.app/images/sales_funnel/example_screens.png, official store badges and the Android store icon from the app source. The presenter supplied the Add Index Finger browser capture. Its approved label is “Browser gameplay preview.” GymNative uses local Haguegym captures with fictional leg-press workouts. The QR points to https://gym.alanocinneide.com/haguegym/?lang=en. The Haguegym pilot is underway. Older slides are preserved in `backup-slides.json`.

The site links to the presentation under Projects. The normal build generates the public slides and copies their allowlisted media. The loopback preview adds speaker notes and lives under ignored output/presentation-preview.

## VS Code launch

Select **Presentation: local preview** in Run and Debug and press **F5**. This uses `.venv/bin` when available, builds the preview and opens its local URL in your browser after the loopback server starts. Stop the terminal with Ctrl+C when finished. Install `requirements.txt` in `.venv` first if setting up a new checkout.

## Visual direction

The deck uses the sibling design system’s locally hosted type, semantic colors and motion. A shared arrow line connects the history, software pivot and close. Lime highlights newly reachable ideas as the Practical circle grows around them.

Repeated launches reuse a server on port 4174 when it serves the matching presentation. Refresh the browser to see rebuilt content. If another application owns the port, the launcher reports the conflict without stopping that application.

## Motion and small details

Presentation mode draws the existing spectrum artwork into view once, then settles. Workflow and process nodes receive a short, sequential accent; media placeholders receive a quiet outline response. Text stays still, all content is always available, and nothing loops or auto-advances. A chapter rail shows actual talk progress and lets you jump between acts. “Replay details” repeats the current visual entrance for rehearsal. Reduced motion skips the choreography and rail transitions, including cancelling an entrance when the preference changes. No animation libraries or external assets are required.

## Opening sources and assets

- NASA Glenn Research Center GRC-1957-C-43712, 21 January 1957. The requested NACA Lewis photograph is stored locally from the NASA Image and Video Library. Archive caption and credit: https://www.flickr.com/photos/44494372@N05/53912325323 . Editorial historical use: https://www.nasa.gov/nasa-brand-center/images-and-media/ .
- VisiCalc screenshot: https://commons.wikimedia.org/wiki/File:Visicalc.png — public-domain text screenshot, credited to Gortu / apple2history.org; later capture, not a launch photograph.
- VisiCalc history: https://www.bricklin.com/history/saiproduct1_m.htm
- Altman quotation: https://www.federalreserve.gov/mediacenter/files/capital-framework-conference-fireside-chat-transcript.pdf — July 22, 2025, page 19; speculative.
- Apple exact annual counts and report links: https://www.apple.com/legal/app-store/transparency/ . Updates and resubmissions included; no causal claim about AI.

In Present mode, the existing navigation advances through the hiring calculation, the diagram reveals and the product captures. Stepping back reverses each reveal. Direct slide links start at the first state. The overview and print show the final states. The Altman quote and App Store chart are retained in `backup-slides.json` for future use.

- The New York Times, May 2, 1892, p. 8. The supplied F13 lecture URL returns 404. The local clipping comes from Dan Nguyen’s reproduction of the archive scan at https://danwin.com/2013/02/the-first-mention-of-computer-in-the-new-york-times/ . The publication date and page were cross-checked against the ProQuest attribution in https://srtate.github.io/old/100.f17/lectures/UNCG-CSC100-F17-LECT3-ComputerScience.pdf .
- IBM 1401 system photo: U.S. Ballistic Research Laboratories, Report 1115, 1961. Public-domain image via https://commons.wikimedia.org/wiki/File:BRL61-IBM_1401.jpg . The timeline year refers to the introduction of the 1401, documented at https://www.ibm.com/history/1401 .

## Meeting-room walkthrough

The door slide uses the presenter’s photo, cropped with handwritten booking details obscured. The booking slide uses a local capture of the actual booking UI with fictional afternoon availability. The presenter supplied the subscribed Apple Calendar capture, which shows anonymous busy blocks. The public booking link is https://room.alanocinneide.com/ .
