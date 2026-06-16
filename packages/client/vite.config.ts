import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

// Serve the repo-root `data/` folder as static assets so the client can fetch
// `/skills.sample.json`, `/i18n/en.json`, … keeping a single source of content.
export default defineConfig({
  publicDir: resolve(here, '../../data'),
  server: { port: 5173 },
});
