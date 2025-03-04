import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  let status = 500;
  let message = 'Internal Server Error';
  let data: Record<string, any> | null = null;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    status = 400;
    message = 'Database error';
    if (err.code === 'P2002') {
      message = `A resource with this ${err.meta?.target} already exists`;
      status = 409;
    }
    data = { errorCode: err.code };
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    status = 400;
    message = 'Database validation error';
  } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    status = 500;
    message = 'Unknown database error';
  } else {
    message = err.message || 'Internal Server Error';
    if (message === 'Invalid email or password') {
      status = 401;
    }
  }

  res.fail({
    status,
    message,
    data
  });
};