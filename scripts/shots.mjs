#!/usr/bin/env node
/* PHOTOGRAPHS OF EVERY PAGE, to be LOOKED AT. A check finds what it was told to look for, the eye finds
   the rest. Each page is walked one screen at a time, the way a thumb walks it, so the bars that stay on
   screen are photographed where they really sit. One contact sheet per page and width.
     node scripts/shots.mjs <out folder> [widths, default 390,320,1440] [pages, default all] */
import { chromium } from 'playwright';
import { mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { serve } from './serve.mjs';
const out = process.argv[2] || 'evidence/shots';
const widths = (process.argv[3] || '390,320,1440').split(',').map(Number);
export const PAGES = { index: 'index.html', shop: 'shop.html', deals: 'deals.html', build: 'build.html', about: 'about.html', contact: 'contact.html', faq: 'faq.html', notfound: 'nothing-here.html', product: 'p/multi-purpose-trigger-spray-bottle.html' };
const only = process.argv[4] ? process.argv[4].split(',') : Object.keys(PAGES);
mkdirSync(out, { recursive: true });
const server = await serve(4601);
const browser = await chromium.launch({ channel: 'chromium' });
for (const w of widths) {
  const phone = w < 700, vh = phone ? 844 : 900;
  const ctx = await browser.newContext({ viewport: { width: w, height: vh }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone, hasTouch: phone, serviceWorkers: 'block' });
  for (const k of only) {
    const page = await ctx.newPage(); const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !(k === 'notfound' && /404/.test(m.text()))) errs.push(m.text()); });
    await page.goto('http://localhost:4601/sastho/' + PAGES[k], { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    const step = vh - (phone ? 150 : 100), files = [];
    for (let y = 0, n = 0; y < h - 40 && n < 24; y += step, n++) {
      await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(260);
      const f = `${out}/.${k}-${w}-${String(n).padStart(2, '0')}.png`; await page.screenshot({ path: f }); files.push(f);
    }
    const per = phone ? 4 : 2;
    for (let i = 0, s = 0; i < files.length; i += per, s++) {
      execFileSync('magick', [...files.slice(i, i + per), '-bordercolor', '#d0d0d0', '-border', '2', '+append', '-resize', phone ? '50%' : '60%', `${out}/${k}-${w}-${s}.png`]);
    }
    files.forEach(f => rmSync(f));
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    console.log(`${k.padEnd(9)} ${String(w).padStart(4)}  height ${String(h).padStart(6)}  screens ${String(files.length).padStart(2)}  scroll width ${sw}${sw > w ? '  SIDEWAYS SCROLL' : ''}${errs.length ? '  ERRORS: ' + errs.slice(0, 3).join(' | ') : ''}`);
    await page.close();
  }
  await ctx.close();
}
await browser.close(); server.close();
