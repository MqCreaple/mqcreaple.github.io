import { defineConfig } from 'astro/config';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const mimeTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
};

function serveGeneratedFiles() {
  return {
    name: 'serve-generated-files',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        let pathname;
        try {
          pathname = decodeURIComponent(url.pathname);
        } catch {
          return next();
        }

        const relative = pathname.startsWith('/app/')
          ? path.join('app', pathname.slice('/app/'.length))
          : pathname.startsWith('/pdf/')
            ? path.join('node_modules', '.cache', 'pdfs', pathname.slice('/pdf/'.length))
            : null;
        if (!relative) return next();

        const base = path.join(root, relative);
        const candidate =
          existsSync(base) && statSync(base).isDirectory() ? path.join(base, 'index.html') : base;
        if (!existsSync(candidate) || !statSync(candidate).isFile()) return next();

        const ext = path.extname(candidate).toLowerCase();
        res.statusCode = 200;
        res.setHeader('Content-Type', mimeTypes[ext] ?? 'application/octet-stream');
        res.end(readFileSync(candidate));
      });
    },
  };
}

export default defineConfig({
  site: 'https://mqcreaple.github.io',
  base: process.env.BASE_PATH || '/',
  output: 'static',
  publicDir: 'asset',
  outDir: 'output',
  trailingSlash: 'always',
  vite: {
    plugins: [serveGeneratedFiles()],
  },
});
