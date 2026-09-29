// Sastho Lanka storefront concept. Astro static site, BB stack standard (2026-09-09).
//
// TWO VALUES CHANGE WHEN THE SITE MOVES TO THE CLIENT'S OWN DOMAIN:
//   SITE_URL  = https://sastho.lk   (or wherever it ends up)
//   BASE_PATH = /
// Set them as environment variables in the build and nothing else changes.
// The defaults are the GitHub Pages address, businessboosterlk.github.io/sastho/.
//
// Pages are written as files (shop.html, not shop/index.html) so every address that was live
// before the rebuild still opens: /sastho/index.html, /sastho/shop.html and the rest.
import { defineConfig } from 'astro/config';

const site = process.env.SITE_URL || 'https://businessboosterlk.github.io';
const base = process.env.BASE_PATH || '/sastho';

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'file', assets: 'assets/app' },
  devToolbar: { enabled: false },
  vite: { build: { cssCodeSplit: false, assetsInlineLimit: 0 } }
});
