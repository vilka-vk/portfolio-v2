import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

let runtime;
const loadRuntime = () => runtime ??= import('metal-fx-button');

function ButtonRing({ api, buttonRef, paused, interactive }) {
  const rootRef = useRef(null);
  const reflections = useMemo(() => [buttonRef], [buttonRef]);
  const getBendConfig = useCallback(() => interactive && !paused
    ? api.BEND_DEFAULTS
    : { ...api.BEND_DEFAULTS, enabled: false }, [api, interactive, paused]);
  api.useMetalBend(rootRef, getBendConfig);

  useEffect(() => {
    if (paused) api.pauseShared();
    else api.resumeShared();
  }, [api, paused]);

  const MetalFx = api.MetalFx;
  return <div className="contact-metal-effect" aria-hidden="true">
    <MetalFx ref={rootRef} variant="button" preset="chromatic" theme="dark" borderRadius={1000}
      ringCssPx={2} paused={paused} reflectionTargets={reflections}>
      <span className="contact-metal-host" />
    </MetalFx>
  </div>;
}

export function ContactMetal({ children, paused, ...linkProps }) {
  const buttonRef = useRef(null);
  const [api, setApi] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const colors = matchMedia('(forced-colors: active)');
    const pointer = matchMedia('(hover: hover) and (pointer: fine)');
    let alive = true;
    const sync = () => {
      const allowed = !motion.matches && !colors.matches;
      setEnabled(allowed);
      setInteractive(pointer.matches);
      if (!allowed) return;
      loadRuntime().then(module => {
        if (alive && !motion.matches && !colors.matches && module.isMetalFxSupported()) setApi(module);
      }).catch(() => { /* The original link remains visible if the effect cannot load. */ });
    };
    for (const query of [motion, colors, pointer]) query.addEventListener('change', sync);
    sync();
    return () => {
      alive = false;
      for (const query of [motion, colors, pointer]) query.removeEventListener('change', sync);
    };
  }, []);

  return <div className="contact-metal">
    <a {...linkProps} className="round-link" ref={buttonRef}>{children}</a>
    {api && enabled && <ButtonRing api={api} buttonRef={buttonRef} paused={paused} interactive={interactive} />}
  </div>;
}
