import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { htmlToDOM } from 'html-react-parser';
import { pageEntries } from '../src/pages.js';
import dimensions from '../src/content/image-dimensions.json' with { type: 'json' };

const origin = 'https://portfolio.test';
const pages = new Map();
const checkedStylesheets = new Set();
let referenceCount = 0;

function elements(nodes) {
  return nodes.flatMap(node => [
    ...(node.attribs ? [node] : []),
    ...elements(node.children || []),
  ]);
}

for (const entry of pageEntries) {
  const html = readFileSync(new URL(`../dist/${entry}`, import.meta.url), 'utf8');
  const nodes = elements(htmlToDOM(html));
  for (const tag of ['main', 'header', 'footer']) {
    assert.equal(nodes.filter(node => node.name === tag).length, 1, `${entry}: one ${tag}`);
  }
  assert.ok(nodes.some(node => node.attribs.id === 'root' && node.children?.length), `${entry}: prerendered content`);
  assert.equal((html.match(/mc\.yandex\.ru\/metrika\/tag\.js/g) || []).length, 1, `${entry}: one counter`);
  pages.set(`/${entry}`, { nodes, ids: new Set(nodes.map(node => node.attribs.id).filter(Boolean)) });
}

function checkReference(value, base) {
  const url = new URL(value, base);
  // Do not contact trackers, mail servers or any external service during verification.
  if (url.origin !== origin) return;
  let path = decodeURIComponent(url.pathname);
  if (path === '/') path = '/index.html';
  if (!path.split('/').at(-1).includes('.')) path += '.html';
  const file = new URL(`../dist${path}`, import.meta.url);
  assert.ok(existsSync(file), `${base}: missing local file ${value}`);
  referenceCount++;
  if (url.hash && pages.has(path)) {
    assert.ok(pages.get(path).ids.has(decodeURIComponent(url.hash.slice(1))), `${base}: missing anchor ${value}`);
  }
  if (path.endsWith('.css') && !checkedStylesheets.has(path)) {
    checkedStylesheets.add(path);
    const css = readFileSync(file, 'utf8');
    for (const match of css.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)) {
      checkReference(match[1], url.href);
    }
  }
}

for (const [path, { nodes }] of pages) {
  const base = `${origin}${path}`;
  for (const node of nodes) {
    for (const attribute of ['src', 'href']) {
      const value = node.attribs[attribute];
      if (value) checkReference(value, base);
    }
    if (node.name === 'img') {
      const src = new URL(node.attribs.src, base).pathname;
      if (dimensions[src]) {
        assert.equal(Number(node.attribs.width), dimensions[src].width, `${path}: ${src} width`);
        assert.equal(Number(node.attribs.height), dimensions[src].height, `${path}: ${src} height`);
      }
    }
  }
  console.log(`PASS ${path}`);
}

for (const path of Object.keys(dimensions)) {
  assert.ok(existsSync(new URL(`..${path}`, import.meta.url)), `Stale image metadata: ${path}`);
}
console.log(`Verified ${pages.size} prerendered pages and ${referenceCount} local references.`);
