import { readFileSync, writeFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';
import { pageEntries } from '../src/pages.js';

// Generate complete HTML for crawlers, link previews and the initial page paint.
const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
try {
  const { App } = await server.ssrLoadModule('/src/App.jsx');
  for (const entry of pageEntries) {
    const isCase = entry !== 'index.html';
    const page = entry.replace('cases/', '').replace('.html', '');
    const pathname = `/${entry}`;
    const target = new URL(`../dist${pathname}`, import.meta.url);
    const initialContent = isCase ? readFileSync(new URL(`../src/content/${page}.html`, import.meta.url), 'utf8') : undefined;
    const markup = renderToString(createElement(App, { pathname, initialContent }));
    const shell = readFileSync(target, 'utf8');
    if (!shell.includes('<div id="root"></div>')) throw new Error(`Missing React root in ${entry}`);
    writeFileSync(target, shell.replace('<div id="root"></div>', () => `<div id="root">${markup}</div>`));
  }
} finally {
  await server.close();
}
