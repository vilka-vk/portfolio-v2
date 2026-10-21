import { readFileSync, writeFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

// Generate complete HTML for crawlers, link previews and the initial page paint.
const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
try {
  const { App } = await server.ssrLoadModule('/src/main.jsx');
  const pages = ['index', 'bashnya', 'forrest', 'gutstuff', 'saymore', 'taromant', 'trinoray'];
  for (const page of pages) {
    const isCase = page !== 'index';
    const pathname = isCase ? `/cases/${page}.html` : '/index.html';
    const target = new URL(`../dist${pathname}`, import.meta.url);
    const initialContent = isCase ? readFileSync(new URL(`../src/content/${page}.html`, import.meta.url), 'utf8') : undefined;
    const markup = renderToString(createElement(App, { pathname, initialContent }));
    const shell = readFileSync(target, 'utf8');
    writeFileSync(target, shell.replace('<div id="root"></div>', () => `<div id="root">${markup}</div>`));
  }
} finally {
  await server.close();
}
