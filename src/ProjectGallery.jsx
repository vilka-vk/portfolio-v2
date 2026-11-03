import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ContentImage } from './content-renderer.jsx';
import { createGalleryNavigation, groupAfterKey } from './gallery-state.js';

const tabs = ['cases', 'concepts'];
const descriptions = {
  forrest: ['Система управления рестораном', 'Restaurant management system'],
  gutstuff: ['Приложение для здоровья кишечника', 'Gut health app'],
  saymore: ['Платформа поддержки и общения', 'Community and support platform'],
  oprosso: ['Платформа для исследований', 'Research platform'],
  bashnya: ['Интерфейс игрового киоска, AI-пайплайн', 'In-game kiosk interface, AI pipeline'],
  kant: ['Образовательный сайт, AI-пайплайн', 'Education website, AI pipeline'],
  taromant: ['Колесо фортуны в Telegram', 'Telegram fortune wheel'],
  trinoray: ['Исследование поискового интерфейса', 'Search interface research'],
};
function Copy({ values }) {
  return <><span className="lru">{values[0]}</span><span className="len">{values[1]}</span></>;
}

function ProjectCard({ project, language }) {
  const Tag = project.href ? 'a' : 'article';
  const linkProps = project.href ? {
    href: project.href,
    ...(project.external ? { target: '_blank', rel: 'noopener' } : {}),
    'aria-label': `${project.title} – ${project.id === 'kant' ? (language === 'en' ? 'view website' : 'посмотреть сайт') : (language === 'en' ? 'view project' : 'открыть проект')}`,
  } : { tabIndex: 0, 'aria-label': project.title };
  return <Tag className={`project-card${project.href ? '' : ' project-card-static'}`} {...linkProps}>
    <div className="project-media"><ContentImage src={`/${project.image}`} alt={project.alt} loading={project.loading} />
      {project.href && (!project.external || project.id === 'kant') && <span className={`project-open${project.id === 'kant' ? ' project-open-site' : ''}`} aria-hidden="true">
        {project.id === 'kant' && <Copy values={['Посмотреть сайт', 'View website']} />}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
      </span>}
    </div>
    <div className="project-title" title={`${project.title} – ${descriptions[project.id][language === 'en' ? 1 : 0]}`}><h3>{project.title}</h3><span aria-hidden="true"> – </span><Copy values={descriptions[project.id]} /></div>
  </Tag>;
}

export function ProjectGallery({ groups, language }) {
  const [active, setActive] = useState('cases');
  const navigation = useRef(null);
  const buttons = useRef({});
  const tabList = useRef(null);
  const indicator = useRef(null);
  const panelContainer = useRef(null);
  const panels = useRef({});
  const previous = useRef('cases');
  const animateNext = useRef(false);
  const motion = useRef([]);
  const indicatorMotion = useRef(null);
  const previousHeight = useRef(null);
  useEffect(() => {
    // Prepare the first row of both categories shortly before the gallery comes into view.
    const prepareImages = () => {
      for (const panel of Object.values(panels.current)) {
        for (const image of [...panel.querySelectorAll('.project-media img')].slice(0, 2)) {
          image.fetchPriority = 'low';
          image.loading = 'eager';
          image.decode?.().catch(() => {});
        }
      }
    };
    if (!window.IntersectionObserver) { prepareImages(); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { prepareImages(); observer.disconnect(); }
    }, { rootMargin: '600px' });
    observer.observe(panelContainer.current.closest('section'));
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    let initializing = true;
    navigation.current = createGalleryNavigation(window, group => {
      animateNext.current = !initializing;
      if (!initializing) previousHeight.current = panelContainer.current.getBoundingClientRect().height;
      setActive(group);
    });
    initializing = false;
    delete document.documentElement.dataset.galleryInitial;
    return () => {
      navigation.current.dispose();
      navigation.current = null;
      motion.current.forEach(animation => animation.cancel());
      indicatorMotion.current?.cancel();
    };
  }, []);
  useLayoutEffect(() => {
    const from = previous.current;
    previous.current = active;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animate = animateNext.current && from !== active && !reduced.matches && Boolean(panelContainer.current.animate);
    animateNext.current = false;
    const pill = indicator.current;
    const movePill = smooth => {
      const button = buttons.current[active];
      const current = pill.getBoundingClientRect();
      const parent = tabList.current.getBoundingClientRect();
      const bounds = button.getBoundingClientRect();
      const target = { transform: `translateX(${bounds.left - parent.left}px)`, width: `${bounds.width}px` };
      indicatorMotion.current?.cancel();
      Object.assign(pill.style, target);
      if (smooth) indicatorMotion.current = pill.animate([
        { transform: `translateX(${current.left - parent.left}px)`, width: `${current.width}px` }, target,
      ], { duration: 360, easing: 'cubic-bezier(.16,1,.3,1)' });
      tabList.current.dataset.motionReady = '';
    };
    movePill(animate);
    const container = panelContainer.current;
    const height = previousHeight.current ?? container.getBoundingClientRect().height;
    previousHeight.current = null;
    const snapshots = {};
    for (const group of tabs) {
      const panel = panels.current[group];
      const running = panel.getAnimations().some(animation => animation.playState === 'running');
      if (running) {
        const style = getComputedStyle(panel);
        snapshots[group] = { opacity: style.opacity, transform: style.transform };
      }
    }
    motion.current.forEach(animation => animation.cancel());
    motion.current = [];
    container.style.height = '';
    const reset = () => {
      motion.current.forEach(animation => animation.cancel());
      motion.current = [];
      indicatorMotion.current?.cancel();
      container.style.height = '';
      for (const group of tabs) {
        panels.current[group].hidden = group !== active;
        panels.current[group].style.willChange = '';
      }
    };
    if (animate) {
      const direction = tabs.indexOf(active) > tabs.indexOf(from) ? 1 : -1;
      for (const group of tabs) {
        const panel = panels.current[group];
        const incoming = group === active;
        panel.hidden = false;
        panel.style.willChange = 'transform, opacity';
        const animation = panel.animate([
          snapshots[group] || (incoming
            ? { opacity: 0, transform: `translate3d(${direction * 28}px,0,0)` }
            : { opacity: 1, transform: 'translate3d(0,0,0)' }),
          incoming
            ? { opacity: 1, transform: 'translate3d(0,0,0)' }
            : { opacity: 0, transform: `translate3d(${-direction * 16}px,0,0)` },
        ], { duration: incoming ? 360 : 180,
          easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
        animation.onfinish = () => {
          if (previous.current !== active) return;
          if (!incoming) panel.hidden = true;
          animation.cancel();
          panel.style.willChange = '';
        };
        motion.current.push(animation);
      }
      const targetHeight = panels.current[active].getBoundingClientRect().height;
      if (Math.abs(height - targetHeight) > 1) {
        container.style.height = `${targetHeight}px`;
        const resize = container.animate([{ height: `${height}px` }, { height: `${targetHeight}px` }],
          { duration: 360, easing: 'cubic-bezier(.16,1,.3,1)' });
        resize.onfinish = () => { if (previous.current === active) container.style.height = ''; };
        motion.current.push(resize);
      }
    } else reset();
    const tabGeometry = () => Object.values(buttons.current).map(button => `${button.offsetLeft}:${button.offsetWidth}`).join('|');
    let measured = tabGeometry();
    const observer = new ResizeObserver(() => {
      const next = tabGeometry();
      if (next !== measured) { measured = next; movePill(false); }
    });
    observer.observe(tabList.current);
    for (const button of Object.values(buttons.current)) observer.observe(button);
    const onReducedMotion = () => { if (reduced.matches) reset(); };
    reduced.addEventListener('change', onReducedMotion);
    return () => {
      observer.disconnect();
      reduced.removeEventListener('change', onReducedMotion);
    };
  }, [active, language]);
  const select = group => navigation.current?.select(group);
  const onKeyDown = (event, group) => {
    const target = groupAfterKey(group, event.key);
    if (!target) return;
    event.preventDefault();
    select(target);
    buttons.current[target]?.focus();
  };
  return <section className="projects-section page-shell" id="cases" aria-label={language === 'en' ? 'Projects' : 'Проекты'}>
    <span id="concepts" className="gallery-anchor" aria-hidden="true" />
    <div className="project-tabs" ref={tabList} role="tablist" aria-label={language === 'en' ? 'Project categories' : 'Категории проектов'}>
      <span className="project-tab-indicator" ref={indicator} aria-hidden="true" />
      {tabs.map(group => <button key={group} type="button" role="tab" id={`tab-${group}`} aria-controls={`panel-${group}`} aria-selected={active === group} tabIndex={active === group ? 0 : -1}
        ref={node => { buttons.current[group] = node; }} onClick={() => select(group)} onKeyDown={event => onKeyDown(event, group)}>
        <Copy values={group === 'cases' ? ['Продукты', 'Products'] : ['Лаборатория', 'Laboratory']} />
      </button>)}
    </div>
    <div className="gallery-panels" ref={panelContainer}>
    {tabs.map(group => <div key={group} ref={node => { panels.current[group] = node; }} className="gallery-panel" id={`panel-${group}`} role="tabpanel" aria-labelledby={`tab-${group}`} hidden={active !== group} aria-hidden={active !== group} inert={active !== group}>
      <div className="case-grid">{groups[group].map(project => <ProjectCard key={project.id} project={project} language={language} />)}</div>
    </div>)}
    </div>
  </section>;
}
