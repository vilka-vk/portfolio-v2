import { gsap } from 'gsap';

// No hidden CSS baseline: prerendered pages remain readable without JavaScript.
export function createPageMotion(root, engine = gsap) {
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const reducedMotion = win.matchMedia('(prefers-reduced-motion: reduce)');
  const items = root.matches('.case') ? Array.from(root.children) : Array.from(root.querySelectorAll(':scope > section'));
  let disposed = false;
  let frame;
  let userInteracted = false;
  let motion;
  const initialHash = win.location.hash;
  const restoringHistory = win.performance.getEntriesByType('navigation')[0]?.type === 'back_forward';

  function hashTarget() {
    try {
      return doc.getElementById(decodeURIComponent(win.location.hash.slice(1)));
    } catch { return null; }
  }

  function mountMotion() {
    const pending = new Set(items);
    const context = engine.context(() => {}, root);
    context.add('reveal', (item, replay = false) => {
      if (!pending.has(item) && !replay) return;
      pending.delete(item);
      engine.fromTo(item, { opacity: 0, filter: 'blur(8px)' }, {
        opacity: 1, filter: 'blur(0px)', duration: 0.7, ease: 'power2.out',
        overwrite: true, willChange: 'opacity,filter', clearProps: 'opacity,filter,willChange',
      });
    });
    const revealVisible = (replay = false) => {
      items.forEach(item => {
        const rect = item.getBoundingClientRect();
        if (rect.height > 0 && rect.bottom > 0 && rect.top < win.innerHeight) context.reveal(item, replay);
      });
    };
    // Browsers without IntersectionObserver must never leave content hidden.
    const observer = win.IntersectionObserver ? new win.IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          context.reveal(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -5%' }) : null;
    context.add(() => {
      if (observer) {
        engine.set(items, { opacity: 0, filter: 'blur(8px)' });
        items.forEach(item => observer.observe(item));
      }
      revealVisible();
    });
    const onFocus = event => {
      const item = items.find(item => item.contains(event.target));
      if (!item) return;
      pending.delete(item);
      engine.killTweensOf(item);
      // Keyboard focus is always immediately visible, never hidden by a reveal.
      engine.set(item, { clearProps: 'opacity,filter,willChange' });
    };
    root.addEventListener('focusin', onFocus);
    return {
      revealVisible,
      revert() {
        observer?.disconnect();
        root.removeEventListener('focusin', onFocus);
        context.revert();
      },
    };
  }

  function alignHash() {
    const target = hashTarget();
    if (target && root.contains(target)) target.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  function refresh({ align = false, replay = false } = {}) {
    win.cancelAnimationFrame(frame);
    frame = win.requestAnimationFrame(() => {
      if (disposed) return;
      if (align) alignHash();
      motion?.revealVisible(replay);
    });
  }
  function syncMotion() {
    motion?.revert();
    motion = reducedMotion.matches ? null : mountMotion();
  }
  const onHashChange = () => refresh({ align: true, replay: true });
  const onPageShow = event => {
    // Back/forward cache restores its own scroll position; do not jump to the hero.
    if (event.persisted) refresh({ replay: true });
    else refresh();
  };
  const onInteraction = () => { userInteracted = true; };
  if (!restoringHistory) alignHash();
  syncMotion();
  refresh();
  win.addEventListener('hashchange', onHashChange);
  win.addEventListener('pageshow', onPageShow);
  reducedMotion.addEventListener('change', syncMotion);
  const interactionEvents = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
  interactionEvents.forEach(type => win.addEventListener(type, onInteraction, { passive: true }));
  doc.fonts?.ready.then(() => {
    if (!disposed && !userInteracted && !restoringHistory && win.location.hash === initialHash) refresh({ align: true });
  });
  return () => {
    disposed = true;
    win.cancelAnimationFrame(frame);
    motion?.revert();
    win.removeEventListener('hashchange', onHashChange);
    win.removeEventListener('pageshow', onPageShow);
    reducedMotion.removeEventListener('change', syncMotion);
    interactionEvents.forEach(type => win.removeEventListener(type, onInteraction));
  };
}
