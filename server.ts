// server.ts (no top-level await)
import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Adjust this to your Angular project name if different:
const PROJECT_NAME = 'meet-portfolio';

// Path where the built SSR bundle is expected
const builtServerBundle = resolve(
  __dirname,
  `../dist/${PROJECT_NAME}/server/main.mjs`
);

// Try to import the built bundle, otherwise fallback to local source.
// We keep this as a Promise (no top-level await).
const bundlePromise: Promise<any> = import(builtServerBundle).catch((err) => {
  // fallback to local dev entry if built bundle not present
  // note: ensure ./src/main.server exists for dev fallback
  return import('./src/main.server');
});

function resolveBootstrapFromBundle(bundle: any) {
  // common possible export names
  return (
    bundle.bootstrap || bundle.app || bundle.server || bundle.default || bundle
  );
}

// Build an Express app factory that defers to the loaded bundle
export function app(): express.Express {
  const server = express();

  const serverDistFolder = __dirname;
  const browserDistFolder = resolve(
    serverDistFolder,
    `../dist/${PROJECT_NAME}/browser`
  );

  const commonEngine = new CommonEngine();

  // Express view engine that waits for the bundle to resolve and then renders.
  server.engine(
    'html',
    (filePath: string, options: any, callback: Function) => {
      // options.req contains the request
      const url = options.req?.url ?? '/';

      bundlePromise
        .then((bundle) => {
          const bootstrap = resolveBootstrapFromBundle(bundle);

          // CommonEngine.render expects a bootstrap (module/class/function) and document
          return commonEngine.render({
            bootstrap,
            document: options.template, // the HTML template
            url,
            providers: [
              { provide: APP_BASE_HREF, useValue: options.req.baseUrl ?? '/' },
            ],
          });
        })
        .then((html) => callback(null, html))
        .catch((err) => callback(err));
    }
  );

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Serve static files
  server.get(
    '*.*',
    express.static(browserDistFolder, {
      maxAge: '1y',
    })
  );

  // fallback - let the engine render index.html
  server.get('*', (req, res) => {
    // Render uses view 'index' so template should be index.html in views folder (browserDistFolder)
    res.render('index', { req, res, template: undefined });
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

if (process.env['NODE_ENV'] !== 'test') {
  run();
}
