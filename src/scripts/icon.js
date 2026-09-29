// THE ONE PLACE AN ICON IS WRITTEN. Every icon is a symbol in assets/icons.svg, which scripts/build-icons.mjs
// builds from Lucide and Simple Icons. Nothing on this site types icon path data by hand.
// Used by Astro at build time and by the browser, so a card drawn by either is the same card.
export const BASE = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
export const url = p => BASE + String(p || '').replace(/^\//, '');
const SPRITE = url('assets/icons.svg');
export const icon = (name, cls = '') => {
  const brand = name.startsWith('b-');
  return `<svg class="ic${brand ? ' b' : ''}${cls ? ' ' + cls : ''}" aria-hidden="true" focusable="false"><use href="${SPRITE}#${name}"></use></svg>`;
};
