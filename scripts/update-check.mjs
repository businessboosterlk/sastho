#!/usr/bin/env node
/* AN INSTALLED APP KEEPS ITS FIRST COPY, unless it is made to look. This walks the whole path with the worker
   ON: open the shop, let the worker settle, publish a newer build beside it, bring the app back to the front,
   and read the stamp the person would read. It must be the new one, after ONE reload and no more.
     node scripts/update-check.mjs */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, cpSync, rmSync, mkdtempSync, readdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, extname } from 'node:path';
import { tmpdir } from 'node:os';

const root = mkdtempSync(join(tmpdir(), 'sastho-update-'));
cpSync('dist', join(root, 'a'), { recursive: true });
cpSync('dist', join(root, 'b'), { recursive: true });
/* build B is build A with a later stamp, in every file that carries one, the way a real build differs */
const A = JSON.parse(readFileSync('dist/version.json', 'utf8')).build, B = A.replace(/\d\d$/, m => String((+m + 1) % 60).padStart(2, '0')) + ' next';
/* a real build gives every changed script a new name, so the newer build here does too */
const walk = d => readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);
const swap = dir => {
  const base = join(root, dir), files = walk(base).filter(f => /\.(html|js|json)$/.test(f));
  const renamed = readdirSync(join(base, 'assets/app')).filter(f => f.endsWith('.js'));
  for (const f of files) {
    let t = readFileSync(f, 'utf8'); const was = t;
    t = t.split(A).join(B); for (const n of renamed) t = t.split(n).join(n.replace(/\.js$/, '.next.js'));
    if (f.endsWith('sw.js')) t = t.replace(/sastho-\d+/, 'sastho-999999');
    if (t !== was) writeFileSync(f, t);
  }
  for (const n of renamed) { const p = join(base, 'assets/app', n); writeFileSync(join(base, 'assets/app', n.replace(/\.js$/, '.next.js')), readFileSync(p)); rmSync(p); }
};
swap('b');
let live = 'a'; const asked = [];
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const server = createServer((req, res) => { const u = new URL(req.url, 'http://x'); let rel = u.pathname.replace(/^\/sastho\//, ''); if (!rel) rel = 'index.html'; asked.push(live + ' ' + rel); try { const body = readFileSync(join(root, live, rel)); res.writeHead(200, { 'Content-Type': TYPES[extname(rel)] || 'application/octet-stream', 'Cache-Control': 'max-age=600' }); res.end(body); } catch { res.writeHead(404); res.end('no'); } });
await new Promise(r => server.listen(4604, '127.0.0.1', r));
const browser = await chromium.launch({ channel: 'chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage(); let loads = 0; page.on('load', () => loads++);
const stamp = () => page.evaluate(() => window.Sastho && window.Sastho.BUILD);
await page.goto('http://localhost:4604/sastho/deals.html', { waitUntil: 'load' });
await page.waitForFunction(() => navigator.serviceWorker.controller || navigator.serviceWorker.ready.then(() => true)); await page.waitForTimeout(1500);
await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(800);
const controlled = await page.evaluate(() => !!navigator.serviceWorker.controller), first = await stamp();
live = 'b'; loads = 0;                                   /* the newer build is published */
/* the app goes to the back and comes to the front */
await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')); });
await page.waitForTimeout(3500);
const second = await stamp(), reloads = loads;
await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))); await page.waitForTimeout(2000);
const third = await stamp(), extra = loads - reloads;
const pass = controlled && first === A && second === B && reloads === 1 && third === B && extra === 0;
console.log((pass ? 'PASS' : 'FAIL') + `  an open app takes a newer build by itself: worker in control ${controlled}, stamp before ${first}, after coming to the front ${second} (wanted ${B}), reloads ${reloads}, reloads on the next look ${extra}`);
await browser.close(); server.close(); rmSync(root, { recursive: true });
process.exit(pass ? 0 : 1);
