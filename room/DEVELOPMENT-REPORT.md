# How I built a meeting room booking system for a coworking space

I built a [booking page](https://room.alanocinneide.com/) for one shared meeting room. The idea was to give people a link they could use to check availability and reserve the room themselves. I used Codex to develop and iterate on the tool, and tested the booking flow against the room’s real iCloud calendar.

## What people can do

The page shows a weekly calendar in The Hague time. People can tap a 15-minute cell or drag across a longer stretch, then adjust the start and end times to the minute. The room is bookable on weekdays from 08:00 to 23:00, up to 30 days ahead, including later the same day. A name is required. Email and phone are optional, and there is no guest account to create.

After a successful booking, the page shows **Room booked** with the reserved time. The booking appears in the room owner’s private calendar, where the owner can see the contact details and cancel by deleting the event. Everyone else sees only **Busy** and the time range. People can also subscribe to an availability-only calendar in their calendar app. The app determines how often the subscription refreshes.

## How it evolved

I started with an existing meeting-request tool that waited for manual approval. For a shared room, I wanted the calendar to decide. I took the calendar integration from that project and built a separate room site around immediate confirmation. During setup, iCloud redirected requests to a different Apple calendar server. I updated the integration to follow verified Apple calendar redirects while preserving the original request. I then made a real booking, saw it appear in iCloud, and checked that the site showed the slot as occupied.

The biggest changes came from using the page. The original date and time selectors made it hard to see gaps, so I replaced them with a weekly grid. The grid gained Morning, Afternoon, and Evening sections, an hour guide on the left, and clear labels for busy and selected stretches. I reduced the grid to 15-minute rows, then fixed their height so labels would stop shifting the calendar while dragging. I also moved the booking confirmation to the spot occupied by the form so it would appear where people were already looking.

## How it works and what another space would need

A Cloudflare Worker serves the page and talks to iCloud through CalDAV. It checks the calendar again before writing and holds overlapping requests while a write is in progress, reducing the risk of two people claiming the same slot. Turnstile helps block automated submissions. The public calendar feed is generated from busy intervals, so the source calendar can stay private.

Another space can reuse the project by changing one [configuration file](room.config.json) for its name, optional branding, domain, opening hours, time zone, and calendar settings. Calendar credentials stay in Cloudflare secrets. I verified that a differently branded room with a different time zone, schedule, and domain builds from configuration alone. The [setup guide](README.md) covers connecting a calendar and deploying the site. iCloud works today. Supporting Google Calendar would require another adapter.

For a coworking space, this is a lightweight way to make one room self-service while keeping the room owner’s calendar as the operational record. A space with several rooms could run one configured instance per room. The current version does not have a shared multi-room view or guest self-service cancellation.
