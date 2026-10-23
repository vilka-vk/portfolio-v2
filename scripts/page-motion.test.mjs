import test from 'node:test';
import assert from 'node:assert/strict';
import { createPageMotion } from '../src/page-motion.js';

class Events {
  listeners = new Map();
  addEventListener(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(callback);
  }
  removeEventListener(type, callback) { this.listeners.get(type)?.delete(callback); }
  emit(type, event = {}) { this.listeners.get(type)?.forEach(callback => callback(event)); }
  listenerCount() { return [...this.listeners.values()].reduce((count, set) => count + set.size, 0); }
}

function environment({ hash = '', reduced = false, history = false, scroll = 0, observer = true, casePage = false } = {}) {
  const win = new Events();
  const query = new Events();
  query.matches = reduced;
  const frames = new Map();
  const calls = { tweens: [], hidden: [], observers: [], scrolls: 0, reverts: 0 };
  let nextFrame = 0;
  Object.assign(win, {
    location: { hash }, innerHeight: 800, scrollY: scroll,
    performance: { getEntriesByType: () => [{ type: history ? 'back_forward' : 'navigate' }] },
    matchMedia: () => query,
    requestAnimationFrame: callback => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: id => frames.delete(id),
  });
  if (observer) win.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; this.targets = new Set(); calls.observers.push(this); }
    observe(target) { this.targets.add(target); }
    unobserve(target) { this.targets.delete(target); }
    disconnect() { this.targets.clear(); }
  };
  let settleFonts;
  const doc = { defaultView: win, fonts: { ready: new Promise(resolve => { settleFonts = resolve; }) } };
  const items = ['hero', 'cases', 'concepts'].map((id, index) => ({
    id, top: index * 1100, style: {},
    contains(target) { return target === this; },
    getBoundingClientRect() { return { top: this.top - win.scrollY, bottom: this.top + 900 - win.scrollY, height: 900 }; },
    scrollIntoView(options) { assert.equal(options.behavior, 'instant'); win.scrollY = this.top - 80; calls.scrolls++; },
  }));
  const root = Object.assign(new Events(), {
    ownerDocument: doc, children: items,
    matches: () => casePage,
    querySelectorAll: () => items,
    contains: target => target === root || items.includes(target),
  });
  doc.getElementById = id => items.find(item => item.id === id) || null;
  const engine = {
    context() {
      const saved = items.map(item => ({ ...item.style }));
      return {
        add(name, callback) {
          if (typeof name === 'function') name();
          else this[name] = callback;
        },
        revert() { items.forEach((item, index) => { item.style = { ...saved[index] }; }); calls.reverts++; },
      };
    },
    set(targets, properties) {
      for (const target of Array.isArray(targets) ? targets : [targets]) {
        if (properties.clearProps) properties.clearProps.split(',').forEach(key => { delete target.style[key]; });
        else { Object.assign(target.style, properties); calls.hidden.push(target); }
      }
    },
    fromTo(target, from, to) { Object.assign(target.style, from); calls.tweens.push({ target, from, to }); },
    killTweensOf() {},
  };
  const cleanup = createPageMotion(root, engine);
  return {
    win, query, items, root, calls, cleanup, settleFonts,
    flush() { const batch = [...frames.values()]; frames.clear(); batch.forEach(callback => callback()); },
    frameCount: () => frames.size,
  };
}

test('direct hash entry aligns before animating the requested section', () => {
  const env = environment({ hash: '#concepts' });
  assert.equal(env.win.scrollY, 2120);
  assert.deepEqual(env.calls.tweens.map(tween => tween.target.id), ['concepts']);
  assert.equal(env.calls.tweens[0].from.filter, 'blur(8px)');
  assert.equal(env.calls.tweens[0].to.clearProps, 'opacity,filter,willChange');
  env.cleanup();
});

test('same-document hash navigation replays the destination', () => {
  const env = environment({ hash: '#cases' });
  env.win.location.hash = '#concepts';
  env.win.emit('hashchange');
  env.flush();
  assert.equal(env.win.scrollY, 2120);
  assert.equal(env.calls.tweens.at(-1).target.id, 'concepts');
  env.win.emit('hashchange');
  env.flush();
  assert.equal(env.calls.tweens.filter(tween => tween.target.id === 'concepts').length, 2);
  env.cleanup();
});

test('cold history navigation and BFCache preserve restored scroll position', () => {
  const env = environment({ hash: '#cases', history: true, scroll: 2300 });
  assert.equal(env.calls.scrolls, 0);
  assert.equal(env.calls.tweens[0].target.id, 'concepts');
  env.win.emit('pageshow', { persisted: true });
  env.flush();
  assert.equal(env.calls.scrolls, 0);
  assert.equal(env.win.scrollY, 2300);
  assert.equal(env.calls.tweens.filter(tween => tween.target.id === 'concepts').length, 2);
  env.cleanup();
});

test('reduced motion disables animations and changing preference reverts inline styles', () => {
  const env = environment({ hash: '#cases', reduced: true });
  assert.equal(env.calls.tweens.length, 0);
  assert.equal(env.calls.hidden.length, 0);
  assert.equal(env.win.scrollY, 1020);
  env.query.matches = false;
  env.query.emit('change');
  assert.ok(env.calls.tweens.length > 0);
  env.query.matches = true;
  env.query.emit('change');
  env.items.forEach(item => assert.deepEqual(item.style, {}));
  env.cleanup();
});

test('observer reveals arriving sections and stops observing each revealed section', () => {
  const env = environment();
  const observer = env.calls.observers[0];
  observer.callback([{ target: env.items[1], isIntersecting: true }]);
  assert.equal(env.calls.tweens.at(-1).target.id, 'cases');
  assert.equal(observer.targets.has(env.items[1]), false);
  env.cleanup();
});

test('without IntersectionObserver no offscreen content is hidden', () => {
  const env = environment({ observer: false });
  assert.equal(env.calls.hidden.length, 0);
  assert.deepEqual(env.items[1].style, {});
  env.cleanup();
});

test('keyboard focus makes a pending section immediately readable', () => {
  const env = environment({ casePage: true });
  assert.equal(env.items[1].style.opacity, 0);
  env.root.emit('focusin', { target: env.items[1] });
  assert.deepEqual(env.items[1].style, {});
  env.cleanup();
});

test('cleanup removes listeners, frames and styles; late font readiness is ignored', async () => {
  const env = environment();
  env.cleanup();
  env.settleFonts();
  await Promise.resolve();
  assert.equal(env.win.listenerCount(), 0);
  assert.equal(env.query.listenerCount(), 0);
  assert.equal(env.root.listenerCount(), 0);
  assert.equal(env.frameCount(), 0);
  env.items.forEach(item => assert.deepEqual(item.style, {}));
});

test('font loading never overrides a user-initiated scroll', async () => {
  const env = environment({ hash: '#cases' });
  env.win.scrollY = 1600;
  env.win.emit('wheel');
  env.settleFonts();
  await Promise.resolve();
  env.flush();
  assert.equal(env.win.scrollY, 1600);
  assert.equal(env.calls.scrolls, 1);
  env.cleanup();
});

test('malformed hashes are ignored without breaking page rendering', () => {
  const env = environment({ hash: '#%ZZ' });
  assert.equal(env.calls.scrolls, 0);
  assert.equal(env.calls.tweens[0].target.id, 'hero');
  env.cleanup();
});
