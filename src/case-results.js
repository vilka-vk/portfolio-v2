import { htmlToDOM } from 'html-react-parser';

const labels = {
  forrest: [
    ['Время обработки заказа', 'Order processing time'],
    ['Время создания бронирования', 'Reservation creation time'],
    ['Конфликты при бронировании', 'Reservation conflicts'],
    ['Дизайн-система второй версии', 'Design system for v2'],
  ],
  gutstuff: [
    ['Загрузок в Google Play', 'Google Play downloads'],
    ['Запуск приложения', 'App launch'],
    ['Согласованный объём работ', 'Agreed scope delivered'],
  ],
  saymore: [
    ['Десктопный MVP', 'Desktop MVP'],
    ['Адаптивных экранов', 'Responsive screens'],
    ['Компоненты для развития продукта', 'Components for product growth'],
  ],
  bashnya: [
    ['Разработка фич', 'Feature development'],
    ['Передача дизайна в разработку', 'Design-to-development'],
    ['Набор иконок и персонаж', 'Icon set and character'],
  ],
  taromant: [
    ['Возврат на следующий день', 'Day-one retention'],
    ['Конверсия в покупку спинов', 'Conversion to spin purchases'],
  ],
  trinoray: [
    ['Переработана логика поиска', 'Search logic reworked'],
    ['Проект получил финансирование', 'Funding secured by the project'],
  ],
};

const textValues = {
  forrest: {3: ['MUI → Mantis', 'MUI → Mantis']},
  saymore: {2: ['Дизайн-система', 'Design system']},
  bashnya: {2: ['AI', 'AI']},
  trinoray: {0: ['Поиск', 'Search']},
};

function valueFor(nodes, language, insideBold = false) {
  return nodes.map(node => {
    const classes = (node.attribs?.class || '').split(/\s+/);
    if (classes.includes(language === 'ru' ? 'len' : 'lru')) return '';
    if (node.type === 'text') return insideBold ? node.data : '';
    return valueFor(node.children || [], language, insideBold || node.name === 'b');
  }).join('').trim();
}

// Numbers come from the very same metrics used by homepage cards.
export function caseResults(project) {
  return project.metrics.map((metric, index) => {
    const nodes = htmlToDOM(metric);
    const value = ['ru', 'en'].map((language, i) => (textValues[project.id]?.[index]?.[i] || valueFor(nodes, language))
      .replace(/^\p{Ll}/u, letter => letter.toUpperCase()));
    return {value, label: labels[project.id]?.[index] || ['', ''], numeric: value.some(text => /\d/.test(text))};
  });
}
