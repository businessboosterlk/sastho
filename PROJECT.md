# Sastho — World-Class Storefront Remake

**Client:** Sastho (sastho.lk) — Sri Lanka's budget home, kitchen & lifestyle store. Colombo 11, since 2009. Island-wide COD delivery.
**Type:** Concept + working demo (full unique kit) to win/upgrade the client.
**Stack:** Single self-contained HTML (inline CSS + JS), no framework, GitHub Pages ready. Real product data + images pulled live from sastho.lk WooCommerce Store API.
**Live URL:** not deployed yet.

## The unique angle (why this converts)
Sastho's real blockers are FEAR and EFFORT, not pretty photos. This build attacks both:
1. **One-tap WhatsApp COD checkout** — "Order in 10 seconds, pay when it arrives." Matches how Sri Lankans buy. wa.me prefilled with full cart.
2. **Smart Cart** — live free-delivery progress nudge + bundle suggestions to lift order value.
3. **Build My Space quiz** — room + budget → instant curated cart. Kills 205-item choice paralysis.
4. **Live trust layer** — Since 2009, COD badge, rotating social proof, delivery promise.

## Brand
- Accent orange `#c85103` (from their site), currency රු / Rs.
- Fonts: Lexend (display) + Inter/system (text).
- WhatsApp: +94 77 767 5984 → wa.me/94777675984
- Address: No.84/1, Maliban Street, Colombo 11. IG @sastho.lk.

## Build status / todo
- [x] Build single-file index.html (hero, trust, categories, lightning deals, quiz, deals grid, smart cart drawer, WhatsApp checkout, spin-to-win, footer)
- [x] Real data: 100 products pulled from sastho.lk WooCommerce Store API (name+image+price+category)
- [x] Verify in preview: desktop + mobile 390px, console clean, iOS off-screen audit passed (0 offenders)
- [x] Fixed bugs: giant lock SVG (added size rule), 4 em-dashes removed, drawer iOS shrink-to-fit trap (in-viewport fade+slide)
- [ ] Deploy to GitHub Pages (awaiting approval)
- [x] Write back learnings (WooCommerce Store API, conversion stack, drawer iOS trap, unsized-SVG)

## Verified working
WhatsApp COD checkout (cart -> prefilled wa.me message), Smart Cart free-delivery progress + frequently-bought bundles, Build My Space quiz (room+budget -> curated under-budget kit), spin-to-win coupon applied to cart total, lightning countdown, low-stock + sold + rating social proof, rotating proof toast, search + category filter + load more.

## Round 2 changes (done + verified)
- [x] Vector "Sastho Lanka" brand lockup (inline SVG, header + footer, themes for dark footer). Real PNG can be swapped into /assets later.
- [x] Removed all "since 2009 / 15 years" heritage; new positioning = "Unbeatable quality at unbeatable prices, pay when it arrives."
- [x] Fonts: Lexend -> Plus Jakarta Sans (display) + Inter (body). More premium / Apple-adjacent.
- [x] Removed ALL emoji; replaced with one consistent stroke-icon set everywhere (categories, trust, how-it-works, announcement, cart, builder, eyebrows).
- [x] Removed spin wheel; added Apple-style welcome-offer popup (10% off, code WELCOME10, applies to cart via percent coupon).
- [x] Apple polish: dark announcement bar, red only on discount badges, calmer shadows, more whitespace.
- [x] Re-verified: console clean, iOS off-screen audit 0 offenders (incl. cart open), desktop + mobile 390px.
- [ ] NEXT: client to send hero/lifestyle images for the main picture and section visuals (drop in /assets).

## Round 3 changes (done + verified)
- [x] REAL logo wired in (assets/logo.png header, assets/logo-light.png dark footer). White bg removed + cropped via PIL; light variant recolors ink to white.
- [x] 6 real lifestyle photos placed (compressed to ~170-220KB JPEGs): hero = life-6 (couple), editorial band = life-2, shop-the-look = life-1 flat-lay, lookbook gallery = life-3/5/4.
- [x] Icons fully upgraded to a refined premium set (fork+knife, mug, pot, jar, bulb, droplet, bottle, house, etc.) replacing the weak ones.
- [x] WhatsApp glyph fixed everywhere (clean official-style mark): FAB, card buttons, checkout, footer, mobile bar.
- [x] New premium sections: editorial overlay band, "Shop the look" split, "Loved in homes island-wide" lookbook.
- [x] UX: mobile sticky bottom bar (View Cart + WhatsApp), gated scroll-reveal animations, deeper editorial gradient for text contrast.
- [x] Re-verified: console clean, iOS off-screen audit 0 offenders (incl. mobile bar + cart open), desktop + mobile 390px, all 6 photos + logos load.
- [ ] NEXT: deploy to GitHub Pages (awaiting approval).

## Round 4 changes (done + verified)
- [x] ON-SITE CHECKOUT: full overlay (details + delivery + COD), inline validation (name/address/district + SL phone regex), live order summary, order id SAS-#####, premium confirmation ("what happens next"), order saved to localStorage (sastho_orders). WhatsApp demoted to a secondary "order on WhatsApp instead" link + "confirm on WhatsApp" on success.
- [x] Cart drawer primary CTA is now "Checkout securely" (on-site); WhatsApp is the small alt option.
- [x] BUILD MY SPACE expanded to 5 questions: Room, Style, Colour vibe, Who's it for, Budget. Real keyword-scoring algorithm so picks actually change with answers (verified two combos differ); "who" controls item count + per-category cap; chosen filters shown as tags.
- [x] Re-verified: console clean, iOS audit 0 offenders incl. checkout open, desktop + mobile 390px, checkout flow (empty→4 errors, valid→order placed + cart cleared + stored).
- [ ] For real deploy: point checkout form POST at Supabase/Formspree (currently localStorage demo).

## Assets
assets/logo.png, assets/logo-light.png, assets/life-1..6.jpg

## Preview
`python3 -m http.server 4599 --directory ~/bb-websites/sastho` (launch.json "sastho")
