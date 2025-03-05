import { PrismaClient } from '@prisma/client';
import { TaskRequest, TaskResponse } from '../types/task.types.js';

export class TaskService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient = new PrismaClient()) {
    this.prisma = prisma;
  }

  async createTask({
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
  }: TaskRequest & { assignedById: string }): Promise<TaskResponse> {
    const task = await this.prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        assignDate: assignDate ? new Date(assignDate) : new Date(),
        dueDate: new Date(dueDate),
        status: status || 'TO_DO',
        startDate: startDate ? new Date(startDate) : null,
        completeDate: completeDate ? new Date(completeDate) : null,
        client,
        assignedToId,
        assignedById,
        isApproved: false
      },
      select: {
        id: true,
        title: true,
        description: true,
        priority: true,
        assignDate: true,
        dueDate: true,
        status: true,
        startDate: true,
        completeDate: true,
        client: true,
        isApproved: true,
        assignedToId: true,
        assignedById: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      assignDate: task.assignDate.toISOString(),
      dueDate: task.dueDate.toISOString(),
      status: task.status,
      startDate: task.startDate ? task.startDate.toISOString() : task.startDate,
      completeDate: task.completeDate ? task.completeDate.toISOString() : task.completeDate,
      client: task.client,
      isApproved: task.isApproved,
      assignedToId: task.assignedToId,
      assignedById: task.assignedById,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString()
    };
  }

  async listTasks(
    userId: string,
    userRole: string,
    limit: number,
    offset: number,
    status?: string,
    priority?: string,
    sortBy: string = 'createdAt',
    order: 'asc' | 'desc' = 'asc'
  ): Promise<{ tasks: TaskResponse[], totalCount: number }> {
    const whereClause: any = userRole === 'EMPLOYEE' ? { assignedToId: userId } : {};

    if (status) {
      whereClause.status = status;
    }
    if (priority) {
      whereClause.priority = priority;
    }

    const totalCount = await this.prisma.task.count({ where: whereClause });

    const tasks = await this.prisma.task.findMany({
      where: whereClause,
      skip: offset,
      take: limit,
      orderBy: {
        [sortBy]: order
      },
      select: {
        id: true,
        title: true,
        description: true,
        priority: true,
        assignDate: true,
        dueDate: true,
        status: true,
        startDate: true,
        completeDate: true,
        client: true,
        isApproved: true,
        assignedToId: true,
        assignedById: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      tasks: tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        assignDate: task.assignDate.toISOString(),
        dueDate: task.dueDate.toISOString(),
        status: task.status,
        startDate: task.startDate ? task.startDate.toISOString() : task.startDate,
        completeDate: task.completeDate ? task.completeDate.toISOString() : task.completeDate,
        client: task.client,
        isApproved: task.isApproved,
        assignedToId: task.assignedToId,
        assignedById: task.assignedById,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString()
      })),
      totalCount
    };
  }

  async getTaskById(taskId: string, userId: string, userRole: string): Promise<TaskResponse> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        title: true,
        description: true,
        priority: true,
        assignDate: true,
        dueDate: true,
        status: true,
        startDate: true,
        completeDate: true,
        client: true,
        isApproved: true,
        assignedToId: true,
        assignedById: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!task) {
      throw new Error('Task not found');
    }

    if (userRole === 'EMPLOYEE' && task.assignedToId !== userId) {
      throw new Error('Access denied: You are not assigned to this task');
    }

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      assignDate: task.assignDate.toISOString(),
      dueDate: task.dueDate.toISOString(),
      status: task.status,
      startDate: task.startDate ? task.startDate.toISOString() : task.startDate,
      completeDate: task.completeDate ? task.completeDate.toISOString() : task.completeDate,
      client: task.client,
      isApproved: task.isApproved,
      assignedToId: task.assignedToId,
      assignedById: task.assignedById,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString()
    };
  }

  async updateTaskById(
    taskId: string,
    userId: string,
    userRole: string,
    updateData: Partial<TaskRequest>
  ): Promise<TaskResponse> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      throw new Error('Task not found');
    }

    if (userRole === 'EMPLOYEE' && task.assignedToId !== userId) {
      throw new Error('Access denied: You are not assigned to this task');
    }

    const dataToUpdate: any = {};
    if (updateData.title) dataToUpdate.title = updateData.title;
    if (updateData.description) dataToUpdate.description = updateData.description;
    if (updateData.priority) dataToUpdate.priority = updateData.priority;
    if (updateData.assignDate) dataToUpdate.assignDate = new Date(updateData.assignDate);
    if (updateData.dueDate) dataToUpdate.dueDate = new Date(updateData.dueDate);
    if (updateData.status) dataToUpdate.status = updateData.status;
    if (updateData.startDate !== undefined) dataToUpdate.startDate = updateData.startDate ? new Date(updateData.startDate) : null;
    if (updateData.completeDate !== undefined) dataToUpdate.completeDate = updateData.completeDate ? new Date(updateData.completeDate) : null;
    if (updateData.client) dataToUpdate.client = updateData.client;
    if (updateData.assignedToId) dataToUpdate.assignedToId = updateData.assignedToId;

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: dataToUpdate,
      select: {
        id: true,
        title: true,
        description: true,
        priority: true,
        assignDate: true,
        dueDate: true,
        status: true,
        startDate: true,
        completeDate: true,
        client: true,
        isApproved: true,
        assignedToId: true,
        assignedById: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      id: updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description,
      priority: updatedTask.priority,
      assignDate: updatedTask.assignDate.toISOString(),
      dueDate: updatedTask.dueDate.toISOString(),
      status: updatedTask.status,
      startDate: updatedTask.startDate ? updatedTask.startDate.toISOString() : updatedTask.startDate,
      completeDate: updatedTask.completeDate ? updatedTask.completeDate.toISOString() : updatedTask.completeDate,
      client: updatedTask.client,
      isApproved: updatedTask.isApproved,
      assignedToId: updatedTask.assignedToId,
      assignedById: updatedTask.assignedById,
      createdAt: updatedTask.createdAt.toISOString(),
      updatedAt: updatedTask.updatedAt.toISOString()
    };
  }

  async deleteTaskById(taskId: string, userRole: string): Promise<void> {
    // Fetch the task to check existence
    const task = await this.prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Access control: Only MANAGER can delete tasks
    if (userRole !== 'MANAGER') {
      throw new Error('Access denied: Requires MANAGER role');
    }

    // Delete the task
    await this.prisma.task.delete({
      where: { id: taskId }
    });
  }
}