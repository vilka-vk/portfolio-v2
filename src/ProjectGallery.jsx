import React, { useLayoutEffect, useRef, useState } from 'react';
import { ContentImage } from './content-renderer.jsx';
import { createGalleryNavigation, groupAfterKey } from './gallery-state.js';

const tabs = ['cases', 'concepts'];
const descriptions = {
  forrest: ['Система управления рестораном', 'Restaurant management system'],
  gutstuff: ['Приложение для здоровья кишечника', 'Gut health app'],
  saymore: ['Платформа поддержки и общения', 'Community and support platform'],
  oprosso: ['Платформа для исследований', 'Research platform'],
  bashnya: ['Интерфейс игрового киоска', 'In-game kiosk interface'],
  kant: ['Образовательный сайт', 'Education website'],
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
    'aria-label': `${project.title} — ${language === 'en' ? 'view project' : 'открыть проект'}`,
  } : { tabIndex: 0, 'aria-label': project.title };
  return <Tag className={`project-card${project.href ? '' : ' project-card-static'}`} {...linkProps}>
    <div className="project-title"><h3>{project.title}</h3><p><Copy values={descriptions[project.id]} /></p></div>
    <div className="project-media"><ContentImage src={`/${project.image}`} alt={project.alt} loading={project.loading} /></div>
    <div className="project-metrics"><ul>{project.metricElements.map((metric, index) => <li key={index}>{metric}</li>)}</ul>{project.href && <><span className="metrics-arrow" aria-hidden="true">↗</span><span className="project-details"><Copy values={['Подробнее', 'Read more']} /> <span aria-hidden="true">↗</span></span></>}</div>
  </Tag>;
}

export function ProjectGallery({ groups, language }) {
  const [active, setActive] = useState('cases');
  const navigation = useRef(null);
  const buttons = useRef({});
  useLayoutEffect(() => {
    navigation.current = createGalleryNavigation(window, setActive);
    delete document.documentElement.dataset.galleryInitial;
    return () => { navigation.current.dispose(); navigation.current = null; };
  }, []);
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
    <div className="project-tabs" role="tablist" aria-label={language === 'en' ? 'Project categories' : 'Категории проектов'}>
      {tabs.map(group => <button key={group} type="button" role="tab" id={`tab-${group}`} aria-controls={`panel-${group}`} aria-selected={active === group} tabIndex={active === group ? 0 : -1}
        ref={node => { buttons.current[group] = node; }} onClick={() => select(group)} onKeyDown={event => onKeyDown(event, group)}>
        <Copy values={group === 'cases' ? ['Продукты', 'Products'] : ['Лаборатория', 'Laboratory']} />
      </button>)}
    </div>
    {tabs.map(group => <div key={group} id={`panel-${group}`} role="tabpanel" aria-labelledby={`tab-${group}`} hidden={active !== group}>
      <div className="case-grid">{groups[group].map(project => <ProjectCard key={project.id} project={project} language={language} />)}</div>
    </div>)}
  </section>;
}
