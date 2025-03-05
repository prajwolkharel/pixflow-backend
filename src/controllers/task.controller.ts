import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service.js';
import { TaskRequest, TaskResponse } from '../types/task.types.js';
import { taskSchema, paginationSchema, querySchema, idSchema, taskUpdateSchema } from '../validations/task.validation.js';

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
      const status = req.query.status as string | undefined;
      const priority = req.query.priority as string | undefined;
      const sortBy = req.query.sortBy as string || 'createdAt';
      const order = req.query.order as 'asc' | 'desc' || 'asc';

      const { tasks, totalCount } = await this.taskService.listTasks(userId, userRole, limit, offset, status, priority, sortBy, order);
      res.ok({
        status: 200,
        message: 'Tasks fetched successfully',
        data: {
          tasks,
          totalCount,
          limit,
          offset,
          filters: {
            status,
            priority
          },
          sort: {
            sortBy,
            order
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getTaskById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const taskId = req.params.id;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;

      const task = await this.taskService.getTaskById(taskId, userId, userRole);
      res.ok({
        status: 200,
        message: 'Task fetched successfully',
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTaskById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const taskId = req.params.id;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const updateData = req.body as Partial<TaskRequest>;

      const updatedTask = await this.taskService.updateTaskById(taskId, userId, userRole, updateData);
      res.ok({
        status: 200,
        message: 'Task updated successfully',
        data: updatedTask
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteTaskById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const taskId = req.params.id;
      const userRole = (req as any).user.role;

      await this.taskService.deleteTaskById(taskId, userRole);
      res.ok({
        status: 200,
        message: 'Task deleted successfully',
        data: null
      });
    } catch (error) {
      next(error);
    }
  }
}

export { taskSchema, paginationSchema, querySchema, idSchema, taskUpdateSchema };