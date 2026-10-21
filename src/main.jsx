import React, { createContext, useContext, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import parse from 'html-react-parser';
import projects from './content/projects.json';
import homeContent from './content/home.html?raw';
import '../styles.css';

const caseContent = import.meta.glob(['./content/*.html', '!./content/home.html'], { query: '?raw', import: 'default' });
const Language = createContext(null);
const cv = '/Senior_Product_Designer_Violetta_Morozova_Eng.pdf';
const linkedIn = 'https://linkedin.com/in/violetta-morozova';

function useReveal(ready = true) {
  useEffect(() => {
    if (!ready || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const items = document.querySelectorAll('.project-card,.experience-list article,.case-fig,.case h2,.case h3');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -5%' });
    items.forEach(item => { item.classList.add('reveal'); observer.observe(item); });
    return () => { observer.disconnect(); items.forEach(item => item.classList.remove('reveal', 'visible')); };
  }, [ready]);
}

function Text({ ru, en }) {
  const { language } = useContext(Language);
  return language === 'en' ? en : ru;
}

function Header({ isCase }) {
  const { language, setLanguage } = useContext(Language);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  const sectionLink = id => `${isCase ? '/index.html' : ''}#${id}`;
  return <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
    <a className="identity" href={sectionLink('top')} aria-label="Violetta Morozova — на главную">
      <img src="/img/avatar.png" alt="Violetta Morozova" />
      <span><b>Violetta Morozova</b><small>Senior Product Designer</small></span>
    </a>
    <nav className="header-nav" aria-label="Основная навигация">
      <a href={sectionLink('cases')}><Text ru="Кейсы" en="Cases" /></a>
      <a href={sectionLink('concepts')}><Text ru="Концепты" en="Concepts" /></a>
      <a href={sectionLink('experience')}><Text ru="Опыт" en="Experience" /></a>
    </nav>
    <div className="header-actions">
      <div className="lang-switch" aria-label="Выбрать язык">
        {['ru', 'en'].map(value => <button key={value} type="button" className={language === value ? 'active' : ''} aria-pressed={language === value} onClick={() => setLanguage(value)}>{value.toUpperCase()}</button>)}
      </div>
      <a className="quiet-link hide-mobile" href={cv} download>CV ↗</a>
      <a className="quiet-link hide-tablet" href={linkedIn} target="_blank" rel="noopener">LinkedIn ↗</a>
    </div>
  </header>;
}

function Footer() {
  return <footer className="site-footer"><div className="page-shell footer-inner">
    <div className="footer-bottom"><span>© 2026 Violetta Morozova</span><div>
      <a href={cv} download>CV ↗</a>
      <a href={linkedIn} target="_blank" rel="noopener">LinkedIn ↗</a>
      <a href="#top"><Text ru="Наверх ↑" en="Top ↑" /></a>
    </div></div>
  </div></footer>;
}

function ProjectCard({ project }) {
  const { language } = useContext(Language);
  const Tag = project.href ? 'a' : 'article';
  const linkProps = project.href ? { href: project.href, ...(project.external ? { target: '_blank', rel: 'noopener' } : {}), 'aria-label': `${project.title} — ${language === 'en' ? 'view project' : 'открыть проект'}` } : { tabIndex: 0, 'aria-label': project.title };
  return <Tag className={`project-card${project.href ? '' : ' project-card-static'}`} {...linkProps}>
    <div className="project-meta"><ul className="project-labels">{project.labels.map(label => <li key={label}>{label}</li>)}</ul></div>
    <div className="project-title"><h3>{project.title}</h3></div>
    <div className="project-media"><img src={project.image} alt={project.alt} loading={project.loading || 'lazy'} /></div>
    <div className="project-metrics"><ul>{project.metrics.map((metric, index) => <li key={index}>{index ? <div>{parse(metric)}</div> : parse(metric)}</li>)}</ul>{project.href && <strong className="metrics-arrow" aria-hidden="true">↗</strong>}</div>
  </Tag>;
}

function Home() {
  useReveal();
  return <main id="top">{parse(homeContent, { replace(node) {
    const group = node.attribs?.['data-project-grid'];
    if (!group) return;
    const groupProjects = group === 'cases' ? projects.slice(0, 4) : projects.slice(4);
    return <div className="case-grid">{groupProjects.map(project => <ProjectCard key={project.id} project={project} />)}</div>;
  } })}</main>;
}

function CaseStudy({ slug, initialContent }) {
  const [content, setContent] = useState(initialContent || '');
  const [failed, setFailed] = useState(false);
  useReveal(Boolean(content));
  useEffect(() => {
    if (initialContent) return;
    let active = true;
    const load = caseContent[`./content/${slug}.html`];
    if (!load) { setFailed(true); return; }
    load().then(value => { if (active) setContent(value); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [slug, initialContent]);
  if (failed) return <main className="narrow case" id="top"><h1><Text ru="Не удалось открыть кейс" en="Unable to load this case" /></h1><a href="/index.html#cases"><Text ru="Все кейсы" en="All cases" /></a></main>;
  return <main className="narrow case" id="top" aria-busy={!content}>{content ? parse(content) : <p role="status"><Text ru="Загрузка кейса…" en="Loading case…" /></p>}</main>;
}

export function App({ pathname, initialContent }) {
  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem('vm-v2-lang') === 'en' ? 'en' : 'ru'; } catch { return 'ru'; }
  });
  const slug = pathname.match(/\/cases\/([^/.]+)(?:\.html)?\/?$/)?.[1];
  useEffect(() => {
    document.body.dataset.lang = language;
    document.documentElement.lang = language;
    try { localStorage.setItem('vm-v2-lang', language); } catch { /* Storage may be disabled. */ }
  }, [language]);
  return <Language.Provider value={{ language, setLanguage }}>
    <Header isCase={Boolean(slug)} />
    {slug ? <CaseStudy slug={slug} initialContent={initialContent} /> : <Home />}
    <Footer />
  </Language.Provider>;
}

if (typeof document !== 'undefined') {
  // Reuse pre-rendered case copy on first paint; development loads it lazily.
  const initialContent = document.querySelector('#root main.narrow.case')?.innerHTML;
  createRoot(document.getElementById('root')).render(<App pathname={window.location.pathname} initialContent={initialContent} />);
}
