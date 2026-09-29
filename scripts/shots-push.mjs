#!/usr/bin/env node
/* PHOTOGRAPHS OF THE SALES PUSH at four basket sizes, to be LOOKED at.  node scripts/shots-push.mjs [out] [width] */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { serve } from './serve.mjs';
const out = process.argv[2] || 'evidence/push', w = +(process.argv[3] || 390), phone = w < 700;
mkdirSync(out, { recursive: true });
const data = JSON.parse(readFileSync('src/data/products.json', 'utf8'));
const plain = data.products.filter(p => !p.options.length && p.images.length);
const near = v => plain.slice().sort((a, b) => Math.abs(a.price - v) - Math.abs(b.price - v))[0];
const BASKETS = { small: [[near(900), 1]], close: [[near(2200), 1]], mid: [[near(2000), 1], [near(1400), 1]], top: [[near(4500), 2]] };
const server = await serve(4605), browser = await chromium.launch({ channel: 'chromium' });
const ctx = await browser.newContext({ viewport: { width: w, height: phone ? 844 : 900 }, deviceScaleFactor: 2, isMobile: phone, hasTouch: phone, serviceWorkers: 'block' });
const page = await ctx.newPage(); const files = [];
const shot = async n => { const f = `${out}/.${n}.png`; await page.screenshot({ path: f }); files.push(f); };
for (const [name, lines] of Object.entries(BASKETS)) {
  await page.goto('http://localhost:4605/sastho/offline.html'); await page.evaluate(l => { localStorage.clear(); localStorage.setItem('sastho_install_hint', '1'); localStorage.setItem('sastho_cart_v2', JSON.stringify(l.map(([p, q]) => ({ id: p.id, qty: q, opt: '' })))); }, lines);
  await page.goto('http://localhost:4605/sastho/shop.html', { waitUntil: 'load' }); await page.waitForTimeout(700); await shot(name + '-1page');
  await page.evaluate(() => window.Sastho.open('cart')); await page.waitForTimeout(600); await shot(name + '-2basket');
  await page.evaluate(() => { const b = document.querySelector('#cart-body'); b.scrollTop = b.scrollHeight; }); await page.waitForTimeout(300); await shot(name + '-3basket-foot');
  await page.goBack(); await page.waitForTimeout(500);
  await page.goto('http://localhost:4605/sastho/p/' + near(700).slug + '.html', { waitUntil: 'load' }); await page.waitForTimeout(700); await page.evaluate(() => window.scrollTo(0, 420)); await page.waitForTimeout(300); await shot(name + '-4product');
}
await page.goto('http://localhost:4605/sastho/index.html', { waitUntil: 'load' }); await page.waitForTimeout(500);
await page.evaluate(() => document.querySelector('.goalband').scrollIntoView({ block: 'center' })); await page.waitForTimeout(400); await shot('z-band');
for (let i = 0, s = 0; i < files.length; i += 4, s++) execFileSync('magick', [...files.slice(i, i + 4), '-bordercolor', '#d0d0d0', '-border', '2', '+append', '-resize', '50%', `${out}/push-${w}-${s}.png`]);
await browser.close(); server.close(); console.log('photographed', files.length);
