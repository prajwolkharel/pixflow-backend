import request from "supertest";
import app from "../app.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Tasks", () => {
  // Test for successful MANAGER creation
  it("should create a task with POST /tasks successfully for MANAGER", async () => {
    const timestamp = Date.now();
    const managerData = {
      name: "Manager User",
      email: `manager${timestamp}@example.com`,
      password: "password123",
      role: "MANAGER",
    };
    const employeeData = {
      name: "Employee User",
      email: `employee${timestamp}@example.com`,
      password: "password123",
      role: "EMPLOYEE",
    };

    const managerRes = await request(app)
      .post("/auth/register")
      .send(managerData);
    const managerId = managerRes.body.data.id;

    const employeeRes = await request(app)
      .post("/auth/register")
      .send(employeeData);
    const employeeId = employeeRes.body.data.id;

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: managerData.email, password: managerData.password });
    const token = loginRes.body.data.token;

    const taskData = {
      title: "Test Task",
      description: "This is a test task",
      priority: "HIGH",
      assignDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "TO_DO",
      startDate: new Date().toISOString(),
      completeDate: null,
      client: "Test Client",
      assignedToId: employeeId,
    };
    const taskRes = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send(taskData);
    expect(taskRes.status).toBe(201);
    expect(taskRes.body.success).toBe(true);
    expect(taskRes.body.message).toBe("Task created successfully");
    expect(taskRes.body.data).toHaveProperty("id");
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
  it("should reject task creation with POST /tasks for EMPLOYEE with 403", async () => {
    const timestamp = Date.now();
    const employeeData = {
      name: "Employee User",
      email: `employee${timestamp}@example.com`,
      password: "password123",
      role: "EMPLOYEE",
    };

    const employeeRes = await request(app)
      .post("/auth/register")
      .send(employeeData);
    const employeeId = employeeRes.body.data.id;

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: employeeData.email, password: employeeData.password });
    const token = loginRes.body.data.token;

    const taskData = {
      title: "Test Task",
      description: "This is a test task",
      priority: "HIGH",
      assignDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "TO_DO",
      startDate: new Date().toISOString(),
      completeDate: null,
      client: "Test Client",
      assignedToId: employeeId,
    };
    const taskRes = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send(taskData);
    expect(taskRes.status).toBe(403);
    expect(taskRes.body.success).toBe(false);
    expect(taskRes.body.message).toBe(
      "Access denied: Requires one of [MANAGER] role"
    );
  });

  // Test for multiple validation errors
  it("should reject task creation with multiple validation errors for MANAGER", async () => {
    const timestamp = Date.now();
    const managerData = {
      name: "Manager User",
      email: `manager${timestamp}@example.com`,
      password: "password123",
      role: "MANAGER",
    };
    const employeeData = {
      name: "Employee User",
      email: `employee${timestamp}@example.com`,
      password: "password123",
      role: "EMPLOYEE",
    };

    const managerRes = await request(app)
      .post("/auth/register")
      .send(managerData);

    const employeeRes = await request(app)
      .post("/auth/register")
      .send(employeeData);
    const employeeId = employeeRes.body.data.id;

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: managerData.email, password: managerData.password });
    const token = loginRes.body.data.token;

    const invalidTaskData = {
      title: "",
      description: undefined,
      priority: "INVALID",
      assignDate: "not-a-date",
      dueDate: undefined,
      status: "INVALID",
      startDate: "not-a-date",
      completeDate: "not-a-date",
      client: undefined,
      assignedToId: "not-a-uuid",
    };

    const taskRes = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send(invalidTaskData);

    expect(taskRes.status).toBe(400);
    expect(taskRes.body.success).toBe(false);
    expect(taskRes.body.message).toBe("Validation failed");
    expect(taskRes.body.data.errors).toBeDefined();
    expect(taskRes.body.data.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "title",
          message: expect.stringContaining(
            '"title" is not allowed to be empty'
          ),
        }),
        expect.objectContaining({
          field: "description",
          message: expect.stringContaining('"description" is required'),
        }),
        expect.objectContaining({
          field: "priority",
          message: expect.stringContaining(
            '"priority" must be one of [LOW, MEDIUM, HIGH]'
          ),
        }),
        expect.objectContaining({
          field: "assignDate",
          message: expect.stringContaining(
            '"assignDate" must be a valid ISO date'
          ),
        }),
        expect.objectContaining({
          field: "dueDate",
          message: expect.stringContaining('"dueDate" is required'),
        }),
        expect.objectContaining({
          field: "status",
          message: expect.stringContaining(
            '"status" must be one of [TO_DO, IN_PROGRESS, SUBMITTED, IN_REVIEW, COMPLETED]'
          ),
        }),
        expect.objectContaining({
          field: "startDate",
          message: expect.stringContaining(
            '"startDate" must be a valid ISO date'
          ),
        }),
        expect.objectContaining({
          field: "completeDate",
          message: expect.stringContaining(
            '"completeDate" must be a valid ISO date'
          ),
        }),
        expect.objectContaining({
          field: "client",
          message: expect.stringContaining('"client" is required'),
        }),
        expect.objectContaining({
          field: "assignedToId",
          message: expect.stringContaining(
            '"assignedToId" must be a valid GUID'
          ),
        }),
      ])
    );
  });

  // New test: MANAGER can fetch tasks with pagination
  it("should allow MANAGER to fetch tasks with pagination using limit and offset", async () => {
    const timestamp = Date.now();
    const managerData = {
      name: "Manager User",
      email: `manager${timestamp}@example.com`,
      password: "password123",
      role: "MANAGER",
    };
    const employeeData = {
      name: "Employee User",
      email: `employee${timestamp}@example.com`,
      password: "password123",
      role: "EMPLOYEE",
    };

    const managerRes = await request(app)
      .post("/auth/register")
      .send(managerData);
    const managerId = managerRes.body.data.id;

    const employeeRes = await request(app)
      .post("/auth/register")
      .send(employeeData);
    const employeeId = employeeRes.body.data.id;

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: managerData.email, password: managerData.password });
    const token = loginRes.body.data.token;

    // Create 15 tasks
    const tasks = Array.from({ length: 15 }, (_, i) => ({
      title: `Task ${i + 1}`,
      description: `This is task ${i + 1}`,
      priority: "HIGH",
      assignDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "TO_DO",
      startDate: new Date().toISOString(),
      completeDate: null,
      client: `Client ${i + 1}`,
      assignedToId: employeeId,
    }));

    for (const taskData of tasks) {
      await request(app)
        .post("/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send(taskData);
    }

    // Fetch first page (limit=5, offset=0)
    const listRes1 = await request(app)
      .get("/tasks?limit=5&offset=0")
      .set("Authorization", `Bearer ${token}`);

    expect(listRes1.status).toBe(200);
    expect(listRes1.body.success).toBe(true);
    expect(listRes1.body.message).toBe("Tasks fetched successfully");
    expect(listRes1.body.data.tasks).toBeInstanceOf(Array);
    expect(listRes1.body.data.tasks).toHaveLength(5);
    expect(listRes1.body.data.totalCount).toBe(15);
    expect(listRes1.body.data.limit).toBe(5);
    expect(listRes1.body.data.offset).toBe(0);
    expect(listRes1.body.data.tasks[0].title).toBe("Task 1");

    // Fetch second page (limit=5, offset=5)
    const listRes2 = await request(app)
      .get("/tasks?limit=5&offset=5")
      .set("Authorization", `Bearer ${token}`);

    expect(listRes2.status).toBe(200);
    expect(listRes2.body.data.tasks).toHaveLength(5);
    expect(listRes2.body.data.totalCount).toBe(15);
    expect(listRes2.body.data.limit).toBe(5);
    expect(listRes2.body.data.offset).toBe(5);
    expect(listRes2.body.data.tasks[0].title).toBe("Task 6");
  });

  // New test: EMPLOYEE can fetch assigned tasks with pagination
  it("should allow EMPLOYEE to fetch assigned tasks with pagination using limit and offset", async () => {
    const timestamp = Date.now();
    const managerData = {
      name: "Manager User",
      email: `manager${timestamp}@example.com`,
      password: "password123",
      role: "MANAGER",
    };
    const employeeData1 = {
      name: "Employee User 1",
      email: `employee1${timestamp}@example.com`,
      password: "password123",
      role: "EMPLOYEE",
    };
    const employeeData2 = {
      name: "Employee User 2",
      email: `employee2${timestamp}@example.com`,
      password: "password123",
      role: "EMPLOYEE",
    };

    const managerRes = await request(app)
      .post("/auth/register")
      .send(managerData);

    const employeeRes1 = await request(app)
      .post("/auth/register")
      .send(employeeData1);
    const employeeId1 = employeeRes1.body.data.id;

    const employeeRes2 = await request(app)
      .post("/auth/register")
      .send(employeeData2);
    const employeeId2 = employeeRes2.body.data.id;

    const managerLoginRes = await request(app)
      .post("/auth/login")
      .send({ email: managerData.email, password: managerData.password });
    const managerToken = managerLoginRes.body.data.token;

    // Create 8 tasks for employee1, 3 for employee2
    const tasksForEmp1 = Array.from({ length: 8 }, (_, i) => ({
      title: `Task Emp1 ${i + 1}`,
      description: `This is task ${i + 1} for Emp1`,
      priority: "HIGH",
      assignDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "TO_DO",
      startDate: new Date().toISOString(),
      completeDate: null,
      client: `Client ${i + 1}`,
      assignedToId: employeeId1,
    }));

    const tasksForEmp2 = Array.from({ length: 3 }, (_, i) => ({
      title: `Task Emp2 ${i + 1}`,
      description: `This is task ${i + 1} for Emp2`,
      priority: "LOW",
      assignDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "IN_PROGRESS",
      startDate: new Date().toISOString(),
      completeDate: null,
      client: `Client ${i + 1}`,
      assignedToId: employeeId2,
    }));

    for (const taskData of [...tasksForEmp1, ...tasksForEmp2]) {
      await request(app)
        .post("/tasks")
        .set("Authorization", `Bearer ${managerToken}`)
        .send(taskData);
    }

    const employeeLoginRes = await request(app)
      .post("/auth/login")
      .send({ email: employeeData1.email, password: employeeData1.password });
    const employeeToken = employeeLoginRes.body.data.token;

    // Fetch first page for employee1 (limit=5, offset=0)
    const listRes1 = await request(app)
      .get("/tasks?limit=5&offset=0")
      .set("Authorization", `Bearer ${employeeToken}`);

    expect(listRes1.status).toBe(200);
    expect(listRes1.body.success).toBe(true);
    expect(listRes1.body.message).toBe("Tasks fetched successfully");
    expect(listRes1.body.data.tasks).toHaveLength(5);
    expect(listRes1.body.data.totalCount).toBe(8);
    expect(listRes1.body.data.limit).toBe(5);
    expect(listRes1.body.data.offset).toBe(0);
    expect(listRes1.body.data.tasks[0].assignedToId).toBe(employeeId1);

    // Fetch second page for employee1 (limit=5, offset=5)
    const listRes2 = await request(app)
      .get("/tasks?limit=5&offset=5")
      .set("Authorization", `Bearer ${employeeToken}`);

    expect(listRes2.status).toBe(200);
    expect(listRes2.body.data.tasks).toHaveLength(3); // Only 3 tasks left
    expect(listRes2.body.data.totalCount).toBe(8);
    expect(listRes2.body.data.limit).toBe(5);
    expect(listRes2.body.data.offset).toBe(5);
  });

  // New test: Handle default pagination values
  it("should use default pagination values if not provided", async () => {
    const timestamp = Date.now();
    const managerData = {
      name: "Manager User",
      email: `manager${timestamp}@example.com`,
      password: "password123",
      role: "MANAGER",
    };
    const employeeData = {
      name: "Employee User",
      email: `employee${timestamp}@example.com`,
      password: "password123",
      role: "EMPLOYEE",
    };

    const managerRes = await request(app)
      .post("/auth/register")
      .send(managerData);

    const employeeRes = await request(app)
      .post("/auth/register")
      .send(employeeData);
    const employeeId = employeeRes.body.data.id;

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: managerData.email, password: managerData.password });
    const token = loginRes.body.data.token;

    // Create 15 tasks
    const tasks = Array.from({ length: 15 }, (_, i) => ({
      title: `Task ${i + 1}`,
      description: `This is task ${i + 1}`,
      priority: "HIGH",
      assignDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "TO_DO",
      startDate: new Date().toISOString(),
      completeDate: null,
      client: `Client ${i + 1}`,
      assignedToId: employeeId,
    }));

    for (const taskData of tasks) {
      await request(app)
        .post("/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send(taskData);
    }

    const listRes = await request(app)
      .get("/tasks") // No limit or offset provided
      .set("Authorization", `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.message).toBe("Tasks fetched successfully");
    expect(listRes.body.data.tasks).toHaveLength(10); // Default limit
    expect(listRes.body.data.totalCount).toBe(15);
    expect(listRes.body.data.limit).toBe(10);
    expect(listRes.body.data.offset).toBe(0);
  });

  // New test: Handle invalid pagination parameters
  it("should reject invalid pagination parameters with 400", async () => {
    const timestamp = Date.now();
    const managerData = {
      name: "Manager User",
      email: `manager${timestamp}@example.com`,
      password: "password123",
      role: "MANAGER",
    };

    const managerRes = await request(app)
      .post("/auth/register")
      .send(managerData);

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: managerData.email, password: managerData.password });
    const token = loginRes.body.data.token;

    // Invalid limit (negative)
    const listRes1 = await request(app)
      .get("/tasks?limit=-5&offset=0")
      .set("Authorization", `Bearer ${token}`);

    expect(listRes1.status).toBe(400);
    expect(listRes1.body.success).toBe(false);
    expect(listRes1.body.message).toBe("Validation failed");
    expect(listRes1.body.data.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "limit",
          message: expect.stringContaining(
            '"limit" must be greater than or equal to 1'
          ),
        }),
      ])
    );

    // Invalid offset (negative)
    const listRes2 = await request(app)
      .get("/tasks?limit=5&offset=-10")
      .set("Authorization", `Bearer ${token}`);

    expect(listRes2.status).toBe(400);
    expect(listRes2.body.data.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "offset",
          message: expect.stringContaining(
            '"offset" must be greater than or equal to 0'
          ),
        }),
      ])
    );

    // Invalid limit (too large)
    const listRes3 = await request(app)
      .get("/tasks?limit=101&offset=0")
      .set("Authorization", `Bearer ${token}`);

    expect(listRes3.status).toBe(400);
    expect(listRes3.body.data.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "limit",
          message: expect.stringContaining(
            '"limit" must be less than or equal to 100'
          ),
        }),
      ])
    );
  });

  // New test: MANAGER can filter tasks by status
  it("should allow MANAGER to filter tasks by status", async () => {
    const timestamp = Date.now();
    const managerData = {
      name: "Manager User",
      email: `manager${timestamp}@example.com`,
      password: "password123",
      role: "MANAGER",
    };
    const employeeData = {
      name: "Employee User",
      email: `employee${timestamp}@example.com`,
      password: "password123",
      role: "EMPLOYEE",
    };

    const managerRes = await request(app)
      .post("/auth/register")
      .send(managerData);

    const employeeRes = await request(app)
      .post("/auth/register")
      .send(employeeData);
    const employeeId = employeeRes.body.data.id;

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: managerData.email, password: managerData.password });
    const token = loginRes.body.data.token;

    // Create tasks with different statuses
    const tasks = [
      {
        title: "Task 1",
        description: "Task 1",
        priority: "HIGH",
        assignDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "TO_DO",
        startDate: new Date().toISOString(),
        completeDate: null,
        client: "Client 1",
        assignedToId: employeeId,
      },
      {
        title: "Task 2",
        description: "Task 2",
        priority: "MEDIUM",
        assignDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "IN_PROGRESS",
        startDate: new Date().toISOString(),
        completeDate: null,
        client: "Client 2",
        assignedToId: employeeId,
      },
      {
        title: "Task 3",
        description: "Task 3",
        priority: "LOW",
        assignDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "TO_DO",
        startDate: new Date().toISOString(),
        completeDate: null,
        client: "Client 3",
        assignedToId: employeeId,
      },
    ];

    for (const taskData of tasks) {
      await request(app)
        .post("/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send(taskData);
    }

    // Filter by status=TO_DO
    const listRes = await request(app)
      .get("/tasks?status=TO_DO")
      .set("Authorization", `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.message).toBe("Tasks fetched successfully");
    expect(listRes.body.data.tasks).toBeInstanceOf(Array);
    expect(listRes.body.data.tasks).toHaveLength(2); // Should return Task 1 and Task 3
    expect(listRes.body.data.totalCount).toBe(2);
    expect(listRes.body.data.filters).toEqual({
      status: "TO_DO",
      priority: undefined,
    });
  });

  // New test: MANAGER can filter tasks by priority
  it("should allow MANAGER to filter tasks by priority", async () => {
    const timestamp = Date.now();
    const managerData = {
      name: "Manager User",
      email: `manager${timestamp}@example.com`,
      password: "password123",
      role: "MANAGER",
    };
    const employeeData = {
      name: "Employee User",
      email: `employee${timestamp}@example.com`,
      password: "password123",
      role: "EMPLOYEE",
    };

    const managerRes = await request(app)
      .post("/auth/register")
      .send(managerData);

    const employeeRes = await request(app)
      .post("/auth/register")
      .send(employeeData);
    const employeeId = employeeRes.body.data.id;

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: managerData.email, password: managerData.password });
    const token = loginRes.body.data.token;

    // Create tasks with different priorities
    const tasks = [
      {
        title: "Task 1",
        description: "Task 1",
        priority: "HIGH",
        assignDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "TO_DO",
        startDate: new Date().toISOString(),
        completeDate: null,
        client: "Client 1",
        assignedToId: employeeId,
      },
      {
        title: "Task 2",
        description: "Task 2",
        priority: "MEDIUM",
        assignDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "IN_PROGRESS",
        startDate: new Date().toISOString(),
        completeDate: null,
        client: "Client 2",
        assignedToId: employeeId,
      },
      {
        title: "Task 3",
        description: "Task 3",
        priority: "HIGH",
        assignDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "COMPLETED",
        startDate: new Date().toISOString(),
        completeDate: null,
        client: "Client 3",
        assignedToId: employeeId,
      },
    ];

    for (const taskData of tasks) {
      await request(app)
        .post("/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send(taskData);
    }

    // Filter by priority=HIGH
    const listRes = await request(app)
      .get("/tasks?priority=HIGH")
      .set("Authorization", `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.message).toBe("Tasks fetched successfully");
    expect(listRes.body.data.tasks).toBeInstanceOf(Array);
    expect(listRes.body.data.tasks).toHaveLength(2); // Should return Task 1 and Task 3
    expect(listRes.body.data.totalCount).toBe(2);
    expect(listRes.body.data.filters).toEqual({
      status: undefined,
      priority: "HIGH",
    });
  });

  // New test: MANAGER can filter tasks by both status and priority
  it("should allow MANAGER to filter tasks by both status and priority", async () => {
    const timestamp = Date.now();
    const managerData = {
      name: "Manager User",
      email: `manager${timestamp}@example.com`,
      password: "password123",
      role: "MANAGER",
    };
    const employeeData = {
      name: "Employee User",
      email: `employee${timestamp}@example.com`,
      password: "password123",
      role: "EMPLOYEE",
    };

    const managerRes = await request(app)
      .post("/auth/register")
      .send(managerData);

    const employeeRes = await request(app)
      .post("/auth/register")
      .send(employeeData);
    const employeeId = employeeRes.body.data.id;

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: managerData.email, password: managerData.password });
    const token = loginRes.body.data.token;

    // Create tasks with different statuses and priorities
    const tasks = [
      {
        title: "Task 1",
        description: "Task 1",
        priority: "HIGH",
        assignDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "TO_DO",
        startDate: new Date().toISOString(),
        completeDate: null,
        client: "Client 1",
        assignedToId: employeeId,
      },
      {
        title: "Task 2",
        description: "Task 2",
        priority: "HIGH",
        assignDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "IN_PROGRESS",
        startDate: new Date().toISOString(),
        completeDate: null,
        client: "Client 2",
        assignedToId: employeeId,
      },
      {
        title: "Task 3",
        description: "Task 3",
        priority: "LOW",
        assignDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "TO_DO",
        startDate: new Date().toISOString(),
        completeDate: null,
        client: "Client 3",
        assignedToId: employeeId,
      },
    ];

    for (const taskData of tasks) {
      await request(app)
        .post("/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send(taskData);
    }

    // Filter by status=TO_DO and priority=HIGH
    const listRes = await request(app)
      .get("/tasks?status=TO_DO&priority=HIGH")
      .set("Authorization", `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.message).toBe("Tasks fetched successfully");
    expect(listRes.body.data.tasks).toBeInstanceOf(Array);
    expect(listRes.body.data.tasks).toHaveLength(1); // Should return only Task 1
    expect(listRes.body.data.totalCount).toBe(1);
    expect(listRes.body.data.filters).toEqual({
      status: "TO_DO",
      priority: "HIGH",
    });
  });

  // New test: EMPLOYEE can filter assigned tasks by status
  it("should allow EMPLOYEE to filter assigned tasks by status", async () => {
    const timestamp = Date.now();
    const managerData = {
      name: "Manager User",
      email: `manager${timestamp}@example.com`,
      password: "password123",
      role: "MANAGER",
    };
    const employeeData1 = {
      name: "Employee User 1",
      email: `employee1${timestamp}@example.com`,
      password: "password123",
      role: "EMPLOYEE",
    };
    const employeeData2 = {
      name: "Employee User 2",
      email: `employee2${timestamp}@example.com`,
      password: "password123",
      role: "EMPLOYEE",
    };

    const managerRes = await request(app)
      .post("/auth/register")
      .send(managerData);

    const employeeRes1 = await request(app)
      .post("/auth/register")
      .send(employeeData1);
    const employeeId1 = employeeRes1.body.data.id;

    const employeeRes2 = await request(app)
      .post("/auth/register")
      .send(employeeData2);
    const employeeId2 = employeeRes2.body.data.id;

    const managerLoginRes = await request(app)
      .post("/auth/login")
      .send({ email: managerData.email, password: managerData.password });
    const managerToken = managerLoginRes.body.data.token;

    // Create tasks for employee1 and employee2
    const tasks = [
      {
        title: "Task 1",
        description: "Task 1",
        priority: "HIGH",
        assignDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "TO_DO",
        startDate: new Date().toISOString(),
        completeDate: null,
        client: "Client 1",
        assignedToId: employeeId1,
      },
      {
        title: "Task 2",
        description: "Task 2",
        priority: "MEDIUM",
        assignDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "IN_PROGRESS",
        startDate: new Date().toISOString(),
        completeDate: null,
        client: "Client 2",
        assignedToId: employeeId1,
      },
      {
        title: "Task 3",
        description: "Task 3",
        priority: "LOW",
        assignDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "TO_DO",
        startDate: new Date().toISOString(),
        completeDate: null,
        client: "Client 3",
        assignedToId: employeeId2,
      },
    ];

    for (const taskData of tasks) {
      await request(app)
        .post("/tasks")
        .set("Authorization", `Bearer ${managerToken}`)
        .send(taskData);
    }

    const employeeLoginRes = await request(app)
      .post("/auth/login")
      .send({ email: employeeData1.email, password: employeeData1.password });
    const employeeToken = employeeLoginRes.body.data.token;

    // Filter by status=TO_DO for employee1
    const listRes = await request(app)
      .get("/tasks?status=TO_DO")
      .set("Authorization", `Bearer ${employeeToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.message).toBe("Tasks fetched successfully");
    expect(listRes.body.data.tasks).toBeInstanceOf(Array);
    expect(listRes.body.data.tasks).toHaveLength(1); // Should return only Task 1 (assigned to employee1)
    expect(listRes.body.data.totalCount).toBe(1);
    expect(listRes.body.data.filters).toEqual({
      status: "TO_DO",
      priority: undefined,
    });
  });

  // New test: Handle invalid filter parameters
  it("should reject invalid filter parameters with 400", async () => {
    const timestamp = Date.now();
    const managerData = {
      name: "Manager User",
      email: `manager${timestamp}@example.com`,
      password: "password123",
      role: "MANAGER",
    };

    const managerRes = await request(app)
      .post("/auth/register")
      .send(managerData);

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: managerData.email, password: managerData.password });
    const token = loginRes.body.data.token;

    // Invalid status
    const listRes1 = await request(app)
      .get("/tasks?status=INVALID")
      .set("Authorization", `Bearer ${token}`);

    expect(listRes1.status).toBe(400);
    expect(listRes1.body.success).toBe(false);
    expect(listRes1.body.message).toBe("Validation failed");
    expect(listRes1.body.data.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "status",
          message: expect.stringContaining(
            '"status" must be one of [TO_DO, IN_PROGRESS, SUBMITTED, IN_REVIEW, COMPLETED]'
          ),
        }),
      ])
    );

    // Invalid priority
    const listRes2 = await request(app)
      .get("/tasks?priority=INVALID")
      .set("Authorization", `Bearer ${token}`);

    expect(listRes2.status).toBe(400);
    expect(listRes2.body.data.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "priority",
          message: expect.stringContaining(
            '"priority" must be one of [LOW, MEDIUM, HIGH]'
          ),
        }),
      ])
    );
  });

  // New test: MANAGER can sort tasks by title ascending
  it("should allow MANAGER to sort tasks by title ascending", async () => {
    const timestamp = Date.now();
    const managerData = {
      name: "Manager User",
      email: `manager${timestamp}@example.com`,
      password: "password123",
      role: "MANAGER",
    };
    const employeeData = {
      name: "Employee User",
      email: `employee${timestamp}@example.com`,
      password: "password123",
      role: "EMPLOYEE",
    };

    const managerRes = await request(app)
      .post("/auth/register")
      .send(managerData);

    const employeeRes = await request(app)
      .post("/auth/register")
      .send(employeeData);
    const employeeId = employeeRes.body.data.id;

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: managerData.email, password: managerData.password });
    const token = loginRes.body.data.token;

    // Create tasks with different titles
    const tasks = [
      {
        title: "Zebra Task",
        description: "Task Z",
        priority: "HIGH",
        assignDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "TO_DO",
        startDate: new Date().toISOString(),
        completeDate: null,
        client: "Client 1",
        assignedToId: employeeId,
      },
      {
        title: "Apple Task",
        description: "Task A",
        priority: "MEDIUM",
        assignDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "IN_PROGRESS",
        startDate: new Date().toISOString(),
        completeDate: null,
        client: "Client 2",
        assignedToId: employeeId,
      },
      {
        title: "Banana Task",
        description: "Task B",
        priority: "LOW",
        assignDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "TO_DO",
        startDate: new Date().toISOString(),
        completeDate: null,
        client: "Client 3",
        assignedToId: employeeId,
      },
    ];

    for (const taskData of tasks) {
      await request(app)
        .post("/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send(taskData);
    }

    // Sort by title ascending
    const listRes = await request(app)
      .get("/tasks?sortBy=title&order=asc")
      .set("Authorization", `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.message).toBe("Tasks fetched successfully");
    expect(listRes.body.data.tasks).toBeInstanceOf(Array);
    expect(listRes.body.data.tasks).toHaveLength(3);
    expect(listRes.body.data.tasks[0].title).toBe("Apple Task");
    expect(listRes.body.data.tasks[1].title).toBe("Banana Task");
    expect(listRes.body.data.tasks[2].title).toBe("Zebra Task");
    expect(listRes.body.data.sort).toEqual({ sortBy: "title", order: "asc" });
  });

  // New test: MANAGER can sort tasks by dueDate descending
  it("should allow MANAGER to sort tasks by dueDate descending", async () => {
    const timestamp = Date.now();
    const managerData = {
      name: "Manager User",
      email: `manager${timestamp}@example.com`,
      password: "password123",
      role: "MANAGER",
    };
    const employeeData = {
      name: "Employee User",
      email: `employee${timestamp}@example.com`,
      password: "password123",
      role: "EMPLOYEE",
    };

    const managerRes = await request(app)
      .post("/auth/register")
      .send(managerData);

    const employeeRes = await request(app)
      .post("/auth/register")
      .send(employeeData);
    const employeeId = employeeRes.body.data.id;

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: managerData.email, password: managerData.password });
    const token = loginRes.body.data.token;

    // Create tasks with different due dates
    const tasks = [
      {
        title: "Task 1",
        description: "Task 1",
        priority: "HIGH",
        assignDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: "TO_DO",
        startDate: new Date().toISOString(),
        completeDate: null,
        client: "Client 1",
        assignedToId: employeeId,
      },
      {
        title: "Task 2",
        description: "Task 2",
        priority: "MEDIUM",
        assignDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: "IN_PROGRESS",
        startDate: new Date().toISOString(),
        completeDate: null,
        client: "Client 2",
        assignedToId: employeeId,
      },
      {
        title: "Task 3",
        description: "Task 3",
        priority: "LOW",
        assignDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "TO_DO",
        startDate: new Date().toISOString(),
        completeDate: null,
        client: "Client 3",
        assignedToId: employeeId,
      },
    ];

    for (const taskData of tasks) {
      await request(app)
        .post("/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send(taskData);
    }

    // Sort by dueDate descending
    const listRes = await request(app)
      .get("/tasks?sortBy=dueDate&order=desc")
      .set("Authorization", `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.message).toBe("Tasks fetched successfully");
    expect(listRes.body.data.tasks).toBeInstanceOf(Array);
    expect(listRes.body.data.tasks).toHaveLength(3);
    expect(listRes.body.data.tasks[0].title).toBe("Task 1"); // Due in 10 days
    expect(listRes.body.data.tasks[1].title).toBe("Task 3"); // Due in 7 days
    expect(listRes.body.data.tasks[2].title).toBe("Task 2"); // Due in 5 days
    expect(listRes.body.data.sort).toEqual({
      sortBy: "dueDate",
      order: "desc",
    });
  });

  // New test: EMPLOYEE can sort assigned tasks by title descending
  it("should allow EMPLOYEE to sort assigned tasks by title descending", async () => {
    const timestamp = Date.now();
    const managerData = {
      name: "Manager User",
      email: `manager${timestamp}@example.com`,
      password: "password123",
      role: "MANAGER",
    };
    const employeeData1 = {
      name: "Employee User 1",
      email: `employee1${timestamp}@example.com`,
      password: "password123",
      role: "EMPLOYEE",
    };
    const employeeData2 = {
      name: "Employee User 2",
      email: `employee2${timestamp}@example.com`,
      password: "password123",
      role: "EMPLOYEE",
    };

    const managerRes = await request(app)
      .post("/auth/register")
      .send(managerData);

    const employeeRes1 = await request(app)
      .post("/auth/register")
      .send(employeeData1);
    const employeeId1 = employeeRes1.body.data.id;

    const employeeRes2 = await request(app)
      .post("/auth/register")
      .send(employeeData2);
    const employeeId2 = employeeRes2.body.data.id;

    const managerLoginRes = await request(app)
      .post("/auth/login")
      .send({ email: managerData.email, password: managerData.password });
    const managerToken = managerLoginRes.body.data.token;

    // Create tasks for employee1 and employee2
    const tasks = [
      {
        title: "Zebra Task",
        description: "Task Z",
        priority: "HIGH",
        assignDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "TO_DO",
        startDate: new Date().toISOString(),
        completeDate: null,
        client: "Client 1",
        assignedToId: employeeId1,
      },
      {
        title: "Apple Task",
        description: "Task A",
        priority: "MEDIUM",
        assignDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "IN_PROGRESS",
        startDate: new Date().toISOString(),
        completeDate: null,
        client: "Client 2",
        assignedToId: employeeId1,
      },
      {
        title: "Banana Task",
        description: "Task B",
        priority: "LOW",
        assignDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "TO_DO",
        startDate: new Date().toISOString(),
        completeDate: null,
        client: "Client 3",
        assignedToId: employeeId2,
      },
    ];

    for (const taskData of tasks) {
      await request(app)
        .post("/tasks")
        .set("Authorization", `Bearer ${managerToken}`)
        .send(taskData);
    }

    const employeeLoginRes = await request(app)
      .post("/auth/login")
      .send({ email: employeeData1.email, password: employeeData1.password });
    const employeeToken = employeeLoginRes.body.data.token;

    // Sort by title descending for employee1
    const listRes = await request(app)
      .get("/tasks?sortBy=title&order=desc")
      .set("Authorization", `Bearer ${employeeToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.message).toBe("Tasks fetched successfully");
    expect(listRes.body.data.tasks).toBeInstanceOf(Array);
    expect(listRes.body.data.tasks).toHaveLength(2); // Only tasks assigned to employee1
    expect(listRes.body.data.tasks[0].title).toBe("Zebra Task");
    expect(listRes.body.data.tasks[1].title).toBe("Apple Task");
    expect(listRes.body.data.sort).toEqual({ sortBy: "title", order: "desc" });
  });

  // New test: Default sorting by createdAt ascending when not specified
  it("should use default sorting by createdAt ascending when sortBy is not provided", async () => {
    const timestamp = Date.now();
    const managerData = {
      name: "Manager User",
      email: `manager${timestamp}@example.com`,
      password: "password123",
      role: "MANAGER",
    };
    const employeeData = {
      name: "Employee User",
      email: `employee${timestamp}@example.com`,
      password: "password123",
      role: "EMPLOYEE",
    };

    const managerRes = await request(app)
      .post("/auth/register")
      .send(managerData);

    const employeeRes = await request(app)
      .post("/auth/register")
      .send(employeeData);
    const employeeId = employeeRes.body.data.id;

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: managerData.email, password: managerData.password });
    const token = loginRes.body.data.token;

    // Create tasks with sequential creation
    const tasks = [
      {
        title: "Task 1",
        description: "Task 1",
        priority: "HIGH",
        assignDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "TO_DO",
        startDate: new Date().toISOString(),
        completeDate: null,
        client: "Client 1",
        assignedToId: employeeId,
      },
      {
        title: "Task 2",
        description: "Task 2",
        priority: "MEDIUM",
        assignDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "IN_PROGRESS",
        startDate: new Date().toISOString(),
        completeDate: null,
        client: "Client 2",
        assignedToId: employeeId,
      },
      {
        title: "Task 3",
        description: "Task 3",
        priority: "LOW",
        assignDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "TO_DO",
        startDate: new Date().toISOString(),
        completeDate: null,
        client: "Client 3",
        assignedToId: employeeId,
      },
    ];

    for (const taskData of tasks) {
      await request(app)
        .post("/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send(taskData);
    }

    // No sortBy or order provided
    const listRes = await request(app)
      .get("/tasks")
      .set("Authorization", `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.message).toBe("Tasks fetched successfully");
    expect(listRes.body.data.tasks).toBeInstanceOf(Array);
    expect(listRes.body.data.tasks).toHaveLength(3);
    expect(listRes.body.data.tasks[0].title).toBe("Task 1");
    expect(listRes.body.data.tasks[1].title).toBe("Task 2");
    expect(listRes.body.data.tasks[2].title).toBe("Task 3");
    expect(listRes.body.data.sort).toEqual({
      sortBy: "createdAt",
      order: "asc",
    });
  });

  // New test: Handle invalid sort parameters
  it("should reject invalid sort parameters with 400", async () => {
    const timestamp = Date.now();
    const managerData = {
      name: "Manager User",
      email: `manager${timestamp}@example.com`,
      password: "password123",
      role: "MANAGER",
    };

    const managerRes = await request(app)
      .post("/auth/register")
      .send(managerData);

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: managerData.email, password: managerData.password });
    const token = loginRes.body.data.token;

    // Invalid sortBy
    const listRes1 = await request(app)
      .get("/tasks?sortBy=invalidField&order=asc")
      .set("Authorization", `Bearer ${token}`);

    expect(listRes1.status).toBe(400);
    expect(listRes1.body.success).toBe(false);
    expect(listRes1.body.message).toBe("Validation failed");
    expect(listRes1.body.data.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "sortBy",
          message: expect.stringContaining(
            '"sortBy" must be one of [title, dueDate, priority, status, createdAt]'
          ),
        }),
      ])
    );

    // Invalid order
    const listRes2 = await request(app)
      .get("/tasks?sortBy=title&order=up")
      .set("Authorization", `Bearer ${token}`);

    expect(listRes2.status).toBe(400);
    expect(listRes2.body.data.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "order",
          message: expect.stringContaining(
            '"order" must be one of [asc, desc]'
          ),
        }),
      ])
    );
  });

  // New test: MANAGER can fetch any task by ID
it('should allow MANAGER to fetch any task by ID', async () => {
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

  // Create a task
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
  const createRes = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send(taskData);
  const taskId = createRes.body.data.id;

  // Fetch task by ID
  const getRes = await request(app)
    .get(`/tasks/${taskId}`)
    .set('Authorization', `Bearer ${token}`);

  expect(getRes.status).toBe(200);
  expect(getRes.body.success).toBe(true);
  expect(getRes.body.message).toBe('Task fetched successfully');
  expect(getRes.body.data).toMatchObject({
    id: taskId,
    title: 'Test Task',
    description: 'This is a test task',
    priority: 'HIGH',
    status: 'TO_DO',
    client: 'Test Client',
    assignedToId: employeeId
  });
});

// New test: EMPLOYEE can fetch their assigned task by ID
it('should allow EMPLOYEE to fetch their assigned task by ID', async () => {
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

  const managerLoginRes = await request(app)
    .post('/auth/login')
    .send({ email: managerData.email, password: managerData.password });
  const managerToken = managerLoginRes.body.data.token;

  // Create a task assigned to the employee
  const taskData = {
    title: 'Employee Task',
    description: 'This is an employee task',
    priority: 'MEDIUM',
    assignDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'IN_PROGRESS',
    startDate: new Date().toISOString(),
    completeDate: null,
    client: 'Test Client',
    assignedToId: employeeId
  };
  const createRes = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${managerToken}`)
    .send(taskData);
  const taskId = createRes.body.data.id;

  const employeeLoginRes = await request(app)
    .post('/auth/login')
    .send({ email: employeeData.email, password: employeeData.password });
  const employeeToken = employeeLoginRes.body.data.token;

  // Fetch task by ID as employee
  const getRes = await request(app)
    .get(`/tasks/${taskId}`)
    .set('Authorization', `Bearer ${employeeToken}`);

  expect(getRes.status).toBe(200);
  expect(getRes.body.success).toBe(true);
  expect(getRes.body.message).toBe('Task fetched successfully');
  expect(getRes.body.data).toMatchObject({
    id: taskId,
    title: 'Employee Task',
    description: 'This is an employee task',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    client: 'Test Client',
    assignedToId: employeeId
  });
});

// New test: EMPLOYEE cannot fetch a task not assigned to them
it('should reject EMPLOYEE fetching a task not assigned to them with 403', async () => {
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

  // Create a task assigned to employee2
  const taskData = {
    title: 'Task for Employee 2',
    description: 'This is a task for employee 2',
    priority: 'LOW',
    assignDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'TO_DO',
    startDate: new Date().toISOString(),
    completeDate: null,
    client: 'Test Client',
    assignedToId: employeeId2
  };
  const createRes = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${managerToken}`)
    .send(taskData);
  const taskId = createRes.body.data.id;

  const employeeLoginRes = await request(app)
    .post('/auth/login')
    .send({ email: employeeData1.email, password: employeeData1.password });
  const employeeToken = employeeLoginRes.body.data.token;

  // Attempt to fetch task by employee1 (not assigned)
  const getRes = await request(app)
    .get(`/tasks/${taskId}`)
    .set('Authorization', `Bearer ${employeeToken}`);

  expect(getRes.status).toBe(403);
  expect(getRes.body.success).toBe(false);
  expect(getRes.body.message).toBe('Access denied: You are not assigned to this task');
});

// New test: Returns 404 for non-existent task ID
it('should return 404 for non-existent task ID', async () => {
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

  // Attempt to fetch a non-existent task
  const nonExistentId = '123e4567-e89b-12d3-a456-426614174000'; // Valid UUID format, but not in DB
  const getRes = await request(app)
    .get(`/tasks/${nonExistentId}`)
    .set('Authorization', `Bearer ${token}`);

  expect(getRes.status).toBe(404);
  expect(getRes.body.success).toBe(false);
  expect(getRes.body.message).toBe('Task not found');
});

// New test: Returns 400 for invalid task ID format
it('should return 400 for invalid task ID format', async () => {
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

  // Attempt to fetch with invalid ID format
  const invalidId = 'not-a-uuid';
  const getRes = await request(app)
    .get(`/tasks/${invalidId}`)
    .set('Authorization', `Bearer ${token}`);

  expect(getRes.status).toBe(400);
  expect(getRes.body.success).toBe(false);
  expect(getRes.body.message).toBe('Validation failed');
  expect(getRes.body.data.errors).toEqual(expect.arrayContaining([
    expect.objectContaining({ field: 'id', message: expect.stringContaining('"id" must be a valid GUID') })
  ]));
});

// New test: MANAGER can update any task by ID
it('should allow MANAGER to update any task by ID', async () => {
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

  // Create a task
  const taskData = {
    title: 'Original Task',
    description: 'This is the original task',
    priority: 'HIGH',
    assignDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'TO_DO',
    startDate: new Date().toISOString(),
    completeDate: null,
    client: 'Test Client',
    assignedToId: employeeId
  };
  const createRes = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send(taskData);
  const taskId = createRes.body.data.id;

  // Update the task
  const updateData = {
    title: 'Updated Task',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM'
  };
  const updateRes = await request(app)
    .put(`/tasks/${taskId}`)
    .set('Authorization', `Bearer ${token}`)
    .send(updateData);

  expect(updateRes.status).toBe(200);
  expect(updateRes.body.success).toBe(true);
  expect(updateRes.body.message).toBe('Task updated successfully');
  expect(updateRes.body.data).toMatchObject({
    id: taskId,
    title: 'Updated Task',
    description: 'This is the original task',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    client: 'Test Client',
    assignedToId: employeeId
  });
});

// New test: EMPLOYEE can update their assigned task by ID
it('should allow EMPLOYEE to update their assigned task by ID', async () => {
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

  const managerLoginRes = await request(app)
    .post('/auth/login')
    .send({ email: managerData.email, password: managerData.password });
  const managerToken = managerLoginRes.body.data.token;

  // Create a task assigned to the employee
  const taskData = {
    title: 'Employee Task',
    description: 'This is an employee task',
    priority: 'MEDIUM',
    assignDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'TO_DO',
    startDate: new Date().toISOString(),
    completeDate: null,
    client: 'Test Client',
    assignedToId: employeeId
  };
  const createRes = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${managerToken}`)
    .send(taskData);
  const taskId = createRes.body.data.id;

  const employeeLoginRes = await request(app)
    .post('/auth/login')
    .send({ email: employeeData.email, password: employeeData.password });
  const employeeToken = employeeLoginRes.body.data.token;

  // Update the task as employee
  const updateData = {
    status: 'IN_PROGRESS',
    completeDate: new Date().toISOString()
  };
  const updateRes = await request(app)
    .put(`/tasks/${taskId}`)
    .set('Authorization', `Bearer ${employeeToken}`)
    .send(updateData);

  expect(updateRes.status).toBe(200);
  expect(updateRes.body.success).toBe(true);
  expect(updateRes.body.message).toBe('Task updated successfully');
  expect(updateRes.body.data).toMatchObject({
    id: taskId,
    title: 'Employee Task',
    description: 'This is an employee task',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    client: 'Test Client',
    assignedToId: employeeId,
    completeDate: expect.any(String) // Updated completeDate
  });
});

// New test: EMPLOYEE cannot update a task not assigned to them
it('should reject EMPLOYEE updating a task not assigned to them with 403', async () => {
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

  // Create a task assigned to employee2
  const taskData = {
    title: 'Task for Employee 2',
    description: 'This is a task for employee 2',
    priority: 'LOW',
    assignDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'TO_DO',
    startDate: new Date().toISOString(),
    completeDate: null,
    client: 'Test Client',
    assignedToId: employeeId2
  };
  const createRes = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${managerToken}`)
    .send(taskData);
  const taskId = createRes.body.data.id;

  const employeeLoginRes = await request(app)
    .post('/auth/login')
    .send({ email: employeeData1.email, password: employeeData1.password });
  const employeeToken = employeeLoginRes.body.data.token;

  // Attempt to update task by employee1 (not assigned)
  const updateData = {
    status: 'IN_PROGRESS'
  };
  const updateRes = await request(app)
    .put(`/tasks/${taskId}`)
    .set('Authorization', `Bearer ${employeeToken}`)
    .send(updateData);

  expect(updateRes.status).toBe(403);
  expect(updateRes.body.success).toBe(false);
  expect(updateRes.body.message).toBe('Access denied: You are not assigned to this task');
});

// New test: Returns 404 for non-existent task ID
it('should return 404 when updating a non-existent task ID', async () => {
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

  // Attempt to update a non-existent task
  const nonExistentId = '123e4567-e89b-12d3-a456-426614174000'; // Valid UUID format, but not in DB
  const updateData = {
    status: 'IN_PROGRESS'
  };
  const updateRes = await request(app)
    .put(`/tasks/${nonExistentId}`)
    .set('Authorization', `Bearer ${token}`)
    .send(updateData);

  expect(updateRes.status).toBe(404);
  expect(updateRes.body.success).toBe(false);
  expect(updateRes.body.message).toBe('Task not found');
});

// New test: Returns 400 for invalid update data
it('should return 400 for invalid update data', async () => {
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

  // Create a task
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
  const createRes = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send(taskData);
  const taskId = createRes.body.data.id;

  // Attempt to update with invalid data
  const invalidUpdateData = {
    status: 'INVALID_STATUS', // Not a valid status enum
    priority: 'INVALID_PRIORITY' // Not a valid priority enum
  };
  const updateRes = await request(app)
    .put(`/tasks/${taskId}`)
    .set('Authorization', `Bearer ${token}`)
    .send(invalidUpdateData);

  expect(updateRes.status).toBe(400);
  expect(updateRes.body.success).toBe(false);
  expect(updateRes.body.message).toBe('Validation failed');
  expect(updateRes.body.data.errors).toEqual(expect.arrayContaining([
    expect.objectContaining({ field: 'status', message: expect.stringContaining('"status" must be one of [TO_DO, IN_PROGRESS, SUBMITTED, IN_REVIEW, COMPLETED]') }),
    expect.objectContaining({ field: 'priority', message: expect.stringContaining('"priority" must be one of [LOW, MEDIUM, HIGH]') })
  ]));
});

// New test: MANAGER can delete any task by ID
it('should allow MANAGER to delete any task by ID', async () => {
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

  // Create a task
  const taskData = {
    title: 'Task to Delete',
    description: 'This task will be deleted',
    priority: 'HIGH',
    assignDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'TO_DO',
    startDate: new Date().toISOString(),
    completeDate: null,
    client: 'Test Client',
    assignedToId: employeeId
  };
  const createRes = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send(taskData);
  const taskId = createRes.body.data.id;

  // Delete the task
  const deleteRes = await request(app)
    .delete(`/tasks/${taskId}`)
    .set('Authorization', `Bearer ${token}`);

  expect(deleteRes.status).toBe(200);
  expect(deleteRes.body.success).toBe(true);
  expect(deleteRes.body.message).toBe('Task deleted successfully');
  expect(deleteRes.body.data).toBeNull();

  // Verify the task is deleted
  const getRes = await request(app)
    .get(`/tasks/${taskId}`)
    .set('Authorization', `Bearer ${token}`);
  expect(getRes.status).toBe(404);
});

// New test: EMPLOYEE cannot delete a task
it('should reject EMPLOYEE deleting a task with 403', async () => {
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

  const managerLoginRes = await request(app)
    .post('/auth/login')
    .send({ email: managerData.email, password: managerData.password });
  const managerToken = managerLoginRes.body.data.token;

  // Create a task assigned to the employee
  const taskData = {
    title: 'Employee Task',
    description: 'This is an employee task',
    priority: 'MEDIUM',
    assignDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'TO_DO',
    startDate: new Date().toISOString(),
    completeDate: null,
    client: 'Test Client',
    assignedToId: employeeId
  };
  const createRes = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${managerToken}`)
    .send(taskData);
  const taskId = createRes.body.data.id;

  const employeeLoginRes = await request(app)
    .post('/auth/login')
    .send({ email: employeeData.email, password: employeeData.password });
  const employeeToken = employeeLoginRes.body.data.token;

  // Attempt to delete the task as employee
  const deleteRes = await request(app)
    .delete(`/tasks/${taskId}`)
    .set('Authorization', `Bearer ${employeeToken}`);

  expect(deleteRes.status).toBe(403);
  expect(deleteRes.body.success).toBe(false);
  expect(deleteRes.body.message).toBe('Access denied: Requires MANAGER role');
});

// New test: Returns 404 for non-existent task ID
it('should return 404 when deleting a non-existent task ID', async () => {
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

  // Attempt to delete a non-existent task
  const nonExistentId = '123e4567-e89b-12d3-a456-426614174000'; // Valid UUID format, but not in DB
  const deleteRes = await request(app)
    .delete(`/tasks/${nonExistentId}`)
    .set('Authorization', `Bearer ${token}`);

  expect(deleteRes.status).toBe(404);
  expect(deleteRes.body.success).toBe(false);
  expect(deleteRes.body.message).toBe('Task not found');
});

// New test: Returns 400 for invalid task ID format
it('should return 400 for invalid task ID format when deleting', async () => {
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

  // Attempt to delete with invalid ID format
  const invalidId = 'not-a-uuid';
  const deleteRes = await request(app)
    .delete(`/tasks/${invalidId}`)
    .set('Authorization', `Bearer ${token}`);

  expect(deleteRes.status).toBe(400);
  expect(deleteRes.body.success).toBe(false);
  expect(deleteRes.body.message).toBe('Validation failed');
  expect(deleteRes.body.data.errors).toEqual(expect.arrayContaining([
    expect.objectContaining({ field: 'id', message: expect.stringContaining('"id" must be a valid GUID') })
  ]));
});
  afterEach(async () => {
    await prisma.task.deleteMany();
    await prisma.user.deleteMany({ where: { email: { contains: "test" } } });
    await prisma.user.deleteMany({ where: { email: { contains: "login" } } });
    await prisma.user.deleteMany({ where: { email: { contains: "manager" } } });
    await prisma.user.deleteMany({
      where: { email: { contains: "employee" } },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
