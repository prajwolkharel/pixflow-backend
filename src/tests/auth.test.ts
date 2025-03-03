import request from 'supertest';
import app from '../app.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Auth', () => {
  it('should register a user with POST /auth/register successfully', async () => {
    const timestamp = Date.now();
    const userData = {
      name: 'Test User',
      email: `test${timestamp}@example.com`,
      password: 'password123',
      role: 'EMPLOYEE'
    };
    const res = await request(app)
      .post('/auth/register')
      .send(userData);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('User registered successfully');
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.email).toBe(userData.email);
    expect(res.body.data.role).toBe(userData.role);
    expect(res.body.data).not.toHaveProperty('password');
  });

  it('should reject registration with an empty name', async () => {
    const timestamp = Date.now();
    const invalidUserData = {
      name: '',
      email: `test${timestamp}@example.com`,
      password: 'password123',
      role: 'EMPLOYEE'
    };
    const res = await request(app)
      .post('/auth/register')
      .send(invalidUserData);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.data.errors).toContainEqual({
      field: 'name',
      message: '"name" is not allowed to be empty'
    });
  });

  it('should reject registration with a short password', async () => {
    const timestamp = Date.now();
    const invalidUserData = {
      name: 'Test User',
      email: `test${timestamp}@example.com`,
      password: 'short',
      role: 'EMPLOYEE'
    };
    const res = await request(app)
      .post('/auth/register')
      .send(invalidUserData);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.data.errors).toContainEqual({
      field: 'password',
      message: '"password" length must be at least 8 characters long'
    });
  });

  it("should reject registration with an invalid email", async () => {
    const invalidUserData = {
      name: "Test User",
      email: "not-an-email",
      password: "password123",
      role: "EMPLOYEE"
    };
    const res = await request(app)
      .post("/auth/register")
      .send(invalidUserData);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Validation failed");
    expect(res.body.data.errors).toContainEqual({
      field: "email",
      message: '"email" must be a valid email'
    });
  });

  it("should login a user with POST /auth/login successfully", async () => {
    const timestamp = Date.now();
    const userData = {
      name: "Login User",
      email: `login${timestamp}@example.com`,
      password: "password123",
      role: "EMPLOYEE"
    }

    await request(app)
      .post("/auth/register")
      .send(userData);

    const loginRes = await request(app)
      .post("/auth/login")
      .send({email: userData.email, password: userData.password});
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.message).toBe("Login successful");
    expect(loginRes.body.data).toHaveProperty("token");
    expect(typeof loginRes.body.data.token).toBe("string");
  });

  afterEach(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: 'test' } } });
    await prisma.user.deleteMany({ where: {email: { contains: "login" } } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});