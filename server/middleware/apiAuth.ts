import { Request, Response, NextFunction } from 'express';

const API_KEY = process.env.API_KEY || 'candidjobs_iep_secure_key_2025';

export function apiAuth(req: Request, res: Response, next: NextFunction): void {
  const clientApiKey = req.headers['x-api-key'] as string;

  if (!clientApiKey || clientApiKey !== API_KEY) {
    res.status(401).json({ 
      success: false, 
      message: 'Unauthorized: Invalid or missing API key' 
    });
    return;
  }

  next();
}