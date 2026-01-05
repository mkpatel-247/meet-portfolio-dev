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

// Ollama Configuration
const OLLAMA_HOST = process.env['OLLAMA_HOST'] || 'http://localhost:11434';
const OLLAMA_MODEL = process.env['OLLAMA_MODEL'] || 'llama3.2';

interface EmbeddingData {
  text: string;
  embedding: number[];
}

function cosineSimilarity(a: number[], b: number[]) {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Load embeddings
  let embeddings: EmbeddingData[] = [];
  try {
    const embeddingsPath = join(browserDistFolder, 'assets/embeddings.json');
    if (fs.existsSync(embeddingsPath)) {
      embeddings = JSON.parse(fs.readFileSync(embeddingsPath, 'utf8'));
      console.log(`Loaded ${embeddings.length} embeddings from ${embeddingsPath}`);
    } else {
      console.warn('Embeddings file not found at:', embeddingsPath);
    }
  } catch (err) {
    console.error('Failed to load embeddings:', err);
  }

  // CORS Configuration
  const corsOptions = {
    origin: ['http://localhost:4200', 'http://localhost:4201'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
  };

  server.use(cors(corsOptions));
  server.use(express.json());

  // RAG Chat Endpoint with Ollama
  server.post('/api/chat', async (req, res) => {
    try {
      const { messages } = req.body;
      const lastMessage = messages[messages.length - 1];
      const userQuery = lastMessage.content;
      console.log("--".repeat(50));
      // 1. Generate embedding for user query using Ollama
      const embeddingResponse = await fetch(`${OLLAMA_HOST}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt: userQuery,
        }),
      });

      if (!embeddingResponse.ok) {
        throw new Error(`Ollama embeddings failed: ${embeddingResponse.statusText}`);
      }

      const embeddingData = await embeddingResponse.json();
      const queryEmbedding = embeddingData.embedding;

      // 2. Find relevant context
      const scoredDocs = embeddings.map(doc => ({
        text: doc.text,
        score: cosineSimilarity(queryEmbedding, doc.embedding),
      }));

      // Sort by score and take top 3
      scoredDocs.sort((a, b) => b.score - a.score);
      const topDocs = scoredDocs.slice(0, 3);
      const context = topDocs.map(d => d.text).join('\n\n');

      console.log('Top context scores:', topDocs.map(d => d.score));

      // 3. Generate response with context using Ollama streaming
      const systemPrompt = `You are a helpful portfolio assistant for Meet Patel. 
      Use the following context to answer the user's question about Meet. 
      If the answer is not in the context, say you don't know but offer to help with something else.
      Keep answers concise and professional.
      
      Context:
      ${context}`;

      const prompt = `${systemPrompt}\n\nUser: ${userQuery}\n\nAssistant:`;

      // Set headers for Server-Sent Events
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Stream response from Ollama
      const ollamaResponse = await fetch(`${OLLAMA_HOST}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt: prompt,
          stream: true,
        }),
      });

      if (!ollamaResponse.ok) {
        throw new Error(`Ollama generate failed: ${ollamaResponse.statusText}`);
      }

      const reader = ollamaResponse.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body from Ollama');
      }

      let buffer = '';
      const messageId = `msg_${Date.now()}`;

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Send completion event
          res.write(`data: ${JSON.stringify({ delta: '', complete: true, messageId })}\n\n`);
          res.end();
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const chunk = JSON.parse(line);
              if (chunk.response) {
                // Send delta to client
                res.write(`data: ${JSON.stringify({
                  delta: chunk.response,
                  complete: false,
                  messageId
                })}\n\n`);
              }

              if (chunk.done) {
                res.write(`data: ${JSON.stringify({ delta: '', complete: true, messageId })}\n\n`);
                res.end();
                return;
              }
            } catch (e) {
              console.warn('Failed to parse Ollama chunk:', e);
            }
          }
        }
      }

    } catch (error: any) {
      console.error('Chat error:', error);

      // If streaming hasn't started, send JSON error
      if (!res.headersSent) {
        return res.status(500).json({
          error: error.message || 'Failed to process chat request',
          details: 'Make sure Ollama is running on ' + OLLAMA_HOST
        });
      }

      // If streaming has started, send error event and close
      res.write(`data: ${JSON.stringify({ error: error.message, complete: true })}\n\n`);
      res.end();
      return;
    }
  });
  // Serve static files from /browser
  server.use(
    express.static(browserDistFolder, {
      maxAge: '1y',
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

function run(): void {
  const port = process.env['PORT'] || 4201;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
