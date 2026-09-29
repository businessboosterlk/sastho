// Turns the raw store answer (data/store-raw.json, written by pull-catalog.mjs) into the two files the site reads:
//   src/data/products.json   every product in full, read by Astro at build time to print one page per product
//   public/assets/catalog.js the short list the browser needs for search, the shop grid, the cart and the quiz
// NOTHING HERE IS INVENTED. Name, price, regular price, photographs, categories and the words on each product page are
// the client's own, read from sastho.lk. The store holds no ratings, no review counts and no sold counts, so the site
// prints none. A product is "on sale" only when the store says its price is below its regular price.
//   node scripts/build-catalog.mjs
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

const RAW = 'data/store-raw.json';
if (!existsSync(RAW)) { console.error('FAIL: ' + RAW + ' is missing. Run: npm run pull'); process.exit(1); }
const raw = JSON.parse(readFileSync(RAW, 'utf8'));

// THE SHELVES. The store carries 204 categories, many with one or two products, so the site groups them into shelves a
// shopper can hold in their head. A product sits on the FIRST shelf whose words match one of its store categories, so the
// order of this list is the rule. The name is read before the categories. Counts are worked out from the data and never typed.
const SHELVES = [
  { key: 'lighting',  label: 'Lamps and clocks',    icon: 'lamp',     name: /\b(lamp|lantern|night light|led light|string light|fairy light|clock|candle)\b/i, cat: /lamp|clock|lighting/ },
  { key: 'cleaning',  label: 'Cleaning and bath',   icon: 'sparkles', name: /\b(clean\w*|sponge|scrub\w*|scouring|brush|mop|broom|duster|dustbin|trash|waste|laundry|soap|toilet|bath\w*|shower|towel|tissue|lint|squeegee|wiper|spray bottle)\b/i, cat: /clean|laundry|bathroom|soap|dustbin|sponge|brush/ },
  { key: 'cookware',  label: 'Cookware and baking', icon: 'pot',      name: /\b(pan|pans|pot|wok|casserole|cooker|kadai|steamer|bak\w*|cake|icing|piping|mould|mold|foil|oven|pastry|muffin|cookie|whisk|rolling pin)\b/i, cat: /cookware|fry-pan|baking|bakeware|mould/ },
  { key: 'tableware', label: 'Tableware',           icon: 'utensils', name: /\b(plate\w*|bowl\w*|platter|dish|dishes|saucer|tray|placemat\w*|coaster\w*|napkin|cutlery|fork\w*|chopstick\w*|dinner|serving|table mat|table runner)\b/i, cat: /tableware|plate|placemat|napkin|dining|cutlery/ },
  { key: 'storage',   label: 'Storage',             icon: 'box',      name: /\b(storage|container\w*|jar|jars|canister|organi[sz]er\w*|rack|shelf|basket|box|boxes|dispenser|holder|stand|hanger|hook\w*|drawer|caddy|bag|bags|clip\w*)\b/i, cat: /storage|container|jar|organi[sz]|rack|basket|compartment|lunch-box|bagclip|zipper/ },
  { key: 'drinkware', label: 'Drinkware',           icon: 'cup',      name: /\b(mug\w*|cup|cups|glass|glasses|stemware|tumbler\w*|goblet|bottle|flask|jug|pitcher|kettle|teapot|tea pot|shaker|straw\w*|decanter|carafe|water set)\b/i, cat: /drinkware|glassware|tumbler|drink-glass|glass-mugs|teacoffee|wine-glass|waterbottle/ },
  { key: 'tools',     label: 'Kitchen tools',       icon: 'tools',    name: /\b(spoon\w*|knife|knives|peeler|grater|slicer|chopper|cutter|scissors|strainer|skimmer|ladle|spatula|tong\w*|masher|opener|trivet|glove\w*|scale|timer|grinder|frother|blender|juicer|squeezer|sharpener|cutting board|chopping board|sealer|mat)\b/i, cat: /kitchen-tools|utensil|spoon|knife|grater|strainer|glove|kitchen-accessories|kitchen-essentials|kitchen-appliances/ },
  { key: 'decor',     label: 'Home and decor',      icon: 'home',     name: /\b(vase|ornament\w*|decor\w*|frame|mirror|carpet|rug|cushion|curtain|wall art|planter|flower\w*|diffuser|incense|figurine|statue)\b/i, cat: /decor|vase|ornament|wallart|carpet|aromatherapy|home-living|home-essentials|home-office|home-outdoor/ },
];
const OTHER = { key: 'more', label: 'More finds', icon: 'tag' };

const un = s => String(s || '')
  .replace(/&amp;/g, '&').replace(/&#8211;|&ndash;/g, '-').replace(/&#8212;|&mdash;/g, ', ').replace(/&#8217;|&#8216;|&rsquo;|&lsquo;/g, "'")
  .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;|&quot;/g, '"').replace(/&#215;|&times;/g, 'x').replace(/&nbsp;|&#160;/g, ' ')
  .replace(/&#8230;|&hellip;/g, '...').replace(/&#038;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
// The client types long dashes in product names. House style prints none, so a dash between words becomes a comma and
// a dash between numbers becomes "to". The words themselves are never changed.
const tidy = s => un(s).replace(/(\d)\s*[–—]\s*(\d)/g, '$1 to $2').replace(/\s*[–—]\s*/g, ', ').replace(/\s+/g, ' ').replace(/\s+,/g, ',').trim();
// Product descriptions arrive as HTML from the store's editor. Keep paragraphs and list items as plain lines of text.
const lines = html => un(String(html || '')
  .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
  .replace(/<\/(p|div|h[1-6]|li|tr)>|<br\s*\/?>/gi, '\n')
  .replace(/<li[^>]*>/gi, '• ')
  .replace(/<[^>]+>/g, ''))
  .split('\n').map(l => tidy(l).replace(/^[••\-\*✔✅✓▪️●]+\s*/u, m => m.includes('•') || /[✔✅✓▪●]/u.test(m) ? '• ' : '')).filter(l => l && l !== '•');
// Emoji and pictographs in product copy read as decoration on a storefront. Dropped from display, words kept.
const plain = s => s.replace(/[\p{Extended_Pictographic}️‍]/gu, '').replace(/\s+/g, ' ').trim();

const UP = 'https://sastho.lk/wp-content/uploads/';
const rel = u => (u && u.startsWith(UP)) ? u.slice(UP.length) : (u || '');
const rupees = (minor, unit) => Math.round(+minor / Math.pow(10, unit));

const seen = new Set(), products = [];
for (const r of raw.rows) {
  if (!r.is_purchasable || r.is_password_protected) continue;
  const slugs = r.categories.map(c => c.slug);
  const hay = slugs.filter(s => !/^below-rs|^all$/.test(s)).join(' ');
  // The product's own name decides first, because the store files many products under several loose categories.
  const shelf = (SHELVES.find(s => s.name.test(un(r.name))) || SHELVES.find(s => s.cat.test(hay)) || OTHER).key;
  const unit = r.prices.currency_minor_unit;
  const price = rupees(r.prices.price, unit), reg = rupees(r.prices.regular_price, unit);
  let slug = r.slug; if (seen.has(slug)) slug = slug + '-' + r.id; seen.add(slug);
  const range = r.prices.price_range ? { min: rupees(r.prices.price_range.min_amount, unit), max: rupees(r.prices.price_range.max_amount, unit) } : null;
  products.push({
    id: r.id, slug, name: plain(tidy(r.name)), shelf, price, reg: reg > price ? reg : price, sale: reg > price,
    range, stock: !!r.is_in_stock, sku: r.sku || '',
    cats: r.categories.map(c => un(c.name)).filter(n => !/^All$/i.test(n)),
    images: r.images.map(i => ({ src: rel(i.src), thumb: rel(i.thumbnail), alt: tidy(i.alt || '') })),
    options: (r.attributes || []).filter(a => a.has_variations).map(a => ({ name: tidy(a.name), terms: a.terms.map(t => tidy(t.name)) })),
    short: lines(r.short_description).map(plain).filter(Boolean),
    desc: lines(r.description).map(plain).filter(Boolean),
    link: r.permalink,
  });
}
products.sort((a, b) => b.id - a.id); // the store numbers products as it adds them, so newest first

const shelves = [...SHELVES, OTHER].map(s => ({ key: s.key, label: s.label, icon: s.icon, count: products.filter(p => p.shelf === s.key).length })).filter(s => s.count);
const meta = { pulled: raw.pulled, storeTotal: raw.total, count: products.length, onSale: products.filter(p => p.sale).length, uploads: UP };

mkdirSync('src/data', { recursive: true }); mkdirSync('public/assets', { recursive: true });
writeFileSync('src/data/products.json', JSON.stringify({ meta, shelves, products }));
// Short list for the browser. One letter keys because 701 rows travel to every phone.
const short = products.map(p => ({ i: p.id, s: p.slug, n: p.name, h: p.shelf, p: p.price, r: p.reg, t: p.images[0] ? p.images[0].thumb : '', g: p.images[0] ? p.images[0].src : '', o: p.options.length ? p.options.map(o => [o.name, o.terms]) : 0, k: p.stock ? 1 : 0, f: p.range && p.range.max > p.range.min ? 1 : 0 }));
writeFileSync('public/assets/catalog.js', '/* Built by scripts/build-catalog.mjs from sastho.lk. Do not edit by hand. */\nwindow.SASTHO_CATALOG=' + JSON.stringify({ meta, shelves, products: short }) + ';\n');
console.log(`PASS: ${products.length} products from a store total of ${raw.total}; ${meta.onSale} on sale; shelves ` + shelves.map(s => s.key + ' ' + s.count).join(', '));
