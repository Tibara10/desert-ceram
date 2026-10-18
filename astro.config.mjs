// @ts-check
import { defineConfig } from 'astro/config';


// Remplacer par l'URL Cloudflare Pages réelle.
export default defineConfig({
  site: 'https://desert-ceram.pages.dev',
  build: {
    // Pas de CSS inline : permet une CSP stricte (style-src 'self')
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      // Pas de script inline non plus (script-src 'self')
      assetsInlineLimit: 0,
    },
  },
});
