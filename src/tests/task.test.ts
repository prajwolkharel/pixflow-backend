import request from 'supertest';
import app from '../app.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Tasks', () => {
  // Test for successful MANAGER creation
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

  // Test for rejecting EMPLOYEE task creation
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

  // Test for multiple validation errors
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
      title: '',
      description: undefined,
      priority: 'INVALID',
      assignDate: 'not-a-date',
      dueDate: undefined,
      status: 'INVALID',
      startDate: 'not-a-date',
      completeDate: 'not-a-date',
      client: undefined,
      assignedToId: 'not-a-uuid'
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

  // New test: MANAGER can fetch tasks with pagination
it('should allow MANAGER to fetch tasks with pagination using limit and offset', async () => {
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

  // Create 15 tasks
  const tasks = Array.from({ length: 15 }, (_, i) => ({
    title: `Task ${i + 1}`,
    description: `This is task ${i + 1}`,
    priority: 'HIGH',
    assignDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'TO_DO',
    startDate: new Date().toISOString(),
    completeDate: null,
    client: `Client ${i + 1}`,
    assignedToId: employeeId
  }));

  for (const taskData of tasks) {
    await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send(taskData);
  }

  // Fetch first page (limit=5, offset=0)
  const listRes1 = await request(app)
    .get('/tasks?limit=5&offset=0')
    .set('Authorization', `Bearer ${token}`);

  expect(listRes1.status).toBe(200);
  expect(listRes1.body.success).toBe(true);
  expect(listRes1.body.message).toBe('Tasks fetched successfully');
  expect(listRes1.body.data.tasks).toBeInstanceOf(Array);
  expect(listRes1.body.data.tasks).toHaveLength(5);
  expect(listRes1.body.data.totalCount).toBe(15);
  expect(listRes1.body.data.limit).toBe(5);
  expect(listRes1.body.data.offset).toBe(0);
  expect(listRes1.body.data.tasks[0].title).toBe('Task 1');

  // Fetch second page (limit=5, offset=5)
  const listRes2 = await request(app)
    .get('/tasks?limit=5&offset=5')
    .set('Authorization', `Bearer ${token}`);

  expect(listRes2.status).toBe(200);
  expect(listRes2.body.data.tasks).toHaveLength(5);
  expect(listRes2.body.data.totalCount).toBe(15);
  expect(listRes2.body.data.limit).toBe(5);
  expect(listRes2.body.data.offset).toBe(5);
  expect(listRes2.body.data.tasks[0].title).toBe('Task 6');
});

// New test: EMPLOYEE can fetch assigned tasks with pagination
it('should allow EMPLOYEE to fetch assigned tasks with pagination using limit and offset', async () => {
  const timestamp = Date.now();
  const managerData = {
    name: 'Manager User',
    email: `manager${timestamp}@example.com`,
    password: 'password123',
    role: 'MANAGER'
  };
  const employeeData1 = {
    name: 'Employee User 1',
    email: `employee1${timestamp}@example.com`,
    password: 'password123',
    role: 'EMPLOYEE'
  };
  const employeeData2 = {
    name: 'Employee User 2',
    email: `employee2${timestamp}@example.com`,
    password: 'password123',
    role: 'EMPLOYEE'
  };

  const managerRes = await request(app)
    .post('/auth/register')
    .send(managerData);

  const employeeRes1 = await request(app)
    .post('/auth/register')
    .send(employeeData1);
  const employeeId1 = employeeRes1.body.data.id;

  const employeeRes2 = await request(app)
    .post('/auth/register')
    .send(employeeData2);
  const employeeId2 = employeeRes2.body.data.id;

  const managerLoginRes = await request(app)
    .post('/auth/login')
    .send({ email: managerData.email, password: managerData.password });
  const managerToken = managerLoginRes.body.data.token;

  // Create 8 tasks for employee1, 3 for employee2
  const tasksForEmp1 = Array.from({ length: 8 }, (_, i) => ({
    title: `Task Emp1 ${i + 1}`,
    description: `This is task ${i + 1} for Emp1`,
    priority: 'HIGH',
    assignDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'TO_DO',
    startDate: new Date().toISOString(),
    completeDate: null,
    client: `Client ${i + 1}`,
    assignedToId: employeeId1
  }));

  const tasksForEmp2 = Array.from({ length: 3 }, (_, i) => ({
    title: `Task Emp2 ${i + 1}`,
    description: `This is task ${i + 1} for Emp2`,
    priority: 'LOW',
    assignDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'IN_PROGRESS',
    startDate: new Date().toISOString(),
    completeDate: null,
    client: `Client ${i + 1}`,
    assignedToId: employeeId2
  }));

  for (const taskData of [...tasksForEmp1, ...tasksForEmp2]) {
    await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${managerToken}`)
      .send(taskData);
  }

  const employeeLoginRes = await request(app)
    .post('/auth/login')
    .send({ email: employeeData1.email, password: employeeData1.password });
  const employeeToken = employeeLoginRes.body.data.token;

  // Fetch first page for employee1 (limit=5, offset=0)
  const listRes1 = await request(app)
    .get('/tasks?limit=5&offset=0')
    .set('Authorization', `Bearer ${employeeToken}`);

  expect(listRes1.status).toBe(200);
  expect(listRes1.body.success).toBe(true);
  expect(listRes1.body.message).toBe('Tasks fetched successfully');
  expect(listRes1.body.data.tasks).toHaveLength(5);
  expect(listRes1.body.data.totalCount).toBe(8);
  expect(listRes1.body.data.limit).toBe(5);
  expect(listRes1.body.data.offset).toBe(0);
  expect(listRes1.body.data.tasks[0].assignedToId).toBe(employeeId1);

  // Fetch second page for employee1 (limit=5, offset=5)
  const listRes2 = await request(app)
    .get('/tasks?limit=5&offset=5')
    .set('Authorization', `Bearer ${employeeToken}`);

  expect(listRes2.status).toBe(200);
  expect(listRes2.body.data.tasks).toHaveLength(3); // Only 3 tasks left
  expect(listRes2.body.data.totalCount).toBe(8);
  expect(listRes2.body.data.limit).toBe(5);
  expect(listRes2.body.data.offset).toBe(5);
});

// New test: Handle default pagination values
it('should use default pagination values if not provided', async () => {
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
    .send({ email: managerData.email, password:managerData.password });
  const token = loginRes.body.data.token;

  // Create 15 tasks
  const tasks = Array.from({ length: 15 }, (_, i) => ({
    title: `Task ${i + 1}`,
    description: `This is task ${i + 1}`,
    priority: 'HIGH',
    assignDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'TO_DO',
    startDate: new Date().toISOString(),
    completeDate: null,
    client: `Client ${i + 1}`,
    assignedToId: employeeId
  }));

  for (const taskData of tasks) {
    await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send(taskData);
  }

  const listRes = await request(app)
    .get('/tasks') // No limit or offset provided
    .set('Authorization', `Bearer ${token}`);

  expect(listRes.status).toBe(200);
  expect(listRes.body.success).toBe(true);
  expect(listRes.body.message).toBe('Tasks fetched successfully');
  expect(listRes.body.data.tasks).toHaveLength(10); // Default limit
  expect(listRes.body.data.totalCount).toBe(15);
  expect(listRes.body.data.limit).toBe(10);
  expect(listRes.body.data.offset).toBe(0);
});

// New test: Handle invalid pagination parameters
it('should reject invalid pagination parameters with 400', async () => {
  const timestamp = Date.now();
  const managerData = {
    name: 'Manager User',
    email: `manager${timestamp}@example.com`,
    password: 'password123',
    role: 'MANAGER'
  };

  const managerRes = await request(app)
    .post('/auth/register')
    .send(managerData);

  const loginRes = await request(app)
    .post('/auth/login')
    .send({ email: managerData.email, password: managerData.password });
  const token = loginRes.body.data.token;

  // Invalid limit (negative)
  const listRes1 = await request(app)
    .get('/tasks?limit=-5&offset=0')
    .set('Authorization', `Bearer ${token}`);

  expect(listRes1.status).toBe(400);
  expect(listRes1.body.success).toBe(false);
  expect(listRes1.body.message).toBe('Validation failed');
  expect(listRes1.body.data.errors).toEqual(expect.arrayContaining([
    expect.objectContaining({ field: 'limit', message: expect.stringContaining('"limit" must be greater than or equal to 1') })
  ]));

  // Invalid offset (negative)
  const listRes2 = await request(app)
    .get('/tasks?limit=5&offset=-10')
    .set('Authorization', `Bearer ${token}`);

  expect(listRes2.status).toBe(400);
  expect(listRes2.body.data.errors).toEqual(expect.arrayContaining([
    expect.objectContaining({ field: 'offset', message: expect.stringContaining('"offset" must be greater than or equal to 0') })
  ]));

  // Invalid limit (too large)
  const listRes3 = await request(app)
    .get('/tasks?limit=101&offset=0')
    .set('Authorization', `Bearer ${token}`);

  expect(listRes3.status).toBe(400);
  expect(listRes3.body.data.errors).toEqual(expect.arrayContaining([
    expect.objectContaining({ field: 'limit', message: expect.stringContaining('"limit" must be less than or equal to 100') })
  ]));
});

  afterEach(async () => {
    await prisma.task.deleteMany();
    await prisma.user.deleteMany({ where: { email: { contains: 'test' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'login' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'manager' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'employee' } } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});