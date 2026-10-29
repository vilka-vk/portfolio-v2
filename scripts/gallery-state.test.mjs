import test from 'node:test';
import assert from 'node:assert/strict';
import { createGalleryNavigation, groupAfterKey, groupFromHash } from '../src/gallery-state.js';

function browser(hash = '') {
  const win = new EventTarget();
  win.location = new URL(`https://portfolio.test/index.html?preview=1${hash}`);
  win.history = { state: { preserved: true }, replaceState(state, _, url) { win.location = new URL(url); this.state = state; } };
  return win;
}
test('only gallery anchors select a group', () => {
  assert.equal(groupFromHash('#cases'), 'cases');
  assert.equal(groupFromHash('#concepts'), 'concepts');
  assert.equal(groupFromHash('#experience'), null);
  assert.equal(groupFromHash(''), null);
});
test('direct laboratory entry and subsequent header/history navigation stay synchronized', () => {
  const win = browser('#concepts');
  const selected = [];
  const nav = createGalleryNavigation(win, group => selected.push(group));
  assert.deepEqual(selected, ['concepts']);
  win.location.hash = 'cases'; win.dispatchEvent(new Event('hashchange'));
  win.location.hash = 'experience'; win.dispatchEvent(new Event('hashchange'));
  win.location.hash = 'concepts'; win.dispatchEvent(new Event('popstate'));
  assert.deepEqual(selected, ['concepts', 'cases', 'concepts']);
  nav.dispose();
  win.location.hash = 'cases'; win.dispatchEvent(new Event('hashchange'));
  win.dispatchEvent(new Event('popstate'));
  assert.equal(selected.length, 3);
});
test('tab selection replaces the URL without navigation and preserves search and history state', () => {
  const win = browser();
  let selected = 'cases';
  const nav = createGalleryNavigation(win, group => { selected = group; });
  nav.select('concepts');
  assert.equal(selected, 'concepts');
  assert.equal(win.location.href, 'https://portfolio.test/index.html?preview=1#concepts');
  assert.deepEqual(win.history.state, { preserved: true });
  nav.select('invalid'); assert.equal(selected, 'concepts');
  nav.dispose();
});
test('tab keyboard navigation wraps and supports Home/End without intercepting Tab', () => {
  for (const key of ['ArrowRight', 'ArrowLeft']) {
    assert.equal(groupAfterKey('cases', key), 'concepts');
    assert.equal(groupAfterKey('concepts', key), 'cases');
  }
  assert.equal(groupAfterKey('concepts', 'Home'), 'cases');
  assert.equal(groupAfterKey('cases', 'End'), 'concepts');
  assert.equal(groupAfterKey('cases', 'Tab'), null);
});
