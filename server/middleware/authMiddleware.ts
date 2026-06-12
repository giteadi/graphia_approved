import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  userId?: number;
  userEmail?: string;
}

// Auth middleware — no token validation, just pass through
// User identity is trusted from request body/headers if provided
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  // Extract user info from custom header (set by frontend after login)
  const userId = req.headers['x-user-id'];
  const userEmail = req.headers['x-user-email'];

  if (userId) req.userId = parseInt(userId as string, 10);
  if (userEmail) req.userEmail = userEmail as string;

  // Always pass through — no token required
  next();
}
