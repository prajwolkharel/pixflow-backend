import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().min(1).required().messages({
    'string.empty': '"name" is not allowed to be empty',
    'string.min': '"name" must be at least 1 character long',
    'any.required': '"name" is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': '"email" must be a valid email',
    'any.required': '"email" is required'
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': '"password" length must be at least 8 characters long',
    'any.required': '"password" is required'
  }),
  role: Joi.string().valid('ADMIN', 'MANAGER', 'EMPLOYEE').required().messages({
    'any.only': '"role" must be one of [ADMIN, MANAGER, EMPLOYEE]',
    'any.required': '"role" is required'
  })
}).required();

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": '"email" must be a valid email',
    "any.required": '"email" is required'
  }),
  password: Joi.string().required().messages({
    "any.required": '"password" is required'
  })
}).required();