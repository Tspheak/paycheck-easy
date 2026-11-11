# Paycheck Pocket website (`Tspheak/paycheck-easy`)

GitHub Pages at paycheckpocket.com. The calculator at `/app/` is a rebuilt Flutter web host.

## Marketing pages
- `index.html` — Home (hero, product shots, pricing)
- `features/index.html`, `pricing/index.html`, `about/index.html`, `privacy/index.html`, `contact/index.html`
- `assets/apple.css` — locked site-apple-v1 tokens, frosted nav, Pixel phone frames, footer
- `assets/nav.js` — phone hamburger (<860px)
- `assets/pricing-region.js` — US/AU price switch
- `assets/shot-mypay-a.png`, `shot-mypay-b.png`, `shot-breakdown.png` — current-app captures @ 820×1798 (Pixel status, ads off). Other `shot-*.png` unchanged.
- Nav everywhere: Home, Calculator, Features, Pricing, About + CTA **Get the app** → Play. Footer labels: About, Privacy, Contact, Get the app, support email. Pricing keeps only **Try free** (Yearly/Monthly/Lifetime CTAs removed; plan cards/text stay).
- Marketing pages: favicon SVG/PNG plus `apple-touch-icon` → `assets/icon.png` (pocket launcher).

## Calculator host
- `app/index.html` — apple.css header + `#flutter_host`. Phone: hamburger visible, footer hidden, host height `calc(100dvh - nav)`. `?embed=1` hides site chrome.
- `app/` — `flutter build web --release --base-href /app/` from the Flutter PR tip. One job; ads/billing off. `app/favicon.png`, `app/icons/*`, and `app/manifest.json` use the pocket launcher icon (`theme_color` `#0B5F58`, `background_color` `#FFFFFF`). `app/favicon.svg` was already the pocket icon.

## Tax
- `tax/tax-us.json`, `tax/tax-au.json` — republish only if the app export changed.

## Leftover
- `assets/style.css`, `scripts/au-calc.js`, `scripts/au-tax.js` — unused by current pages.
