import React from 'react';

const product = [
  ['UX-исследования', 'UX Research'],
  ['Пользовательские сценарии', 'User Flows'],
  ['CJM', 'CJM'],
  ['Дизайн-системы', 'Design Systems'],
  ['A/B-тестирование', 'A/B Testing'],
  ['Многоролевой UX', 'Multi-role UX'],
  ['Доступность (WCAG)', 'Accessibility (WCAG)'],
];
const groups = [
  { id: 'ai', title: ['AI', 'AI'], items: ['Cursor', 'Claude (Code & Design)', 'ChatGPT + Codex', 'Figma Make', 'Google AI Studio'] },
  { id: 'tools', title: ['Инструменты', 'Tools'], items: ['Figma', 'Miro', 'Notion', 'Asana', 'Adobe Creative Suite'] },
  { id: 'leadership', title: ['Лидерство', 'Leadership'], items: [
    ['Управление командой', 'Team Management'], ["Найм и онбординг", 'Hiring & Onboarding'], ['Менторство', 'Mentorship'],
  ] },
  { id: 'frontend', title: ['Фронтенд', 'Frontend'], items: [
    'HTML5', 'CSS3', 'JavaScript', 'Git', ["Адаптивная и кроссбраузерная вёрстка", 'Responsive & cross-browser layout'],
  ] },
];

function Copy({ value }) {
  return typeof value === 'string' ? value : <><span className="lru">{value[0]}</span><span className="len">{value[1]}</span></>;
}

function SkillList({ items }) {
  return <ul>{items.map(item => <li key={typeof item === 'string' ? item : item[0]}><Copy value={item} /></li>)}</ul>;
}

export function Skills() {
  return <section className="skills-section page-shell" aria-labelledby="skills-heading">
    <div className="section-heading">
      <h2 id="skills-heading"><Copy value={["Навыки и инструменты", 'Skills & tools']} /></h2>
      <p className="eyebrow">04 / <Copy value={['Компетенции', 'Expertise']} /></p>
    </div>
    <div className="expertise-layout">
      <div className="expertise-feature" aria-labelledby="product-skills-heading">
        <h3 id="product-skills-heading"><Copy value={["Продукт и UX", 'Product & UX']} /></h3>
        <SkillList items={product} />
      </div>
      <div className="expertise-support">
        {groups.map(group => <div className="expertise-group" key={group.id} aria-labelledby={`skills-${group.id}`}>
          <h3 id={`skills-${group.id}`}><Copy value={group.title} /></h3>
          <SkillList items={group.items} />
        </div>)}
      </div>
    </div>
    <div className="expertise-languages" aria-labelledby="skills-languages">
      <h3 id="skills-languages"><Copy value={['Языки', 'Languages']} /></h3>
      <ul>
        <li><Copy value={["Английский — B1 / Intermediate", "English — B1 / Intermediate"]} /></li>
        <li><Copy value={["Русский — родной", "Russian — Native"]} /></li>
      </ul>
    </div>
  </section>;
}
