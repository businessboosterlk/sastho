// ONE PRODUCT CARD. Astro prints it at build time and the browser prints it when a list is filtered,
// from this same function, so the two can never drift apart.
// A card shows only what the store itself says: name, photograph, price, the regular price when the
// store has the product on sale, and the shelf. No ratings, no sold counts, no stock countdowns.
import { icon, url } from './icon.js';
import { SITE } from '../config.js';

export const UPLOADS = 'https://sastho.lk/wp-content/uploads/';
export const rs = n => 'Rs ' + Math.round(n).toLocaleString('en-LK');
export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const off = p => p.reg > p.price ? Math.round((1 - p.price / p.reg) * 100) : 0;
export const img = path => path ? UPLOADS + path : url('assets/logo.png');
export const page = p => url('p/' + p.slug + '.html');
export const waText = text => 'https://wa.me/' + SITE.whatsapp + '?text=' + encodeURIComponent(text);
export const waProduct = (p, qty = 1, opt = '') => waText(
  `Hi Sastho, I would like to order this (cash on delivery):\n\n${p.name}${opt ? '\n' + opt : ''}\nQuantity: ${qty}\nPrice shown: ${rs(p.price)} each\n\nPlease confirm the price, stock and delivery.`);

/* the full record Astro holds and the short one the browser holds, in one shape */
export const shape = p => p.i !== undefined
  ? { id: p.i, slug: p.s, name: p.n, shelf: p.h, price: p.p, reg: p.r, thumb: p.t, full: p.g, options: !!p.o, opts: p.o || [], stock: !!p.k, from: !!p.f }
  : { id: p.id, slug: p.slug, name: p.name, shelf: p.shelf, price: p.price, reg: p.reg, thumb: p.images[0] ? p.images[0].thumb : '', full: p.images[0] ? p.images[0].src : '', options: p.options.length > 0, opts: p.options.map(o => [o.name, o.terms]), stock: p.stock, from: !!(p.range && p.range.max > p.range.min) };

export const cardHTML = (raw, shelfLabel = '', eager = false) => {
  const p = raw.thumb !== undefined && raw.options !== undefined && typeof raw.options === 'boolean' ? raw : shape(raw);
  const o = off(p);
  return `<article class="card" data-id="${p.id}">
  <a class="card-img" href="${page(p)}" aria-label="${esc(p.name)}">
    <img src="${esc(img(p.thumb))}" alt="" width="300" height="300" loading="${eager ? 'eager' : 'lazy'}" decoding="async">
    ${o > 0 ? `<span class="badge">${o}% off</span>` : ''}
  </a>
  <button class="fav" type="button" data-fav="${p.id}" aria-label="Save ${esc(p.name)}" aria-pressed="false">${icon('heart')}</button>
  <div class="card-body">
    ${shelfLabel ? `<span class="card-cat">${esc(shelfLabel)}</span>` : ''}
    <a class="card-name" href="${page(p)}" data-client-copy>${esc(p.name)}</a>
    <div class="card-price">${p.from ? '<span class="from">From</span>' : ''}<span class="now">${rs(p.price)}</span>${o > 0 ? `<span class="was">${rs(p.reg)}</span>` : ''}</div>
    <div class="card-act">
      ${p.options
        ? `<button class="add" type="button" data-quick="${p.id}">${icon('eye')}<span>Choose</span></button>`
        : `<button class="add" type="button" data-add="${p.id}">${icon('plus')}<span>Add</span></button>`}
      <a class="wa-sq" href="${esc(waProduct(p))}" target="_blank" rel="noopener" aria-label="Order ${esc(p.name)} on WhatsApp">${icon('b-whatsapp')}</a>
    </div>
  </div>
</article>`;
};
