import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { parse } from '@babel/parser';
import { htmlToDOM } from 'html-react-parser';
import { formatText, formatHTML, formatJSX, formatProjects } from './typography.mjs';

const normalize = value => value.replaceAll('\u00a0', ' ').replaceAll('\u2011', '-');
function structure(nodes) {
  return nodes.map(node => node.type === 'text' ? ['text', normalize(node.data)] : [node.type, node.name, node.attribs, structure(node.children || [])]);
}

test('short words and numbers stay with their following words', () => {
  assert.equal(formatText('Дизайн для продукта и команды'), 'Дизайн для\u00a0продукта и\u00a0команды');
  assert.equal(formatText('за 6 месяцев'), 'за\u00a06\u00a0месяцев');
  assert.equal(formatText('10K+ downloads'), '10K+\u00a0downloads');
  assert.equal(formatText('7 → 3 дня'), '7\u00a0→\u00a03\u00a0дня');
  assert.equal(formatText('AI-first'), 'AI\u2011first');
});

test('inline emphasis cannot separate a number from its unit', () => {
  assert.equal(formatHTML('<p><b>6</b> месяцев</p>'), '<p><b>6</b>\u00a0месяцев</p>');
  assert.equal(formatHTML('<p>для <em>AI-first</em></p>'), '<p>для\u00a0<em>AI\u2011first</em></p>');
});

test('HTML attributes, scripts and code are never rewritten', () => {
  const source = '<a href="/index.html#cases" title="Дизайн для команд">Дизайн для команд</a><script>var s="за 6 месяцев"</script><pre>для команды</pre>';
  const result = formatHTML(source);
  assert.deepEqual(structure(htmlToDOM(result)), structure(htmlToDOM(source)));
  assert.ok(result.includes('<script>var s="за 6 месяцев"</script>'));
  assert.ok(result.includes('<pre>для команды</pre>'));
});

test('JSX formatting preserves program syntax and does not change selectors', () => {
  const source = 'const selector="a in article"; const product=["Работа с командой"]; const view=<Text className="a in article" ru="Работа с командой" en="Work with teams" />;';
  const result = formatJSX(source);
  parse(result, { sourceType: 'module', plugins: ['jsx'] });
  assert.ok(result.includes('selector="a in article"'));
  assert.ok(result.includes('className="a in article"'));
  assert.ok(result.includes('с\u00a0командой'));
});

test('the complete editorial content keeps identical markup, links and wording', () => {
  for (const file of readdirSync(new URL('../src/content/', import.meta.url)).filter(name => name.endsWith('.html'))) {
    const source = readFileSync(new URL(`../src/content/${file}`, import.meta.url), 'utf8');
    const result = formatHTML(source);
    assert.deepEqual(structure(htmlToDOM(result)), structure(htmlToDOM(source)), file);
    assert.equal(formatHTML(result), result, `${file}: idempotent`);
  }
});

test('project links and asset paths stay unchanged and formatting is repeatable', () => {
  const source = readFileSync(new URL('../src/content/projects.json', import.meta.url), 'utf8');
  const before = JSON.parse(source);
  const result = formatProjects(source);
  const after = JSON.parse(result);
  before.forEach((project, index) => {
    for (const field of ['id', 'href', 'image', 'category']) assert.equal(after[index][field], project[field]);
  });
  assert.equal(formatProjects(result), result);
});
