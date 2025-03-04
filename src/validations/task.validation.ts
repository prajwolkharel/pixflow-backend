import Joi from 'joi';

export const taskSchema = Joi.object({
  title: Joi.string().min(1).required().messages({
    'string.empty': '"title" is not allowed to be empty',
    'string.min': '"title" must be at least 1 character long',
    'any.required': '"title" is required'
  }),
  description: Joi.string().required().messages({
    'string.base': '"description" must be a string',
    'any.required': '"description" is required'
  }),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').default('MEDIUM').messages({
    'any.only': '"priority" must be one of [LOW, MEDIUM, HIGH]'
  }),
  assignDate: Joi.string().isoDate().default(new Date().toISOString()).messages({
    'string.isoDate': '"assignDate" must be a valid ISO date'
  }),
  dueDate: Joi.string().isoDate().required().messages({
    'string.isoDate': '"dueDate" must be a valid ISO date',
    'any.required': '"dueDate" is required'
  }),
  status: Joi.string().valid('TO_DO', 'IN_PROGRESS', 'SUBMITTED', 'IN_REVIEW', 'COMPLETED').default('TO_DO').messages({
    'any.only': '"status" must be one of [TO_DO, IN_PROGRESS, SUBMITTED, IN_REVIEW, COMPLETED]'
  }),
  startDate: Joi.string().isoDate().allow(null).optional().messages({
    'string.isoDate': '"startDate" must be a valid ISO date'
  }),
  completeDate: Joi.string().isoDate().allow(null).optional().messages({
    'string.isoDate': '"completeDate" must be a valid ISO date'
  }),
  client: Joi.string().required().messages({
    'string.base': '"client" must be a string',
    'any.required': '"client" is required'
  }),
  assignedToId: Joi.string().uuid().required().messages({
    'string.uuid': '"assignedToId" must be a valid UUID',
    'any.required': '"assignedToId" is required'
  })
}).required();