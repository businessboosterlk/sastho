#!/usr/bin/env node
/* WHAT THE LIVE ADDRESS SERVES, read in a real browser with the worker on. Run after every publish.
     node scripts/verify-live.mjs [base, default https://businessboosterlk.github.io/sastho/] */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
const BASE = process.argv[2] || 'https://businessboosterlk.github.io/sastho/';
const data = JSON.parse(readFileSync('src/data/products.json', 'utf8'));
const plain = data.products.find(p => !p.options.length);
mkdirSync('evidence/live', { recursive: true });
const browser = await chromium.launch({ channel: 'chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage(); const errs = []; let bad = 0;
page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
const say = (name, pass, seen) => { if (!pass) bad++; console.log((pass ? 'PASS  ' : 'FAIL  ') + name + '   ' + seen); };
for (const f of ['index.html', 'shop.html', 'deals.html', 'build.html', 'about.html', 'contact.html', 'faq.html', 'p/' + plain.slug + '.html']) {
  const r = await page.goto(BASE + f + '?t=' + Date.now(), { waitUntil: 'load' }); await page.waitForTimeout(900);
  const s = await page.evaluate(() => ({ n: window.SASTHO_CATALOG ? window.SASTHO_CATALOG.products.length : 0, build: window.Sastho && window.Sastho.BUILD, robots: document.querySelector('meta[name=robots]').content, torn: [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.getBoundingClientRect().width > 0).length, wide: document.documentElement.scrollWidth - innerWidth }));
  await page.screenshot({ path: 'evidence/live/' + f.replace(/[^a-z0-9]+/gi, '-') + '.png' });
  say(f, r.status() === 200 && s.n === data.meta.count && s.build && s.robots === 'noindex,nofollow' && !s.torn && s.wide <= 0, `status ${r.status()}, ${s.n} products, build ${s.build}, ${s.robots}, torn pictures ${s.torn}, sideways ${s.wide}`);
}
await page.goto(BASE + 'shop.html', { waitUntil: 'load' }); await page.waitForTimeout(900);
const [x, y] = await page.locator('#shop-grid [data-add]').first().evaluate(n => { n.scrollIntoView({ block: 'center' }); const r = n.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
await page.touchscreen.tap(x, y); await page.waitForTimeout(500);
const n = await page.evaluate(() => window.Sastho.cart.count());
await page.locator('.tabs [data-sheet="cart"]').tap(); await page.waitForTimeout(500);
const open = await page.evaluate(() => document.querySelector('#sheet-cart').classList.contains('on') && document.querySelectorAll('#cart-body .line').length);
await page.screenshot({ path: 'evidence/live/basket.png' });
say('add to basket and open the basket, on the live shop', n === 1 && open === 1, `basket holds ${n}, lines shown ${open}`);
const sw = await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); return r ? (r.active ? 'active' : 'installing') : 'none'; });
say('the worker is registered on the live shop', sw !== 'none', sw);
say('no error on any live page', !errs.length, errs.length ? errs.slice(0, 3).join(' | ') : 'none');
await browser.close(); process.exit(bad ? 1 : 0);
