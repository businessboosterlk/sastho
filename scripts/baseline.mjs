// BASELINE: what a phone sees on every page, measured. Read only, changes nothing.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('/Users/thulaibhassen/bb-systems/batch/node_modules/playwright');
const OUT = process.argv[2] || '/tmp/sastho-before';
const BASE = process.argv[3] || 'http://localhost:4599';
const PAGES = ['index','shop','product','deals','build','about','contact','faq','404'];
const b = await chromium.launch();
const ctx = await b.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 } });
const rows = [];
for (const p of PAGES) {
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(String(e.message).slice(0, 90)));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 90)); });
  await page.goto(`${BASE}/${p}.html${p==='product'?'?id=1':''}`, { waitUntil: 'load' });
  await page.waitForTimeout(900);
  const m = await page.evaluate(() => {
    const vis = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0.05; };
    const taps = [...document.querySelectorAll('a,button,[role=button],input,select,textarea,[onclick]')].filter(vis);
    const small = taps.filter(e => { const r = e.getBoundingClientRect(); return Math.min(r.width, r.height) < 40; });
    const fields = [...document.querySelectorAll('input,select,textarea')];
    const tiny = fields.filter(e => parseFloat(getComputedStyle(e).fontSize) < 16);
    const texts = [...document.querySelectorAll('body *')].filter(e => vis(e) && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1));
    const under11 = texts.filter(e => parseFloat(getComputedStyle(e).fontSize) < 11);
    const off = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return vis(e) && r.right > innerWidth + 1 && getComputedStyle(e).position !== 'fixed'; });
    const fixed = [...document.querySelectorAll('body *')].filter(e => vis(e) && ['fixed','sticky'].includes(getComputedStyle(e).position)).map(e => (e.className || e.tagName).toString().slice(0, 28) + ':' + getComputedStyle(e).position);
    let hoverOutside = 0; for (const s of document.styleSheets) { try { for (const r of s.cssRules) if (r.selectorText && /:hover/.test(r.selectorText)) hoverOutside++; } catch (e) {} }
    return { taps: taps.length, small: small.length, smallSample: small.slice(0, 4).map(e => (e.textContent.trim().slice(0, 18) || e.className || e.tagName) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)),
      fields: fields.length, tinyFields: tiny.length, under11: under11.length, offRight: off.length, scrollW: document.documentElement.scrollWidth, fixed, hoverOutside,
      height: document.documentElement.scrollHeight, imgs: document.images.length, broken: [...document.images].filter(i => i.complete && !i.naturalWidth).length, lazy: [...document.images].filter(i => i.loading === 'lazy').length };
  });
  await page.screenshot({ path: `${OUT}/${p}-top.png` });
  await page.screenshot({ path: `${OUT}/${p}-full.png`, fullPage: true });
  rows.push({ p, ...m, errs });
  await page.close();
}
console.log('page      taps small<40  fields <16px  text<11  offRight scrollW  hover  height  imgs lazy broken  errors');
for (const r of rows) console.log(r.p.padEnd(9), String(r.taps).padStart(4), String(r.small).padStart(8), String(r.fields).padStart(7), String(r.tinyFields).padStart(5), String(r.under11).padStart(8), String(r.offRight).padStart(9), String(r.scrollW).padStart(7), String(r.hoverOutside).padStart(6), String(r.height).padStart(7), String(r.imgs).padStart(5), String(r.lazy).padStart(4), String(r.broken).padStart(6), ' ', r.errs.length ? r.errs.slice(0,2).join(' | ') : 'none');
console.log('\nfixed/sticky chrome on index:', rows[0].fixed.join(', '));
console.log('small tap samples on index:', rows[0].smallSample.join(' | '));
await b.close();
