import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { caseResults } from '../src/case-results.js';

const projects = JSON.parse(readFileSync(new URL('../src/content/projects.json', import.meta.url)));
const cases = projects.filter(project => project.href?.startsWith('cases/'));

test('every case has a value and a caption in both languages', () => {
  for (const project of cases) {
    const results = caseResults(project);
    assert.equal(results.length, project.metrics.length);
    for (const result of results) {
      assert.ok(result.value.every(text => text.trim()));
      assert.ok(result.label.every(text => text.trim()));
    }
  }
});

test('case result figures stay in sync when homepage metrics change', () => {
  const project = structuredClone(projects.find(project => project.id === 'bashnya'));
  project.metrics[0] = project.metrics[0].replaceAll('7', '8').replaceAll('3', '4');
  const result = caseResults(project)[0];
  assert.match(result.value[0], /8\s*→\s*4/);
  assert.match(result.value[1], /8\s*→\s*4/);
  assert.doesNotMatch(result.value[0], /days/);
  assert.doesNotMatch(result.value[1], /дня/);
});

test('shared figures and qualitative outcomes are preserved without altering homepage data', () => {
  const before = JSON.stringify(projects);
  assert.deepEqual(caseResults(projects.find(p => p.id === 'taromant'))[0].value, ['42%', '42%']);
  assert.equal(caseResults(projects.find(p => p.id === 'trinoray'))[1].numeric, false);
  cases.forEach(caseResults);
  assert.equal(JSON.stringify(projects), before);
});
