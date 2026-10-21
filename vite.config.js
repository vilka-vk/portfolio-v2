import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const entries = ['index.html', ...['bashnya', 'forrest', 'gutstuff', 'saymore', 'taromant', 'trinoray'].map(name => `cases/${name}.html`)];

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  build: {
    rollupOptions: {
      input: entries.map(entry => fileURLToPath(new URL(entry, import.meta.url))),
    },
  },
});
