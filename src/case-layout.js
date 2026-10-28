// Composition and stable IDs are authored in the editorial HTML, never inferred.
export function prepareCase(content) {
  return content;
}

export function caseLinks(content) {
  return [...content.matchAll(/<section class="case-section" id="([^"]+)"[^>]*>\s*<h2[^>]*>([\s\S]*?)<\/h2>/g)]
    .map(([, id, label]) => ({ id, label: outlineLabels[id] ? `<span class="lru">${outlineLabels[id][0]}</span><span class="len">${outlineLabels[id][1]}</span>` : label }));
}

const outlineLabels = {
  context: ['Контекст', 'Context'], orders: ['Заказы', 'Orders'],
  reservations: ['Бронирования', 'Reservations'], handoff: ['Передача и итог', 'Handoff and outcome'],
  research: ['Исследование', 'Research'], diary: ['Опрос и дневник', 'Quiz and diary'],
  plan: ['Персональный план', 'Personal plan'], learning: ['Обучение и привычки', 'Learning and habits'],
  system: ['Система и редизайн', 'System and redesign'], outcome: ['Итог', 'Outcome'],
  feed: ['Лента', 'Feed'], privacy: ['Публикация', 'Posting'],
  communities: ['Сообщества и каналы', 'Groups and channels'], delivery: ['Проектирование', 'Design process'],
  world: ['Визуальный язык', 'Visual language'], carts: ['Варианты корзины', 'Cart variants'],
  states: ['Состояния', 'States'], direction: ['Процесс работы', 'Design process'],
  screens: ['Экраны и ассеты', 'Screens and assets'], scope: ['Вклад', 'Contribution'],
};
