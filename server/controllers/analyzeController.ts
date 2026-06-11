import { Request, Response } from 'express';
import { openaiClient } from '../config/openai.js';
import OpenAI from 'openai';

export async function analyzeHandler(req: Request, res: Response): Promise<void> {
  console.log('[analyzeController] POST /api/analyze hit');

  const { messages, model, max_tokens } = req.body;

  if (!messages || !Array.isArray(messages)) {
    console.error('[analyzeController] Missing or invalid messages field');
    res.status(400).json({ error: 'messages field is required and must be an array' });
    return;
  }

  console.log('[analyzeController] model:', model || 'gpt-4o', '| max_tokens:', max_tokens || 4096);
  console.log('[analyzeController] messages count:', messages.length);

  try {
    const response = await openaiClient.chat.completions.create({
      model: model || 'gpt-4o',
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      max_tokens: max_tokens || 4096,
    });

    console.log('[analyzeController] OpenAI response received ✓ | usage:', response.usage);
    res.json(response);
  } catch (error: any) {
    console.error('[analyzeController] OpenAI error:', error?.message);
    console.error('[analyzeController] Full error:', error);
    const status = error?.status || 500;
    res.status(status).json({ error: error?.message || 'Internal server error' });
  }
}
