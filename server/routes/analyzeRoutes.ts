import { Router } from 'express';
import { analyzeHandler } from '../controllers/analyzeController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/analyze', authMiddleware, analyzeHandler);

export default router;
