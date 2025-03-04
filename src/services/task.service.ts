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

    // Transform Prisma output to match TaskResponse
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
}