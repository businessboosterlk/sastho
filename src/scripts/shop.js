// THE SHOP LIST. Every filter lives in the address, so a link from the home page opens the shop already
// filtered, a refresh keeps the list and the Back button returns to the list a person left.
import { cardHTML } from './card.js';
import { PRODUCTS, shelfLabel } from './store.js';
import { search, hearts } from './app.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const PAGE = 24;
const SORT = { new: (a, b) => b.id - a.id, low: (a, b) => a.price - b.price || b.id - a.id, high: (a, b) => b.price - a.price || b.id - a.id, az: (a, b) => a.name.localeCompare(b.name) };
const state = { shelf: '', price: '', sort: 'new', sale: false, q: '', shown: PAGE };

function fromAddress() {
  const u = new URLSearchParams(location.search);
  state.shelf = u.get('shelf') || ''; state.price = u.get('price') || ''; state.sort = SORT[u.get('sort')] ? u.get('sort') : 'new';
  state.sale = u.get('offer') === '1'; state.q = (u.get('q') || '').trim(); state.shown = Math.max(PAGE, +(u.get('n') || PAGE));
}
function toAddress() {
  const u = new URLSearchParams();
  if (state.shelf) u.set('shelf', state.shelf); if (state.price) u.set('price', state.price); if (state.sort !== 'new') u.set('sort', state.sort);
  if (state.sale) u.set('offer', '1'); if (state.q) u.set('q', state.q); if (state.shown > PAGE) u.set('n', String(state.shown));
  const s = u.toString();
  history.replaceState(history.state, '', location.pathname + (s ? '?' + s : ''));
}
function list() {
  let out = state.q.length >= 2 ? search(state.q, 1000) : PRODUCTS.slice();
  if (state.shelf) out = out.filter(p => p.shelf === state.shelf);
  if (state.price) { const [lo, hi] = state.price.split('-'); out = out.filter(p => p.price >= +lo && (hi === '' || hi === undefined || p.price <= +hi)); }
  if (state.sale) out = out.filter(p => p.reg > p.price);
  /* a search keeps its own order, best match first, unless a person asks for another */
  if (!(state.q.length >= 2 && state.sort === 'new')) out.sort(SORT[state.sort]);
  return out;
}
const active = () => (state.price ? 1 : 0) + (state.sort !== 'new' ? 1 : 0) + (state.sale ? 1 : 0);
const any = () => !!(state.shelf || state.price || state.sale || state.q || state.sort !== 'new');

function paint() {
  const all = list(), show = all.slice(0, state.shown);
  $('#shop-grid').innerHTML = show.length
    ? show.map((p, i) => cardHTML(p, shelfLabel(p.shelf), i < 4)).join('')
    : `<div class="empty"><strong>Nothing matches those filters</strong>Try a wider price, another shelf or a shorter search.<br><button class="btn dark sm" type="button" id="empty-clear">Clear filters</button></div>`;
  hearts($('#shop-grid'));
  $('#f-line').textContent = all.length ? `Showing ${show.length} of ${all.length} product${all.length === 1 ? '' : 's'}` : 'No products match';
  marks(all, show);
  toAddress();
}
/* what is chosen is always shown as chosen, on the first screen too */
function marks(all = list(), show = all.slice(0, state.shown)) {
  $('#shop-more').hidden = show.length >= all.length;
  $('#shop-more').textContent = `Show ${Math.min(PAGE, all.length - show.length)} more`;
  $('#f-clear').hidden = !any();
  $('#s-show').textContent = all.length ? `Show ${all.length} product${all.length === 1 ? '' : 's'}` : 'No products match';
  const n = active(), c = $('#f-count'); c.hidden = !n; c.textContent = String(n);
  $$('#f-shelves .chip').forEach(b => { const on = b.dataset.shelf === state.shelf; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
  $$('#s-price .chip').forEach(b => { const on = b.dataset.price === state.price; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
  $$('#s-sort .chip').forEach(b => { const on = b.dataset.sort === state.sort; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
  [$('#f-sale'), $('#s-sale')].forEach(b => { b.classList.toggle('on', state.sale); b.setAttribute('aria-pressed', String(state.sale)); });
  $('#f-price').value = state.price; $('#f-sort').value = state.sort;
  if ($('#f-q').value.trim() !== state.q && document.activeElement !== $('#f-q')) $('#f-q').value = state.q;
}
const change = patch => { Object.assign(state, patch, patch.shown ? {} : { shown: PAGE }); paint(); };
const clear = () => { $('#f-q').value = ''; change({ shelf: '', price: '', sort: 'new', sale: false, q: '' }); };

document.addEventListener('click', e => {
  const t = e.target instanceof Element ? e.target : null; if (!t) return;
  let b;
  if ((b = t.closest('#f-shelves [data-shelf]'))) return change({ shelf: b.dataset.shelf });
  if ((b = t.closest('#s-price [data-price]'))) return change({ price: b.dataset.price });
  if ((b = t.closest('#s-sort [data-sort]'))) return change({ sort: b.dataset.sort });
  if (t.closest('#f-sale') || t.closest('#s-sale')) return change({ sale: !state.sale });
  if (t.closest('#f-clear') || t.closest('#s-clear') || t.closest('#empty-clear')) return clear();
  if (t.closest('#shop-more')) return change({ shown: state.shown + PAGE });
});
$('#f-price').addEventListener('change', e => change({ price: e.target.value }));
$('#f-sort').addEventListener('change', e => change({ sort: e.target.value }));
let typing;
$('#f-q').addEventListener('input', e => { clearTimeout(typing); typing = setTimeout(() => change({ q: e.target.value.trim() }), 160); });
$('#f-q').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } });

fromAddress();
/* the page arrives with the newest 24 already printed. Only redraw when the address asks for something else. */
if (any() || state.shown > PAGE) paint(); else { hearts($('#shop-grid')); marks(); }
{ const on = $('#f-shelves .chip.on'); if (on && state.shelf) on.scrollIntoView({ inline: 'center', block: 'nearest' }); }
$('#f-q').value = state.q;
