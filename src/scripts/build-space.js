// BUILD MY SPACE. Four questions, then a basket picked from the real catalogue that fits the budget.
// The picks are worked out on the phone. One from each need in turn, so the basket is a spread and not
// six of the same thing, and never over the budget.
import { icon, url } from './icon.js';
import { rs, esc, img, page } from './card.js';
import { PRODUCTS, cart } from './store.js';
import { toast, open } from './app.js';
import { ROOMS, LOOKS, BUDGETS } from './rooms.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const quiz = $('#quiz');
const st = { step: 1, room: '', needs: new Set(), look: '', budget: 0, picks: [], turn: 0 };
const room = () => ROOMS.find(r => r.key === st.room);

function pick() {
  const r = room(); if (!r) return [];
  const needs = (st.needs.size ? r.needs.filter(n => st.needs.has(n.name)) : r.needs);
  const look = LOOKS.find(l => l.key === st.look);
  const pools = needs.map(n => {
    const pool = PRODUCTS.filter(p => r.shelves.includes(p.shelf) && n.re.test(p.name) && p.price <= st.budget && !p.options);
    /* products that carry the look come first. Inside each group the order turns with every "another mix". */
    const score = p => (look && look.re.test(p.name) ? 0 : 1);
    const sorted = pool.sort((a, b) => score(a) - score(b) || b.id - a.id);
    const head = sorted.filter(p => score(p) === 0), tail = sorted.filter(p => score(p) === 1);
    const spin = a => a.length ? a.slice(st.turn % a.length).concat(a.slice(0, st.turn % a.length)) : a;
    return spin(head).concat(spin(tail));
  }).filter(p => p.length);
  const out = [], used = new Set(); let spent = 0, idle = 0, i = 0;
  const cap = Math.max(4, Math.min(8, needs.length * 2));
  while (pools.length && out.length < cap && idle < pools.length) {
    const pool = pools[i % pools.length]; i++;
    const p = pool.find(x => !used.has(x.id) && spent + x.price <= st.budget);
    if (!p) { idle++; continue; }
    idle = 0; used.add(p.id); out.push(p); spent += p.price;
  }
  return out;
}

function paintPicks() {
  const r = room(), box = $('#q-picks'), total = st.picks.reduce((n, p) => n + p.price, 0);
  $('#q-title').textContent = `Your ${r.name.toLowerCase()} picks`;
  if (!st.picks.length) {
    $('#q-sub').textContent = '';
    box.innerHTML = `<div class="empty"><strong>Nothing fits that budget yet</strong>Try a higher budget or fewer needs. The shop has the whole range.<br><a class="btn dark sm" href="${url('shop.html')}">Browse the shop</a></div>`;
  } else {
    $('#q-sub').textContent = `${st.picks.length} product${st.picks.length === 1 ? '' : 's'}, inside your budget of ${rs(st.budget)}. Take out anything you do not want.`;
    box.innerHTML = st.picks.map(p => `<div class="pickrow" data-id="${p.id}">
      <a href="${page(p)}"><img src="${esc(img(p.thumb))}" alt="" width="72" height="72" loading="lazy"></a>
      <div class="pk-t"><a class="nm" href="${page(p)}" data-client-copy><span>${esc(p.name)}</span></a><div class="pr">${rs(p.price)}</div></div>
      <button class="x" type="button" data-drop="${p.id}" aria-label="Take out ${esc(p.name)}">${icon('close')}</button>
    </div>`).join('');
  }
  $('#q-total').textContent = rs(total);
  $('#q-add').disabled = !st.picks.length;
  $('#q-add span').textContent = st.picks.length ? `Add all ${st.picks.length} to basket` : 'Add all to basket';
  $('#q-again').disabled = !st.picks.length;
}

function paint(scroll = false) {
  quiz.dataset.step = String(st.step);
  $$('.qpane').forEach(p => { p.hidden = +p.dataset.pane !== st.step; });
  $('#qbar').style.width = (Math.min(st.step, 4) / 4 * 100) + '%';
  $('#qstep').textContent = st.step <= 4 ? `Question ${st.step} of 4` : 'Your basket';
  /* a room is chosen by tapping it, which moves on by itself, so the first question has no Next */
  $('#qnav').hidden = st.step === 5 || st.step === 1;
  $('#q-back').hidden = st.step === 1;
  const next = $('#q-next');
  next.disabled = (st.step === 1 && !st.room) || (st.step === 4 && !st.budget);
  next.firstChild.textContent = st.step === 4 ? 'See my picks' : st.step === 3 && !st.look ? 'Skip' : st.step === 2 && !st.needs.size ? 'Take everything' : 'Next';
  $$('[data-room]').forEach(b => { const on = b.dataset.room === st.room; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
  const r = room();
  if (r) $('#q-needs').innerHTML = r.needs.map(n => `<button class="chip${st.needs.has(n.name) ? ' on' : ''}" type="button" data-need="${esc(n.name)}" aria-pressed="${st.needs.has(n.name)}">${esc(n.name)}</button>`).join('');
  $$('[data-look]').forEach(b => { const on = b.dataset.look === st.look; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
  $$('[data-budget]').forEach(b => { const on = +b.dataset.budget === st.budget; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
  if (st.step === 5) paintPicks();
  if (scroll) quiz.scrollIntoView({ block: 'start', behavior: 'smooth' });
}
/* each step is a history entry, so the phone's Back button goes back one question */
function go(step, push = true) {
  st.step = step;
  if (step === 5) { st.picks = pick(); }
  if (push) history.pushState({ quiz: step }, '', step > 1 ? '#step-' + step : location.pathname);
  paint(true);
}
window.addEventListener('popstate', e => {
  if (e.state && e.state.sheet) return;
  const s = e.state && e.state.quiz ? e.state.quiz : 1;
  if (s !== st.step && !document.body.classList.contains('sheet-open')) { st.step = s > 1 && !st.room ? 1 : s; if (st.step === 5 && !st.picks.length) st.picks = pick(); paint(true); }
});

document.addEventListener('click', e => {
  const t = e.target instanceof Element ? e.target : null; if (!t) return;
  let b;
  if ((b = t.closest('[data-room]'))) { if (st.room !== b.dataset.room) st.needs.clear(); st.room = b.dataset.room; return go(2); }
  if ((b = t.closest('[data-need]'))) { const n = b.dataset.need; st.needs.has(n) ? st.needs.delete(n) : st.needs.add(n); return paint(); }
  if ((b = t.closest('[data-look]'))) { st.look = st.look === b.dataset.look ? '' : b.dataset.look; return paint(); }
  if ((b = t.closest('[data-budget]'))) { st.budget = +b.dataset.budget; return paint(); }
  if (t.closest('#q-next')) return go(st.step + 1);
  if (t.closest('#q-back')) return history.back();
  if ((b = t.closest('[data-drop]'))) { st.picks = st.picks.filter(p => p.id !== +b.dataset.drop); return paintPicks(); }
  if (t.closest('#q-again')) { st.turn++; st.picks = pick(); paintPicks(); return; }
  if (t.closest('#q-restart')) { Object.assign(st, { room: '', look: '', budget: 0, picks: [], turn: 0 }); st.needs.clear(); return go(1); }
  if (t.closest('#q-add')) { st.picks.forEach(p => cart.add(p.id, 1)); toast(`${st.picks.length} added to your basket`); open('cart'); }
});

/* a link from the home page arrives with the room already chosen */
/* an order carried in the address is spent once and removed before it is acted on, so a reload or a
   Back press never chooses the room a second time */
const want = new URLSearchParams(location.search).get('room');
history.replaceState({ quiz: 1 }, '', location.pathname);
if (want && ROOMS.some(r => r.key === want)) { st.room = want; go(2); } else paint();
