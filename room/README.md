# Room booking

The room Worker serves `https://room.alanocinneide.com/` and has its own deployment. The homepage, CV and existing meeting approval site use their existing deployments.

## Verify locally

Install Node dependencies with `npm ci` in both `meet/` and `room/`. From `room/`, run `npm test`, `npm run build`, and `npx wrangler deploy --dry-run`. The shared CalDAV adapter and availability rules live in `meet/calendar.js`. Run the tests in `meet/` when changing shared logic.

## Configure production

1. Create a dedicated private Room calendar in iCloud. Generate an Apple app-specific password and discover the final HTTPS CalDAV collection URL as described in the [meeting setup](../meet/README.md). Keep the calendar unshared. The owner can see the guest name and optional contact details in iCloud and can cancel a booking by deleting its event.
2. From `room/`, run `npm run deploy` using a Cloudflare account with access to the zone and Workers. The custom domain is declared in Wrangler. For a fresh installation, deploy with `--var BOOKING_OPEN:false` during setup. Configure a Turnstile widget for `room.alanocinneide.com`.
3. Configure the following Worker bindings. Set secrets in the Cloudflare dashboard or via `npx wrangler secret put NAME`.

| Binding | Value |
| --- | --- |
| `CALENDAR_PROVIDER` | `caldav` |
| `CALENDAR_USER` | Apple Account email, stored as a secret |
| `CALENDAR_PASSWORD` | Apple app-specific password, stored as a secret |
| `CALENDAR_HOSTS` | JSON array of allowed CalDAV hostnames |
| `WRITE_CALENDAR` | Private Room collection URL with a trailing slash, stored as a secret |
| `BUSY_CALENDARS` | `[]` to use only the Room calendar, or a JSON array of additional collection URLs |
| `TURNSTILE_SITE_KEY` | Public widget key |
| `TURNSTILE_SECRET_KEY` | Widget secret |

4. Verify HTTPS with booking closed. For the live test, temporarily restrict the hostname to the owner with Cloudflare Access, then set `BOOKING_OPEN=true`. Submit a name-only booking, check the private calendar event and unavailable slot, then delete the event and verify the slot reopens. Inspect desktop and mobile rendering, keyboard use, stored theme preference, and reduced motion. Remove the temporary Access policy and verify anonymous booking availability. The tracked Wrangler value keeps production bookings open on redeploy.
5. To pause, set `BOOKING_OPEN=false`. For a provider or destination change, pause booking, resolve outstanding writes, and move any bookings that should continue blocking slots to the new calendar before reopening.

`room/calendar.js` selects the adapter. To add a provider, register a factory implementing `busy({start,end})` (UTC milliseconds), `exists(booking)` (stable ID lookup), and `create(booking)` (idempotent event creation). Google Calendar requires a separate adapter and credentials.

The public API returns start times and confirmation for the submitted booking. The calendar is authoritative after confirmation. The Worker retains unresolved submission details until it confirms the event, verifies absence after the retry window, or the booking time passes. Manual calendar changes can race with the final availability check.
