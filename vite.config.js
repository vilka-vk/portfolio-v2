import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { pageEntries } from './src/pages.js';

const initializeLanguage = `try {
  const language = localStorage.getItem('vm-v2-lang') === 'en' ? 'en' : 'ru';
  document.body.dataset.lang = language;
  document.documentElement.lang = language;
} catch { /* Default markup remains Russian when storage is disabled. */ }`;

export default defineConfig({
  plugins: [react(), {
    name: 'initial-language',
    transformIndexHtml() {
      return [{ tag: 'script', children: initializeLanguage, injectTo: 'body-prepend' }];
    },
  }],
  publicDir: false,
  build: {
    rollupOptions: {
      input: pageEntries.map(entry => fileURLToPath(new URL(entry, import.meta.url))),
    },
  },
});
