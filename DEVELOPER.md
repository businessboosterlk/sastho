# Sastho Lanka storefront: developer notes

Written 29 September 2026 by Business Booster. Read this before touching the code.

## What this is

A concept storefront for Sastho Lanka (sastho.lk) that installs on a phone like an app. 711 pages of static HTML
built by **Astro 7** from `src/`. There is no server. An order leaves the phone as a WhatsApp message the shopper
sends themselves. Stack per Business Booster's standard: Astro for pages. If a server is ever added it is Node.js
(Next.js where pages and an API live together) on Supabase. That happens only after the client has said yes.

Until 29 September 2026 this was nine separate HTML files, each with its own header, its own bottom bar and its
own copy of the catalogue. Those files are kept, untouched, in `legacy/` as the rollback. Nothing in `legacy/` is
built or served.

## Run it

```bash
npm install          # Node 22.12 or newer
npm run build        # checks the icons, stamps the build, writes dist/, writes the worker
node scripts/serve.mjs          # http://localhost:4599/sastho/  behaves like GitHub Pages
node scripts/check-site.mjs     # the gate: 63 checks, 11 pages, 3 widths, every sheet opened, the sums
node scripts/click-path.mjs     # every touchpoint counted and pressed, Back once and twice
node scripts/shots.mjs evidence/shots    # photographs of every page, to be LOOKED at
npm run pull         # reads the whole catalogue from sastho.lk again, then rebuilds the site's data
```

Pushing to `main` builds and publishes to GitHub Pages (`.github/workflows/deploy.yml`). **Run the gate and the
click path on the Mac before every push.** They are not yet run by the workflow.

## Where things are

| Path | What it is |
|---|---|
| `src/config.js` | **Every real-world value**: WhatsApp number, address, hours, returns, the app offer, the robots switch. Each line names where the fact came from. A value nobody has confirmed is `null` and the site prints nothing for it |
| `src/layouts/Layout.astro` | The shell every page wears: head, the strip under the clock, top bar, footer, bottom bar, every sheet |
| `src/pages/` | `index`, `shop`, `deals`, `build`, `about`, `contact`, `faq`, `404`, `offline`, `product` (the old address), `p/[slug]` (one page per product) |
| `src/scripts/card.js` | The ONE product card. Astro prints it at build time and the browser prints it when a list is filtered, from the same function |
| `src/scripts/store.js` | What the phone remembers: basket, saved items, delivery details, the app offer, which offers were seen |
| `src/scripts/sheets.js` | The one overlay: pins the page, one history entry per sheet, Back closes it, the page behind is inert |
| `src/scripts/app.js` | Shared behaviour: basket, order, search, quick look, install, update check |
| `src/styles/app.css` | Tokens, foundations, shell, controls, cards, sheets |
| `src/styles/pages.css` | Page sections. The last block centres the phone layout |
| `src/data/products.json` | The catalogue in full. Written by `scripts/build-catalog.mjs`. Never edit by hand |
| `src/data/faq.json` | Help answers. Every one is taken from Sastho's own policy pages |
| `public/assets/catalog.js` | The short catalogue the browser loads. Written by the same script |
| `data/store-raw.json` | The store's raw answer. Not in git (5 MB). `npm run pull` writes it |

## Rules that must not break

1. **Nothing is invented.** Names, prices, photographs and descriptions are the client's own, read from the
   sastho.lk store feed. The store holds no ratings, no review counts and no sold counts, so the site prints none.
   A product is "on sale" only when the store's price is below its regular price. The gate fails the build on
   sold counts, star ratings, countdowns, stock countdowns, made up reviews and unconfirmed promises.
2. **No length of time in business is ever printed.**
3. **Delivery charge and free delivery are not confirmed.** `SITE.delivery` is `null` on purpose. The basket says
   the charge is confirmed on WhatsApp. Put real numbers in `config.js` and the basket shows them.
4. **The app offer needs the client's yes.** `SITE.appOffer.agreed` is `false`. Do not share the link with
   shoppers until Cader has agreed the offer and named what it does not cover.
4b. **The basket ladder needs the client's yes too.** `SITE.basketGoals` holds three steps (3% at Rs 2,500, 5% at
   Rs 5,000, 8% at Rs 8,000). They are Business Booster's starting point and `agreed` is `false`. The reward is a
   percentage and never free delivery: BB's own delivery report to the client shows free delivery loses him
   money. Offers never stack. The gate works the sums out from the config and fails if a screen disagrees.
5. **On a phone the layout is centred. On a desk it is hard left.** The gate measures both.
6. **Icons are never drawn by hand.** Lucide and Simple Icons through `scripts/build-icons.mjs`. To add one, put
   its name in that file and run `npm run icons`.
7. **The catalogue script is loaded in the head.** A page's own script sits higher in the page than the shell's.
   Scripts run in the order they are written. Loaded at the foot, four pages ran with an empty catalogue.
8. **A link inside a sheet leaves with `location.replace`**, so Back returns in one press.
9. **This concept carries `noindex`.** It must not compete with sastho.lk in Google.

## Moving to the client's own domain

Set `SITE_URL` and `BASE_PATH=/` in the build. Change `ROBOTS` in `config.js` only when the old site is retired.

## What only an installed iPhone shows

Checked on the iOS 26.5 simulator, installed to the Home Screen, on 29 September 2026. On iOS 26 the way to
install is three dots, Share, View More, Add to Home Screen. The install sheet says exactly that.
