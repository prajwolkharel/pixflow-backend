import express from 'express';
import { TaskController } from '../controllers/task.controller.js';
import { validate } from '../middlewares/validation.js';
import { authenticateToken } from '../middlewares/auth.js';
import { authorizeRole } from '../middlewares/role.js';
import { taskSchema, querySchema, idSchema, taskUpdateSchema } from '../validations/task.validation.js';

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
  validate(querySchema, 'query'),
  taskController.listTasks.bind(taskController)
);

router.get(
  '/:id',
  authenticateToken,
  authorizeRole(['MANAGER', 'EMPLOYEE']),
  validate(idSchema, 'params'),
  taskController.getTaskById.bind(taskController)
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRole(['MANAGER', 'EMPLOYEE']),
  validate(idSchema, 'params'),
  validate(taskUpdateSchema, 'body'),
  taskController.updateTaskById.bind(taskController)
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeRole(['MANAGER', 'EMPLOYEE']),
  validate(idSchema, 'params'),
  taskController.deleteTaskById.bind(taskController)
);

router.post(
  '/:id/approve',
  authenticateToken,
  authorizeRole(['MANAGER', 'EMPLOYEE']), // EMPLOYEE will be rejected by service logic
  validate(idSchema, 'params'),
  taskController.approveTaskById.bind(taskController)
);

export default router;