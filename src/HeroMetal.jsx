import React, { useEffect, useMemo, useRef, useState } from 'react';

const HEART = 'M8 14 1.8 8.1C-1.7 4.6 3.2-.5 6.8 3L8 4.2 9.2 3c3.6-3.5 8.5 1.6 5 5.1Z';

// Keep the WebGL library out of server rendering and case-page startup.
let runtime;
const loadRuntime = () => runtime ??= import('metal-fx');

export function useHeroMetal(rootRef) {
  const [api, setApi] = useState(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const hero = rootRef.current?.querySelector('.hero');
    if (!hero) return;
    let alive = true;
    let visible = true;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const colors = window.matchMedia('(forced-colors: active)');
    const sync = () => {
      const shouldPause = document.hidden || !visible;
      setPaused(shouldPause);
      if (motion.matches || colors.matches) { setApi(null); return; }
      loadRuntime().then(module => {
        if (!alive || motion.matches || colors.matches) return;
        if (module.isMetalFxSupported()) setApi(module);
      }).catch(() => { /* The static design remains usable if the effect cannot load. */ });
    };
    const observer = window.IntersectionObserver
      ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }) : null;
    observer?.observe(hero);
    motion.addEventListener('change', sync);
    colors.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => {
      alive = false;
      observer?.disconnect();
      motion.removeEventListener('change', sync);
      colors.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [rootRef]);
  useEffect(() => {
    if (!api) return;
    if (paused) api.pauseShared();
    else api.resumeShared();
  }, [api, paused]);
  return useMemo(() => ({ api, paused }), [api, paused]);
}

function useInlineMetal(rootRef, textRef, canvasRef, metal, heart = false) {
  const instanceRef = useRef(null);
  const pausedRef = useRef(metal?.paused ?? false);
  pausedRef.current = metal?.paused ?? false;
  const api = metal?.api;
  useEffect(() => {
    if (!api) return;
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const maskCanvas = document.createElement('canvas');
    const maskContext = maskCanvas.getContext('2d');
    if (!maskContext) return;
    let disposed = false;
    let frame;
    let dprQuery;
    const draw = () => {
      if (disposed) return;
      const rect = root.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = window.devicePixelRatio || 1;
      maskCanvas.width = Math.max(1, Math.round(rect.width * dpr));
      maskCanvas.height = Math.max(1, Math.round(rect.height * dpr));
      maskContext.fillStyle = '#fff';
      if (heart) {
        maskContext.scale(maskCanvas.width / 16, maskCanvas.height / 16);
        maskContext.fill(new Path2D(HEART));
      } else {
        // paintTextRun supplies the actual DOM baseline; preserve the H1 tracking too.
        maskContext.letterSpacing = getComputedStyle(textRef.current).letterSpacing;
        api.paintTextRun(maskContext, root, textRef.current, dpr);
      }
      const mask = (ctx, width, height) => ctx.drawImage(maskCanvas, 0, 0, width, height);
      if (instanceRef.current) {
        api.updateInstance(instanceRef.current, { cssWidth: rect.width, cssHeight: rect.height, mask });
        api.redrawInstance(canvas);
      } else {
        api.setSharedPreset('chromatic', 'light');
        instanceRef.current = api.createInstance({
          hostCanvas: canvas, cssWidth: rect.width, cssHeight: rect.height,
          kind: 'pill', cornerRadius: 0, shaderScale: heart ? 1.3 : 2.8,
          opacityMul: heart ? 1 : 0.62, mask, paused: pausedRef.current,
        });
      }
    };
    const schedule = () => {
      if (disposed) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    };
    const watchDpr = () => {
      dprQuery?.removeEventListener('change', onDpr);
      dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
      dprQuery.addEventListener('change', onDpr);
    };
    const onDpr = () => {
      // Recreate so the public API picks up DPR even when CSS dimensions stay identical.
      if (instanceRef.current) api.destroyInstance(instanceRef.current);
      instanceRef.current = null;
      schedule();
      watchDpr();
    };
    draw();
    watchDpr();
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    document.fonts?.ready.then(schedule);
    document.fonts?.addEventListener('loadingdone', schedule);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.fonts?.removeEventListener('loadingdone', schedule);
      dprQuery?.removeEventListener('change', onDpr);
      if (instanceRef.current) api.destroyInstance(instanceRef.current);
      instanceRef.current = null;
    };
  }, [api, rootRef, textRef, canvasRef, heart]);
  useEffect(() => {
    if (instanceRef.current && api) api.updateInstance(instanceRef.current, { paused: metal.paused });
  }, [api, metal?.paused]);
}

export function MetalText({ children, metal }) {
  const rootRef = useRef(null);
  const textRef = useRef(null);
  const canvasRef = useRef(null);
  useInlineMetal(rootRef, textRef, canvasRef, metal);
  return <em className="hero-metal-text" ref={rootRef}>
    <span ref={textRef}>{children}</span>
    <canvas ref={canvasRef} className="hero-metal-canvas" aria-hidden="true" />
  </em>;
}

export function MetalHeart({ metal }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  useInlineMetal(rootRef, rootRef, canvasRef, metal, true);
  return <span className="availability-heart" ref={rootRef} aria-hidden="true">
    <svg className="availability-heart-halo" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d={HEART} /></svg>
    <svg className="availability-heart-wave" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1"><path d={HEART} vectorEffect="non-scaling-stroke" /></svg>
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d={HEART} /></svg>
    <canvas ref={canvasRef} className="hero-metal-canvas" />
  </span>;
}
