#!/usr/bin/env node
/* THE CLICK PATH. Every touchpoint is COUNTED from the page, PRESSED in a real browser and its effect READ.
   A button that changes nothing a person can see is a FAIL. Then the sequences: Back once and Back twice after
   every sheet and every link followed from inside a sheet, a sheet opened from a sheet, the order all the way
   to WhatsApp, the app offer, the filters in the address.
   The counting is done by the harness, never by hand: ALL is read from the page, PRESSED is filled by a
   recorder that hears every real tap, and the run fails when the two differ and prints the names.
     node scripts/click-path.mjs            phone and desk
     node scripts/click-path.mjs --quick    phone only
   Method: ~/.claude/skills/bb-click-path. Worked example: ~/bb-systems/bb-client-os/scripts/click-path.mjs. */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { serve } from './serve.mjs';

const QUICK = process.argv.includes('--quick');
const R = [];
const ok = (name, pass, seen = '') => { R.push({ name, pass: !!pass }); console.log((pass ? 'PASS  ' : 'FAIL  ') + name + (seen ? '   ' + String(seen).slice(0, 700) : '')); };
const data = JSON.parse(readFileSync('src/data/products.json', 'utf8'));
const PLAIN = data.products.find(p => !p.options.length && p.images.length > 1) || data.products.find(p => !p.options.length);
const OPT = data.products.find(p => p.options.length && p.images.length > 1) || data.products.find(p => p.options.length);
const WA = 'wa.me/94777675984';
const server = await serve(4603);
const BASE = 'http://localhost:4603/sastho/';
const browser = await chromium.launch({ channel: 'chromium' });

/* runs in the page before anything else: names every touchpoint, hears every real press */
const INSTALL = () => {
  const TOUCH = 'a[href],button,summary,select,input:not([type=hidden]),textarea';
  const region = e => { const s = e.closest('.sheet'); if (s) return s.id.replace('sheet-', 'sheet '); if (e.closest('.top')) return 'top bar'; if (e.closest('.tabs')) return 'bottom bar'; if (e.closest('.foot')) return 'footer'; if (e.closest('.install')) return 'install ask'; if (e.closest('.card')) return 'card'; return 'page'; };
  const ACTS = ['add', 'fav', 'quick', 'sheet', 'close', 'qty', 'remove', 'q', 'optTerm', 'quickAdd', 'orderSend', 'orderEdit', 'orderCancelEdit', 'orderBack', 'orderDone', 'installGo', 'installNo', 'shelf', 'price', 'sort', 'topic', 'room', 'need', 'look', 'budget', 'drop', 'pic'];
  const WORDS = { add: 'add to basket', fav: 'save', quick: 'quick look', close: 'close', remove: 'remove line', optTerm: 'option', quickAdd: 'add from quick look', orderSend: 'send order', orderEdit: 'edit details', orderCancelEdit: 'keep saved details', orderBack: 'change the order', orderDone: 'I have sent it', installGo: 'get the app', installNo: 'not now', shelf: 'shelf chip', price: 'price chip', sort: 'sort chip', topic: 'topic chip', room: 'room', need: 'need chip', look: 'look chip', budget: 'budget chip', drop: 'take out a pick', pic: 'photograph' };
  const dest = a => {
    const u = new URL(a.href, location.href);
    if (/wa\.me$/.test(u.host)) return 'to WhatsApp';
    if (/google\./.test(u.host)) return 'to the map';
    if (/instagram\.com$/.test(u.host)) return 'to Instagram';
    if (u.host === 'wholesale.sastho.lk') return 'to wholesale';
    if (u.host === 'sastho.lk') return 'to the policy on sastho.lk';
    if (u.host !== location.host) return 'to ' + u.host;
    if (u.pathname === location.pathname && u.hash) return 'to ' + u.hash;
    const f = u.pathname.replace(/^\/sastho\//, '') || 'index.html';
    if (f.startsWith('p/')) return 'to a product';
    return 'to ' + f.replace('.html', '') + (u.search ? ', filtered' : '');
  };
  const name = e => {
    if (e.matches('input,select,textarea')) return 'field ' + (e.name || e.id || e.type);
    if (e.tagName === 'SUMMARY') return 'open an answer';
    for (const a of ACTS) if (a in e.dataset) return a === 'sheet' ? 'open ' + e.dataset.sheet : a === 'qty' ? (e.dataset.qty > 0 ? 'one more' : 'one fewer') : a === 'q' ? (e.dataset.q > 0 ? 'one more' : 'one fewer') : WORDS[a];
    if (e.id) return '#' + e.id;
    if (e.tagName === 'A') return dest(e);
    return 'UNNAMED ' + e.outerHTML.replace(/\s+/g, ' ').slice(0, 70);
  };
  window.__kind = e => region(e) + ': ' + name(e);
  window.__touch = TOUCH;
  window.__vis = e => { const r = e.getBoundingClientRect(), c = getComputedStyle(e); if (!(r.width > 1 && r.height > 1) || c.visibility === 'hidden' || c.display === 'none') return false; /* inside a closed answer */ if (e.checkVisibility && !e.checkVisibility({ visibilityProperty: true })) return false; /* switched off is not a touchpoint */ if (e.disabled) return false; if (e.closest('[inert],[hidden]')) return false; for (let n = e.parentElement; n; n = n.parentElement) { const k = getComputedStyle(n); if (k.display === 'none' || k.visibility === 'hidden') return false; } return true; };
  window.__kinds = () => { const top = [...document.querySelectorAll('.sheet.on')].pop(); const root = top || document; return [...new Set([...root.querySelectorAll(TOUCH)].filter(window.__vis).map(window.__kind))]; };
  window.__pressed = JSON.parse(sessionStorage.getItem('__pressed') || '[]');
  const hear = e => { const t = e.target instanceof Element ? e.target.closest(TOUCH) : null; if (!t) return; const k = window.__kind(t); if (!window.__pressed.includes(k)) { window.__pressed.push(k); sessionStorage.setItem('__pressed', JSON.stringify(window.__pressed)); } };
  document.addEventListener('click', hear, true); document.addEventListener('change', hear, true); document.addEventListener('input', hear, true);
  window.__snap = () => { let h = 0; const s = document.body.innerHTML; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; const g = document.querySelector('#gal-main'); return JSON.stringify({ href: location.href, sheets: [...document.querySelectorAll('.sheet.on')].map(x => x.id), store: JSON.stringify(localStorage), dom: h, y: Math.round(scrollY), gal: g ? Math.round(g.scrollLeft) : 0, val: [...document.querySelectorAll('input,select,textarea')].map(x => x.value).join('|') }); };
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function run(w, h, touch) {
  const tag = touch ? `phone ${w}px` : `desk ${w}px`;
  console.log(`\n${tag}`);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: touch ? 2 : 1, isMobile: touch, hasTouch: touch, serviceWorkers: 'block' });
  await ctx.addInitScript(INSTALL);
  /* every link that leaves the shop is answered here, and its address is read */
  const outside = [];
  await ctx.route(u => !/^localhost/.test(new URL(u).host), (route) => {
    const q = route.request();
    if (q.resourceType() === 'document') { outside.push(q.url()); return route.fulfill({ status: 200, contentType: 'text/html', body: '<title>outside the shop</title>' }); }
    return route.fulfill({ status: 200, contentType: 'image/gif', body: Buffer.from('R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==', 'base64') });
  });
  const page = await ctx.newPage(); const errs = [];
  /* a door that opens a new tab: the tab is read by the route above, then shut */
  const shutPopups = pg => pg.on('popup', async p => { try { await p.waitForLoadState('domcontentloaded', { timeout: 3000 }); } catch { /* an empty tab */ } try { await p.close(); } catch { /* closed already */ } });
  shutPopups(page);
  page.on('pageerror', e => errs.push(e.message));
  const go = async (path, seed = {}) => {
    await page.goto(BASE + 'offline.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(s => { const keep = sessionStorage.getItem('__pressed'); localStorage.clear(); sessionStorage.clear(); if (keep) sessionStorage.setItem('__pressed', keep); localStorage.setItem('sastho_install_hint', s.ask ? '0' : '1'); if (!s.ask) localStorage.setItem('sastho_install_hint', '1'); else localStorage.removeItem('sastho_install_hint');
      if (s.cart) localStorage.setItem('sastho_cart_v2', JSON.stringify(s.cart)); if (s.saved) localStorage.setItem('sastho_saved_v2', JSON.stringify(s.saved)); if (s.me) localStorage.setItem('sastho_me_v1', JSON.stringify(s.me)); localStorage.setItem('sastho_app_hello_v1', '1'); }, seed);
    await page.goto(BASE + path, { waitUntil: 'load' }); await page.waitForFunction(() => document.documentElement.classList.contains('app-ready')); await sleep(250);
  };
  const point = async (sel, nth = 0) => {
    const e = page.locator(sel).nth(nth); await e.waitFor({ state: 'attached', timeout: 4000 });
    /* the press lands where the control IS. The page is moved only when the control is off the screen or
       under a bar, and a bar that is already on screen is never scrolled to. */
    const reach = () => e.evaluate(n => { const r = n.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2; if (!(r.width > 0) || x < 0 || x > innerWidth || y < 0 || y > innerHeight) return null; const t = document.elementFromPoint(x, y); return t && (t === n || n.contains(t) || t.contains(n)) ? [x, y] : null; });
    let at = await reach();
    if (!at) { await e.evaluate(n => n.scrollIntoView({ block: 'center', inline: 'center' })); await sleep(260); at = await reach(); }
    if (!at) throw new Error('nothing to press, or it is covered: ' + sel);
    return at;
  };
  const tap = async (sel, nth = 0) => { const [x, y] = await point(sel, nth); touch ? await page.touchscreen.tap(x, y) : await page.mouse.click(x, y); await sleep(420); };
  const back = async () => { await page.goBack({ waitUntil: 'commit' }).catch(() => null); await sleep(560); };
  const st = () => page.evaluate(() => ({ href: location.href.replace(location.origin + '/sastho/', ''), sheets: [...document.querySelectorAll('.sheet.on')].map(s => s.id.replace('sheet-', '')), locked: document.body.classList.contains('sheet-open'), y: Math.round(scrollY), cart: window.Sastho ? window.Sastho.cart.count() : -1, saved: window.Sastho ? window.Sastho.saved.ids().length : -1 }));

  const CART = [{ id: PLAIN.id, qty: 2, opt: '' }, { id: OPT.id, qty: 1, opt: OPT.options.map(o => o.name + ': ' + o.terms[0]).join(', ') }];
  const SAVED = [PLAIN.id, OPT.id];
  const ME = { name: 'Test Shopper', phone: '0771234567', address: '12 Example Road', district: 'Colombo', town: 'Nugegoda', note: '' };
  const cartOpen = touch ? '.tabs [data-sheet="cart"]' : '.top [data-sheet="cart"]';
  const searchOpen = touch ? '.top .search-ib' : '.top .top-search';

  /* EVERY SURFACE A PERSON CAN STAND ON: a page, or a page with a sheet open in one of its states */
  const SURFACES = [
    ['home', 'index.html', { ask: 1 }],
    ['shop', 'shop.html', {}],
    ['shop, nothing matches', 'shop.html?q=zzzqqq', {}],
    ['deals', 'deals.html', {}],
    ['build, the room', 'build.html', {}],
    ['build, the needs', 'build.html', {}, async () => { await tap('.quiz [data-room="kitchen"]'); }],
    ['build, the look', 'build.html', {}, async () => { await tap('.quiz [data-room="kitchen"]'); await tap('#q-next'); }],
    ['build, the budget', 'build.html', {}, async () => { await tap('.quiz [data-room="kitchen"]'); await tap('#q-next'); await tap('#q-next'); }],
    ['build, the picks', 'build.html', {}, async () => { await tap('.quiz [data-room="kitchen"]'); await tap('#q-next'); await tap('#q-next'); await tap('[data-budget="5000"]'); await tap('#q-next'); }],
    ['about', 'about.html', {}], ['contact', 'contact.html', {}], ['help', 'faq.html', {}],
    ['help, nothing matches', 'faq.html', {}, async () => { await page.locator('#faq-q').fill('zzzqqq'); await sleep(250); }],
    ['page not found', 'no-such-page.html', {}], ['no connection', 'offline.html', {}],
    ['old product address, gone', 'product.html?id=1', {}],
    ['product with options', 'p/' + OPT.slug + '.html', {}], ['product', 'p/' + PLAIN.slug + '.html', {}],
    ['basket, empty', 'shop.html', {}, async () => { await tap(cartOpen); }],
    ['basket', 'shop.html', { cart: CART }, async () => { await tap(cartOpen); }],
    ['order, the form', 'shop.html', { cart: CART }, async () => { await tap(cartOpen); await tap('#cart-foot [data-sheet="order"]'); }],
    ['order, saved details', 'shop.html', { cart: CART, me: ME }, async () => { await tap(cartOpen); await tap('#cart-foot [data-sheet="order"]'); }],
    ['order, editing saved details', 'shop.html', { cart: CART, me: ME }, async () => { await tap(cartOpen); await tap('#cart-foot [data-sheet="order"]'); await tap('[data-order-edit]'); }],
    ['order, sent', 'shop.html', { cart: CART, me: ME }, async () => { await tap(cartOpen); await tap('#cart-foot [data-sheet="order"]'); await tap('#order-send'); }],
    ['saved, empty', 'shop.html', {}, async () => { await tap('.top [data-sheet="saved"]'); }],
    ['saved', 'shop.html', { saved: SAVED }, async () => { await tap('.top [data-sheet="saved"]'); }],
    ['quick look', 'shop.html?q=' + encodeURIComponent(OPT.name.slice(0, 18)), {}, async () => { await tap('#shop-grid [data-quick]'); }],
    ['search, empty', 'shop.html', {}, async () => { await tap(searchOpen); }],
    ['search, results', 'shop.html', {}, async () => { await tap(searchOpen); await page.locator('#find-input').fill('plate'); await sleep(300); }],
    ['search, nothing found', 'shop.html', {}, async () => { await tap(searchOpen); await page.locator('#find-input').fill('zzzqqq'); await sleep(300); }],
    ['install, how to', 'index.html', { ask: 1 }, async () => { await tap('.install [data-install-go]'); }],
    ['welcome', 'index.html', {}, async () => { await page.evaluate(() => window.Sastho.open('hello')); await sleep(400); }],
    ...(touch ? [['more', 'index.html', {}, async () => { await tap('.tabs [data-sheet="menu"]'); }], ['filters', 'shop.html', {}, async () => { await tap('#f-open'); }]] : []),
  ];

  const ALL = new Map();        // kind -> the surface it was first met on
  const dead = [], unnamed = [], wrongDoor = [];
  let pressed = 0;
  for (const [name, path, seed, setup] of SURFACES) {
    try {
      await go(path, seed); if (setup) await setup();
      const kinds = await page.evaluate(() => window.__kinds());
      for (const k of kinds) {
        if (/UNNAMED/.test(k)) { if (!unnamed.includes(k)) unnamed.push(name + ' > ' + k); continue; }
        if (ALL.has(k)) continue;
        ALL.set(k, name);
        /* a fresh surface for every press, so one press never answers for the next */
        await go(path, seed); if (setup) await setup();
        const n = await page.evaluate(k => { const top = [...document.querySelectorAll('.sheet.on')].pop(); const root = top || document; const list = [...root.querySelectorAll(window.__touch)].filter(window.__vis); const same = list.filter(x => window.__kind(x) === k); /* the second of its kind when there is one: the first is often the one already chosen */ const e = same[1] || same[0]; if (!e) return -1; e.setAttribute('data-press', '1'); return 1; }, k);
        if (n < 0) { dead.push(`${name} > ${k}: it was there when counted and gone when pressed`); continue; }
        const before = await page.evaluate(() => window.__snap()), out0 = outside.length;
        const isField = /: field /.test(k);
        if (isField) {
          const e = page.locator('[data-press="1"]').first(), t = await e.evaluate(n => n.tagName + ':' + (n.type || ''));
          if (/^SELECT/.test(t)) await e.selectOption({ index: 1 }); else { await e.evaluate(n => n.scrollIntoView({ block: 'center' })); await e.fill(/tel/.test(t) ? '0771234567' : 'plate'); }
          await sleep(350);
        } else await tap('[data-press="1"]');
        await sleep(200);
        const after = await page.evaluate(() => window.__snap()).catch(() => 'left the page');
        const left = outside.length > out0 ? outside[outside.length - 1] : '';
        pressed++;
        if (before === after && !left) dead.push(`${name} > ${k}: nothing changed`);
        if (left && /WhatsApp/.test(k) && !left.includes(WA)) wrongDoor.push(`${k} went to ${left.slice(0, 60)}`);
        if (/#order-send|#order-again/.test(k) && !left.includes(WA)) wrongDoor.push(`${k} did not reach WhatsApp`);
      }
    } catch (e) { dead.push(`${name}: the surface could not be walked, ${String(e.message).split('\n')[0]}`); }
  }
  const heard = await page.evaluate(() => JSON.parse(sessionStorage.getItem('__pressed') || '[]'));
  const never = [...ALL.keys()].filter(k => !heard.includes(k) && !/: field /.test(k));
  ok(`${tag}: every touchpoint has a name`, !unnamed.length, unnamed.length ? unnamed.slice(0, 4).join(' | ') : `${ALL.size} kinds of touchpoint on ${SURFACES.length} surfaces`);
  ok(`${tag}: every touchpoint counted was pressed, heard by the recorder`, !never.length, never.length ? `${never.length} never pressed: ` + never.slice(0, 6).join(' | ') : `${ALL.size} counted, ${pressed} pressed`);
  ok(`${tag}: no press does nothing`, !dead.length, dead.length ? `${dead.length}: ` + dead.slice(0, 6).join(' | ') : `${pressed} presses, each changed the screen, the basket, the address or opened a door`);
  ok(`${tag}: every WhatsApp door opens Sastho's own number`, !wrongDoor.length, wrongDoor.length ? wrongDoor.slice(0, 4).join(' | ') : `${outside.filter(u => u.includes(WA)).length} WhatsApp doors, all ${WA}`);

  /* ───────── THE SEQUENCES ───────── */
  const F = [];                                  // faults, in the words of what was seen
  const want = async (what, fn) => { try { const bad = await fn(); if (bad) F.push(`${what}: ${bad}`); } catch (e) { F.push(`${what}: could not be walked, ${String(e.message).split('\n')[0]}`); } };

  await want('a sheet opens, Back closes it, Back again leaves the page', async () => {
    await go('index.html'); await tap(`.top a.brand`); await go('shop.html');
    await page.goto(BASE + 'deals.html', { waitUntil: 'load' }); await sleep(300);        // history: shop, deals
    await page.evaluate(() => window.scrollTo(0, 700)); await sleep(150);
    await tap(cartOpen); const a = await st(); if (a.sheets.join() !== 'cart' || !a.locked) return `the basket did not open: ${JSON.stringify(a)}`;
    await sleep(800); const a2 = await st(); if (a2.sheets.join() !== 'cart') return 'the basket closed by itself within a second';
    await back(); const b = await st(); if (b.sheets.length || b.locked || !/^deals/.test(b.href)) return `after Back once: ${JSON.stringify(b)}`;
    if (Math.abs(b.y - 700) > 2) return `the page was at 700 and came back at ${b.y}`;
    await back(); const c = await st(); if (!/^shop/.test(c.href)) return `after Back twice the page is ${c.href}, shop was expected`;
  });
  await want('a sheet opened from a sheet: the order over the basket', async () => {
    await go('shop.html', { cart: CART }); await tap(cartOpen); await tap('#cart-foot [data-sheet="order"]');
    await sleep(800); const a = await st(); if (a.sheets.join() !== 'cart,order') return `expected the order over the basket, saw [${a.sheets}]`;
    await back(); const b = await st(); if (b.sheets.join() !== 'cart') return `Back once should leave the basket, saw [${b.sheets}]`;
    await back(); const c = await st(); if (c.sheets.length || c.locked) return `Back twice should leave the page clear, saw [${c.sheets}] locked ${c.locked}`;
    if (!/^shop/.test(c.href)) return `Back twice left the shop for ${c.href}`;
  });
  await want('a sheet that takes the place of a sheet: saved, then the quick look, then the basket', async () => {
    await go('shop.html', { saved: SAVED }); await tap('.top [data-sheet="saved"]'); await tap('#saved-body [data-quick]');
    await sleep(800); const a = await st(); if (a.sheets.join() !== 'quick') return `the quick look should stand alone, saw [${a.sheets}]`;
    await tap('#quick-body [data-opt-term]'); await tap('[data-quick-add]');
    await sleep(800); const b = await st(); if (b.sheets.join() !== 'cart' || b.cart !== 1) return `expected the basket with 1 item, saw [${b.sheets}] and ${b.cart}`;
    await back(); const c = await st(); if (c.sheets.length || c.locked) return `one Back should close it all, saw [${c.sheets}]`;
    const len = await page.evaluate(() => history.length); await back(); const d = await st(); if (/^shop/.test(d.href) && !d.sheets.length && len > 2) return 'the second Back did nothing: a history entry was left behind';
  });
  await want('a link followed from inside a sheet: one Back returns, the next leaves', async () => {
    await go('deals.html'); await page.goto(BASE + 'shop.html', { waitUntil: 'load' }); await sleep(300);
    await page.evaluate(() => window.scrollTo(0, 600)); await sleep(150);
    await tap(searchOpen); await page.locator('#find-input').fill('plate'); await sleep(300); await tap('#search-body .hit');
    const a = await st(); if (!/^p\//.test(a.href) || a.sheets.length || a.locked) return `expected a product page with nothing open, saw ${JSON.stringify(a)}`;
    await back(); const b = await st(); if (!/^shop/.test(b.href) || b.sheets.length || b.locked) return `Back once should return to the shop with nothing open, saw ${JSON.stringify(b)}`;
    if (Math.abs(b.y - 600) > 60) return `the shop was at 600 and came back at ${b.y}`;
    await back(); const c = await st(); if (!/^deals/.test(c.href)) return `Back twice should leave for deals, saw ${c.href}`;
  });
  await want('the order, from an empty form to WhatsApp and an empty basket', async () => {
    await go('shop.html', { cart: CART }); await tap(cartOpen); await tap('#cart-foot [data-sheet="order"]');
    await tap('[data-order-send]');
    const refused = await page.evaluate(() => ({ bad: document.querySelectorAll('#order-form .field.bad').length, why: document.querySelector('#order-refuse').textContent, shown: !document.querySelector('#order-refuse').hidden }));
    if (refused.bad !== 4 || !refused.shown) return `an empty form should be refused on 4 fields with the reason in the bar, saw ${JSON.stringify(refused)}`;
    await page.locator('#order-form [name=name]').fill('Test Shopper'); await page.locator('#order-form [name=phone]').fill('12345');
    await page.locator('#order-form [name=address]').fill('12 Example Road'); await page.locator('#order-form [name=district]').selectOption('Kandy');
    await tap('[data-order-send]'); const r2 = await page.evaluate(() => document.querySelectorAll('#order-form .field.bad').length); if (r2 !== 1) return `a wrong phone number should be the one field refused, ${r2} were`;
    await page.locator('#order-form [name=phone]').fill('077 123 4567'); const n0 = outside.length;
    await tap('[data-order-send]'); await sleep(500);
    const url = outside.slice(n0).find(u => u.includes(WA)); if (!url) return 'WhatsApp was never opened';
    const msg = decodeURIComponent(url.split('text=')[1] || '');
    const items = PLAIN.price * 2 + OPT.price;
    for (const must of [PLAIN.name, OPT.name, 'Test Shopper', '077 123 4567', '12 Example Road', 'Kandy', 'Rs ' + items.toLocaleString('en-LK'), 'cash on delivery']) if (!msg.includes(must)) return `the message does not carry "${must}"`;
    if (/undefined|NaN|null/.test(msg)) return 'the message carries an empty value: ' + msg.match(/.{20}(undefined|NaN|null).{10}/)[0];
    const s = await page.evaluate(() => ({ title: document.querySelector('#order-title').textContent, me: JSON.parse(localStorage.getItem('sastho_me_v1') || 'null'), cart: window.Sastho.cart.count() }));
    if (s.title !== 'One more step' || !s.me || s.me.district !== 'Kandy') return `after sending: ${JSON.stringify(s)}`;
    if (s.cart !== 3) return 'the basket was emptied before the shopper said the order was sent';
    await tap('[data-order-done]'); await sleep(500); const e = await st(); if (e.sheets.length || e.locked || e.cart !== 0) return `after "I have sent it": ${JSON.stringify(e)}`;
    await back(); const f = await st(); if (f.sheets.length) return 'Back after the order brought a sheet back';
  });
  await want('the app offer: 10 percent off inside the installed app, once', async () => {
    const pct = (await page.evaluate(() => window.Sastho.offer.percent)) || 0; if (!pct) return '';
    await go('shop.html', { cart: CART, me: ME });
    const out = await page.evaluate(() => ({ open: window.Sastho.offer.open(), waiting: window.Sastho.offer.waiting() })); if (out.open || !out.waiting) return `in a browser the offer should be waiting and not open, saw ${JSON.stringify(out)}`;
    await tap(cartOpen); const nudge = await page.locator('#cart-body .offer-card').count(); if (!nudge) return 'the basket in a browser does not ask for the install';
    const t0 = await page.locator('#cart-foot .tot b').textContent(); const items = PLAIN.price * 2 + OPT.price;
    if (t0 !== 'Rs ' + items.toLocaleString('en-LK')) return `in a browser the total should be the full ${items}, saw ${t0}`;
    /* the same phone, opened from the Home Screen */
    const app = await ctx.newPage(); shutPopups(app); await app.addInitScript(() => { Object.defineProperty(navigator, 'standalone', { get: () => true }); });
    await app.goto(BASE + 'shop.html', { waitUntil: 'load' }); await app.waitForFunction(() => document.documentElement.classList.contains('app-ready')); await sleep(300);
    const a = await app.evaluate(() => ({ open: window.Sastho.offer.open(), asks: document.querySelector('#install').classList.contains('on'), band: !!document.querySelector('html.can-install') }));
    if (!a.open || a.asks || a.band) { await app.close(); return `installed: the offer should be open and every ask gone, saw ${JSON.stringify(a)}`; }
    await app.evaluate(() => window.Sastho.open('cart')); await sleep(400);
    const cut = Math.round(items * pct / 100), t1 = await app.locator('#cart-foot .tot b').textContent();
    if (t1 !== 'Rs ' + (items - cut).toLocaleString('en-LK')) { await app.close(); return `installed: the total should be ${items - cut}, saw ${t1}`; }
    await app.evaluate(() => window.Sastho.open('order')); await sleep(400); const n0 = outside.length;
    const href = await app.locator('#order-send').getAttribute('href'); const msg = decodeURIComponent(href.split('text=')[1]);
    if (!msg.includes('APP10') || !msg.includes('minus Rs ' + cut.toLocaleString('en-LK'))) { await app.close(); return 'the order message does not carry the offer and its sum'; }
    await app.evaluate(() => { window.Sastho.offer.spend(); }); await sleep(200);
    const again = await app.evaluate(() => window.Sastho.offer.open()); await app.close(); if (again) return 'the offer was still open after it was spent';
  });
  await want('the filters live in the address: a reload keeps them, Back leaves the shop', async () => {
    await go('index.html'); await page.goto(BASE + 'shop.html', { waitUntil: 'load' }); await sleep(300);
    await tap('#f-shelves [data-shelf="tableware"]'); const n = await page.locator('#f-line').textContent();
    const a = await st(); if (!/shelf=tableware/.test(a.href)) return `the address does not carry the shelf: ${a.href}`;
    const want = data.products.filter(p => p.shelf === 'tableware').length; if (!n.includes(' of ' + want + ' ')) return `the line says "${n}", the catalogue holds ${want}`;
    await tap('#shop-more'); const shown = await page.locator('#shop-grid .card').count(); if (shown !== 48) return `Show more should give 48 cards, saw ${shown}`;
    await page.reload({ waitUntil: 'load' }); await sleep(400); const kept = await page.locator('#shop-grid .card').count(), chip = await page.locator('#f-shelves .chip.on').textContent();
    if (kept !== 48 || !/Tableware/.test(chip)) return `after a reload: ${kept} cards and the chip "${chip}"`;
    await page.locator('#f-q').fill('zzzqqq'); await sleep(400); const none = await page.locator('#shop-grid .empty').count(); if (!none) return 'a search with no match shows no message';
    await tap('#empty-clear'); const all = await page.locator('#f-line').textContent(); if (!all.includes('of ' + data.meta.count)) return `Clear filters should bring back all ${data.meta.count}, the line says "${all}"`;
    await back(); const b = await st(); if (!/^index/.test(b.href)) return `one Back should leave the shop for home, saw ${b.href}`;
  });
  await want('Build My Space: Back goes back one question, the picks fit the budget', async () => {
    await go('index.html'); await tap('.rooms a.room'); const a = await st(); if (!/^build\.html#step-2$/.test(a.href)) return `a room on the home page should open question 2 with the room spent from the address, saw ${a.href}`;
    await tap('#q-next'); await tap('#q-next'); await tap('[data-budget="2000"]'); await tap('#q-next');
    const p = await page.evaluate(() => ({ n: document.querySelectorAll('#q-picks .pickrow').length, total: document.querySelector('#q-total').textContent })); const total = +p.total.replace(/[^\d]/g, '');
    if (!p.n || total > 2000 || total <= 0) return `the picks should fit Rs 2,000: ${p.n} picks, ${p.total}`;
    await tap('#q-add'); const b = await st(); if (b.sheets.join() !== 'cart' || b.cart !== p.n) return `Add all should open the basket with ${p.n}, saw [${b.sheets}] and ${b.cart}`;
    await back(); const c = await st(); if (c.sheets.length || !/step-5/.test(c.href)) return `Back should close the basket and stay on the picks, saw ${JSON.stringify(c)}`;
    await back(); const d = await page.evaluate(() => document.querySelector('#quiz').dataset.step); if (d !== '4') return `Back should return to question 4, the quiz is on ${d}`;
    await page.reload({ waitUntil: 'load' }); await sleep(400); const e = await page.evaluate(() => document.querySelector('#quiz').dataset.step); if (e !== '1') return `a reload should start the quiz again at 1, it is on ${e}`;
  });
  await want('the old product address finds the real product, and Back does not trap', async () => {
    await go('index.html'); await page.goto(BASE + 'product.html?id=' + PLAIN.id, { waitUntil: 'load' }); await sleep(500);
    const a = await st(); if (a.href !== 'p/' + PLAIN.slug + '.html') return `expected the product's own page, saw ${a.href}`;
    const h1 = await page.locator('.pdp h1').textContent(); if (h1.trim() !== PLAIN.name) return `the page names "${h1}", the store names "${PLAIN.name}"`;
    await back(); const b = await st(); if (!/^index/.test(b.href)) return `Back should return home, saw ${b.href}`;
  });
  await want('a product: options are asked for, the quantity and the price follow, the basket holds the line', async () => {
    await go('p/' + OPT.slug + '.html'); const add = touch ? '#pbar-add' : '#p-add';
    await tap(add); const a = await st(); if (a.cart !== 0) return 'a product with options was added with no option chosen';
    for (let i = 0; i < OPT.options.length; i++) await tap(`[data-optset] >> nth=${i} >> [data-opt-term] >> nth=0`);
    await tap('#pq-plus'); await tap('#pq-plus'); await tap(add); const b = await st(); if (b.cart !== 3) return `3 were asked for, the basket holds ${b.cart}`;
    const line = await page.evaluate(() => JSON.parse(localStorage.getItem('sastho_cart_v2'))[0]); if (!line.opt) return 'the line in the basket does not carry the option';
    const wa = decodeURIComponent((await page.locator('#p-wa').getAttribute('href')).split('text=')[1]); if (!wa.includes('Quantity: 3') || !wa.includes(OPT.options[0].terms[0])) return 'the WhatsApp message does not carry the quantity and the option';
  });
  if (touch) await want('a press that closes a sheet never falls through to the bar under it', async () => {
    await go('index.html'); await tap(cartOpen);
    const [x, y] = await point('#cart-foot [data-close]');
    await page.touchscreen.tap(x, y); await sleep(60);
    /* the same finger, the same place, the moment the sheet has gone */
    const under = await page.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); const hit = e && e.closest('a,button'); return { what: hit ? (hit.getAttribute('href') || hit.dataset.sheet || hit.textContent.trim()) : '', reach: !!hit && !hit.closest('[inert]') }; }, [x, y]);
    await page.touchscreen.tap(x, y); await sleep(500);
    const a = await st(); if (!/^index/.test(a.href) || a.sheets.length) return `a second touch in the same place reached "${under.what}" and the screen is now ${JSON.stringify(a)}`;
  });
  await want('a second tab of the shop follows the basket', async () => {
    await go('shop.html'); const two = await ctx.newPage(); await two.goto(BASE + 'index.html', { waitUntil: 'load' }); await sleep(300);
    await tap('#shop-grid [data-add]'); await sleep(400);
    const n = await two.evaluate(() => document.querySelector('[data-count="cart"]').textContent); await two.close(); if (n !== '1') return `the other tab shows ${n}`;
  });
  ok(`${tag}: the sequences, Back once and Back twice`, !F.length && !errs.length, F.length || errs.length ? [...errs.slice(0, 2), ...F].join(' | ') : (touch ? '12' : '11') + ' sequences walked, each ended where its label promised');
  await ctx.close();
  return { kinds: ALL.size, pressed };
}

const sizes = QUICK ? [[390, 844, true]] : [[390, 844, true], [1440, 900, false]];
const totals = [];
for (const s of sizes) totals.push(await run(...s));
await browser.close(); server.close();
const bad = R.filter(x => !x.pass);
console.log(`\nTouchpoints counted ${totals.map(t => t.kinds).join(' and ')}, pressed ${totals.map(t => t.pressed).join(' and ')}.`);
console.log(`${R.length - bad.length} of ${R.length} checks passed.` + (bad.length ? '\nFAILED:\n  ' + bad.map(x => x.name).join('\n  ') : ''));
process.exit(bad.length ? 1 : 0);
