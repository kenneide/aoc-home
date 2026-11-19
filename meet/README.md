# Meeting booking

This Worker serves `https://meet.alanocinneide.com/`. Its generated assets live in `meet/dist`. The homepage and CV use the existing independent build and deployment.

## Local verification

From this directory, run `npm ci`, `npm test`, `npm run build`, and `npx wrangler deploy --dry-run`. Use `npx wrangler dev` for local development. Use an ignored `.dev.vars` file and test service credentials if testing live integrations locally.

## Production setup

1. Create a dedicated **Meetings** calendar in iCloud, choose the conflict calendars and create an Apple app-specific password. Discover the collection URLs using a private CalDAV client or authenticated DAV discovery from `https://caldav.icloud.com/`: request `current-user-principal`, request `calendar-home-set` on that principal, then list its calendar collections using a depth-one PROPFIND. Use their final HTTPS collection URLs including trailing slashes and list their exact hostnames. Calendar visibility remains private.
2. Configure a Cloudflare Access self-hosted application covering `meet.alanocinneide.com/owner` and its descendants, with an allow policy restricted to the owner's exact email. Copy its audience tag and team domain. Configure a Turnstile widget for the booking hostname. Verify a dedicated sending subdomain such as `booking.alanocinneide.com` in Resend and create a sending key scoped to that domain. Keep mail records on the existing domain intact.
3. Deploy the Worker with `npm run deploy` from this directory using an authenticated Cloudflare session with Worker and route access. Keep `BOOKING_OPEN=false` during setup. Add the bindings below through Cloudflare dashboard variables and secrets or `npx wrangler secret put VARIABLE`. Wrangler preserves dashboard variables across deploys. The tracked configuration defaults to closed, so remove its `BOOKING_OPEN` entry before committing a deployment that should preserve a dashboard-controlled open value, or set the tracked value explicitly for that deployment.
4. Verify the custom-domain certificate, owner sign-in, signed JWT validation and rejection of anonymous owner API calls. For the controlled live test, protect the whole hostname temporarily with a separate Access policy and verify the more specific owner policy still supplies the owner audience. Set `BOOKING_OPEN=true`, submit a test request on the real hostname, and check the pending state, owner email, approval, iCloud event and guest email attachment. Also verify decline and overlap handling. Remove the temporary hostname-wide policy after the test passes. Verify anonymous booking availability and owner protection again.
5. To pause public booking, set `BOOKING_OPEN=false`. The inbox remains available for existing requests. To roll back a Worker release, use Cloudflare deployments and preserve the booking database. Requests retained in the application are purged 30 days after the later of closure and the meeting end. Calendar entries and email copies follow their own retention.

| Binding | Value |
| --- | --- |
| `CALENDAR_USER` | Apple Account email, private |
| `CALENDAR_PASSWORD` | Apple app-specific password, secret |
| `CALENDAR_HOSTS` | JSON list of exact allowed CalDAV hostnames |
| `BUSY_CALENDARS` | JSON list of CalDAV collection URLs, private |
| `WRITE_CALENDAR` | Dedicated writable CalDAV collection URL, private |
| `OWNER_EMAIL` | Exact email allowed by Access and receiving request alerts |
| `ACCESS_TEAM_DOMAIN` | Team hostname, without scheme |
| `ACCESS_AUDIENCE` | Owner Access application audience tag |
| `TURNSTILE_SITE_KEY` | Public widget key |
| `TURNSTILE_SECRET_KEY` | Widget secret |
| `MAIL_FROM` | Verified sender such as `Meetings <meet@booking.alanocinneide.com>` |
| `RESEND_API_KEY` | Resend sending key, secret |

The same adapter works with compatible CalDAV providers by changing the collection URLs and credentials. A different protocol can implement the same busy lookup, conditional create and event lookup operations in `calendar.js`. Resolve any requests marked as writing before switching the write calendar. External edits can race with the final availability check because CalDAV does not provide a cross-calendar reservation transaction.
