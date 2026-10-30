import React, { createContext, memo, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import parse, { domToReact } from 'html-react-parser';
import { MetalHeart, MetalText, useHeroMetal } from './HeroMetal.jsx';
import { Skills } from './Skills.jsx';
import { ProjectGallery } from './ProjectGallery.jsx';
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

function Header() {
  const { language, setLanguage } = useContext(Language);
  const cv = cvByLanguage[language];
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
    <a className="identity" href="/" aria-label="Violetta Morozova — на главную">
      <ContentImage src="/img/avatar.png" alt="Violetta Morozova" loading="eager" />
      <span><b>Violetta Morozova</b><small>Senior Product Designer</small></span>
    </a>
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

const projectGroups = projects.reduce((groups, project) => {
  groups[project.category].push({ ...project, metricElements: project.metrics.map(metric => parse(metric)) });
  return groups;
}, { cases: [], concepts: [] });

const Home = memo(function Home() {
  const { language } = useContext(Language);
  const rootRef = usePageMotion();
  const metal = useHeroMetal(rootRef);
  const content = useMemo(() => {
    const options = { replace(node) {
      if (node.name === 'a' && node.attribs?.class === 'round-link') {
        return <div className="contact-metal">
          <a className="round-link" href={node.attribs.href} target={node.attribs.target} rel={node.attribs.rel}>{domToReact(node.children)}</a>
        </div>;
      }
      if (node.attribs?.['data-metal-heart'] !== undefined) return <MetalHeart metal={metal} />;
      if (node.name === 'em' && node.attribs?.['data-metal-text'] !== undefined) {
        const active = node.attribs['data-metal-text'] === language;
        return <MetalText metal={active ? metal : null}>{node.children[0].data}</MetalText>;
      }
      if (node.attribs?.['data-skills'] !== undefined) return <Skills />;
      if (node.attribs?.['data-project-gallery'] !== undefined) return <ProjectGallery groups={projectGroups} language={language} />;
    } };
    return parse(homeContent, options);
  }, [language, metal]);
  return <main id="top" tabIndex={-1} ref={rootRef} data-metal-paused={metal.paused ? 'true' : undefined}>{content}</main>;
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
        {project?.category === 'concepts' ? <Text ru="В Лабораторию" en="Back to the Laboratory" /> : <Text ru="Все продукты" en="All products" />}
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
    <Header />
    {slug ? <CaseStudy slug={slug} initialContent={initialContent} /> : <Home />}
    <Footer />
  </Language.Provider>;
}

