import request from 'supertest';
import app from '../app.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Tasks', () => {
  // Existing test for successful MANAGER creation
  it('should create a task with POST /tasks successfully for MANAGER', async () => {
    const timestamp = Date.now();
    const managerData = {
      name: 'Manager User',
      email: `manager${timestamp}@example.com`,
      password: 'password123',
      role: 'MANAGER'
    };
    const employeeData = {
      name: 'Employee User',
      email: `employee${timestamp}@example.com`,
      password: 'password123',
      role: 'EMPLOYEE'
    };

    const managerRes = await request(app)
      .post('/auth/register')
      .send(managerData);
    const managerId = managerRes.body.data.id;

    const employeeRes = await request(app)
      .post('/auth/register')
      .send(employeeData);
    const employeeId = employeeRes.body.data.id;

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: managerData.email, password: managerData.password });
    const token = loginRes.body.data.token;

    const taskData = {
      title: 'Test Task',
      description: 'This is a test task',
      priority: 'HIGH',
      assignDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'TO_DO',
      startDate: new Date().toISOString(),
      completeDate: null,
      client: 'Test Client',
      assignedToId: employeeId
    };
    const taskRes = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send(taskData);
    expect(taskRes.status).toBe(201);
    expect(taskRes.body.success).toBe(true);
    expect(taskRes.body.message).toBe('Task created successfully');
    expect(taskRes.body.data).toHaveProperty('id');
    expect(taskRes.body.data.title).toBe(taskData.title);
    expect(taskRes.body.data.description).toBe(taskData.description);
    expect(taskRes.body.data.priority).toBe(taskData.priority);
    expect(taskRes.body.data.assignDate).toBeDefined();
    expect(taskRes.body.data.dueDate).toBe(taskData.dueDate);
    expect(taskRes.body.data.status).toBe(taskData.status);
    expect(taskRes.body.data.startDate).toBeDefined();
    expect(taskRes.body.data.completeDate).toBeNull();
    expect(taskRes.body.data.client).toBe(taskData.client);
    expect(taskRes.body.data.isApproved).toBe(false);
    expect(taskRes.body.data.assignedToId).toBe(employeeId);
    expect(taskRes.body.data.assignedById).toBe(managerId);
  });

  // Existing test for rejecting EMPLOYEE task creation
  it('should reject task creation with POST /tasks for EMPLOYEE with 403', async () => {
    const timestamp = Date.now();
    const employeeData = {
      name: 'Employee User',
      email: `employee${timestamp}@example.com`,
      password: 'password123',
      role: 'EMPLOYEE'
    };

    const employeeRes = await request(app)
      .post('/auth/register')
      .send(employeeData);
    const employeeId = employeeRes.body.data.id;

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: employeeData.email, password: employeeData.password });
    const token = loginRes.body.data.token;

    const taskData = {
      title: 'Test Task',
      description: 'This is a test task',
      priority: 'HIGH',
      assignDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'TO_DO',
      startDate: new Date().toISOString(),
      completeDate: null,
      client: 'Test Client',
      assignedToId: employeeId
    };
    const taskRes = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send(taskData);
    expect(taskRes.status).toBe(403);
    expect(taskRes.body.success).toBe(false);
    expect(taskRes.body.message).toBe('Access denied: Requires one of [MANAGER] role');
  });

  // New test for multiple validation errors
  it('should reject task creation with multiple validation errors for MANAGER', async () => {
    const timestamp = Date.now();
    const managerData = {
      name: 'Manager User',
      email: `manager${timestamp}@example.com`,
      password: 'password123',
      role: 'MANAGER'
    };
    const employeeData = {
      name: 'Employee User',
      email: `employee${timestamp}@example.com`,
      password: 'password123',
      role: 'EMPLOYEE'
    };

    const managerRes = await request(app)
      .post('/auth/register')
      .send(managerData);

    const employeeRes = await request(app)
      .post('/auth/register')
      .send(employeeData);
    const employeeId = employeeRes.body.data.id;

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: managerData.email, password: managerData.password });
    const token = loginRes.body.data.token;

    const invalidTaskData = {
      title: '', // Invalid: empty title
      description: undefined, // Invalid: missing required field
      priority: 'INVALID', // Invalid: not one of [LOW, MEDIUM, HIGH]
      assignDate: 'not-a-date', // Invalid: not an ISO date
      dueDate: undefined, // Invalid: missing required field
      status: 'INVALID', // Invalid: not one of [TO_DO, IN_PROGRESS, SUBMITTED, IN_REVIEW, COMPLETED]
      startDate: 'not-a-date', // Invalid: not an ISO date
      completeDate: 'not-a-date', // Invalid: not an ISO date
      client: undefined, // Invalid: missing required field
      assignedToId: 'not-a-uuid' // Invalid: not a UUID
    };

    const taskRes = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidTaskData);

    expect(taskRes.status).toBe(400);
    expect(taskRes.body.success).toBe(false);
    expect(taskRes.body.message).toBe('Validation failed');
    expect(taskRes.body.data.errors).toBeDefined();
    expect(taskRes.body.data.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'title', message: expect.stringContaining('"title" is not allowed to be empty') }),
      expect.objectContaining({ field: 'description', message: expect.stringContaining('"description" is required') }),
      expect.objectContaining({ field: 'priority', message: expect.stringContaining('"priority" must be one of [LOW, MEDIUM, HIGH]') }),
      expect.objectContaining({ field: 'assignDate', message: expect.stringContaining('"assignDate" must be a valid ISO date') }),
      expect.objectContaining({ field: 'dueDate', message: expect.stringContaining('"dueDate" is required') }),
      expect.objectContaining({ field: 'status', message: expect.stringContaining('"status" must be one of [TO_DO, IN_PROGRESS, SUBMITTED, IN_REVIEW, COMPLETED]') }),
      expect.objectContaining({ field: 'startDate', message: expect.stringContaining('"startDate" must be a valid ISO date') }),
      expect.objectContaining({ field: 'completeDate', message: expect.stringContaining('"completeDate" must be a valid ISO date') }),
      expect.objectContaining({ field: 'client', message: expect.stringContaining('"client" is required') }),
      expect.objectContaining({ field: 'assignedToId', message: expect.stringContaining('"assignedToId" must be a valid GUID') })
    ]));
  });

  afterEach(async () => {
    await prisma.task.deleteMany();
    await prisma.feedback.deleteMany();
    await prisma.user.deleteMany({ where: { email: { contains: 'test' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'login' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'manager' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'employee' } } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});