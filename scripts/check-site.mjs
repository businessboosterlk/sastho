#!/usr/bin/env node
/* THE GATE. Nothing is published until this passes. It reads the built site in a real browser at three
   widths, opens every sheet, and runs the Business Booster house checks. Every line is a PASS or a FAIL
   with what was SEEN. A failing check prints a sample, never only a count.
     node scripts/check-site.mjs              the whole gate
     node scripts/check-site.mjs --quick      phone width only
   Photographs of every sheet go to evidence/sheets. Look at them: a check is not an eye. */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { serve } from './serve.mjs';
import { AUDIT } from './lib/audit.mjs';

const QUICK = process.argv.includes('--quick');
const HOME = homedir();
const PY = 'python3', NODE = process.execPath;
const R = [];
const ok = (name, pass, seen = '') => { R.push({ name, pass: !!pass, seen: String(seen) }); console.log((pass ? 'PASS  ' : 'FAIL  ') + name + (seen ? '   ' + String(seen).slice(0, 600) : '')); };
const run = (cmd, args, opt = {}) => spawnSync(cmd, args, { encoding: 'utf8', ...opt });
const sample = (a, n = 3) => a.slice(0, n).join(' | ') + (a.length > n ? ` | and ${a.length - n} more` : '');

const PAGES = { index: 'index.html', shop: 'shop.html', deals: 'deals.html', build: 'build.html', about: 'about.html', contact: 'contact.html', faq: 'faq.html', notfound: 'this-page-is-not-here.html', offline: 'offline.html', product: 'p/multi-purpose-trigger-spray-bottle.html', plain: 'p/white-ceramic-scalloped-plate.html' };
const data = JSON.parse(readFileSync('src/data/products.json', 'utf8'));
if (!existsSync('dist/' + PAGES.plain)) PAGES.plain = 'p/' + data.products.find(p => !p.options.length).slug + '.html';
if (!existsSync('dist/' + PAGES.product)) PAGES.product = 'p/' + data.products.find(p => p.options.length).slug + '.html';

/* ───────────── A. WHAT CAN BE READ WITHOUT A BROWSER ───────────── */
console.log('\nA. The source and the built files');
let r = run(NODE, ['scripts/build-icons.mjs', '--check']); ok('icons come from the licensed sets, untouched', r.status === 0, (r.stdout + r.stderr).trim());
r = run(NODE, ['scripts/stamp.mjs', '--check']); ok('one build stamp in the app, the version file and the built site', r.status === 0, (r.stdout + r.stderr).trim());
r = run(NODE, [join(HOME, 'bb-systems/qa/hand-svg.mjs'), 'src', '--allow', 'scripts/icon.js=1']); ok('no icon typed by hand (one named exception: the function that draws a symbol)', r.status === 0, (r.stdout + r.stderr).trim());
r = run(PY, [join(HOME, 'bb-systems/stack-standard/check_stack.py'), '.']); ok('stack standard', r.status === 0, (r.stdout + r.stderr).trim().split('\n').slice(0, 3).join(' '));

const css = readdirSync('dist/assets/app').filter(f => f.endsWith('.css')).map(f => readFileSync('dist/assets/app/' + f, 'utf8')).join('\n');
const js = readdirSync('dist/assets/app').filter(f => f.endsWith('.js')).map(f => readFileSync('dist/assets/app/' + f, 'utf8')).join('\n');
const html = Object.fromEntries(Object.entries(PAGES).filter(([k]) => k !== 'notfound').map(([k, f]) => [k, readFileSync('dist/' + f, 'utf8')]));
html.notfound = readFileSync('dist/404.html', 'utf8');

/* the app shell checker reads one file, so it is given the page and its stylesheet together */
const tmp = join(tmpdir(), 'sastho-gate'); mkdirSync(tmp, { recursive: true });
const shellFails = [];
for (const [k, h] of Object.entries(html)) {
  const f = join(tmp, k + '.html'); writeFileSync(f, h.replace('</head>', '<style>' + css + '</style></head>'));
  const out = run(PY, [join(HOME, 'bb-systems/apply_app_shell.py'), '--check', f]).stdout || '';
  const no = [...out.matchAll(/([A-Za-z0-9 :\-]+?):NO/g)].map(m => m[1].trim());
  if (no.length || !/viewport-fit:yes/.test(out)) shellFails.push(k + ' [' + (no.join(', ') || 'no answer') + ']');
}
ok(`app shell recipe on all ${Object.keys(html).length} pages (viewport, insets, strip painted, manifest, installed iPhone rule)`, !shellFails.length, shellFails.length ? sample(shellFails) : 'every line yes');
const uses = s => (css.match(new RegExp(s.replace(/[()]/g, '\\$&'), 'g')) || []).length;
ok('the insets are USED, not only declared', uses('var(--sat)') >= 6 && uses('var(--sab)') >= 5, `var(--sat) ${uses('var(--sat)')} uses, var(--sab) ${uses('var(--sab)')} uses`);

/* the foundations audit: count the knobs */
const all = css + js + Object.values(html).join('');
const knobs = { 'touch-action': /touch-action:manipulation/g, 'tap-highlight-color': /-webkit-tap-highlight-color:(transparent|#0000|rgba\(0,0,0,0\))/g, 'touch-callout': /-webkit-touch-callout:none/g, 'user-select': /user-select:none/g, 'overscroll-behavior': /overscroll-behavior(-[xy])?:(contain|none)/g, enterkeyhint: /enterkeyhint=/g, inert: /\binert\b/g, scrollRestoration: /scrollRestoration/g };
const zero = Object.entries(knobs).map(([k, re]) => [k, (all.match(re) || []).length]);
ok('foundation knobs, none at zero', zero.every(([, n]) => n > 0), zero.map(([k, n]) => `${k} ${n}`).join(', '));
ok('a field cannot zoom the screen: 16px on a touch screen', /@media \(pointer:coarse\)\{input,select,textarea\{font-size:16px!important\}\}/.test(css.replace(/\s*([{};:,])\s*/g, '$1').replace(/@media\(/g, '@media (')), 'the coarse pointer rule is in the built stylesheet');
ok('sheets are sized in dvh, never vh', !/[\d.]+vh\b/.test(css.replace(/[\d.]+dvh/g, '')), 'no vh unit in the stylesheet');
ok('overflow is clipped, never hidden, on the page itself', /html,body\{[^}]*overflow-x:clip/.test(css), 'html,body overflow-x:clip');

/* hover sticks to the last thing tapped on a touch screen: every hover rule lives inside (hover:hover) */
{
  let depth = 0, inHover = 0, bad = [], i = 0; const src = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const stack = [];
  while (i < src.length) {
    const open = src.indexOf('{', i), shut = src.indexOf('}', i);
    if (shut === -1) break;
    if (open !== -1 && open < shut) { const sel = src.slice(i, open).trim(); stack.push(sel); if (/:hover/.test(sel) && !stack.some(s => /^@media[^{]*\(hover:\s*hover\)/.test(s))) bad.push(sel.slice(0, 60)); i = open + 1; }
    else { stack.pop(); i = shut + 1; }
  }
  ok('every hover rule is inside @media (hover:hover)', !bad.length, bad.length ? sample(bad) : `${(src.match(/:hover/g) || []).length} hover rules, all inside`);
}
{
  const srcFiles = ['src/scripts', 'src/pages', 'src/pages/p', 'src/layouts', 'src/components'].flatMap(d => readdirSync(d).filter(f => /\.(js|astro)$/.test(f)).map(f => d + '/' + f));
  const boxes = srcFiles.filter(f => /(^|[^.\w])(confirm|prompt|alert)\s*\(/.test(readFileSync(f, 'utf8').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\.prompt\(\)/g, '')));
  ok('the app asks its own questions: no confirm(), prompt() or alert()', !boxes.length, boxes.length ? sample(boxes) : `${srcFiles.length} source files read`);
}
{
  const ft = [];
  /* the checker reads one file, so each page is given with its stylesheet, and every script is read from source */
  const scripts = readdirSync('src/scripts').filter(f => f.endsWith('.js')).map(f => 'src/scripts/' + f);
  for (const f of [...Object.keys(html).map(k => join(tmp, k + '.html')), ...scripts]) { const o = run(NODE, [join(HOME, 'bb-systems/qa/first-try.mjs'), f]); if (o.status !== 0) ft.push(f.split('/').pop() + ': ' + ((o.stdout + o.stderr).split('\n').find(l => /FAIL F/.test(l)) || '').trim()); }
  ok('first try checker on every page and every script', !ft.length, ft.length ? sample(ft, 2) : `${Object.keys(html).length} pages and ${scripts.length} scripts pass`);
}
ok('the concept cannot compete with sastho.lk in Google', Object.values(html).every(h => /<meta name="robots" content="noindex,nofollow">/.test(h)), 'noindex on every page');
{
  const man = JSON.parse(readFileSync('dist/manifest.json', 'utf8'));
  const missing = man.icons.map(i => i.src).filter(f => !existsSync('dist/' + f));
  ok('the manifest is this shop and every icon it names exists', man.short_name === 'Sastho' && man.display === 'standalone' && !missing.length && man.icons.some(i => i.purpose === 'maskable'), `${man.name}, ${man.icons.length} icons${missing.length ? ', MISSING ' + missing : ''}`);
  const sw = readFileSync('dist/sw.js', 'utf8');
  ok('the worker: pages from the network first with no-cache, version.json never kept', /mode === 'navigate'/.test(sw) && /cache: 'no-cache'/.test(sw) && /version\.json'\)\) return/.test(sw), 'read in dist/sw.js');
  const shell = JSON.parse(sw.match(/const SHELL = (\[.*?\]);/)[1]); const gone = shell.filter(f => !existsSync('dist/' + f.replace(/^\.\//, '')));
  ok('every file the worker keeps on the phone exists', !gone.length, gone.length ? sample(gone) : `${shell.length} files`);
}
{
  /* THE CATALOGUE IS THE CLIENT'S OWN. Every price on a built product page must be the price in the store data. */
  const bad = [];
  for (const p of data.products) {
    const h = readFileSync('dist/p/' + p.slug + '.html', 'utf8');
    const want = 'Rs ' + p.price.toLocaleString('en-LK');
    const got = (h.match(/<span class="now"[^>]*>([^<]+)<\/span>/) || [])[1];
    if (got !== want) bad.push(`${p.slug}: page ${got}, store ${want}`);
  }
  ok(`every product page shows the store's own price`, !bad.length && data.products.length === data.meta.storeTotal, bad.length ? sample(bad) : `${data.products.length} of ${data.meta.storeTotal} pages read`);
}

/* ───────────── B. EVERY PAGE IN A REAL BROWSER ───────────── */
const server = await serve(4602);
const BASE = 'http://localhost:4602/sastho/';
const browser = await chromium.launch({ channel: 'chromium' });
const SIZES = QUICK ? [[390, 844, true]] : [[390, 844, true], [320, 640, true], [1440, 900, false]];
const styleText = [];

const PAGE_PROBE = () => {
  const vis = e => { const r = e.getBoundingClientRect(), c = getComputedStyle(e); if (!(r.width > 1 && r.height > 1) || c.visibility === 'hidden' || c.display === 'none' || +c.opacity < .05) return false; if (e.checkVisibility && !e.checkVisibility({ visibilityProperty: true })) return false; /* switched off is not a touchpoint */ if (e.disabled) return false; for (let n = e.parentElement; n; n = n.parentElement) { const k = getComputedStyle(n); if (k.visibility === 'hidden' || k.display === 'none' || +k.opacity < .05) return false; } return true; };
  const name = e => (e.id ? '#' + e.id : e.tagName.toLowerCase() + '.' + String(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className).split(' ').filter(Boolean).slice(0, 2).join('.')) + ' "' + (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 24) + '"';
  const inScroller = e => { for (let n = e.parentElement; n && n !== document.body; n = n.parentElement) { const c = getComputedStyle(n); if (/(auto|scroll)/.test(c.overflowX) && n.scrollWidth > n.clientWidth + 2) return true; } return false; };
  const root = [...document.querySelectorAll('.sheet.on')].pop() || document.body;
  const out = {};
  const taps = [...root.querySelectorAll('a[href],button,select,summary,input:not([type=hidden]),textarea,[role=button]')].filter(e => vis(e) && !e.closest('[inert]'));
  out.taps = taps.length;
  /* a link inside a sentence is text and is read as text. Everything else a finger meets is 44px. */
  out.small = taps.filter(e => { const r = e.getBoundingClientRect(); const inline = e.tagName === 'A' && getComputedStyle(e).display === 'inline'; return !inline && (r.height < 43.5 || r.width < 43.5); }).map(e => name(e) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
  out.fields = [...root.querySelectorAll('input,select,textarea')].filter(vis).filter(e => parseFloat(getComputedStyle(e).fontSize) < 16).map(name);
  out.tiny = [...root.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim() && vis(e) && !e.closest('svg') && parseFloat(getComputedStyle(e).fontSize) < 11).map(name);
  /* the moving line of promises is decoration, hidden from a screen reader and repeated in the page: it is meant to run off the edge */
  out.past = [...root.querySelectorAll('*')].filter(e => vis(e) && !e.closest('svg,[aria-hidden="true"]') && getComputedStyle(e).position !== 'fixed' && !inScroller(e) && e.getBoundingClientRect().right > innerWidth + 1).map(name);
  out.sideways = document.documentElement.scrollWidth - innerWidth;
  /* ON A DESK every heading is hard left. ON A PHONE the hero, the page heading and the feature blocks are
     centred (Thulaib, 29 Sep 2026), so there the first heading is measured against the middle of the screen. */
  const phone = innerWidth < 720;
  out.centred = phone ? [] : [...root.querySelectorAll('h1,h2')].filter(e => vis(e) && !e.closest('.foot') && getComputedStyle(e).textAlign === 'center').map(name);
  out.offCentre = [];
  if (phone && root === document.body) {
    const mid = e => { const g = document.createRange(); g.selectNodeContents(e); const r = g.getBoundingClientRect(); return Math.round(((r.left + r.right) / 2 - innerWidth / 2) * 10) / 10; };
    [...document.querySelectorAll('main .hero h1, main .phead h1, main .hero-text > p, main .phead p, .teaser h2, .appband h2, .promo h3')].filter(vis).forEach(e => { const d = mid(e); if (Math.abs(d) > 1.5) out.offCentre.push(name(e) + ' is ' + d + 'px off the middle'); });
    [...document.querySelectorAll('main .hero-cta .btn, .teaser .btn, .promo .btn')].filter(vis).forEach(e => { const r = e.getBoundingClientRect(), d = Math.round(((r.left + r.right) / 2 - innerWidth / 2) * 10) / 10; if (Math.abs(d) > 1.5) out.offCentre.push(name(e) + ' is ' + d + 'px off the middle'); });
  }
  out.tight = [...root.querySelectorAll('h1,h2,h3')].filter(vis).filter(e => { const c = getComputedStyle(e); return parseFloat(c.lineHeight) / parseFloat(c.fontSize) < 1.05; }).map(name);
  const brand = document.querySelector('.top .brand img'), h1 = [...document.querySelectorAll('main h1')].find(vis);
  out.left = (!phone && brand && h1 && !h1.closest('.pdp')) ? Math.round((h1.getBoundingClientRect().left - brand.getBoundingClientRect().left) * 10) / 10 : 0;
  out.torn = [...document.images].filter(i => vis(i) && i.complete && i.naturalWidth === 0).map(i => i.src.split('/').pop());
  out.catalogue = window.SASTHO_CATALOG ? window.SASTHO_CATALOG.products.length : 0;
  out.app = !!(window.Sastho && window.Sastho.find && window.Sastho.BUILD);
  out.strip = getComputedStyle(document.querySelector('.statusfill')).backgroundColor;
  out.grounds = [getComputedStyle(document.documentElement).backgroundColor, getComputedStyle(document.querySelector('.top')).backgroundColor, out.strip, (document.querySelector('.tabs') ? getComputedStyle(document.querySelector('.tabs')).backgroundColor : '')].filter(Boolean);
  return out;
};
const TEXT = () => {
  /* the words Business Booster wrote. The client's own product names and descriptions are marked
     data-client-copy and are read by the client's eye, not by the house style. */
  const skip = e => e.closest('[data-client-copy],script,style,svg,[inert],[hidden]');
  const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) { const t = n.textContent.replace(/\s+/g, ' ').trim(); if (t && n.parentElement && !skip(n.parentElement)) out.push(t); }
  /* a label that carries a product's name ("Save White Ceramic Plate") carries the client's words */
  const named = e => e.closest('.card,.line,.hit,.pickrow,.gal,.ql');
  document.querySelectorAll('[aria-label],[placeholder],[alt],[title]').forEach(e => { if (skip(e) || named(e)) return; ['aria-label', 'placeholder', 'alt', 'title'].forEach(a => { const v = e.getAttribute(a); if (v && v.trim()) out.push(v.trim()); }); });
  if (!document.body.classList.contains('on-product')) { out.push(document.title); const d = document.querySelector('meta[name=description]'); if (d) out.push(d.content); }
  return out;
};

console.log('\nB. Every page in a real browser');
for (const [w, h, touch] of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: touch ? 2 : 1, isMobile: touch, hasTouch: touch, serviceWorkers: 'block' });
  const fails = { errors: [], catalogue: [], sideways: [], past: [], small: [], fields: [], tiny: [], centred: [], tight: [], left: [], torn: [], gaps: [], grounds: [], topbar: [], inset: [] };
  let taps = 0;
  for (const [k, f] of Object.entries(PAGES)) {
    const page = await ctx.newPage(); const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !(k === 'notfound' && /404/.test(m.text()))) errs.push(m.text()); });
    await page.goto(BASE + f, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 600) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(60); }
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(300);
    const p = await page.evaluate(PAGE_PROBE); taps += p.taps;
    const tag = `${k}@${w}`;
    if (errs.length) fails.errors.push(tag + ' ' + errs[0]);
    if (p.catalogue !== data.meta.count || !p.app) fails.catalogue.push(`${tag} catalogue ${p.catalogue}, app ${p.app}`);
    if (p.sideways > 0) fails.sideways.push(`${tag} by ${p.sideways}px`);
    p.past.slice(0, 2).forEach(x => fails.past.push(tag + ' ' + x));
    if (touch) p.small.forEach(x => fails.small.push(tag + ' ' + x));
    if (touch) p.fields.forEach(x => fails.fields.push(tag + ' ' + x));
    p.tiny.slice(0, 2).forEach(x => fails.tiny.push(tag + ' ' + x));
    p.centred.forEach(x => fails.centred.push(tag + ' ' + x));
    p.offCentre.forEach(x => fails.centred.push(tag + ' ' + x));
    p.tight.forEach(x => fails.tight.push(tag + ' ' + x));
    if (Math.abs(p.left) > 1) fails.left.push(`${tag} heading ${p.left}px from the brand mark's left edge`);
    p.torn.forEach(x => fails.torn.push(tag + ' ' + x));
    if (new Set(p.grounds).size !== 1 || /rgba\(0, 0, 0, 0\)|transparent/.test(p.strip)) fails.grounds.push(`${tag} ${p.grounds.join(' / ')}`);
    (await page.evaluate(AUDIT)).forEach(x => fails.gaps.push(tag + ' ' + x));
    /* does the top bar survive a scroll, and does the check prove anything */
    const tb = await page.evaluate(async () => { const t = document.querySelector('.top'), before = t.getBoundingClientRect().top, room = Math.max(document.documentElement.scrollHeight - innerHeight, 0); window.scrollTo(0, Math.min(700, room)); await new Promise(r => setTimeout(r, 120)); const after = t.getBoundingClientRect().top; window.scrollTo(0, 0); return { before, after, room }; });
    if (tb.room < 100) fails.topbar.push(`${tag} page too short to scroll (${tb.room}px), this proved nothing`); else if (tb.before !== tb.after) fails.topbar.push(`${tag} top bar moved from ${tb.before} to ${tb.after}`);
    /* every shell rule is proved with the inset SET. At 0 they all pass. */
    if (touch) {
      const s = await page.evaluate(async () => {
        const root = document.documentElement, q = s => document.querySelector(s);
        const read = () => ({ top: q('.top').getBoundingClientRect().height, brand: q('.top .brand').getBoundingClientRect().top, strip: q('.statusfill').getBoundingClientRect().height, tabs: q('.tabs') ? q('.tabs').getBoundingClientRect().height : 0, tabsBottom: q('.tabs') ? innerHeight - q('.tabs').getBoundingClientRect().bottom : 0 });
        const a = read(); root.style.setProperty('--sat', '59px'); root.style.setProperty('--sab', '34px'); await new Promise(r => setTimeout(r, 60));
        const b = read(); root.style.removeProperty('--sat'); root.style.removeProperty('--sab'); return { a, b };
      });
      if (s.b.top - s.a.top !== 59 || s.b.strip !== 59 || s.b.brand < 59 || s.b.tabs - s.a.tabs !== 34 || Math.abs(s.b.tabsBottom) > 0.5) fails.inset.push(`${tag} with 59 and 34 set: top bar grew ${s.b.top - s.a.top}, strip ${s.b.strip}, brand top ${s.b.brand}, bottom bar grew ${s.b.tabs - s.a.tabs}, gap under the bar ${s.b.tabsBottom}`);
    }
    if (w === 390) styleText.push(...(await page.evaluate(TEXT)));
    await page.close();
  }
  const n = Object.keys(PAGES).length;
  ok(`${w}px: no error on any of ${n} pages`, !fails.errors.length, sample(fails.errors));
  ok(`${w}px: the catalogue and the app are loaded on every page`, !fails.catalogue.length, fails.catalogue.length ? sample(fails.catalogue) : `${data.meta.count} products on ${n} of ${n} pages`);
  ok(`${w}px: no page scrolls sideways and nothing is clipped off the right edge`, !fails.sideways.length && !fails.past.length, sample([...fails.sideways, ...fails.past]));
  if (touch) ok(`${w}px: every touchpoint is at least 44px`, !fails.small.length, fails.small.length ? sample(fails.small, 5) : `${taps} touchpoints measured`);
  if (touch) ok(`${w}px: no field under 16px`, !fails.fields.length, sample(fails.fields));
  ok(`${w}px: no text under 11px`, !fails.tiny.length, sample(fails.tiny));
  ok(touch ? `${w}px: on a phone the hero, the page heading, the feature blocks and their buttons sit in the middle` : `${w}px: on a desk no centred heading, every first heading level with the brand mark`, !fails.centred.length && !fails.left.length, sample([...fails.centred, ...fails.left], 5));
  ok(`${w}px: no heading tighter than 1.05`, !fails.tight.length, sample(fails.tight));
  ok(`${w}px: every picture loaded`, !fails.torn.length, sample(fails.torn));
  ok(`${w}px: one colour from the clock to the bar, and the strip is painted`, !fails.grounds.length, sample(fails.grounds));
  ok(`${w}px: the top bar survives a scroll`, !fails.topbar.length, sample(fails.topbar));
  if (touch) ok(`${w}px: the shell moves with the insets set to 59 and 34`, !fails.inset.length, sample(fails.inset));
  ok(`${w}px: the gap audit, every pair of controls on every page`, !fails.gaps.length, fails.gaps.length ? fails.gaps.length + ' faults: ' + sample(fails.gaps, 6) : 'no two controls touch, crowd or sit on an edge');
  await ctx.close();
}

/* ───────────── C. EVERY SHEET, OPENED ───────────── */
console.log('\nC. Every sheet, opened and measured');
mkdirSync('evidence/sheets', { recursive: true });
for (const [w, h, touch] of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: touch ? 2 : 1, isMobile: touch, hasTouch: touch, serviceWorkers: 'block' });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const plainId = data.products.find(p => 'p/' + p.slug + '.html' === PAGES.plain).id, optId = data.products.find(p => p.options.length).id;
  const faults = [], seen = [];
  /* the press lands where the control IS. The harness never scrolls the page to reach a bar that is
     already on screen: doing so sent the page to the top and blamed the sheet for it. */
  const tap = async sel => {
    const e = page.locator(sel).first();
    let b = await e.boundingBox();
    if (!b || b.y < 0 || b.y + b.height > h) { await e.evaluate(n => n.scrollIntoView({ block: 'center' })); await page.waitForTimeout(150); b = await e.boundingBox(); }
    if (!b) throw new Error('nothing to press: ' + sel);
    const x = b.x + b.width / 2, y = b.y + b.height / 2;
    touch ? await page.touchscreen.tap(x, y) : await page.mouse.click(x, y);
    await page.waitForTimeout(380);
  };
  const state = () => page.evaluate(() => ({ open: [...document.querySelectorAll('.sheet.on')].map(s => s.id), locked: document.body.classList.contains('sheet-open'), y: Math.round(-parseFloat(document.body.style.top || '0')), inertBehind: [...document.querySelectorAll('[data-behind]')].every(e => e.hasAttribute('inert')), inertClosed: [...document.querySelectorAll('.sheet:not(.on)')].every(s => s.hasAttribute('inert')), len: history.length }));
  const measure = async (label) => {
    const s = await state(), p = await page.evaluate(PAGE_PROBE), a = await page.evaluate(AUDIT);
    const tag = `${label}@${w}`; seen.push(label);
    if (!s.locked || !s.inertBehind) faults.push(`${tag} the page behind is not frozen or not out of reach (locked ${s.locked}, inert ${s.inertBehind})`);
    if (touch) p.small.forEach(x => faults.push(`${tag} under 44px: ${x}`));
    if (touch) p.fields.forEach(x => faults.push(`${tag} field under 16px: ${x}`));
    p.past.slice(0, 2).forEach(x => faults.push(`${tag} past the right edge: ${x}`));
    a.forEach(x => faults.push(`${tag} ${x}`));
    const top = await page.evaluate(() => { const s = [...document.querySelectorAll('.sheet.on')].pop(); const r = s.getBoundingClientRect(); return { top: r.top, bottom: innerHeight - r.bottom, focus: s.contains(document.activeElement) }; });
    if (Math.abs(top.bottom) > 0.5 && w < 720) faults.push(`${tag} the sheet stands ${top.bottom}px off the bottom edge`);
    if (!top.focus) faults.push(`${tag} the focus did not move into the sheet`);
    if (w === 390) styleText.push(...(await page.evaluate(TEXT)));
    await page.screenshot({ path: `evidence/sheets/${label.replace(/[^a-z0-9]+/gi, '-')}-${w}.png` });
  };
  const back = async () => { await page.goBack(); await page.waitForTimeout(520); };
  const shut = async (label) => { const s = await state(); if (s.open.length || s.locked) faults.push(`${label}@${w} still open after Back: ${s.open.join(', ')} locked ${s.locked}`); };

  await page.goto(BASE + 'shop.html', { waitUntil: 'load' }); await page.waitForTimeout(400);
  await page.evaluate(() => window.scrollTo(0, 900)); await page.waitForTimeout(200);
  const y0 = await page.evaluate(() => window.scrollY);
  const opener = touch ? '.tabs [data-sheet="cart"]' : '.top [data-sheet="cart"]';
  await tap(opener); await measure('basket, empty');
  const s1 = await state(); if (s1.y !== y0) faults.push(`basket@${w} the page behind moved from ${y0} to ${s1.y}`);
  await back(); await shut('basket, empty');
  const y1 = await page.evaluate(() => window.scrollY); if (Math.abs(y1 - y0) > 1) faults.push(`basket@${w} after closing the page is at ${y1}, it was at ${y0}`);
  await page.evaluate(([a]) => { window.Sastho.cart.add(a, 2); }, [plainId]);
  await page.evaluate(id => { const p = window.Sastho.find(id); window.Sastho.cart.add(id, 1, p.opts.map(([n, t]) => n + ': ' + t[0]).join(', ')); }, optId);
  await tap(opener); await measure('basket, two lines');
  await tap('#cart-foot [data-sheet="order"]'); await measure('order, empty form');
  await tap('[data-order-send]'); await measure('order, form refused');
  const msgs = await page.evaluate(() => [...document.querySelectorAll('#order-form .field.bad')].length); if (msgs !== 4) faults.push(`order@${w} an empty form marked ${msgs} fields, 4 are required`);
  await back(); const s2 = await state(); if (s2.open.join() !== 'sheet-cart') faults.push(`order@${w} Back from the order left [${s2.open}] open, the basket should be back`);
  await back(); await shut('basket after order');
  await tap('.top [data-sheet="saved"]'); await measure('saved, empty'); await back(); await shut('saved');
  await page.evaluate(([a, b]) => { window.Sastho.saved.toggle(a); window.Sastho.saved.toggle(b); }, [plainId, optId]);
  await tap('.top [data-sheet="saved"]'); await measure('saved, two items'); await back(); await shut('saved');
  await tap(touch ? '.top .search-ib' : '.top .top-search'); await measure('search, empty');
  await page.locator('#find-input').fill('plate'); await page.waitForTimeout(300); await measure('search, results');
  await page.locator('#find-input').fill('zzzqqq'); await page.waitForTimeout(300); await measure('search, nothing found');
  await back(); await shut('search');
  await tap(`#shop-grid [data-quick="${optId}"], [data-quick]`); await measure('quick look'); await back(); await shut('quick look');
  if (touch) { await tap('.tabs [data-sheet="menu"]'); await measure('more'); await back(); await shut('more'); }
  if (touch) { await page.evaluate(() => window.scrollTo(0, 0)); await tap('#f-open'); await measure('filters'); await back(); await shut('filters'); }
  await page.evaluate(() => window.Sastho.open('install')); await page.waitForTimeout(380); await measure('install, how to'); await back(); await shut('install');
  await page.evaluate(() => window.Sastho.open('hello')); await page.waitForTimeout(380); await measure('welcome'); await back(); await shut('welcome');
  /* the order with saved details, and the state after sending */
  await page.evaluate(() => { localStorage.setItem('sastho_me_v1', JSON.stringify({ name: 'Test Shopper', phone: '0771234567', address: '12 Example Road', district: 'Colombo', town: 'Nugegoda', note: '' })); });
  await tap(opener); await tap('#cart-foot [data-sheet="order"]'); await measure('order, saved details');
  await tap('[data-order-edit]'); await measure('order, editing details');
  await back(); await back(); await shut('order, saved details');
  ok(`${w}px: ${seen.length} sheets opened, frozen page, focus inside, 44px, gap audit, Back closes each`, !faults.length && !errs.length, faults.length || errs.length ? (faults.length + errs.length) + ' faults: ' + sample([...errs, ...faults], 6) : seen.join(', '));
  await ctx.close();
}

/* ───────────── D. THE SELECT LAW, PROBED ───────────── */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' }); const page = await ctx.newPage();
  await page.goto(BASE + 'contact.html', { waitUntil: 'load' });
  const s = await page.evaluate(() => { const e = document.querySelector('select'), c = getComputedStyle(e); return { app: c.appearance || c.webkitAppearance, img: /chevron|svg/.test(c.backgroundImage), pos: c.backgroundPositionX, pad: c.paddingRight }; });
  ok('select law: a drawn chevron 16px in from the edge, never the browser arrow', s.app === 'none' && s.img && /calc\(100% - 16px\)|right 16px/.test(s.pos) && parseFloat(s.pad) >= 44, JSON.stringify(s));
  await ctx.close();
}

/* ───────────── F. THE SALES PUSH ───────────── */
console.log('\nF. The sales push: the ladder, the basket bar and the sums');
{
  const cfg = (await import('../src/config.js')).SITE, tiers = (cfg.basketGoals.on ? cfg.basketGoals.tiers : []).slice().sort((a, b) => a.spend - b.spend);
  const money = n => 'Rs ' + Math.round(n).toLocaleString('en-LK');
  const plain = data.products.filter(p => !p.options.length && p.images.length);
  const near = v => plain.slice().sort((a, b) => Math.abs(a.price - v) - Math.abs(b.price - v))[0];
  /* baskets that sit under the first step, one rupee under a step, exactly on a step, between steps and over the top */
  const BASKETS = tiers.length ? [[[near(400), 1]], [[near(tiers[0].spend - 300), 1]], [[near(tiers[0].spend / 2), 2]], [[near(1700), 2]], [[near(tiers[tiers.length - 1].spend / 2 + 300), 2]]] : [];
  for (const [w, h, touch] of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: touch ? 2 : 1, isMobile: touch, hasTouch: touch, serviceWorkers: 'block' });
    const page = await ctx.newPage(); const faults = [], errs = []; page.on('pageerror', e => errs.push(e.message)); let sums = 0;
    for (const lines of BASKETS) {
      const items = lines.reduce((n, [p, q]) => n + p.price * q, 0);
      /* THE ARITHMETIC IS DONE HERE, from the config, and the screen must agree with it */
      const have = tiers.filter(t => items >= t.spend).pop() || null, next = tiers.find(t => items < t.spend) || null;
      const cut = have ? Math.round(items * have.percent / 100) : 0, total = items - cut, tag = `basket of ${money(items)}@${w}`;
      await page.goto(BASE + 'offline.html'); await page.evaluate(l => { localStorage.clear(); localStorage.setItem('sastho_install_hint', '1'); localStorage.setItem('sastho_app_hello_v1', '1'); localStorage.setItem('sastho_me_v1', JSON.stringify({ name: 'Test Shopper', phone: '0771234567', address: '12 Example Road', district: 'Colombo', town: '', note: '' })); localStorage.setItem('sastho_cart_v2', JSON.stringify(l)); }, lines.map(([p, q]) => ({ id: p.id, qty: q, opt: '' })));
      for (const f of ['shop.html', PAGES.plain]) {
        await page.goto(BASE + f, { waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(350);
        const b = await page.evaluate(() => { const g = document.querySelector('#goalbar'), r = g.getBoundingClientRect(), bar = document.querySelector('.tabs'), br = bar && getComputedStyle(bar).display !== 'none' ? bar.getBoundingClientRect() : null; return { shown: !g.hidden && r.height > 0, top: document.querySelector('#gb-top').textContent, sub: document.querySelector('#gb-sub').textContent, h: r.height, gap: br ? br.top - r.bottom : innerHeight - r.bottom, left: r.left, right: innerWidth - r.right, cutTop: document.querySelector('#gb-top').scrollWidth > document.querySelector('#gb-top').clientWidth + 1 }; });
        const wantTop = next ? `${money(next.spend - items)} more for ${next.percent}% off` : `${have.percent}% off is yours`;
        if (!b.shown) faults.push(`${tag} ${f}: the basket bar is not shown`);
        if (b.top !== wantTop) faults.push(`${tag} ${f}: the bar says "${b.top}", the sum says "${wantTop}"`);
        if (!b.sub.includes(money(total))) faults.push(`${tag} ${f}: the bar's total is "${b.sub}", the sum is ${money(total)}`);
        if (b.h < 44 || b.gap < 8 || b.left < 8 || b.right < 8) faults.push(`${tag} ${f}: the bar is ${b.h} high, ${b.gap} from the bar under it, ${b.left} and ${b.right} from the edges`);
        if (b.cutTop && w >= 360) faults.push(`${tag} ${f}: the bar's words are cut`);
        (await page.evaluate(AUDIT)).forEach(x => faults.push(`${tag} ${f}: ${x}`));
        /* at the foot of the page nothing a person reads or presses sits under the bars */
        const foot = await page.evaluate(async () => { window.scrollTo(0, document.documentElement.scrollHeight); await new Promise(r => setTimeout(r, 200)); const last = document.querySelector('.foot .bar'), g = document.querySelector('#goalbar').getBoundingClientRect(); return last.getBoundingClientRect().bottom - g.top; });
        if (foot > 0) faults.push(`${tag} ${f}: the last line of the page runs ${Math.round(foot)}px under the basket bar`);
        if (f !== 'shop.html') { const line = await page.evaluate(() => { const e = document.querySelector('#p-goal'); return e.hidden ? '' : e.textContent; }); const p = data.products.find(x => 'p/' + x.slug + '.html' === f), then = items + p.price, h2 = tiers.filter(t => then >= t.spend).pop() || null, n2 = tiers.find(t => then < t.spend) || null;
          const wantLine = h2 && (!have || h2.percent > have.percent) ? `Add this and your whole basket gets ${h2.percent}% off` : n2 ? `Add this and you are ${money(n2.spend - then)} from ${n2.percent}% off your basket` : `Your basket has ${h2.percent}% off`;
          if (line !== wantLine) faults.push(`${tag}: the product says "${line}", the sum says "${wantLine}"`); }
      }
      await page.goto(BASE + 'shop.html', { waitUntil: 'load' }); await page.waitForTimeout(300);
      await page.evaluate(() => window.Sastho.open('cart')); await page.waitForTimeout(450);
      const c = await page.evaluate(() => ({ total: document.querySelector('#cart-foot .tot b').textContent, head: (document.querySelector('.ld-head') || {}).textContent || '', offer: [...document.querySelectorAll('#cart-body .sums .sum')].map(e => e.textContent.replace(/\s+/g, ' ').trim()).find(t => /offer/.test(t)) || '', picks: [...document.querySelectorAll('#cart-body .rc-row [data-add]')].map(b => +b.dataset.add), on: document.querySelectorAll('.ld-step.on').length }));
      if (c.total !== money(total)) faults.push(`${tag}: the basket total is ${c.total}, the sum is ${money(total)}`);
      if (next && !c.head.includes(money(next.spend - items))) faults.push(`${tag}: the ladder says "${c.head}", ${money(next.spend - items)} is what is missing`);
      if (cut && !c.offer.includes('minus ' + money(cut))) faults.push(`${tag}: the offer line is "${c.offer}", the sum is minus ${money(cut)}`);
      if (!cut && c.offer) faults.push(`${tag}: an offer is shown on a basket that has not reached a step: "${c.offer}"`);
      if (c.on !== tiers.filter(t => items >= t.spend).length) faults.push(`${tag}: ${c.on} steps are lit, ${tiers.filter(t => items >= t.spend).length} are reached`);
      if (next) { const gap = next.spend - items, reachers = c.picks.map(id => data.products.find(p => p.id === id)).filter(p => p.price >= gap); if (!c.picks.length) faults.push(`${tag}: no product is offered to reach the next step`); else if (!reachers.length) faults.push(`${tag}: none of the ${c.picks.length} products offered reaches the next step in one tap`); }
      await page.evaluate(() => window.Sastho.open('order')); await page.waitForTimeout(450);
      const msg = decodeURIComponent((await page.locator('#order-send').getAttribute('href')).split('text=')[1]);
      if (cut && !(msg.includes(`Basket offer, ${have.percent}% off a basket of ${money(have.spend)} or more: minus ${money(cut)}`) && msg.includes('Items after the offer: ' + money(total)))) faults.push(`${tag}: the order message does not carry the offer and its sum`);
      if (!cut && /offer/i.test(msg)) faults.push(`${tag}: the order message names an offer the basket has not reached`);
      (await page.evaluate(AUDIT)).forEach(x => faults.push(`${tag} order sheet: ${x}`));
      if (w === 390) { styleText.push(...(await page.evaluate(TEXT))); await page.goBack(); await page.waitForTimeout(450); styleText.push(...(await page.evaluate(TEXT))); }
      sums++;
    }
    ok(`${w}px: the ladder, the basket bar, the product line and the order message agree with the sums, on ${sums} baskets`, !faults.length && !errs.length && sums === BASKETS.length, faults.length || errs.length ? (faults.length + errs.length) + ' faults: ' + sample([...errs, ...faults], 5) : BASKETS.map(l => money(l.reduce((n, [p, q]) => n + p.price * q, 0))).join(', '));
    await ctx.close();
  }
}

/* ───────────── E. THE WORDS ───────────── */
console.log('\nE. The words');
{
  const lines = [...new Set(styleText)];
  /* the words that were read are kept, so a failure can be found and a person can read what was checked */
  mkdirSync('evidence', { recursive: true }); const f = 'evidence/words-read.txt'; writeFileSync(f, lines.join('\n'));
  const hs = run(PY, [join(HOME, 'bb-consultancy/house_style.py'), f]);
  ok(`house style on ${lines.length} lines of rendered words (dashes, comma before and, US spellings, filler)`, hs.status === 0, (hs.stdout + hs.stderr).trim().split('\n').slice(0, 8).join(' // '));
  /* NOTHING INVENTED. The first build printed star ratings, sold counts, stock countdowns, a timer, made up
     reviews, a welcome code and a free delivery line. The store holds none of them. They must not return. */
  const banned = [[/\b\d[\d,.]*k?\+?\s+sold\b/i, 'a sold count'], [/\bonly \d+ left\b/i, 'a stock countdown'], [/\b\d+ viewing\b/i, 'a viewing count'], [/\b\d(\.\d)? (stars?|out of 5)\b/i, 'a star rating'], [/\b\d+ reviews?\b/i, 'a review count'], [/ends in\b/i, 'a countdown'], [/WELCOME10/, 'the old welcome code'], [/free (island-wide )?(delivery|shipping) (over|on orders)/i, 'a free delivery promise'], [/\bverified\b/i, 'a verified badge'], [/happy customers/i, 'a customer count'], [/\bpremium\b/i, 'the word premium'], [/same[- ]day delivery/i, 'same day delivery'], [/price match|match (it|the price)/i, 'a price match'], [/\b(since|established|est\.?) \d{4}\b|\byears (of|in) (business|experience)\b/i, 'a length of time in business'], [/holding your items/i, 'a holding timer'], [/just ordered/i, 'a made up order notice']];
  const hits = []; for (const l of lines) for (const [re, what] of banned) if (re.test(l)) hits.push(`${what}: "${l.slice(0, 70)}"`);
  ok('nothing invented: no ratings, sold counts, countdowns, made up reviews or unconfirmed promises', !hits.length, hits.length ? sample(hits, 4) : `${banned.length} kinds of claim looked for in ${lines.length} lines`);
}

await browser.close(); server.close();
try { rmSync(tmp, { recursive: true }); } catch { /* left for the next run */ }
const bad = R.filter(x => !x.pass);
console.log(`\n${R.length - bad.length} of ${R.length} checks passed.` + (bad.length ? '\nFAILED:\n  ' + bad.map(x => x.name).join('\n  ') : ''));
process.exit(bad.length ? 1 : 0);
