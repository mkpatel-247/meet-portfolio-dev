import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

// ===========================
// Configuration Constants
// ===========================

const CONFIG = {
  SERVER: {
    PORT: parseInt(process.env['PORT'] || '4201', 10),
    CORS_ORIGINS: process.env['CORS_ORIGINS']?.split(',') || [
      'http://localhost:4200',
      'http://localhost:4201',
    ],
    STATIC_MAX_AGE: '1y',
  },
} as const;


// ===========================
// Request Logger
// ===========================
function requestLogger(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusEmoji = status >= 500 ? '✗' : status >= 400 ? '⚠️' : '✓';
    console.log(
      `${statusEmoji} [${req.method}] ${req.path} - ${status} (${duration}ms)`
    );
  });

  next();
}

// ===========================
// Express Application Setup
// ===========================

/**
 * Create and configure Express application
 * @returns Configured Express app
 */
export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);


  // Middleware
  server.use(requestLogger);
  server.use(
    cors({
      origin: CONFIG.SERVER.CORS_ORIGINS,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      optionsSuccessStatus: 200,
    })
  );
  server.use(express.json());

  // Serve static files from /browser
  server.use(
    express.static(browserDistFolder, {
      maxAge: CONFIG.SERVER.STATIC_MAX_AGE,
      index: false,
    })
  );

  // All regular routes use the Angular engine (must be last)
  server.get('*', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

  return server;
}

// ===========================
// Server Startup
// ===========================

/**
 * Start the Express server
 */
function run(): void {
  const server = app();
  server.listen(CONFIG.SERVER.PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 Server started successfully');
    console.log(`📍 URL: http://localhost:${CONFIG.SERVER.PORT}`);
    console.log('='.repeat(50));
  });
}

run();
