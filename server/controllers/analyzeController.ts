import { Response } from 'express';
import { openaiClient } from '../config/openai.js';
import { query } from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import OpenAI from 'openai';

export async function analyzeHandler(req: AuthRequest, res: Response): Promise<void> {
  console.log('[analyzeController] POST /api/analyze — user:', req.userEmail);

  const { messages, model, max_tokens, grade } = req.body;

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: 'messages field is required and must be an array' });
    return;
  }

  try {
    const response = await openaiClient.chat.completions.create({
      model: model || 'gpt-4o',
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      max_tokens: max_tokens || 4096,
    });

    const reportText = response.choices[0]?.message?.content || '';

    // Save report to DB
    if (req.userId) {
      await query(
        'INSERT INTO reports (user_id, grade, report_text) VALUES (?, ?, ?)',
        [req.userId, grade || null, reportText]
      );
      console.log(`[analyzeController] Report saved for user ${req.userId} ✓`);
    }

    console.log('[analyzeController] OpenAI response ✓ | usage:', response.usage);
    res.json(response);
  } catch (error: any) {
    console.error('[analyzeController] OpenAI error:', error?.message);
    const status = error?.status || 500;
    res.status(status).json({ error: error?.message || 'Internal server error' });
  }
}
