import request from "supertest";
import app from "../app.js";
import { PrismaClient } from "@prisma/client";
import { PassThrough } from "stream";

const prisma = new PrismaClient();

describe("Tasks", () => {
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
      description: "This is a test task", // Required
      priority: "HIGH",
      assignDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Required
      status: "TO_DO",
      startDate: new Date().toISOString(),
      completeDate: null,
      client: "Test Client", // Required
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

  it("should reject a task creation for an EMPLOYEE", async () => {
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

    const loginRes =  await request(app)
      .post("/auth/login")
      .send({email: employeeData.email, password: employeeData.password});
    const token = loginRes.body.data.token;

    const taskData = {
      title: "Test Task",
      description: "This is a test task", // Required
      priority: "HIGH",
      assignDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Required
      status: "TO_DO",
      startDate: new Date().toISOString(),
      completeDate: null,
      client: "Test Client", // Required
      assignedToId: employeeId,
    };

    const taskRes = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send(taskData);
    expect(taskRes.status).toBe(403);
    expect(taskRes.body.success).toBe(false);
    expect(taskRes.body.message).toBe('Access denied: Requires one of [MANAGER] role');
    expect(taskRes.body.data).toBe(null);
  });

  afterEach(async () => {
    await prisma.task.deleteMany();
    await prisma.feedback.deleteMany();
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
