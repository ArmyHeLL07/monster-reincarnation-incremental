import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { VERSION } from './src/changelog';

const here = dirname(fileURLToPath(import.meta.url));

// Serve the repo-root `data/` folder as static assets so the client can fetch
// `/skills.sample.json`, `/i18n/en.json`, … keeping a single source of content.
// `BASE_PATH` is set by the GitHub Pages workflow (e.g. "/<repo>/"); defaults to "/" locally.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  publicDir: resolve(here, '../../data'),
  server: { port: 5173 },
  plugins: [
    {
      // Emit a tiny, uncached version.json so the running client can detect a fresh deploy.
      name: 'emit-version-json',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: VERSION }) });
      },
    },
  ],
});
