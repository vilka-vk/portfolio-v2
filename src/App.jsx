import React, { createContext, memo, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import parse, { domToReact } from 'html-react-parser';
import { BorderBeam } from 'border-beam';
import { Skills } from './Skills.jsx';
import { createPageMotion } from './page-motion.js';
import projects from './content/projects.json';
import homeContent from './content/home.html?raw';
import { ContentImage, parseContent } from './content-renderer.jsx';
import { getLanguage, getServerLanguage, setLanguage, subscribeLanguage } from './language-store.js';
import { prepareCase, caseLinks } from './case-layout.js';
import { CaseResults } from './CaseResults.jsx';

const caseContent = import.meta.glob(['./content/*.html', '!./content/home.html'], { query: '?raw', import: 'default' });
const Language = createContext(null);
const cvByLanguage = {
  ru: '/Senior_Product_Designer_Violetta_Morozova_Rus.pdf',
  en: '/Senior_Product_Designer_Violetta_Morozova_Eng.pdf',
};
const linkedIn = 'https://linkedin.com/in/violetta-morozova';
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

function usePageMotion(ready = true) {
  const rootRef = useRef(null);
  useLayoutEffect(() => {
    if (!ready || !rootRef.current) return;
    return createPageMotion(rootRef.current);
  }, [ready]);
  return rootRef;
}

function Text({ ru, en }) {
  return <><span className="lru">{ru}</span><span className="len">{en}</span></>;
}

function Header({ isCase }) {
  const { language, setLanguage } = useContext(Language);
  const cv = cvByLanguage[language];
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  const sectionLink = id => `${isCase ? '/index.html' : ''}#${id}`;
  return <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
    <a className="identity" href={sectionLink('top')} aria-label="Violetta Morozova — на главную">
      <ContentImage src="/img/avatar.png" alt="Violetta Morozova" loading="eager" />
      <span><b>Violetta Morozova</b><small>Senior Product Designer</small></span>
    </a>
    <nav className="header-nav" aria-label={language === 'en' ? 'Main navigation' : 'Основная навигация'}>
      <a href={sectionLink('cases')}><Text ru="Кейсы" en="Cases" /></a>
      <a href={sectionLink('concepts')}><Text ru="Концепты" en="Concepts" /></a>
      <a href={sectionLink('experience')}><Text ru="Опыт" en="Experience" /></a>
    </nav>
    <div className="header-actions">
      <div className="lang-switch" role="group" aria-label={language === 'en' ? 'Select language' : 'Выбрать язык'}>
        {['ru', 'en'].map(value => <button key={value} type="button" className={language === value ? 'active' : ''} aria-pressed={language === value} onClick={() => setLanguage(value)}>{value.toUpperCase()}</button>)}
      </div>
      <a className="quiet-link" href={cv} download>CV ↗</a>
      <a className="quiet-link hide-mobile hide-tablet" href={linkedIn} target="_blank" rel="noopener">LinkedIn ↗</a>
    </div>
  </header>;
}

function Footer() {
  const { language } = useContext(Language);
  const cv = cvByLanguage[language];
  return <footer className="site-footer"><div className="page-shell footer-inner">
    <div className="footer-bottom"><span>© 2026 Violetta Morozova</span><div>
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
    <div className="project-title"><h3>{project.title}</h3>{project.category === 'cases' && <p><Text ru={descriptions[project.id][0]} en={descriptions[project.id][1]} /></p>}</div>
    <div className="project-media"><ContentImage src={`/${project.image}`} alt={project.alt} /></div>
    <div className="project-metrics"><ul>{project.metricElements.map((metric, index) => <li key={index}>{index ? <div>{metric}</div> : metric}</li>)}</ul>{project.href && <strong className="metrics-arrow" aria-hidden="true">↗</strong>}</div>
  </Tag>;
}

const projectGroups = projects.reduce((groups, project) => {
  groups[project.category].push({ ...project, metricElements: project.metrics.map(metric => parse(metric)) });
  return groups;
}, { cases: [], concepts: [] });

function ForestBeam({ children, className, hoverOnly = false }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const highlighted = hovered || focused;
  return <BorderBeam
    className={`forest-beam ${className}`} size="md" colorVariant="forest"
    theme={highlighted ? 'dark' : 'light'} active={!hoverOnly || highlighted}
    borderRadius={1000} duration={3} glowSize={5}
    brightness={highlighted ? 2.2 : 1.5} saturation={highlighted ? 2 : 1.8}
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocus={() => setFocused(true)} onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
    }}
    css={`
      [data-beam="{id}"]{overflow:visible;isolation:isolate;--beam-stroke-opacity:0;--beam-inner-opacity:0}
      [data-beam="{id}"] [data-beam-bloom]{
        z-index:-1;
        clip-path:none;
        -webkit-mask:none;
        mask:none;
        inset:-12px;
        padding:0;
        background:conic-gradient(from var(--beam-angle-{id}),transparent 0%,rgba(57,255,117,.15) 12%,rgba(57,255,117,.65) 30%,#39ff75 48%,#00eeb0 68%,rgba(0,238,176,.6) 82%,rgba(0,238,176,.1) 95%,transparent 100%);
        filter:blur(28px) saturate(1.8);
      }
      [data-beam="{id}"][data-active] [data-beam-bloom],
      [data-beam="{id}"][data-fading] [data-beam-bloom]{
        opacity:calc(var(--beam-opacity-{id}) * ${highlighted ? 1 : 0.8});
      }
    `}
  >{children}</BorderBeam>;
}

const Home = memo(function Home() {
  const rootRef = usePageMotion();
  const content = useMemo(() => parse(homeContent, { replace(node) {
    if (node.name === 'a' && node.attribs?.class === 'round-link') {
      return <ForestBeam className="contact-beam">
        <a className="round-link" href={node.attribs.href}>{domToReact(node.children)}</a>
      </ForestBeam>;
    }
    if (node.attribs?.['data-skills'] !== undefined) return <Skills />;
    const group = node.attribs?.['data-project-grid'];
    if (!group) return;
    const groupProjects = projectGroups[group];
    return <div className="case-grid">{groupProjects.map(project => <ProjectCard key={project.id} project={project} />)}</div>;
  } }), []);
  return <main id="top" tabIndex={-1} ref={rootRef}>{content}</main>;
});

function CaseStudy({ slug, initialContent }) {
  const { language } = useContext(Language);
  const [content, setContent] = useState(initialContent || '');
  const [failed, setFailed] = useState(false);
  const rootRef = usePageMotion(Boolean(content));
  const prepared = useMemo(() => prepareCase(content), [content]);
  const links = useMemo(() => caseLinks(prepared), [prepared]);
  const navigation = prepared.match(/<nav class="case-nav"[\s\S]*?<\/nav>/)?.[0] || '';
  const renderedContent = useMemo(() => prepared ? parseContent(prepared.replace(/<nav class="case-nav"[\s\S]*?<\/nav>/, ''), true) : null, [prepared]);
  const project = projectGroups.cases.concat(projectGroups.concepts).find(item => item.id === slug);
  const contentNodes = React.Children.toArray(renderedContent);
  const heroIndex = contentNodes.findIndex(node => node.props?.className === 'case-hero');
  const results = content && project && <CaseResults project={project} />;
  useEffect(() => {
    if (initialContent) return;
    let active = true;
    const load = caseContent[`./content/${slug}.html`];
    if (!load) { setFailed(true); return; }
    load().then(value => { if (active) setContent(value); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [slug, initialContent]);
  if (failed) return <main className="narrow case" id="top"><h1><Text ru="Не удалось открыть кейс" en="Unable to load this case" /></h1><a href="/index.html#cases"><Text ru="Все кейсы" en="All cases" /></a></main>;
  return <main className="narrow case" id="top" tabIndex={-1} ref={rootRef} aria-busy={!content}>
    {content && <aside className="case-outline">
      <a className="case-back" href={`/index.html#${project?.category === 'concepts' ? 'concepts' : 'cases'}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 4-5 5 5 5M4 9h10a6 6 0 0 1 0 12h-2" /></svg>
        {project?.category === 'concepts' ? <Text ru="Все концепты" en="All concepts" /> : <Text ru="Все продукты" en="All products" />}
      </a>
      <nav aria-label={language === 'ru' ? 'Разделы кейса' : 'Case sections'}><a href="#top"><Text ru="Начало" en="Overview" /></a>{links.map(link => <a key={link.id} href={`#${link.id}`}>{parse(link.label)}</a>)}</nav>
    </aside>}
    <div className="case-document">{renderedContent ? contentNodes.map((node,index) => <React.Fragment key={index}>{node}{index === heroIndex && results}</React.Fragment>) : <p role="status"><Text ru="Загрузка кейса…" en="Loading case…" /></p>}</div>
    {navigation && parse(navigation)}
  </main>;
}

export function App({ pathname, initialContent }) {
  const language = useSyncExternalStore(subscribeLanguage, getLanguage, getServerLanguage);
  const languageContext = useMemo(() => ({ language, setLanguage }), [language]);
  const slug = pathname.match(/\/cases\/([^/.]+)(?:\.html)?\/?$/)?.[1];
  useEffect(() => {
    document.body.dataset.lang = language;
    document.documentElement.lang = language;
  }, [language]);
  return <Language.Provider value={languageContext}>
    <a className="skip-link" href="#top"><Text ru="Перейти к содержимому" en="Skip to content" /></a>
    <Header isCase={Boolean(slug)} />
    {slug ? <CaseStudy slug={slug} initialContent={initialContent} /> : <Home />}
    <Footer />
  </Language.Provider>;
}

