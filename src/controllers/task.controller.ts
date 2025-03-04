import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service';
import { TaskRequest, TaskResponse } from '../types/task.types.js';
import { taskSchema } from '../validations/task.validation.js';

export class TaskController {
  private taskService: TaskService;

  constructor(taskService: TaskService = new TaskService()) {
    this.taskService = taskService;
  }

  async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, description, priority, assignDate, dueDate, status, startDate, completeDate, client, assignedToId } = req.body as TaskRequest;
      const assignedById = req.user!.id;
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
}

export { taskSchema };