import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service.js';
import { TaskRequest, TaskResponse } from '../types/task.types.js';
import { taskSchema, paginationSchema } from '../validations/task.validation.js';

export class TaskController {
  private taskService: TaskService;

  constructor(taskService: TaskService = new TaskService()) {
    this.taskService = taskService;
  }

  async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, description, priority, assignDate, dueDate, status, startDate, completeDate, client, assignedToId } = req.body as TaskRequest;
      const assignedById = (req as any).user.id; // Cast to any to avoid TypeScript error
      const task: TaskResponse = await this.taskService.createTask({
        title,
        description,
        priority,
        assignDate,
        dueDate,
        status,
        startDate,
        completeDate,
        client,
        assignedToId,
        assignedById
      });
      res.ok({ status: 201, message: 'Task created successfully', data: task });
    } catch (error) {
      next(error);
    }
  }

  async listTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      const { tasks, totalCount } = await this.taskService.listTasks(userId, userRole, limit, offset);
      res.ok({
        status: 200,
        message: 'Tasks fetched successfully',
        data: {
          tasks,
          totalCount,
          limit,
          offset
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export { taskSchema, paginationSchema };