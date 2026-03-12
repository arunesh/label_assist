import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.userMessage });
    return;
  }

  // Multer file size error
  if (err.message?.includes('File too large')) {
    res.status(400).json({ error: 'Image file is too large. Maximum size is 10MB.' });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
}
