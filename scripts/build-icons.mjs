// EVERY ICON ON THIS SITE COMES FROM A LICENSED ICON SET. NOBODY DRAWS ONE BY HAND.
//   line icons   Lucide (ISC licence), via the lucide-static package
//   brand marks  Simple Icons (CC0), the companies' own glyphs, via the simple-icons package
// Writes src/data/icons.json (the record) and public/assets/icons.svg (the one sprite every page and
// script draws from). `--check` fails if either file differs from what the packages produce, which is
// how the gate proves no icon was edited or added by hand.
//   node scripts/build-icons.mjs          write
//   node scripts/build-icons.mjs --check  verify (run by check-site.mjs)
// The worked example this follows is ~/bb-websites/bswl/scripts/build-icons.mjs.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

const LINE = {                      // our name        Lucide's file
  menu: 'menu', close: 'x', search: 'search', heart: 'heart', cart: 'shopping-cart', bag: 'shopping-bag',
  home: 'house', store: 'store', tag: 'tag', zap: 'zap', sparkles: 'sparkles', wand: 'wand-sparkles',
  plus: 'plus', minus: 'minus', check: 'check', arrow: 'arrow-right', back: 'arrow-left',
  down: 'chevron-down', right: 'chevron-right', left: 'chevron-left',
  truck: 'truck', cash: 'banknote', shield: 'shield-check', returns: 'undo-2', chat: 'message-circle',
  phone: 'phone', pin: 'map-pin', clock: 'clock', trash: 'trash-2', share: 'share', download: 'download',
  device: 'smartphone', filters: 'sliders-horizontal', grid: 'layout-grid', list: 'list', eye: 'eye',
  sort: 'arrow-up-down', info: 'info', external: 'external-link', building: 'building-2', help: 'circle-help',
  pencil: 'pencil', navigation: 'navigation', addbox: 'square-plus', offline: 'wifi-off', box: 'package',
  boxcheck: 'package-check', refresh: 'refresh-cw',
  // shelves and rooms
  utensils: 'utensils', cup: 'coffee', pot: 'cooking-pot', tools: 'utensils-crossed', lamp: 'lamp',
  sofa: 'sofa', bath: 'bath', bed: 'bed-double', desk: 'monitor', armchair: 'armchair',
};
const BRAND = { whatsapp: 'whatsapp', instagram: 'instagram', facebook: 'facebook' };

const inner = svg => svg.replace(/<!--[\s\S]*?-->/g, '').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/\s*\n\s*/g, '').trim();
const ver = p => JSON.parse(readFileSync(`node_modules/${p}/package.json`, 'utf8')).version;
const out = { _source: { line: 'lucide-static ' + ver('lucide-static') + ' (ISC)', brand: 'simple-icons ' + ver('simple-icons') + ' (CC0-1.0)' }, line: {}, brand: {} };
for (const [k, f] of Object.entries(LINE)) out.line[k] = inner(readFileSync(`node_modules/lucide-static/icons/${f}.svg`, 'utf8'));
for (const [k, f] of Object.entries(BRAND)) out.brand[k] = inner(readFileSync(`node_modules/simple-icons/icons/${f}.svg`, 'utf8')).replace(/<title>.*?<\/title>/, '');

const json = JSON.stringify(out, null, 1) + '\n';
// The sprite. Colour, weight and line ends are set in CSS on the element that uses a symbol (.ic), so
// one file serves every size and every ground.
const sprite = '<!-- Built by scripts/build-icons.mjs from ' + out._source.line + ' and ' + out._source.brand + '. Do not edit by hand. -->\n'
  + '<svg xmlns="http://www.w3.org/2000/svg">\n'
  + Object.entries(out.line).map(([k, v]) => `<symbol id="${k}" viewBox="0 0 24 24">${v}</symbol>`).join('\n') + '\n'
  + Object.entries(out.brand).map(([k, v]) => `<symbol id="b-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('\n') + '\n</svg>\n';

const J = 'src/data/icons.json', S = 'public/assets/icons.svg';
if (process.argv.includes('--check')) {
  const bad = [[J, json], [S, sprite]].filter(([f, want]) => !existsSync(f) || readFileSync(f, 'utf8') !== want).map(([f]) => f);
  if (bad.length) { console.error('FAIL  ' + bad.join(' and ') + ' do not match the icon packages. An icon was edited by hand, or the packages changed. Run: npm run icons'); process.exit(1); }
  console.log('PASS  icons match the packages: ' + Object.keys(out.line).length + ' line, ' + Object.keys(out.brand).length + ' brand');
} else {
  mkdirSync('src/data', { recursive: true }); mkdirSync('public/assets', { recursive: true });
  writeFileSync(J, json); writeFileSync(S, sprite);
  console.log('wrote ' + J + ' and ' + S + ': ' + Object.keys(out.line).length + ' line, ' + Object.keys(out.brand).length + ' brand');
}
