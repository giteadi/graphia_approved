import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  console.error('[Config] ERROR: VITE_OPENAI_API_KEY is not set in .env');
  process.exit(1);
}

console.log('[Config] OpenAI API key loaded:', apiKey.slice(0, 8) + '...' + apiKey.slice(-4));

export const openaiClient = new OpenAI({ apiKey });
