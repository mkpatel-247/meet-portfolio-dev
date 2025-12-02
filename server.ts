// server.ts (replace your file with this)
import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Adjust this to your Angular project name if different:
const PROJECT_NAME = 'meet-portfolio';

// Resolve the expected built server bundle path
const builtServerBundle = resolve(
  __dirname,
  `../dist/${PROJECT_NAME}/server/main.mjs`
);

// Attempt to load the built server bundle; if not present, fallback to source (dev)
let serverBundle: any;
try {
  serverBundle = await import(builtServerBundle);
  // serverBundle should export the same things as your generated main.server
} catch (err) {
  // fallback to local source build for local testing/development
  // note: this requires your TS -> JS dev workflow to allow importing src during dev
  serverBundle = await import('./src/main.server');
}

// depending on how your server bundle exports are named, adjust these:
const {
  AppServerModuleNgFactory,
  renderModuleFactory,
  ngExpressEngine,
  handle,
} = serverBundle;

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();

  // Where this server file lives (after build it will be inside .vercel or api)
  const serverDistFolder = __dirname;
  const browserDistFolder = resolve(
    serverDistFolder,
    `../dist/${PROJECT_NAME}/browser`
  );
  const indexHtml = join(serverDistFolder, 'index.server.html'); // if you produce this

  const commonEngine = new CommonEngine();

  server.engine('html', (_, options: any, callback) => {
    const url = options.req.url;
    commonEngine
      .render({
        bootstrap:
          serverBundle.bootstrap ?? serverBundle.app ?? serverBundle.default,
        document: options.template,
        url,
        providers: [{ provide: APP_BASE_HREF, useValue: options.req.baseUrl }],
      })
      .then((html) => callback(null, html))
      .catch((err) => callback(err));
  });

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  server.get(
    '*.*',
    express.static(browserDistFolder, {
      maxAge: '1y',
    })
  );

  server.get('*', (req, res) => {
    res.render('index', { req, res });
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

run();
