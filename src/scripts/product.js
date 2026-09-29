// THE PRODUCT PAGE: the photographs, the options, the quantity and the two ways to buy.
import { icon } from './icon.js';
import { rs, waProduct } from './card.js';
import { cart, find, goals, push } from './store.js';
import { toast, open, nextWord } from './app.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const root = $('[data-product]');
const p = root ? find(root.dataset.product) : null;

if (p) {
  let qty = 1; const picked = {};
  const optText = () => p.opts.map(([n]) => picked[n] ? `${n}: ${picked[n]}` : '').filter(Boolean).join(', ');
  const missing = () => p.opts.map(([n]) => n).find(n => !picked[n]);

  /* photographs: a row that slides under the thumb on a phone, thumbnails that move it everywhere */
  const main = $('#gal-main'), thumbs = $$('#gal-thumbs button');
  const mark = i => thumbs.forEach((b, n) => { b.classList.toggle('on', n === i); b.setAttribute('aria-pressed', String(n === i)); });
  thumbs.forEach(b => b.addEventListener('click', () => { const i = +b.dataset.pic; main.scrollTo({ left: main.clientWidth * i, behavior: 'smooth' }); mark(i); }));
  let t; if (main) main.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(() => mark(Math.round(main.scrollLeft / Math.max(1, main.clientWidth))), 80); }, { passive: true });

  function paint() {
    $('#pq').textContent = String(qty);
    $('#pq-minus').disabled = qty <= 1; $('#pq-plus').disabled = qty >= 99;
    const word = missing() ? 'Choose an option' : qty > 1 ? `Add ${qty}, ${rs(p.price * qty)}` : 'Add to basket';
    $('#p-add span').textContent = word;
    const bar = $('#pbar-add span'); if (bar) bar.textContent = word;
    $('#p-wa').href = waProduct(p, qty, optText());
    /* what adding THIS does to the basket: the step it reaches, or how close it brings the next one */
    const line = $('#p-goal');
    if (line && goals.on) {
      const now = cart.totals().items, then = now + p.price * qty, a = push(now), b = push(then);
      line.hidden = false;
      line.textContent = b.have.kind === 'goal' && b.have.percent > a.have.percent ? `Add this and your whole basket gets ${b.have.percent}% off`
        : b.next ? `Add this and you are ${rs(b.gap)} from ${b.next.percent}% off your basket`
        : b.have.percent ? `Your basket has ${b.have.percent}% off` : '';
      if (!line.textContent) line.hidden = true;
    }
    $$('[data-optset]').forEach(set => {
      const n = set.dataset.optset;
      set.querySelector('.optpick').textContent = picked[n] ? picked[n] : '';
      set.classList.toggle('need', false);
      set.querySelectorAll('.chip').forEach(c => { const on = c.dataset.optTerm === picked[n]; c.classList.toggle('on', on); c.setAttribute('aria-pressed', String(on)); });
    });
  }
  function add(btn) {
    const miss = missing();
    if (miss) {
      const set = $(`[data-optset="${CSS.escape(miss)}"]`);
      if (set) { set.classList.add('need'); set.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      toast('Choose an option first', 'info'); return;
    }
    cart.add(p.id, qty, optText());
    toast(nextWord() || (qty > 1 ? `Added ${qty} to your basket` : 'Added to your basket'));
    if (btn && !btn.classList.contains('done')) {
      const was = btn.innerHTML; btn.classList.add('done'); btn.innerHTML = icon('check') + '<span>Added</span>';
      setTimeout(() => { btn.classList.remove('done'); btn.innerHTML = was; paint(); }, 1300);
    }
  }
  $('#pq-minus').addEventListener('click', () => { qty = Math.max(1, qty - 1); paint(); });
  $('#pq-plus').addEventListener('click', () => { qty = Math.min(99, qty + 1); paint(); });
  $('#p-add').addEventListener('click', e => add(e.currentTarget));
  const bar = $('#pbar-add'); if (bar) bar.addEventListener('click', e => add(e.currentTarget));
  document.addEventListener('click', e => {
    const c = e.target instanceof Element ? e.target.closest('.pdp [data-opt-term]') : null;
    if (c) { picked[c.dataset.optName] = c.dataset.optTerm; paint(); }
  });
  const save = $('#p-save');
  const saveWord = () => { if (save) save.querySelector('span').textContent = save.classList.contains('on') ? 'Saved' : 'Save'; };
  document.addEventListener('sastho:change', () => { saveWord(); paint(); });
  paint(); saveWord();
}
