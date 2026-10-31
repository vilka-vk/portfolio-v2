import React, { useLayoutEffect, useRef } from 'react';

export function LanguageSwitch({ language, onChange }) {
  const rootRef = useRef(null);
  const indicatorRef = useRef(null);
  const buttonsRef = useRef({});
  const animationRef = useRef(null);
  const animateNext = useRef(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const indicator = indicatorRef.current;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const move = smooth => {
      const button = buttonsRef.current[language];
      const current = indicator.getBoundingClientRect();
      const parent = root.getBoundingClientRect();
      const bounds = button.getBoundingClientRect();
      const target = { transform: `translateX(${bounds.left - parent.left}px)`, width: `${bounds.width}px` };
      animationRef.current?.cancel();
      Object.assign(indicator.style, target);
      if (smooth && indicator.animate) {
        animationRef.current = indicator.animate([
          { transform: `translateX(${current.left - parent.left}px)`, width: `${current.width}px` }, target,
        ], { duration: 360, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
      root.dataset.motionReady = '';
    };
    move(animateNext.current && !reduced.matches);
    animateNext.current = false;
    const geometry = () => Object.values(buttonsRef.current).map(button => `${button.offsetLeft}:${button.offsetWidth}`).join('|');
    let measured = geometry();
    const observer = new ResizeObserver(() => {
      const next = geometry();
      if (next !== measured) { measured = next; move(false); }
    });
    observer.observe(root);
    for (const button of Object.values(buttonsRef.current)) observer.observe(button);
    const onReducedMotion = () => { if (reduced.matches) move(false); };
    reduced.addEventListener('change', onReducedMotion);
    return () => {
      observer.disconnect();
      reduced.removeEventListener('change', onReducedMotion);
    };
  }, [language]);

  useLayoutEffect(() => () => animationRef.current?.cancel(), []);

  return <div className="lang-switch" ref={rootRef} role="group" aria-label={language === 'en' ? 'Select language' : 'Выбрать язык'}>
    <span className="lang-switch-indicator" ref={indicatorRef} aria-hidden="true" />
    {['ru', 'en'].map(value => <button key={value} type="button" ref={node => { buttonsRef.current[value] = node; }}
      className={language === value ? 'active' : ''} aria-pressed={language === value}
      onClick={() => { animateNext.current = value !== language; onChange(value); }}>{value.toUpperCase()}</button>)}
  </div>;
}
