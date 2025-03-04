import { Request, Response, NextFunction } from 'express';

export const responseMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.ok = function ({ status, message, data }) {
    return res.status(status).json({
      success: true,
      message,
      data
    });
  };

  res.fail = function ({ status, message, data }) {
    return res.status(status).json({
      success: false,
      message,
      data
    });
  };

  next();
};