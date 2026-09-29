#!/usr/bin/env node
/* THE BUILD STAMP. An installed app keeps its first copy, so every build carries a stamp in the app
   (src/scripts/build.js) and the same stamp in a small file beside it (public/version.json). The app
   reads the small file when it opens and when it comes back to the front, then reloads itself once when
   the two differ. Both files are written together, here, and published together.
   Follows ~/bb-systems/bb-client-os/scripts/stamp.mjs.
     node scripts/stamp.mjs            write a new stamp (Colombo time)
     node scripts/stamp.mjs --check    exit 1 when the two files disagree, or the built site disagrees */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const JS = 'src/scripts/build.js', JSON_ = 'public/version.json', DIST = 'dist/version.json';
if (process.argv.includes('--check')) {
  const a = (readFileSync(JS, 'utf8').match(/BUILD = '([^']+)'/) || [])[1], b = JSON.parse(readFileSync(JSON_, 'utf8')).build;
  const c = existsSync(DIST) ? JSON.parse(readFileSync(DIST, 'utf8')).build : b;
  if (!a || a !== b || a !== c) { console.error(`FAIL  build stamps disagree: app ${a}, version file ${b}, built site ${c}`); process.exit(1); }
  console.log('PASS  one build stamp in the app, the version file and the built site: ' + a); process.exit(0);
}
const d = new Date(Date.now() + 5.5 * 3600e3).toISOString();   /* Colombo is UTC+5:30 */
const stamp = process.argv[2] && !process.argv[2].startsWith('-') ? process.argv[2] : d.slice(0, 10) + ' ' + d.slice(11, 16);
writeFileSync(JS, `/* WRITTEN BY scripts/stamp.mjs. NEVER EDIT BY HAND. */\nexport const BUILD = '${stamp}';\n`);
writeFileSync(JSON_, JSON.stringify({ build: stamp }) + '\n');
console.log('stamped ' + stamp);
