import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../types/errors.js';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      throw new ValidationError('Validation failed', errors);
    }
    next();
  };
};