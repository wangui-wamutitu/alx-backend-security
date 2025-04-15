import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || 'your-secret-key',
    (err: any, user: any) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' });
      }
      (req as any).user = user;
      next();
    }
  );
}; 