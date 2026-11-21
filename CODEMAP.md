# Paycheck Pocket website (`Tspheak/paycheck-easy`)

GitHub Pages at paycheckpocket.com. The calculator at `/app/` is a rebuilt Flutter web host.

## Marketing pages
- `index.html` — Home (hero, product shots including salary form and language picker, Compare offers, `#pricing` free-for-a-limited-time note)
- `about/index.html`, `privacy/index.html`, `contact/index.html`
- `features/index.html` — redirect stub to `/` (old links)
- `pricing/index.html` — redirect stub to `/#pricing` (old links)
- `assets/apple.css` — locked site-apple-v1 tokens, frosted nav, Pixel phone frames, footer
- `assets/nav.js` — phone hamburger (<860px)
- `assets/pricing-region.js` — unused after the paid price grid was removed
- `assets/shot-mypay-a.png`, `shot-mypay-b.png`, `shot-mypay-c.png`, `shot-breakdown.png`, `shot-salary-form.png`, `shot-welcome.png` — current-app captures @ 820×1798 (Pixel status, ads off). Other `shot-*.png` unchanged.
- Nav everywhere: Home, Calculator, About + CTA **Get the app** → Play. Footer labels: About, Privacy, Contact, Get the app, support email.

## Calculator host
- `app/index.html` — apple.css header + `#flutter_host`. Phone: hamburger visible, footer hidden, host height `calc(100dvh - nav)`. `?embed=1` hides site chrome. Unregisters a leftover Flutter service worker from older builds and reloads once. Do not pass `serviceWorkerSettings` into `_flutter.loader.load`.
- `app/` — `flutter build web --release --base-href /app/` from the Flutter PR tip. One job; ads/billing off. After copying the build here, run `python3 scripts/bust-cache.py`.

## Cache busting
- GitHub Pages caches HTML for 10 minutes (`max-age=600`) but unversioned `.css`/`.js` for 4 hours (`max-age=14400`). Asset tags use a content-hash query string (`?v=` plus the first 10 hex characters of the file SHA-256) so a new deploy is fetched once the HTML updates.
- After changing `assets/apple.css`, `assets/nav.js`, `assets/pricing-region.js`, or replacing `app/main.dart.js`, run `python3 scripts/bust-cache.py` from the repo root, then commit the stamped HTML. The script is idempotent.

## Tax
- `tax/tax-us.json`, `tax/tax-au.json` — republish only if the app export changed.

## Leftover
- `assets/style.css`, `scripts/au-calc.js`, `scripts/au-tax.js` — unused by current pages.
