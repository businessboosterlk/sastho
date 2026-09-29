// EVERY REAL-WORLD VALUE ON THE SITE LIVES HERE. Edit here, never in a page.
// Each line names where the fact came from. A value nobody has confirmed is null and the site
// then prints nothing for it. Never fill a null with a guess.
export const SITE = {
  name: 'Sastho Lanka',
  short: 'Sastho',
  tagline: 'Unbeatable quality at unbeatable prices',            // the client's logo and About page
  store: 'https://sastho.lk',
  wholesale: 'https://wholesale.sastho.lk/',                      // linked from the client's own menu, answered 200 on 29 Sep 2026
  instagram: 'https://www.instagram.com/sastho.lk/',              // linked from the client's own footer
  facebook: null,                                                 // the client's footer shows the mark but the address was not readable. Ask Cader
  whatsapp: '94777675984',                                        // the client's footer and every caption
  phoneShown: '077 767 5984',
  phoneIntl: '+94 77 767 5984',
  address: 'No. 84/1, Maliban Street, Colombo 11',               // the client's footer
  mapQuery: 'Sastho Lanka, 84 Maliban Street, Colombo 11',
  hours: 'Open Monday to Sunday, 10am to 7pm',                    // sastho.lk/after-sale-service
  returnsDays: 14,                                                // sastho.lk/refunds-returns. The After Sales page says 7. Ask Cader which one stands
  cancelHours: 6,                                                 // sastho.lk/refunds-returns
  // DELIVERY CHARGE AND FREE DELIVERY ARE NOT CONFIRMED. The old demo printed Rs 350 and free over Rs 5,000.
  // Both were Business Booster's own figures. Until Cader gives the real ones the basket says the charge is
  // confirmed on WhatsApp. Put numbers here and the basket shows them and the progress line appears.
  delivery: { fee: null, freeOver: null },
  // THE APP OFFER (Thulaib, 29 Sep 2026): keep the shop on your phone, get 10 percent off the first order.
  // It applies only inside the installed app and only once per phone. With no server the phone is the only
  // thing that knows, so the order message carries the code and Sastho has the last word.
  // agreed:false means CADER HAS NOT YET SAID YES. He stopped a video on 3 Sep 2026 over a flat discount that
  // did not name its exclusions (dinner plates). Get his yes and his exclusions in writing before this link is
  // shared with shoppers, then write the exclusions into `covers` and set agreed to true.
  appOffer: { on: true, percent: 10, code: 'APP10', agreed: false, covers: 'Sastho confirms which items the offer covers when it confirms your order.' },
  // SALE ALERTS. A notification on a locked phone needs a server to send it. That is not built and is
  // Thulaib's decision. What works with no server: the app marks new offers each time it opens, and a
  // shopper can ask Sastho for sale alerts on WhatsApp.
  saleAlerts: { inApp: true, whatsapp: true, push: false },
  // This is a concept on a Business Booster address. It must not compete with sastho.lk in Google.
  robots: 'noindex,nofollow',
  concept: true,
};

export const TABS = [
  { key: 'home',  label: 'Home',  icon: 'home',   href: 'index.html' },
  { key: 'shop',  label: 'Shop',  icon: 'store',  href: 'shop.html' },
  { key: 'deals', label: 'Deals', icon: 'tag',    href: 'deals.html' },
  { key: 'build', label: 'Build', icon: 'wand',   href: 'build.html' },
];
export const LINKS = [
  { key: 'deals',   label: 'Deals',          href: 'deals.html' },
  { key: 'shop',    label: 'Shop',           href: 'shop.html' },
  { key: 'build',   label: 'Build My Space', href: 'build.html' },
  { key: 'about',   label: 'About',          href: 'about.html' },
  { key: 'contact', label: 'Contact',        href: 'contact.html' },
  { key: 'faq',     label: 'Help',           href: 'faq.html' },
];
