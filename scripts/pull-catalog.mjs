// Pulls the whole published catalogue from the client's own store feed and keeps the raw answer.
// The store does not allow a browser on another site to read it, so this runs at build time.
// Usage: node scripts/pull-catalog.mjs      (writes data/store-raw.json)
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://sastho.lk/wp-json/wc/store/v1/products';
const PER = 100;

async function page(n) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const r = await fetch(`${API}?per_page=${PER}&page=${n}&orderby=date&order=desc`, {
        headers: { 'User-Agent': 'BusinessBooster-catalogue-pull/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(60000),
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return { rows: await r.json(), total: +r.headers.get('x-wp-total'), pages: +r.headers.get('x-wp-totalpages') };
    } catch (e) {
      console.log(`  page ${n} attempt ${attempt} failed: ${e.message}`);
      await new Promise(res => setTimeout(res, 1500 * attempt));
    }
  }
  throw new Error('page ' + n + ' never answered');
}

const first = await page(1);
let rows = first.rows;
console.log(`store says ${first.total} products on ${first.pages} pages`);
for (let n = 2; n <= first.pages; n++) {
  const p = await page(n);
  rows = rows.concat(p.rows);
  console.log(`  page ${n}: ${p.rows.length} rows, ${rows.length} so far`);
}
const ids = new Set(rows.map(r => r.id));
if (ids.size !== first.total) {
  console.log(`FAIL: store said ${first.total}, unique products read ${ids.size}`);
  process.exit(1);
}
writeFileSync(join(ROOT, 'data', 'store-raw.json'), JSON.stringify({ pulled: new Date().toISOString(), total: first.total, rows }));
console.log(`PASS: ${ids.size} of ${first.total} products read and saved`);
