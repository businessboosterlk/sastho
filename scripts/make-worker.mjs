#!/usr/bin/env node
/* THE WORKER, written after the build because it must name the built files.
   Rules, from ~/bb-websites/bb-client-library/sw.js and the no-cache navigations lesson:
     pages        network first with cache:'no-cache', the copy on the phone only when there is no connection.
                  GitHub Pages serves max-age=600, so a plain fetch is answered by the HTTP cache and a
                  deploy takes ten minutes to reach anybody.
     version.json never cached. It is how an installed app learns there is a newer build.
     the shell    the stylesheet, the scripts, the icons, the fonts, the catalogue and the logo are kept
                  on the phone, so the shop opens at once and opens with no connection.
     photographs  product photographs come from sastho.lk and are left to the browser's own cache.
   node scripts/make-worker.mjs */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const DIST = 'dist';
if (!existsSync(DIST)) { console.error('FAIL  no dist folder. Build first.'); process.exit(1); }
const build = JSON.parse(readFileSync(join(DIST, 'version.json'), 'utf8')).build;
const walk = d => readdirSync(d).flatMap(f => { const q = join(d, f); return statSync(q).isDirectory() ? walk(q) : [q]; });
const all = walk(DIST).map(f => f.slice(DIST.length + 1));
const PAGES = ['index.html', 'shop.html', 'deals.html', 'build.html', 'about.html', 'contact.html', 'faq.html', 'offline.html'];
const shell = [
  ...PAGES.filter(p => all.includes(p)),
  ...all.filter(f => /^assets\/app\//.test(f)),
  ...all.filter(f => /^assets\/fonts\//.test(f)),
  'assets/icons.svg', 'assets/catalog.js', 'assets/logo.png', 'assets/logo-light.png', 'manifest.json', 'icon-192.png',
].filter(f => all.includes(f));
const missing = PAGES.filter(p => !all.includes(p));
if (missing.length) { console.error('FAIL  pages missing from the build: ' + missing.join(', ')); process.exit(1); }
const src = `/* WRITTEN BY scripts/make-worker.mjs FOR BUILD ${build}. NEVER EDIT BY HAND. */
const C = 'sastho-${build.replace(/[^0-9]/g, '')}';
const SHELL = ${JSON.stringify(shell.map(f => './' + f))};
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('sastho-') && k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return;                 /* photographs and WhatsApp are not ours to keep */
  if (u.pathname.endsWith('/version.json')) return;              /* always the live one */
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r, { cache: 'no-cache' }).then(res => {
      if (res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); }
      return res;
    }).catch(() => caches.match(r, { ignoreSearch: true }).then(hit => hit || caches.match('./offline.html'))));
    return;
  }
  e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => {
    if (res.ok && /\\/assets\\//.test(u.pathname)) { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); }
    return res;
  })));
});
`;
writeFileSync(join(DIST, 'sw.js'), src);
console.log(`PASS  worker written for build ${build}: ${shell.length} files kept on the phone`);
