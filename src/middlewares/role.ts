import { Request, Response, NextFunction } from 'express';

export const authorizeRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return res.fail({
        status: 403,
        message: `Access denied: Requires one of [${roles.join(', ')}] role`
      });
    }
    next();
  };
};