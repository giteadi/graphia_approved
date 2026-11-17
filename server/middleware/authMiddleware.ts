import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../controllers/authController.js';

export interface AuthRequest extends Request {
  userId?: number;
  userEmail?: string;
}

// Fallback secrets to ensure existing user sessions generated with previous defaults do not break
const KNOWN_SECRETS = [
  JWT_SECRET,
  'graphia_jwt_super_secret_2024',
  'dev_secret_for_local_testing_only'
].filter(Boolean);

export function verifyUserToken(token: string): { userId?: number; email?: string } | null {
  for (const secret of KNOWN_SECRETS) {
    try {
      const decoded = jwt.verify(token, secret) as { userId?: number; email?: string };
      if (decoded && decoded.userId) {
        return decoded;
      }
    } catch {
      // try next secret
    }
  }
  return null;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid authentication token' });
    return;
  }

  const decoded = verifyUserToken(token);
  if (!decoded || !decoded.userId) {
    res.status(401).json({ error: 'Unauthorized: Token expired or invalid' });
    return;
  }

  req.userId = decoded.userId;
  req.userEmail = decoded.email;
  next();
}

/**
 * Optional authentication: extracts user identity if valid token is provided,
 * but NEVER blocks or rejects requests (critical for payment checkout / order creation).
 */
export function optionalAuthMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (token) {
    const decoded = verifyUserToken(token);
    if (decoded && decoded.userId) {
      req.userId = decoded.userId;
      req.userEmail = decoded.email;
    }
  }

  next();
}
