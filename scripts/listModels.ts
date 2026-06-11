import dotenv from 'dotenv';
dotenv.config();

import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.VITE_OPENAI_API_KEY });

const models = await client.models.list();
const ids = models.data.map((m: any) => m.id).sort();

console.log('\n✅ Available models on your API key:\n');
ids.forEach((id: string) => console.log(' -', id));
console.log('\nTotal:', ids.length, 'models\n');
