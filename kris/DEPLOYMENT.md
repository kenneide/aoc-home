# Publishing the family reveal

The family site is a separate Cloudflare Pages direct-upload project, `kris-kindle`. It does not change the company homepage. The custom domain https://kris.alanocinneide.com/ is connected and HTTPS verified. The fallback URL is https://kris-kindle.pages.dev/.

Build with `npm run build:family`, then run `npm test` from this folder. Deploy only `dist/` with `wrangler pages deploy dist --project-name kris-kindle --branch main --commit-dirty=true`. Do not deploy the project root or `private/`. Wrangler authentication must have access to the existing hosting account. The photo studio is intentionally not copied into dist.

The saved draw, issued codes and original photo export exist only under ignored `private/`. Back up that folder securely. Rebuilding in this checkout preserves assignments and codes; a fresh checkout cannot recreate them. Do not delete or regenerate the saved family draw after distributing codes.

For the custom domain, attach `kris.alanocinneide.com` in the project's Custom domains section and create only its CNAME pointing to `kris-kindle.pages.dev`. Do not change existing website or mail records. Check domain activation and HTTPS before changing invitation links from the verified pages.dev URL.

Private WhatsApp drafts are in `private/whatsapp-messages.txt`. They contain only each giver's code, without assignments. Send one message per person privately. Nothing is sent automatically.
