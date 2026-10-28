import React from 'react';
import { caseResults } from './case-results.js';

function Bilingual({ text }) {
  return <><span className="lru">{text[0]}</span><span className="len">{text[1]}</span></>;
}

export function CaseResults({ project }) {
  return <section className="case-results" id="case-results">
    <ul>{caseResults(project).map((result, index) => <li key={index}>
      <p className="case-result-value"><Bilingual text={result.value} /></p>
      <p className="case-result-label"><Bilingual text={result.label} /></p>
    </li>)}</ul>
  </section>;
}
