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
npm run check:build
npm test
npm run preview
```

The build generates `dist/`, pre-renders all seven pages to complete HTML, and copies the original images and CV. Stop the development server before running preview: both use port 4173.

`check:build` verifies the generated pages, local asset URLs, navigation anchors, image metadata and a single analytics counter per page without sending analytics requests. It does not replace browser-based visual testing.

## Text typography

Run `npm run typography` after changing editorial copy, project metrics or skills. It applies conservative nonbreaking-space rules to visible text, preserving wording, markup, URLs and code. `npm run check:typography` checks without writing. Typograf runs only as a development tool and is not shipped to the browser. Responsive line wrapping remains enabled; headings use balanced wrapping and paragraphs use pretty wrapping where supported.

## Structure

- `src/main.jsx`: browser entry; hydrates pre-rendered HTML in production and mounts React in development.
- `src/App.jsx`: shared Header, Footer, ProjectCard, Home and CaseStudy components and scoped scroll effects.
- `src/language-store.js`: cached language preference, storage fallback and cross-tab synchronization.
- `src/Skills.jsx`: bilingual skills grouped by discipline.
- `src/page-motion.js`: GSAP opacity/blur section reveals, hash entry and history restoration; respects reduced motion and cleans up animations/listeners on unmount.
- `src/content-renderer.jsx`: cached editorial rendering support and image dimensions/lazy loading.
- `src/pages.js`: shared page-entry manifest for Vite and pre-rendering.
- `src/content/projects.json`: explicit card categories, labels, metrics, links and images.
- `src/content/image-dimensions.json`: intrinsic raster-image dimensions; update this metadata when replacing images.
- `src/content/*.html`: rich bilingual editorial content converted into React elements with html-react-parser; cases load per page.
- `styles.css`: shared responsive styles.
- `index.html` and `cases/*.html`: Vite entries with individual titles and descriptions.
- `scripts/prerender.mjs`: generates complete production HTML.
- `scripts/copy-assets.mjs`: packages assets using original URLs.
- `scripts/verify-build.mjs`: production-output integrity checks.

## Deployment

Import `vilka-vk/portfolio-v2` into Vercel with the repository root as Root Directory, Vite as Framework, `npm run build` as Build Command and `dist` as Output Directory. Build settings are declared in `vercel.json`.

No API keys, database or SPA catch-all rewrite are needed. Original `/cases/forrest.html` links and clean URLs are supported through `cleanUrls`.
