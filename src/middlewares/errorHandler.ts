import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ValidationError } from '../types/errors.js';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  let status = 500;
  let message = 'Internal Server Error';
  let errors: { field: string; message: string }[] | null = null;
  let errorCode: string | undefined;

  if (err instanceof ValidationError) {
    status = err.status;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    status = 400;
    message = 'Database error';
    errorCode = err.code;
    if (err.code === 'P2002') {
      message = `A user with this ${err.meta?.target} already exists`;
    }
  } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    status = 500;
    message = 'Unknown database error';
  } else if (err instanceof Error) {
    message = err.message;
  }

  res.status(status).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(errorCode && { errorCode })
  });
};