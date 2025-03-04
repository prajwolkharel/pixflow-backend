import { Request, Response, NextFunction } from 'express';

export const authorizeRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user.role;
    if (!roles.includes(userRole)) {
      res.status(403).json({
        success: false,
        message: `Access denied: Requires one of [${roles.join(', ')}] role`,
        data: null
      });
      return;
    }
    next();
  };
};