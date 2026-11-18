import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware.js';

const hits = new Map<number, number[]>();

export function analyzeLimiter(req: AuthRequest, res: Response, next: NextFunction): void {
  const limit = parseInt(process.env.ANALYZE_RATE_LIMIT_PER_HOUR || '20', 10);
  const now = Date.now();
  const userId = req.userId || 0;
  const arr = (hits.get(userId) || []).filter(t => now - t < 3600_000);

  if (arr.length >= limit) {
    res.status(429).json({ error: 'Too many analysis requests. Please try again later.' });
    return;
  }

  arr.push(now);
  hits.set(userId, arr);
  next();
}
