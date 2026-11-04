import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { pageEntries } from './src/pages.js';

const initializeLanguage = `try {
  const stored = localStorage.getItem('vm-v2-lang');
  const browserLanguage = (navigator.language || '').toLowerCase();
  const language = stored === 'ru' || stored === 'en'
    ? stored
    : browserLanguage.startsWith('ru') ? 'ru' : 'en';
  document.body.dataset.lang = language;
  document.documentElement.lang = language;
} catch {
  const language = (navigator.language || '').toLowerCase().startsWith('ru') ? 'ru' : 'en';
  document.body.dataset.lang = language;
  document.documentElement.lang = language;
}`;

const metrikaId = 113753598;
const initializeMetrika = `(function(m,e,t,r,i,k,a){
  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();
  for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a);
})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=${metrikaId}','ym');
ym(${metrikaId},'init',{ssr:true,webvisor:true,clickmap:true,referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true});`;

export default defineConfig({
  // The library shares theme and rendering settings per module. Keep the dark
  // button independent from the light chromatic text and heart renderer.
  resolve: {
    alias: {
      'metal-fx-button': fileURLToPath(new URL('./node_modules/metal-fx/dist/index.es.js', import.meta.url)) + '?button',
    },
  },
  optimizeDeps: { exclude: ['metal-fx-button'] },
  plugins: [react(), {
    name: 'initial-language',
    transformIndexHtml() {
      return [{ tag: 'script', children: initializeLanguage, injectTo: 'body-prepend' }];
    },
  }, {
    name: 'yandex-metrika',
    // Keep local development visits out of the production counter.
    apply: 'build',
    transformIndexHtml() {
      return [
        { tag: 'script', children: initializeMetrika, injectTo: 'body' },
        {
          tag: 'noscript',
          children: `<div><img src="https://mc.yandex.ru/watch/${metrikaId}" style="position:absolute;left:-9999px" alt=""></div>`,
          injectTo: 'body',
        },
      ];
    },
  }],
  publicDir: false,
  build: {
    rollupOptions: {
      input: pageEntries.map(entry => fileURLToPath(new URL(entry, import.meta.url))),
    },
  },
});
