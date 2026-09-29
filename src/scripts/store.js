// WHAT THE PHONE REMEMBERS. The basket, the saved list and the delivery details live on the device only.
// Nothing here is sent anywhere. An order leaves the phone as a WhatsApp message the shopper sends themselves.
import { shape } from './card.js';
import { SITE } from '../config.js';

const K = { cart: 'sastho_cart_v2', saved: 'sastho_saved_v2', me: 'sastho_me_v1', hint: 'sastho_install_hint', offer: 'sastho_app_offer_v1', seen: 'sastho_seen_offers_v1', hello: 'sastho_app_hello_v1' };

/* Private browsing and a full disk both refuse storage. The shop must still work for the visit. */
const mem = {};
const read = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : (k in mem ? mem[k] : d); } catch { return k in mem ? mem[k] : d; } };
const write = (k, v) => { mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* kept for this visit only */ } };

const C = window.SASTHO_CATALOG || { meta: {}, shelves: [], products: [] };
export const META = C.meta;
export const SHELVES = C.shelves;
export const PRODUCTS = C.products.map(shape);
const BY = new Map(PRODUCTS.map(p => [p.id, p]));
export const find = id => BY.get(+id);
export const shelfLabel = key => (SHELVES.find(s => s.key === key) || {}).label || '';

/* The first build kept two baskets under different names and never joined them. Read them once,
   keep what is still sold, then leave the old keys alone so nothing is lost if this build is rolled back. */
function firstRun() {
  try {
    if (localStorage.getItem(K.cart) === null) {
      const old = JSON.parse(localStorage.getItem('sastho_cart') || '[]');
      write(K.cart, old.filter(l => l && find(l.id)).map(l => ({ id: +l.id, qty: Math.max(1, Math.min(99, +l.qty || 1)), opt: '' })));
    }
    if (localStorage.getItem(K.saved) === null) {
      const a = JSON.parse(localStorage.getItem('sastho_favs') || '[]'), b = JSON.parse(localStorage.getItem('sastho_fav') || '[]');
      write(K.saved, [...new Set([...a, ...b].map(Number))].filter(id => find(id)));
    }
  } catch { /* nothing to bring across */ }
}
firstRun();

const listeners = new Set();
export const onChange = fn => { listeners.add(fn); return () => listeners.delete(fn); };
const tell = what => listeners.forEach(fn => { try { fn(what); } catch (e) { console.error(e); } });
/* another tab of the shop changed the basket: this one follows */
window.addEventListener('storage', e => { if (e.key === K.cart) tell('cart'); if (e.key === K.saved) tell('saved'); });

export const cart = {
  lines() { return read(K.cart, []).filter(l => find(l.id)); },
  count() { return this.lines().reduce((n, l) => n + l.qty, 0); },
  add(id, qty = 1, opt = '') {
    if (!find(id)) return false;
    const lines = this.lines(), hit = lines.find(l => l.id === +id && (l.opt || '') === opt);
    if (hit) hit.qty = Math.min(99, hit.qty + qty); else lines.push({ id: +id, qty: Math.max(1, Math.min(99, qty)), opt });
    write(K.cart, lines); tell('cart'); return true;
  },
  set(id, opt, qty) {
    let lines = this.lines();
    const hit = lines.find(l => l.id === +id && (l.opt || '') === (opt || ''));
    if (!hit) return;
    if (qty <= 0) lines = lines.filter(l => l !== hit); else hit.qty = Math.min(99, qty);
    write(K.cart, lines); tell('cart');
  },
  remove(id, opt) { this.set(id, opt, 0); },
  clear() { write(K.cart, []); tell('cart'); },
  totals() {
    let items = 0, regular = 0;
    for (const l of this.lines()) { const p = find(l.id); items += p.price * l.qty; regular += p.reg * l.qty; }
    return { items, saved: regular - items, count: this.count() };
  },
};

export const saved = {
  ids() { return read(K.saved, []).filter(id => find(id)); },
  has(id) { return this.ids().includes(+id); },
  toggle(id) {
    const ids = this.ids(), i = ids.indexOf(+id);
    if (i > -1) ids.splice(i, 1); else ids.unshift(+id);
    write(K.saved, ids); tell('saved'); return i === -1;
  },
};

export const me = {
  get() { return read(K.me, null); },
  set(v) { write(K.me, v); tell('me'); },
  clear() { write(K.me, null); tell('me'); },
};

export const hint = { seen: () => !!read(K.hint, 0), dismiss: () => write(K.hint, 1) };

/* ───────── the app offer and the sale marks ───────── */
/* installed means opened from the Home Screen: full screen, no browser bar. The phone says so itself. */
export const installed = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const O = SITE.appOffer || { on: false };
export const offer = {
  on: !!O.on, percent: O.percent || 0, code: O.code || '', covers: O.covers || '',
  used() { return !!read(K.offer, 0); },
  /* open to this phone: the offer is running, the shop is installed and the first order has not gone yet */
  open() { return this.on && installed() && !this.used(); },
  /* still to be earned: the offer is running and the shop is not installed on this phone */
  waiting() { return this.on && !installed() && !this.used(); },
  amount(items) { return this.open() ? Math.round(items * this.percent / 100) : 0; },
  spend() { write(K.offer, 1); tell('offer'); },
};
export const hello = { due: () => installed() && !read(K.hello, 0), done: () => write(K.hello, 1) };
/* which offers this phone has already been shown, so the Deals tab can mark the new ones */
const SALE = PRODUCTS.filter(p => p.reg > p.price).map(p => p.id);
export const offers = {
  all: () => SALE,
  fresh() { const seen = read(K.seen, null); return seen === null ? [] : SALE.filter(id => !seen.includes(id)); },
  firstVisit: () => read(K.seen, null) === null,
  markSeen() { write(K.seen, SALE); tell('offers'); },
};

/* ───────── the basket ladder: add this much more, get this much off ───────── */
const G = SITE.basketGoals || { on: false, tiers: [] };
const TIERS = (G.on ? G.tiers : []).slice().sort((a, b) => a.spend - b.spend);
export const goals = {
  on: TIERS.length > 0, tiers: TIERS, covers: G.covers || '',
  reached: items => TIERS.filter(t => items >= t.spend).pop() || null,
  next: items => TIERS.find(t => items < t.spend) || null,
};
/* OFFERS NEVER STACK. The basket takes the better of the two, and says which one it took. */
export function best(items) {
  const app = offer.open() ? offer.percent : 0, g = goals.reached(items), lad = g ? g.percent : 0;
  if (!app && !lad) return { kind: '', percent: 0, amount: 0, label: '', note: '' };
  return app >= lad
    ? { kind: 'app', percent: app, amount: Math.round(items * app / 100), label: `App offer, ${app}% off your first order`, note: offer.covers, code: offer.code }
    : { kind: 'goal', percent: lad, amount: Math.round(items * lad / 100), label: `Basket offer, ${lad}% off`, note: goals.covers, spend: g.spend };
}
/* what to say to push the basket on: how far the next step is and what it is worth */
export function push(items) {
  const b = best(items), n = goals.tiers.find(t => items < t.spend && t.percent > b.percent) || null;
  return { have: b, next: n, gap: n ? n.spend - items : 0, part: n ? Math.max(0.04, Math.min(1, items / n.spend)) : 1 };
}
/* products that close the gap in one tap: no options to choose, from the shelves already in the basket first */
export function reach(gap, n = 4) {
  const inside = new Set(cart.lines().map(l => l.id)), shelves = new Set(cart.lines().map(l => find(l.id).shelf));
  const pool = PRODUCTS.filter(p => !inside.has(p.id) && !p.options && p.stock && p.thumb);
  if (!(gap > 0)) return pool.filter(p => shelves.has(p.shelf)).slice(0, n);
  /* the nearest price at or over the gap comes first, then the nearest under it. Nothing dearer than three gaps. */
  const score = p => (p.price >= gap ? p.price - gap : (gap - p.price) * 1.6) + (shelves.has(p.shelf) ? 0 : gap * 0.35);
  return pool.filter(p => p.price <= Math.max(gap * 3, gap + 600)).sort((a, b) => score(a) - score(b)).slice(0, n);
}
