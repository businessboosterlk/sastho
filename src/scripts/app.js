// THE SHARED BEHAVIOUR OF EVERY PAGE: the basket, the saved list, search, the quick look, the order
// hand-off to WhatsApp, the message line, and the app shell (the strip, the update check, install).
import { SITE } from '../config.js';
import { icon, url } from './icon.js';
import { rs, esc, off, img, page, waText, waProduct } from './card.js';
import { cart, saved, me, hint, find, shelfLabel, onChange, PRODUCTS, SHELVES, META, offer, offers, hello, installed } from './store.js';
import { open, close, onSheet, isOpen, shutAll } from './sheets.js';
import { BUILD } from './build.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ───────── the message line ───────── */
let toastT;
export function toast(msg, ic = 'check') {
  const t = $('#toast'); if (!t) return;
  t.innerHTML = icon(ic) + '<span>' + esc(msg) + '</span>';
  t.classList.add('on'); clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('on'), 2400);
}
const short = (s, n = 34) => s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;

/* ───────── counts and hearts, kept true on every change ───────── */
function paint() {
  const c = cart.count(), s = saved.ids().length;
  $$('[data-count="cart"]').forEach(e => { e.textContent = c > 99 ? '99+' : String(c); e.dataset.n = String(c); });
  $$('[data-count="saved"]').forEach(e => { e.textContent = String(s); e.dataset.n = String(s); });
  const fresh = SITE.saleAlerts.inApp ? offers.fresh().length : 0;
  $$('[data-count="offers"]').forEach(e => { e.textContent = String(fresh); e.dataset.n = String(fresh); });
  $$('[data-cart-label]').forEach(e => e.setAttribute('aria-label', c ? `Basket, ${c} item${c === 1 ? '' : 's'}` : 'Basket, empty'));
  hearts();
}
export function hearts(root = document) {
  const ids = new Set(saved.ids());
  $$('[data-fav]', root).forEach(b => { const on = ids.has(+b.dataset.fav); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
}

/* ───────── delivery, only ever what the client has confirmed ───────── */
const D = SITE.delivery;
function deliveryLine(items) {
  if (D.fee == null) return { text: 'Confirmed on WhatsApp', amount: null };
  if (D.freeOver != null && items >= D.freeOver) return { text: 'Free', amount: 0 };
  return { text: rs(D.fee), amount: D.fee };
}

/* ───────── the basket ───────── */
function lineHTML(l) {
  const p = find(l.id), o = off(p), key = `data-id="${p.id}" data-opt="${esc(l.opt || '')}"`;
  return `<div class="line">
    <a href="${page(p)}"><img src="${esc(img(p.thumb))}" alt="" width="72" height="72" loading="lazy"></a>
    <div>
      <a class="nm" href="${page(p)}" data-client-copy><span>${esc(p.name)}</span></a>
      ${l.opt ? `<div class="opt" data-client-copy>${esc(l.opt)}</div>` : ''}
      <div class="pr">${rs(p.price * l.qty)}${o > 0 ? `<s>${rs(p.reg * l.qty)}</s>` : ''}</div>
      <div class="row">
        <div class="qty" role="group" aria-label="Quantity">
          <button type="button" data-qty="-1" ${key} aria-label="One fewer">${icon('minus')}</button>
          <b aria-live="polite">${l.qty}</b>
          <button type="button" data-qty="1" ${key} aria-label="One more">${icon('plus')}</button>
        </div>
        <button class="rm" type="button" data-remove ${key}>${icon('trash')}Remove</button>
      </div>
    </div>
  </div>`;
}
function renderCart() {
  const body = $('#cart-body'), foot = $('#cart-foot'); if (!body) return;
  const lines = cart.lines(), t = cart.totals();
  if (!lines.length) {
    body.innerHTML = `<div class="blank"><div class="mark">${icon('cart')}</div><strong>Your basket is empty</strong><p>Add anything you like the look of. It stays here on your phone until you are ready to order.</p></div>`;
    foot.innerHTML = `<a class="btn primary" href="${url('shop.html')}">Browse the shop</a><button class="btn quiet" type="button" data-close>Close</button>`;
    return;
  }
  const d = deliveryLine(t.items);
  let ship = '';
  if (D.freeOver != null) {
    const left = Math.max(0, D.freeOver - t.items);
    ship = `<div class="shipline">${left > 0 ? `Add <b>${rs(left)}</b> more for free delivery` : '<b>Free delivery on this order</b>'}<div class="bar"><i style="width:${Math.min(100, t.items / D.freeOver * 100)}%"></i></div></div>`;
  }
  const cut = offer.amount(t.items);
  /* the offer is shown where the money is: in the basket, with the sum it is worth on this order */
  const nudge = offer.waiting() ? `<div class="offer-card">
      <span class="oc-mark">${icon('device')}</span>
      <div><b>Take ${rs(Math.round(t.items * offer.percent / 100))} off this order</b><span>Keep Sastho on your phone and your first order is ${offer.percent}% less.</span></div>
      <button class="btn dark sm" type="button" data-install-go>Get the app</button>
    </div>` : '';
  /* the sums ride with the list, so the pinned bar holds only the total and the way on, and the list keeps its room */
  body.innerHTML = nudge + ship + lines.map(lineHTML).join('') + `<div class="sums">
    <div class="sum"><span>Items</span><b>${rs(t.items)}</b></div>
    ${t.saved > 0 ? `<div class="sum"><span>You save</span><b class="save">${rs(t.saved)}</b></div>` : ''}
    ${cut > 0 ? `<div class="sum"><span>App offer, ${offer.percent}% off your first order</span><b class="save">minus ${rs(cut)}</b></div>` : ''}
    <div class="sum"><span>Delivery</span><b>${d.text}</b></div>
    ${cut > 0 ? `<p class="note">${esc(offer.covers)}</p>` : ''}
  </div>`;
  foot.innerHTML = `
    <div class="sum tot"><span>${d.amount == null ? 'Total before delivery' : 'Total'}</span><b>${rs(t.items - cut + (d.amount || 0))}</b></div>
    <button class="btn primary" type="button" data-sheet="order">Continue to order${icon('arrow')}</button>
    <button class="btn quiet" type="button" data-close>Keep shopping</button>`;
}

/* ───────── the saved list ───────── */
function renderSaved() {
  const body = $('#saved-body'), foot = $('#saved-foot'); if (!body) return;
  const items = saved.ids().map(find);
  if (!items.length) {
    body.innerHTML = `<div class="blank"><div class="mark">${icon('heart')}</div><strong>Nothing saved yet</strong><p>Tap the heart on any product and it waits for you here.</p></div>`;
    foot.innerHTML = `<a class="btn primary" href="${url('shop.html')}">Browse the shop</a><button class="btn quiet" type="button" data-close>Close</button>`;
    return;
  }
  body.innerHTML = items.map(p => `<div class="line">
    <a href="${page(p)}"><img src="${esc(img(p.thumb))}" alt="" width="72" height="72" loading="lazy"></a>
    <div>
      <a class="nm" href="${page(p)}" data-client-copy><span>${esc(p.name)}</span></a>
      <div class="pr">${p.from ? 'From ' : ''}${rs(p.price)}${off(p) > 0 ? `<s>${rs(p.reg)}</s>` : ''}</div>
      <div class="row">
        ${p.options ? `<button class="btn dark sm" type="button" data-quick="${p.id}">Choose</button>` : `<button class="btn dark sm" type="button" data-add="${p.id}">${icon('plus')}Add to basket</button>`}
        <button class="rm" type="button" data-fav="${p.id}">${icon('trash')}Remove</button>
      </div>
    </div>
  </div>`).join('');
  foot.innerHTML = `<button class="btn primary" type="button" data-sheet="cart" data-swap>Open my basket</button><button class="btn quiet" type="button" data-close>Keep shopping</button>`;
}

/* ───────── the quick look ───────── */
let q = { id: 0, qty: 1, opt: {} };
const optText = (p, picked) => p.opts.map(([name]) => picked[name] ? `${name}: ${picked[name]}` : '').filter(Boolean).join(', ');
const optMissing = (p, picked) => p.opts.map(([name]) => name).find(name => !picked[name]);
function renderQuick() {
  const p = find(q.id); if (!p) return;
  const o = off(p);
  $('#quick-title').textContent = shelfLabel(p.shelf) || 'Product';
  $('#quick-body').innerHTML = `<div class="ql">
    <div class="ql-img"><img src="${esc(img(p.full || p.thumb))}" alt="${esc(p.name)}" width="600" height="600">${o > 0 ? `<span class="badge">${o}% off</span>` : ''}</div>
    <div>
      <h4 data-client-copy>${esc(p.name)}</h4>
      <div class="price">${p.from ? '<span class="was" style="text-decoration:none">From</span>' : ''}<span class="now">${rs(p.price)}</span>${o > 0 ? `<span class="was">${rs(p.reg)}</span>` : ''}</div>
      ${p.opts.map(([name, terms]) => `<div class="optset" data-client-copy><span class="optname">${esc(name)}</span><div class="chips wrapped" role="group" aria-label="${esc(name)}">${terms.map(t => `<button type="button" class="chip${q.opt[name] === t ? ' on' : ''}" data-opt-name="${esc(name)}" data-opt-term="${esc(t)}" aria-pressed="${q.opt[name] === t}" data-client-copy>${esc(t)}</button>`).join('')}</div></div>`).join('')}
      <div class="facts">
        <div>${icon('check')}Pay cash when it arrives</div>
        <div>${icon('check')}Delivered anywhere in Sri Lanka</div>
        <div>${icon('check')}Returns within ${SITE.returnsDays} days on unused items</div>
      </div>
      <div class="qrow"><span>Quantity</span>
        <div class="qty" role="group" aria-label="Quantity"><button type="button" data-q="-1" aria-label="One fewer"${q.qty <= 1 ? ' disabled' : ''}>${icon('minus')}</button><b>${q.qty}</b><button type="button" data-q="1" aria-label="One more">${icon('plus')}</button></div>
      </div>
    </div>
  </div>`;
  $('#quick-foot').innerHTML = `
    <button class="btn primary" type="button" data-quick-add>${icon('plus')}Add ${q.qty} to basket, ${rs(p.price * q.qty)}</button>
    <div class="pair">
      <a class="btn ghost" href="${page(p)}">Full details</a>
      <button class="btn ghost" type="button" data-fav="${p.id}">${icon('heart')}<span>${saved.has(p.id) ? 'Saved' : 'Save'}</span></button>
    </div>`;
  hearts($('#sheet-quick'));
}

/* ───────── the order: details on this phone, then a WhatsApp message the shopper sends ───────── */
const DISTRICTS = ['Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'];
const validPhone = v => /^(0\d{9}|(\+?94)\d{9})$/.test(String(v).replace(/[\s-]/g, ''));
let orderView = 'form';     // form | card | sent
function orderMessage(m) {
  const t = cart.totals(), d = deliveryLine(t.items);
  let s = 'Hi Sastho, I would like to place this order (cash on delivery):\n\n';
  cart.lines().forEach((l, i) => { const p = find(l.id); s += `${i + 1}. ${p.name}${l.opt ? ' (' + l.opt + ')' : ''}\n   ${l.qty} x ${rs(p.price)} = ${rs(p.price * l.qty)}\n`; });
  const cut = offer.amount(t.items);
  s += `\nItems: ${rs(t.items)}\n`;
  if (cut > 0) s += `App offer ${offer.code}, ${offer.percent}% off my first order: minus ${rs(cut)}\nItems after the offer: ${rs(t.items - cut)}\n`;
  s += `Delivery: ${d.amount == null ? 'please confirm' : d.text}\n`;
  if (d.amount != null) s += `Total: ${rs(t.items - cut + d.amount)}\n`;
  s += `\nName: ${m.name}\nPhone: ${m.phone}\nAddress: ${m.address}\n${m.town ? 'Town: ' + m.town + '\n' : ''}District: ${m.district}\n`;
  if (m.note) s += `Note: ${m.note}\n`;
  s += `\nPrices as shown in the Sastho app${META.pulled ? ' on ' + new Date(META.pulled).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}. Please confirm the price, stock and delivery.`;
  return s;
}
function orderSummary() {
  const t = cart.totals(), d = deliveryLine(t.items);
  const cut = offer.amount(t.items);
  return `<div class="sum"><span>${t.count} item${t.count === 1 ? '' : 's'}</span><b>${rs(t.items)}</b></div>
    ${cut > 0 ? `<div class="sum"><span>App offer, ${offer.percent}% off</span><b class="save">minus ${rs(cut)}</b></div>` : ''}
    <div class="sum tot"><span>${d.amount == null ? 'Total before delivery' : 'Total'}</span><b>${rs(t.items - cut + (d.amount || 0))}</b></div>`;
}
function renderOrder() {
  const body = $('#order-body'), foot = $('#order-foot'), edit = $('#order-edit'); if (!body) return;
  const m = me.get();
  if (!cart.lines().length && orderView !== 'sent') { orderView = 'form'; }
  edit.hidden = orderView !== 'card';
  if (orderView === 'sent') {
    $('#order-title').textContent = 'One more step';
    body.innerHTML = `<div class="blank"><div class="mark" style="background:#e9f6ee;color:var(--wa)">${icon('b-whatsapp')}</div><strong>Press send in WhatsApp</strong><p>Your order is written out in WhatsApp and waiting. It reaches Sastho only when you press send there. Sastho then confirms the price, stock and delivery with you before anything is dispatched.</p></div>`;
    foot.innerHTML = `<button class="btn primary" type="button" data-order-done>I have sent it, empty my basket</button>
      <div class="pair"><a class="btn ghost" id="order-again" href="${esc(waText(orderMessage(m || {})))}" target="_blank" rel="noopener">${icon('b-whatsapp')}Open WhatsApp again</a><button class="btn ghost" type="button" data-order-back>Change the order</button></div>`;
    return;
  }
  $('#order-title').textContent = 'Your order';
  if (orderView === 'card' && m) {
    body.innerHTML = `<p class="lead">Your order goes to Sastho as a WhatsApp message. Nothing is charged here.</p>
      <div class="saved-me"><div><b data-client-copy>${esc(m.name)}</b><span data-client-copy>${esc(m.phone)}</span><span data-client-copy>${esc([m.address, m.town, m.district].filter(Boolean).join(', '))}</span>${m.note ? `<span data-client-copy>Note: ${esc(m.note)}</span>` : ''}</div></div>
      <p class="lead" style="margin:0">These details are kept on this phone only, so the next order takes one tap.</p>`;
    foot.innerHTML = orderSummary() + `<a class="btn wa" id="order-send" href="${esc(waText(orderMessage(m)))}" target="_blank" rel="noopener">${icon('b-whatsapp')}Send order on WhatsApp</a>
      <button class="btn quiet" type="button" data-close>Back to basket</button>`;
    return;
  }
  const v = m || {};
  body.innerHTML = `<p class="lead">Your order goes to Sastho as a WhatsApp message. Nothing is charged here and you pay cash when it arrives.</p>
    <form id="order-form" novalidate autocomplete="on">
      <label class="field" id="f-name"><span>Full name</span><input name="name" type="text" autocomplete="name" autocapitalize="words" enterkeyhint="next" value="${esc(v.name || '')}" required><span class="msg">Please add your name</span></label>
      <label class="field" id="f-phone"><span>Phone number</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" enterkeyhint="next" placeholder="07X XXX XXXX" value="${esc(v.phone || '')}" required><span class="msg">Please add a Sri Lankan number, for example 077 123 4567</span></label>
      <label class="field" id="f-address"><span>Delivery address</span><textarea name="address" autocomplete="street-address" enterkeyhint="next" rows="3" required>${esc(v.address || '')}</textarea><span class="msg">Please add the address to deliver to</span></label>
      <div class="row2">
        <label class="field" id="f-district"><span>District</span><select name="district" autocomplete="address-level1" required><option value="">Choose</option>${DISTRICTS.map(d => `<option${v.district === d ? ' selected' : ''}>${d}</option>`).join('')}</select><span class="msg">Please choose a district</span></label>
        <label class="field"><span>Town <i>optional</i></span><input name="town" type="text" autocomplete="address-level2" autocapitalize="words" enterkeyhint="next" value="${esc(v.town || '')}"></label>
      </div>
      <label class="field"><span>Note for Sastho <i>optional</i></span><input name="note" type="text" enterkeyhint="done" placeholder="Landmark or best time" value="${esc(v.note || '')}"></label>
    </form>`;
  foot.innerHTML = orderSummary() + `<p class="refuse" id="order-refuse" role="alert" hidden></p><button class="btn wa" type="button" data-order-send>${icon('b-whatsapp')}Send order on WhatsApp</button>
    ${m ? '<button class="btn quiet" type="button" data-order-cancel-edit>Keep my saved details</button>' : '<button class="btn quiet" type="button" data-close>Back to basket</button>'}`;
}
function readOrderForm() {
  const f = $('#order-form'); if (!f) return null;
  const g = n => (f.elements[n].value || '').trim();
  const m = { name: g('name'), phone: g('phone'), address: g('address'), district: g('district'), town: g('town'), note: g('note') };
  const bad = { name: !m.name, phone: !validPhone(m.phone), address: !m.address, district: !m.district };
  const first = Object.keys(bad).find(k => bad[k]);
  /* every field still needed is marked. The words go beside the one a person is taken to, and the
     refusal itself is written inside the action bar, beside the button that refused. */
  Object.entries(bad).forEach(([k, b]) => { $('#f-' + k).classList.toggle('bad', b); $('#f-' + k).classList.toggle('say', b && k === first); });
  const why = $('#order-refuse');
  if (first) {
    const names = { name: 'your name', phone: 'a phone number', address: 'the address', district: 'the district' }, need = Object.keys(bad).filter(k => bad[k]).map(k => names[k]);
    if (why) { why.hidden = false; why.textContent = 'Still needed: ' + (need.length > 1 ? need.slice(0, -1).join(', ') + ' and ' + need[need.length - 1] : need[0]) + '.'; }
    const e = $('#f-' + first + ' :is(input,textarea,select)'); e.focus({ preventScroll: true }); e.scrollIntoView({ block: 'center' }); return null;
  }
  if (why) why.hidden = true;
  return m;
}

/* ───────── search ───────── */
const norm = s => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const INDEX = PRODUCTS.map(p => ({ p, hay: norm(p.name + ' ' + shelfLabel(p.shelf)) }));
export function search(text, limit = 40) {
  const words = norm(text).split(' ').filter(Boolean);
  if (!words.length) return [];
  const out = [];
  for (const { p, hay } of INDEX) {
    if (!words.every(w => hay.includes(w))) continue;
    const name = norm(p.name);
    out.push({ p, score: (name.startsWith(words[0]) ? 0 : 1) + (words.every(w => (' ' + name + ' ').includes(' ' + w)) ? 0 : 1) });
  }
  return out.sort((a, b) => a.score - b.score || b.p.id - a.p.id).slice(0, limit).map(x => x.p);
}
function renderSearch() {
  const box = $('#find-input'), body = $('#search-body'); if (!box) return;
  const text = box.value.trim();
  if (text.length < 2) {
    body.innerHTML = `<div class="find-note">Browse a shelf</div><div class="chips wrapped">${SHELVES.map(s => `<a class="chip" href="${url('shop.html')}?shelf=${s.key}">${esc(s.label)}<small>${s.count}</small></a>`).join('')}</div>`;
    return;
  }
  const hits = search(text);
  body.innerHTML = hits.length
    ? `<div class="find-note">${hits.length === 40 ? 'First 40 matches' : hits.length + ' match' + (hits.length === 1 ? '' : 'es')}</div>` + hits.map(p => `<a class="hit" href="${page(p)}"><img src="${esc(img(p.thumb))}" alt="" width="56" height="56" loading="lazy"><div style="min-width:0"><div class="nm" data-client-copy>${esc(p.name)}</div><div class="ct">${esc(shelfLabel(p.shelf))}</div></div><div class="pr">${rs(p.price)}</div></a>`).join('')
      + `<a class="btn ghost block" style="margin-top:14px" href="${url('shop.html')}?q=${encodeURIComponent(text)}">See every match in the shop</a>`
    : `<div class="blank"><div class="mark">${icon('search')}</div><strong>Nothing matches that yet</strong><p>Try one word, such as plate, lamp or jar. Or ask Sastho on WhatsApp and they will look for you.</p><a class="btn wa" style="margin-top:16px" href="${esc(waText('Hi Sastho, I am looking for: ' + text))}" target="_blank" rel="noopener">${icon('b-whatsapp')}Ask on WhatsApp</a></div>`;
}

/* ───────── wiring ───────── */
onSheet('cart', { open: renderCart });
onSheet('saved', { open: renderSaved });
onSheet('quick', { open: id => { q = { id: +id, qty: 1, opt: {} }; renderQuick(); } });
onSheet('order', { open: () => { orderView = me.get() ? 'card' : 'form'; renderOrder(); } });
onSheet('search', { open: () => { renderSearch(); }, close: () => { const b = $('#find-input'); if (b) b.blur(); } });

onSheet('hello', { close: () => hello.done() });
onChange(what => {
  paint();
  if (what === 'offer' && isOpen('cart')) renderCart();
  if (what === 'cart') { if (isOpen('cart')) renderCart(); if (isOpen('order') && orderView !== 'sent') renderOrder(); }
  if (what === 'saved') { if (isOpen('saved')) renderSaved(); if (isOpen('quick')) renderQuick(); }
  document.dispatchEvent(new CustomEvent('sastho:change', { detail: what }));
});

function added(btn, label = 'Add') {
  if (!btn || btn.classList.contains('done')) return;
  const was = btn.innerHTML;
  btn.classList.add('done'); btn.innerHTML = icon('check') + '<span>Added</span>';
  setTimeout(() => { btn.classList.remove('done'); btn.innerHTML = was; }, 1300);
}

document.addEventListener('click', e => {
  const t = e.target instanceof Element ? e.target : null; if (!t) return;
  let b;
  if ((b = t.closest('[data-add]'))) {
    const p = find(b.dataset.add); if (!p) return;
    /* the screen changes at the tap: the basket is on the phone, so nothing waits on a server */
    cart.add(p.id, +(b.dataset.qty || 1), b.dataset.opt || '');
    added(b); toast('Added: ' + short(p.name));
    return;
  }
  if ((b = t.closest('[data-fav]'))) {
    const p = find(b.dataset.fav); if (!p) return;
    const now = saved.toggle(p.id);
    toast(now ? 'Saved for later' : 'Removed from saved', 'heart');
    return;
  }
  if ((b = t.closest('[data-quick]'))) { e.preventDefault(); open('quick', { detail: b.dataset.quick, swap: isOpen('saved') }); return; }
  if ((b = t.closest('[data-qty]'))) { const l = cart.lines().find(x => x.id === +b.dataset.id && (x.opt || '') === b.dataset.opt); if (l) cart.set(l.id, l.opt, l.qty + (+b.dataset.qty)); return; }
  if ((b = t.closest('[data-remove]'))) { const p = find(b.dataset.id); cart.remove(+b.dataset.id, b.dataset.opt); if (p) toast('Removed: ' + short(p.name), 'trash'); return; }
  if ((b = t.closest('[data-q]'))) { q.qty = Math.max(1, Math.min(99, q.qty + (+b.dataset.q))); renderQuick(); return; }
  if ((b = t.closest('[data-opt-term]')) && b.closest('#sheet-quick')) { q.opt[b.dataset.optName] = b.dataset.optTerm; renderQuick(); return; }
  if ((b = t.closest('[data-quick-add]'))) {
    const p = find(q.id), miss = optMissing(p, q.opt);
    if (miss) { toast('Choose an option first', 'info'); return; }
    cart.add(p.id, q.qty, optText(p, q.opt)); toast('Added: ' + short(p.name));
    open('cart', { swap: true }); return;
  }
  if ((b = t.closest('[data-order-send]'))) { const m = readOrderForm(); if (!m) return; me.set(m); window.open(waText(orderMessage(m)), '_blank', 'noopener'); orderView = 'sent'; renderOrder(); return; }
  if ((b = t.closest('#order-send'))) { setTimeout(() => { orderView = 'sent'; renderOrder(); }, 50); return; }
  if ((b = t.closest('[data-order-edit]'))) { orderView = 'form'; renderOrder(); const f = $('#order-form input'); if (f) f.focus(); return; }
  if ((b = t.closest('[data-order-cancel-edit]'))) { orderView = 'card'; renderOrder(); return; }
  if ((b = t.closest('[data-order-back]'))) { orderView = me.get() ? 'card' : 'form'; renderOrder(); return; }
  if ((b = t.closest('[data-order-done]'))) { if (offer.open()) offer.spend(); cart.clear(); orderView = 'form'; shutAllSoft(); toast('Basket emptied. Thank you'); return; }
});
/* closing two sheets at once (the order over the basket) steps back through both history entries */
function shutAllSoft() { const n = document.querySelectorAll('.sheet.on').length; shutAll(); if (n > 0) history.go(-n); }

document.addEventListener('input', e => {
  if (e.target && e.target.id === 'find-input') renderSearch();
  const f = e.target && e.target.closest && e.target.closest('.field.bad'); if (f) f.classList.remove('bad', 'say');
});
document.addEventListener('submit', e => {
  if (e.target && e.target.id === 'find-form') { e.preventDefault(); const v = $('#find-input').value.trim(); if (v) { shutAll(); location.replace(url('shop.html') + '?q=' + encodeURIComponent(v)); } }
  if (e.target && e.target.id === 'order-form') e.preventDefault();
});

/* ───────── the shell ───────── */
const top = $('.top');
const onScroll = () => { if (top && !document.body.classList.contains('sheet-open')) top.classList.toggle('scrolled', window.scrollY > 4); };
window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* when a field takes the focus an iPhone slides the page up, and everything pinned to the top slides
   under the clock. The strip is moved back down by as far as the phone moved the page. */
if (window.visualViewport) {
  const vv = window.visualViewport, set = () => document.documentElement.style.setProperty('--vv-top', Math.max(0, vv.offsetTop) + 'px');
  vv.addEventListener('scroll', set); vv.addEventListener('resize', set); set();
}

/* AN INSTALLED APP KEEPS ITS FIRST COPY. On open, and every time the app comes back to the front, read
   the small version file. When its stamp differs from the one this copy was built with, reload ONCE.
   The basket and the delivery details live on the device, so nothing is lost by the reload. */
let checking = false;
/* THE APP SAYS WHAT IT SAW. The line under the build stamp in More reads: when it last looked, which build the
   server named and whether the worker is in charge. A person can read it out, so an update that did not
   arrive is a fact on the screen and not a theory. */
const seen = { at: '', live: '', note: 'not looked yet' };
const tell = () => $$('[data-update]').forEach(e => { e.textContent = `Looked ${seen.at || 'never'}. Server has ${seen.live || 'no answer'}. ${seen.note}. Worker ${navigator.serviceWorker && navigator.serviceWorker.controller ? 'on' : 'off'}.`; });
async function checkBuild() {
  if (checking || isOpen()) return; checking = true;
  try {
    seen.at = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const r = await fetch(url('version.json') + '?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) { seen.note = 'Version file answered ' + r.status; return; }
    const live = String((await r.json()).build || ''); seen.live = live;
    if (!live || live === BUILD) { seen.note = 'This copy is the newest'; try { sessionStorage.removeItem('sastho_reloaded_for'); } catch { /* fine */ } return; }
    let done = ''; try { done = sessionStorage.getItem('sastho_reloaded_for') || ''; } catch { /* fine */ }
    /* once per stamp, so a version file that is ahead for a minute cannot loop */
    if (done === live) { seen.note = 'Reloaded once for it and still on the old copy'; return; }
    try { sessionStorage.setItem('sastho_reloaded_for', live); } catch { /* fine */ }
    seen.note = 'Newer build found, reloading';
    await freshCopy();
    location.reload();
  } catch (e) { seen.note = 'No connection'; console.info('update check skipped', e && e.message); }
  finally { checking = false; tell(); }
}
/* Before the reload the old copies are put down: the worker is asked to update and every page it kept is
   dropped, so the reload cannot be answered from the phone. */
async function freshCopy() {
  try {
    if ('serviceWorker' in navigator) { const reg = await navigator.serviceWorker.getRegistration(); if (reg) await reg.update(); }
    if ('caches' in window) { const keys = await caches.keys(); await Promise.all(keys.filter(k => k.startsWith('sastho-')).map(async k => { const c = await caches.open(k); const reqs = await c.keys(); await Promise.all(reqs.filter(q => /\.html(\?|$)/.test(q.url) || q.mode === 'navigate').map(q => c.delete(q))); })); }
  } catch (e) { console.warn('update: could not clear the old copies', e); }
}
if (location.protocol.startsWith('http')) {
  checkBuild();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkBuild(); });
  /* an iPhone brings an installed app back from its memory without telling the page it was hidden */
  window.addEventListener('pageshow', e => { if (e.persisted) checkBuild(); });
  window.addEventListener('focus', () => checkBuild());
  /* SEEN ON AN iPHONE, 29 Sep 2026: Safari came back to the front and told the page nothing, so none of the three
     listeners above ran. A clock does not depend on being told. It ticks every 5 seconds while the page is
     awake. A gap between two ticks means the phone put the page to sleep, so the page looks the moment it wakes.
     It also looks every 5 minutes while it stays open. */
  let tick = Date.now(), looked = Date.now();
  setInterval(() => { const now = Date.now(); if (now - tick > 15000 || now - looked > 300000) { looked = now; checkBuild(); } tick = now; }, 5000);
  document.addEventListener('sastho:sheets-shut', () => checkBuild());
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register(url('sw.js'), { scope: url(''), updateViaCache: 'none' }).catch(e => console.warn('worker not registered', e)));
}
tell();
$$('[data-build]').forEach(e => { e.textContent = BUILD; });

/* ───────── keeping the shop on the phone ─────────
   The ask is made in four places, each where it makes sense: the line at the top of the first screen, the
   card in the basket (with the sum the offer is worth), the band on the home page and the row in More.
   Android and desktop Chrome hand the page an install prompt. Safari on an iPhone has none, so the way
   is shown with the share mark drawn. Once installed every ask disappears. */
let askInstall = null;
const ios = () => 'standalone' in navigator && !navigator.standalone;     /* this property exists on iPhone Safari and nowhere else */
const pitch = () => offer.on && !offer.used() ? `Get ${offer.percent}% off your first order` : 'Keep Sastho on your phone';
function paintInstall() {
  /* asked of everyone who has not installed. A phone with no install prompt (Safari, or the browser inside
     Facebook, Instagram or TikTok) is shown the way by hand. */
  const can = !installed();
  document.documentElement.classList.toggle('can-install', !!can);
  document.documentElement.classList.toggle('is-installed', installed());
  document.documentElement.classList.toggle('is-ios', 'standalone' in navigator);
  $$('[data-install-row]').forEach(r => { r.hidden = !can; });
  $$('[data-install-pitch]').forEach(e => { e.textContent = pitch(); });
  $$('[data-install-how]').forEach(e => { e.innerHTML = ios()
    ? `<span class="how">In Safari tap Share ${icon('share')} then <b style="display:inline">Add to Home Screen</b></span>`
    : 'Install the app. One tap, no app store.'; });
  const bar = $('#install'); if (bar) bar.classList.toggle('on', !!can && !hint.seen());
}
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); askInstall = e; paintInstall(); });
window.addEventListener('appinstalled', () => { askInstall = null; paintInstall(); toast('Installed. Open Sastho from your Home Screen', 'device'); });
window.matchMedia('(display-mode: standalone)').addEventListener('change', paintInstall);
document.addEventListener('click', async e => {
  const t = e.target instanceof Element ? e.target : null; if (!t) return;
  if (t.closest('[data-install-go]')) {
    e.preventDefault();
    if (askInstall) { const ask = askInstall; askInstall = null; ask.prompt(); try { await ask.userChoice; } catch (err) { console.info('install prompt closed', err); } paintInstall(); }
    else open('install', { swap: isOpen() });
  }
  if (t.closest('[data-install-no]')) { hint.dismiss(); paintInstall(); }
  if (t.closest('[data-hello-ok]')) { close(); }
});
paintInstall();
/* the first time the shop is opened from the Home Screen: say the offer is waiting and offer sale alerts */
if (hello.due()) setTimeout(() => { if (!isOpen()) open('hello'); }, 700);
/* the first visit has no "new" offers: everything on offer today is simply what the shop has */
if (offers.firstVisit() && !document.body.classList.contains('page-deals')) { /* marked as seen on the Deals page, or now if there is nothing to see */ if (!offers.all().length) offers.markSeen(); }

paint();
window.Sastho = { cart, saved, find, toast, open, close, search, hearts, offer, offers, installed, BUILD };
document.documentElement.classList.add('app-ready');
export { open, close };
