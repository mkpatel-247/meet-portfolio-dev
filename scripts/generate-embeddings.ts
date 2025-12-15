
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';
import { ABOUT_ME_DATA, EXPERIENCE_DATA, EXTRA_DATA } from '../src/app/shared/data/portfolio-data';

// Load environment variables
dotenv.config();

const OPENAI_API_KEY = process.env['OPENAI_API_KEY'];

if (!OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY is not set in environment variables.');
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

const ASSETS_DIR = path.join(__dirname, '../src/assets');
const EMBEDDINGS_FILE = path.join(ASSETS_DIR, 'embeddings.json');

interface EmbeddingData {
    text: string;
    embedding: number[];
    metadata?: any;
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
    console.log(`Generating embeddings for ${chunks.length} chunks...`);

    const embeddingsData: EmbeddingData[] = [];

    for (const chunk of chunks) {
        try {
            const response = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: chunk,
            });

            const embedding = response.data[0].embedding;
            embeddingsData.push({
                text: chunk,
                embedding: embedding,
            });
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
