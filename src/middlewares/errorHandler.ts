import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ValidationError } from '../types/errors.js';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  let status = 500;
  let message = 'Internal Server Error';
  let data: { errors?: { field: string; message: string }[]; errorCode?: string } | null = null;

  if (err instanceof ValidationError) {
    status = err.status;
    message = err.message;
    data = { errors: err.errors };
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    status = 400;
    message = 'Database error';
    if (err.code === 'P2002') {
      message = `A user with this ${err.meta?.target} already exists`;
    }
    data = { errorCode: err.code };
  } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    status = 500;
    message = 'Unknown database error';
  } else if (err instanceof Error) {
    message = err.message;
  }

  res.fail({
    status,
    message,
    data
  });
};