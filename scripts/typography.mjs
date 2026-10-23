import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import { htmlToDOM } from 'html-react-parser';
import Typograf from 'typograf';
import { pageEntries } from '../src/pages.js';

const typographers = new Map();
function typographer(locale) {
  if (!typographers.has(locale)) {
    const tp = new Typograf({ locale });
    // A conservative pass: preserve punctuation, wording and markup.
    tp.disableRule('*');
    tp.enableRule([
      'common/nbsp/afterShortWordByList', 'common/nbsp/afterNumber',
      'common/nbsp/beforeShortLastWord', 'ru/nbsp/beforeParticle', 'ru/nbsp/initials',
    ]);
    typographers.set(locale, tp);
  }
  return typographers.get(locale);
}

export function formatText(text) {
  if (!/\S/.test(text)) return text;
  const locale = /[а-яё]/i.test(text) ? 'ru' : 'en-US';
  return typographer(locale).execute(text)
    .replace(/(\d+(?:[.,]\d+)?(?:K|M)?\+?)[ \t]+(?=\p{L})/gu, '$1\u00a0')
    .replace(/(\d)[ \t\u00a0]+([–—→])[ \t\u00a0]+(?=\d)/g, '$1\u00a0$2\u00a0')
    .replace(/[ \t]+(?=—)/g, '\u00a0')
    .replace(/→[ \t]+/g, '→\u00a0')
    .replace(/\bAI-first\b/g, 'AI\u2011first');
}

const escapeHTML = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const textContent = node => node.type === 'text' ? node.data : (node.children || []).map(textContent).join('');
function applyReplacements(source, replacements) {
  return replacements.sort((a, b) => b.start - a.start).reduce((text, edit) => text.slice(0, edit.start) + edit.value + text.slice(edit.end), source);
}

export function formatHTML(source) {
  const replacements = [];
  const nodes = htmlToDOM(source, { withStartIndices: true, withEndIndices: true });
  function visit(nodes) {
    nodes.forEach((node, index) => {
      if (['script', 'style', 'code', 'pre'].includes(node.name)) return;
      if (node.type === 'text') {
        let value = formatText(node.data);
        const previous = nodes[index - 1];
        // Glue a number to its unit even when bold markup separates them.
        if (previous && ['b', 'strong', 'em', 'span'].includes(previous.name) && /\d(?:K|M)?\+?$/.test(textContent(previous))) {
          value = value.replace(/^[ \t]+(?=[\p{L}—–→])/u, '\u00a0');
        }
        if (value !== node.data) replacements.push({ start: node.startIndex, end: node.endIndex + 1, value: escapeHTML(value) });
      } else if (node.children) visit(node.children);
    });
  }
  visit(nodes);
  return applyReplacements(source, replacements);
}

export function formatJSX(source) {
  const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
  const replacements = [];
  function visit(node, parent, visible = false) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'JSXAttribute') visible = ['ru', 'en', 'value', 'title', 'alt', 'aria-label'].includes(node.name?.name);
    if (node.type === 'VariableDeclarator') visible = ['product', 'groups'].includes(node.id?.name);
    if (node.type === 'StringLiteral') {
      if (!visible) return;
      const value = formatText(node.value);
      if (value !== node.value) replacements.push({
        start: node.start, end: node.end,
        value: parent?.type === 'JSXAttribute' ? `"${escapeHTML(value).replaceAll('"', '&quot;')}"` : JSON.stringify(value),
      });
      return;
    }
    if (node.type === 'JSXText') {
      const value = formatHTML(node.value);
      if (value !== node.value) replacements.push({ start: node.start, end: node.end, value });
      return;
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(child => visit(child, node, visible));
      else if (value && typeof value === 'object') visit(value, node, visible);
    }
  }
  visit(ast);
  return applyReplacements(source, replacements);
}

export function formatProjects(source) {
  const projects = JSON.parse(source);
  for (const project of projects) {
    for (const field of ['title', 'alt']) if (project[field]) project[field] = formatText(project[field]);
    project.labels = project.labels.map(formatText);
    project.metrics = project.metrics.map(formatHTML);
  }
  return JSON.stringify(projects, null, 2) + '\n';
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const write = process.argv.includes('--write');
  const files = [
    ...pageEntries,
    ...readdirSync(new URL('../src/content/', import.meta.url)).filter(name => name.endsWith('.html')).map(name => `src/content/${name}`),
    'src/App.jsx', 'src/Skills.jsx', 'src/content/projects.json',
  ];
  let changed = 0;
  for (const file of files) {
    const path = new URL(`../${file}`, import.meta.url);
    const source = readFileSync(path, 'utf8');
    const format = file.endsWith('.jsx') ? formatJSX : file.endsWith('.json') ? formatProjects : formatHTML;
    const result = format(source);
    if (result === source) continue;
    changed++;
    console.log(`${write ? 'Formatted' : 'Needs formatting'} ${file}`);
    if (write) writeFileSync(path, result);
  }
  console.log(`${changed} file(s) ${write ? 'updated' : 'need typography updates'}.`);
  if (changed && !write) process.exitCode = 1;
}
