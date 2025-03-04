import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.fail({ status: 401, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: string; email: string; role: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.fail({ status: 403, message: 'Invalid or expired token' });
  }
};

declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: string; email: string; role: string };
  }
}