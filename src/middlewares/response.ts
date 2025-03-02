import { Request, Response, NextFunction } from 'express';
import { SuccessResponseParams, ErrorResponseParams } from '../types/response.types.js';

export const responseMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.ok = ({ status, message, data = null }) => {
    res.status(status).json({ success: true, message, data });
  };

  res.fail = ({ status, message, data = null }) => {
    res.status(status).json({ success: false, message, data });
  };

  next();
};