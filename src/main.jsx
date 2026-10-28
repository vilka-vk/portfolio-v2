import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { App } from './App.jsx';
import '../styles.css';
import './case-styles.css';

const root = document.getElementById('root');
const caseDocument = root.querySelector('.case-document');
const sourceDocument = caseDocument?.cloneNode(true);
sourceDocument?.querySelector('.case-results')?.remove();
const initialContent = sourceDocument ? sourceDocument.innerHTML + (root.querySelector('main > .case-nav')?.outerHTML || '') : undefined;
const app = <App pathname={window.location.pathname} initialContent={initialContent} />;

if (root.hasChildNodes()) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
