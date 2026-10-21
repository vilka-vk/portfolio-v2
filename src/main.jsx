import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { App } from './App.jsx';
import '../styles.css';

const root = document.getElementById('root');
const app = <App pathname={window.location.pathname} initialContent={root.querySelector('main.narrow.case')?.innerHTML} />;

if (root.hasChildNodes()) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
