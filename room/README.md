# Room booking

Edit [room.config.json](room.config.json) to configure a new booking site. The build uses it for the public page, the booking rules, and the Cloudflare Worker configuration.

| Section | Settings |
| --- | --- |
| `site` | HTTPS origin without a trailing slash, page title, room name, and optional branding. Omit `brand` for a plain room-name header and footer. Set `brand.spectrum` to `true` to use this repository's spectrum artwork and favicon. |
| `schedule` | IANA time zone, displayed time-zone label, bookable days (Sunday is 0), whole-hour opening and closing times, grid increment in minutes (a divisor of 60), and the number of days bookable ahead. |
| `calendar` | Calendar adapter and the permitted CalDAV hostnames. Use `caldav` for iCloud. |
| `deployment` | Cloudflare Worker name, public Turnstile site key, and whether booking is open. Set `open` to `false` for initial setup. |

## Build and deploy

1. Install dependencies with `npm ci` in both `meet/` and `room/`. From `room/`, run `npm test` and `npm run build`. The build generates the public assets in `dist/` and the deployment config at `.wrangler/room.json`. Use `npx wrangler deploy --config .wrangler/room.json --dry-run` to verify the Worker package.
2. Create a dedicated private calendar. For iCloud, create an Apple app-specific password and discover the final HTTPS collection URL using the [CalDAV setup instructions](../meet/README.md). Create a Turnstile widget for the hostname in `site.origin` and put its public site key in the config file.
3. Run `npm run deploy` from `room/` with a Cloudflare account that has access to the domain's zone and Workers. In Cloudflare, add the secrets below to the new Worker. You can also use `npx wrangler secret put NAME --config .wrangler/room.json`.

| Secret | Value |
| --- | --- |
| `CALENDAR_USER` | Calendar account email |
| `CALENDAR_PASSWORD` | App-specific password |
| `WRITE_CALENDAR` | Private CalDAV collection URL with a trailing slash |
| `BUSY_CALENDARS` | Optional JSON array of additional private CalDAV collection URLs |
| `TURNSTILE_SECRET_KEY` | Private Turnstile verification key |

4. Verify HTTPS, set `deployment.open` to `true`, and redeploy. Test a booking, confirm that the private event appears, then delete it and verify the slot reopens. The public `/availability.ics` subscription shows only busy intervals. Keep the source calendar unshared.

For a provider or destination change, pause booking, resolve outstanding writes, and move any bookings that should continue blocking slots to the new calendar before reopening. Add a provider in `calendar.js` by implementing `busy({start,end})` (UTC milliseconds), `exists(booking)`, and idempotent `create(booking)`. Google Calendar requires a separate adapter and credentials.

The calendar is authoritative after confirmation. The Worker retains unresolved submission details until it confirms the event, verifies absence after the retry window, or the booking time passes. Manual calendar changes can race with the final availability check.
