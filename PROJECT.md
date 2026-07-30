# Sastho — World-Class Storefront Remake

**Client:** Sastho (sastho.lk), Sri Lanka's budget home, kitchen and lifestyle store. Colombo 11, island-wide COD delivery.
**Type:** Concept + working demo (full unique kit) to win/upgrade the client.
**Stack:** Single self-contained HTML (inline CSS + JS), no framework, GitHub Pages ready. Real product data + images pulled live from sastho.lk WooCommerce Store API.
**Live URL:** https://businessboosterlk.github.io/sastho/ (LIVE, verified HTTP 200 on 2026-07-30, byte-identical to local index.html).
**Version control:** local git initialised 2026-07-30. Baseline commit captures the deployed state. No remote wired locally yet.

> ⚠️ CORRECTED 2026-07-30. This header previously read "Colombo 11, since 2009". The brand is about
> one year old and BRAIN.md forbids any long-establishment reference. The claim was NEVER on the
> shipped pages (Round 2 removed it, zero hits across all 9 HTML files and zero on the live URL), it
> survived only in this document. Fixed here so nobody reintroduces it from the doc.

## The unique angle (why this converts)
Sastho's real blockers are FEAR and EFFORT, not pretty photos. This build attacks both:
1. **One-tap WhatsApp COD checkout** — "Order in 10 seconds, pay when it arrives." Matches how Sri Lankans buy. wa.me prefilled with full cart.
2. **Smart Cart** — live free-delivery progress nudge + bundle suggestions to lift order value.
3. **Build My Space quiz** — room + budget → instant curated cart. Kills 205-item choice paralysis.
4. **Live trust layer**: COD badge, rotating social proof, delivery promise. (Corrected 2026-07-30, this line previously read "Since 2009" as the first trust element. The shipped pages never carried it, the doc did.)

## Brand
- Accent orange `#c85103`. VERIFIED 2026-07-30 by sampling the real logo pixel by pixel: 21,688 of
  22,333 orange pixels in assets/logo.png are exactly #c85103, and sastho.lk's own CSS uses #c85103.
  Brand black is #000000 (logo). Full ramp shipped: `--accent-deep:#9d3f02` · `--accent:#c85103` ·
  `--accent-2:#f96504`, plus rgba shadows on rgb(200,81,3).
  BRAIN.md's "#E8722A source of truth" is WRONG and is being corrected there. Do not reintroduce it.
- Currency රු / Rs.
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

## Round 5 audit + fixes, 2026-07-30 (verified in browser, not assumed)
- [x] CONTACT PAGE JS WAS DEAD ON THE LIVE SITE. An orphaned `})();` at contact.html:552 had no
      matching opener, so the entire script block failed to parse and NOTHING in it ran: the brand
      logo never wired, the hamburger never wired, form validation and the submit handler were inert
      and `window.resetForm` was undefined. Restored the missing `(function(){`. Verified in the
      browser: resetForm is a function, empty submit raises 4 field errors, a valid submit shows the
      success state, and helpers (form, obs, showToast) correctly stay out of global scope.
- [x] PALETTE MIGRATED TO THE REAL BRAND ORANGE. Was #d24e08, a value present in neither the logo
      nor the client's site. Now #c85103 across 9 files, 51 hex uses plus 63 rgba shadows.
      Side effect worth keeping: contrast on white rises 4.34:1 to 4.53:1, so the accent now passes
      WCAG AA for normal text where the old one failed.
- [x] BROKEN FREE-DELIVERY PROMISE. shop.html and 404.html advertised free delivery over Rs 3,000
      while the cart constant `FREE_SHIP` is 5000, so the promise broke at the cart. Display aligned
      to the code at Rs 5,000.
- [x] RETURNS WINDOW CORRECTED. We advertised "7-day returns" in 4 places. The client's own live
      policy at sastho.lk/refunds-returns/ says 14 calendar days from delivery. We were understating
      the client's own offer. Now 14-day.
- [x] iOS RIGHT-EDGE CLIP (landmine L-004) was missing on ALL 9 pages, on a storefront whose buyers
      are almost entirely on phones. Added `-webkit-text-size-adjust:100%`.
- [x] bb-rock-solid guard: 9 of 9 pages PASS (was 9 of 9 FAIL).
- [ ] ⚠️ UNVERIFIED CLAIM STILL LIVE, needs Cader's yes: the Rs 5,000 free-delivery threshold is a
      BB invention. It appears nowhere on sastho.lk and nowhere in the client's policy pages. It is
      now at least internally consistent, but it is still a commercial promise we made up for the
      client. Confirm the real threshold or remove the mechanic.
- [ ] ⚠️ THE CONTACT FORM SENDS NOTHING. Verified: no fetch, no XHR, no form action, zero network
      requests on submit. It waits 1200ms and then tells the customer "Message sent, we'll get back
      to you within 24 hours." Every enquiry on the live page is lost behind a false confirmation.
      Wire it to a real endpoint or take the page down. Same unwired state as the checkout below.

## Assets
assets/logo.png, assets/logo-light.png, assets/life-1..6.jpg

## Preview
`python3 -m http.server 4599 --directory ~/bb-websites/sastho` (launch.json "sastho")
