import { Router } from 'express';
import { analyzeHandler, recalculateHandler } from '../controllers/analyzeController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/analyze', authMiddleware, analyzeHandler);
router.post('/recalculate', authMiddleware, recalculateHandler);

export default router;
