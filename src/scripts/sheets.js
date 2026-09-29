// THE ONE OVERLAY. Ported from bb-workshop-os/apps/web/src/app/ui/drawer.component.ts.
// It pins the page behind it the iOS way (hold the body at its scroll position, put it back on close),
// gives every open sheet one history entry so the phone's Back button closes the sheet on screen, closes
// on Escape, and makes the page behind it inert. A closed sheet is hidden in place and inert, never
// parked off screen. Closing from a button steps back through history, so a button and the Back
// button can never disagree about what is open.
const stack = [];                       // names of the open sheets, the one on screen last
let lockedY = 0, closing = false, returnTo = null;
const el = n => document.getElementById('sheet-' + n);
const scrim = () => document.querySelector('[data-scrim]');
const behind = () => document.querySelectorAll('[data-behind]');
const hooks = {};                       // name -> { open(detail), close() }
export const onSheet = (name, h) => { hooks[name] = h; };
export const isOpen = n => n ? stack.includes(n) : stack.length > 0;

function show(n, detail) {
  const s = el(n); if (!s) return;
  s.removeAttribute('inert'); s.setAttribute('aria-hidden', 'false'); s.style.zIndex = String(90 + stack.length);
  if (hooks[n] && hooks[n].open) hooks[n].open(detail);
  s.classList.add('on');
  const body = s.querySelector('.s-body'); if (body) body.scrollTop = 0;
  /* the search panel is opened to type, so its field takes the focus. Every other sheet gives the
     focus to its own frame, which keeps the keyboard down until a person asks for it. */
  const want = s.querySelector('[data-autofocus]') || s;
  requestAnimationFrame(() => { try { want.focus({ preventScroll: true }); } catch { /* not focusable */ } });
}
function hide(n) {
  const s = el(n); if (!s) return;
  s.classList.remove('on'); s.setAttribute('inert', ''); s.setAttribute('aria-hidden', 'true');
  if (hooks[n] && hooks[n].close) hooks[n].close();
}
function lock() {
  lockedY = window.scrollY;
  document.body.style.top = `-${lockedY}px`;
  document.body.classList.add('sheet-open');
  behind().forEach(e => e.setAttribute('inert', ''));
  scrim().classList.add('on');
  history.scrollRestoration = 'manual';
}
function unlock() {
  document.body.classList.remove('sheet-open');
  document.body.style.top = '';
  window.scrollTo(0, lockedY);
  /* THE PAGE COMES BACK A MOMENT AFTER THE SHEET HAS GONE. Seen on an installed iPhone, 29 Sep 2026: "Not now"
     closed the welcome sheet and the same touch landed on the Deals tab that had been under it. The bar and
     the page stay out of reach for a third of a second, which is longer than a touch lasts. */
  const held = [...behind()];
  setTimeout(() => { if (!stack.length) { held.forEach(e => e.removeAttribute('inert')); document.dispatchEvent(new CustomEvent('sastho:sheets-shut')); } }, 340);
  scrim().classList.remove('on');
  history.scrollRestoration = 'auto';
  if (returnTo && document.contains(returnTo)) { try { returnTo.focus({ preventScroll: true }); } catch { /* gone */ } }
  returnTo = null;
}

/* open(name)            a sheet over the page, or over the sheet already open
   open(name, {swap})    takes the place of the sheet on screen and keeps its history entry */
export function open(n, { swap = false, detail } = {}) {
  if (!el(n) || stack.includes(n)) return;
  if (swap && stack.length) { hide(stack.pop()); stack.push(n); show(n, detail); return; }
  /* the history entry is made BEFORE the page is pinned. Pinning sends the window's scroll to 0, and an
     entry made after that would remember 0: coming Back to this page later would land at the top. */
  const first = !stack.length;
  if (first) returnTo = document.activeElement;
  stack.push(n);
  history.pushState({ sheet: stack.length }, '');
  if (first) lock();
  show(n, detail);
}
export function close() {
  if (!stack.length || closing) return;
  closing = true;
  history.back();
  /* a browser that swallows the step (it happens inside some in-app browsers) must not leave a sheet stuck */
  setTimeout(() => { if (closing) { closing = false; drop(); } }, 400);
}
function drop() {
  if (!stack.length) return;
  hide(stack.pop());
  if (!stack.length) unlock(); else { const s = el(stack[stack.length - 1]); if (s) s.focus({ preventScroll: true }); }
}
/* everything shut, no history step: the page is being left or has just been handed back */
export function shutAll() { while (stack.length) hide(stack.pop()); if (document.body.classList.contains('sheet-open')) unlock(); closing = false; }

window.addEventListener('popstate', () => { closing = false; drop(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && stack.length) { e.preventDefault(); close(); } });
/* a copy of the page kept by the browser for the Back button must never come back with a sheet open */
window.addEventListener('pagehide', shutAll);
window.addEventListener('pageshow', e => { if (e.persisted) shutAll(); });
/* a page reloaded while a sheet was open sits on the sheet's history entry with nothing open:
   step off it, so the next Back press does something a person can see */
if (history.state && history.state.sheet) history.back();

document.addEventListener('click', e => {
  const t = e.target instanceof Element ? e.target : null; if (!t) return;
  const opener = t.closest('[data-sheet]');
  if (opener) { e.preventDefault(); open(opener.dataset.sheet, { swap: opener.hasAttribute('data-swap'), detail: opener.dataset.detail }); return; }
  if (t.closest('[data-close]')) { e.preventDefault(); close(); return; }
  if (t.matches('[data-scrim]')) { close(); return; }
  /* a link inside a sheet leaves the page. The sheet's history entry is handed to the new page, so
     Back from there returns here in one press, with the page where it was. */
  const a = t.closest('.sheet a[href]');
  if (a && stack.length && a.target !== '_blank' && a.origin === location.origin && !a.hasAttribute('download')) {
    e.preventDefault();
    const go = a.href;
    shutAll();
    location.replace(go);
  }
});
