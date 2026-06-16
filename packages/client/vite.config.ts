import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

// Serve the repo-root `data/` folder as static assets so the client can fetch
// `/skills.sample.json`, `/i18n/en.json`, … keeping a single source of content.
// `BASE_PATH` is set by the GitHub Pages workflow (e.g. "/<repo>/"); defaults to "/" locally.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  publicDir: resolve(here, '../../data'),
  server: { port: 5173 },
});
