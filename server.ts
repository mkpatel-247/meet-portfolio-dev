import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const OPENAI_API_KEY = process.env['OPENAI_API_KEY'];
const openai = new OpenAI({ apiKey: OPENAI_API_KEY || 'dummy' }); // Fallback to avoid crash if variable missing, but will fail on request

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

  server.use(express.json());

  // RAG Chat Endpoint
  server.post('/api/chat', async (req, res) => {
    try {
      const { messages } = req.body;
      const lastMessage = messages[messages.length - 1];
      const userQuery = lastMessage.content;

      if (!OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OpenAI API Key not configured' });
      }

      // 1. Generate embedding for user query
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: userQuery,
      });
      const queryEmbedding = embeddingResponse.data[0].embedding;

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

      // 3. Generate response with context
      const systemPrompt = `You are a helpful portfolio assistant for Meet Patel. 
      Use the following context to answer the user's question about Meet. 
      If the answer is not in the context, say you don't know but offer to help with something else.
      Keep answers concise and professional.
      
      Context:
      ${context}`;

      const chatCompletion = await openai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m: any) => ({ role: m.role, content: m.content })),
        ],
        model: 'gpt-3.5-turbo',
      });

      const responseMessage = chatCompletion.choices[0].message;

      return res.json({
        message: {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: responseMessage.content,
          createdAt: new Date().toISOString(),
        }
      });

    } catch (error: any) {
      console.error('Chat error:', error);
      return res.status(500).json({ error: 'Failed to process chat request' });
    }
  });
  // Serve static files from /browser
  server.get(
    '**',
    express.static(browserDistFolder, {
      maxAge: '1y',
      index: 'index.html',
    })
  );

  // All regular routes use the Angular engine
  server.get('**', (req, res, next) => {
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
  const port = process.env['PORT'] || 4200;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
