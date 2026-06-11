import { Router } from 'express';
import { openaiClient } from '../config/openai.js';

const router = Router();

router.get('/models', async (_req, res) => {
  try {
    const models = await openaiClient.models.list();
    const ids = models.data.map((m: any) => m.id).sort();
    console.log('[Models] Available:', ids);
    res.json({ models: ids });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
