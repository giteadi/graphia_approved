import { Router } from 'express';
import { analyzeHandler, recalculateHandler } from '../controllers/analyzeController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { analyzeLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/analyze', authMiddleware, analyzeLimiter, analyzeHandler);
router.post('/recalculate', authMiddleware, recalculateHandler);

export default router;
