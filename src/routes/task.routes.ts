import express from 'express';
import { TaskController } from '../controllers/task.controller.js';
import { validate } from '../middlewares/validation.js';
import { authenticateToken } from '../middlewares/auth.js';
import { authorizeRole } from '../middlewares/role.js';
import { taskSchema, querySchema } from '../validations/task.validation.js';

const taskController = new TaskController();
const router = express.Router();

router.post(
  '/',
  authenticateToken,
  authorizeRole(['MANAGER']),
  validate(taskSchema),
  taskController.createTask.bind(taskController)
);

router.get(
  '/',
  authenticateToken,
  authorizeRole(['MANAGER', 'EMPLOYEE']),
  validate(querySchema, 'query'), // Validate all query parameters (status, priority, limit, offset, sortBy, order)
  taskController.listTasks.bind(taskController)
);

export default router;