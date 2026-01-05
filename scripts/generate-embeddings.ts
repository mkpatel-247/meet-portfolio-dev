
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { ABOUT_ME_DATA, EXPERIENCE_DATA, EXTRA_DATA } from '../src/app/shared/data/portfolio-data';

// Load environment variables
dotenv.config();

// Ollama Configuration
const OLLAMA_HOST = process.env['OLLAMA_HOST'] || 'http://localhost:11434';
const OLLAMA_MODEL = process.env['OLLAMA_MODEL'] || 'llama3.2';

const ASSETS_DIR = path.join(__dirname, '../src/assets');
const EMBEDDINGS_FILE = path.join(ASSETS_DIR, 'embeddings.json');

interface EmbeddingData {
    text: string;
    embedding: number[];
    metadata?: any;
}

interface OllamaEmbeddingResponse {
    embedding: number[];
    model?: string;
    prompt?: string;
}

function processData(): string[] {
    const chunks: string[] = [];

    // Process About Me
    ABOUT_ME_DATA.forEach((text) => {
        if (text.trim()) chunks.push(`About Me: ${text.trim()}`);
    });

    // Process Experience
    EXPERIENCE_DATA.forEach((exp) => {
        const header = `Experience at ${exp.organization} as ${exp.role} (${exp.startDate} - ${exp.endDate})`;
        chunks.push(header);
        exp.description.forEach((desc) => {
            chunks.push(`${header}: ${desc}`);
        });
    });

    // Process Extra Data
    EXTRA_DATA.forEach((text) => {
        if (text.trim()) chunks.push(`Extra Info: ${text.trim()}`);
    });

    return chunks;
}

async function generateEmbeddings() {
    const chunks = processData();
    console.log(`Generating embeddings for ${chunks.length} chunks using Ollama...`);
    console.log(`Ollama host: ${OLLAMA_HOST}, Model: ${OLLAMA_MODEL}`);

    const embeddingsData: EmbeddingData[] = [];

    for await (const chunk of chunks) {
        try {
            const response = await fetch(`${OLLAMA_HOST}/api/embeddings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: OLLAMA_MODEL,
                    prompt: chunk,
                }),
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }
            console.log("Response JSON :>> ", response);
            const data = await response.json() as OllamaEmbeddingResponse;
            console.log(" Data Embedding :>> ", JSON.stringify(data, null, 2));
            console.log('--'.repeat(50));
            if (data && data.embedding) {
                embeddingsData?.push({
                    text: chunk,
                    embedding: data.embedding,
                });
                console.log("data.embedding:>>", data.embedding);

            }
            console.log(`Encoded: ${chunk.substring(0, 50)}...`);
        } catch (error) {
            console.error(`Failed to generate embedding for chunk: ${chunk}`, error);
        }
    }

    if (!fs.existsSync(ASSETS_DIR)) {
        fs.mkdirSync(ASSETS_DIR, { recursive: true });
    }

    fs.writeFileSync(EMBEDDINGS_FILE, JSON.stringify(embeddingsData, null, 2));
    console.log(`Saved ${embeddingsData.length} embeddings to ${EMBEDDINGS_FILE}`);
}

generateEmbeddings().catch(console.error);
