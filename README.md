# Violetta Morozova — Portfolio v2

A bilingual React + Vite portfolio. The current design, content and original case URLs are preserved.

## Development

Requires Node.js 22.12+ or a compatible newer LTS release.

```sh
npm install
npm run dev
```

The server runs at http://127.0.0.1:4173 with hot reload.

## Production

```sh
npm run build
npm run preview
```

The build generates `dist/`, pre-renders all seven pages to complete HTML, and copies the original images and CV. Stop the development server before running preview: both use port 4173.

## Structure

- `src/main.jsx`: shared Header, Footer, ProjectCard, Home and CaseStudy components, language state and scroll effects.
- `src/content/projects.json`: card labels, metrics, links and images.
- `src/content/*.html`: rich bilingual editorial content converted into React elements with html-react-parser; cases load per page.
- `styles.css`: shared responsive styles.
- `index.html` and `cases/*.html`: Vite entries with individual titles and descriptions.
- `scripts/prerender.mjs`: generates complete production HTML.
- `scripts/copy-assets.mjs`: packages assets using original URLs.

## Deployment

Import `vilka-vk/portfolio-v2` into Vercel with the repository root as Root Directory, Vite as Framework, `npm run build` as Build Command and `dist` as Output Directory. Build settings are declared in `vercel.json`.

No API keys, database or SPA catch-all rewrite are needed. Original `/cases/forrest.html` links and clean URLs are supported through `cleanUrls`.
