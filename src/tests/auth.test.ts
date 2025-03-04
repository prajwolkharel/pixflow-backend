import request from 'supertest';
import app from '../app.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Auth', () => {
  it('should register and login successfully with valid credentials', async () => {
    const timestamp = Date.now();
    const userData = {
      name: 'Test User',
      email: `test${timestamp}@example.com`,
      password: 'password123',
      role: 'EMPLOYEE'
    };

    const registerRes = await request(app)
      .post('/auth/register')
      .send(userData);

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.success).toBe(true);
    expect(registerRes.body.message).toBe('User registered successfully');
    expect(registerRes.body.data).toHaveProperty('id');
    expect(registerRes.body.data.email).toBe(userData.email);
    expect(registerRes.body.data.role).toBe(userData.role);

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: userData.email, password: userData.password });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.message).toBe('Login successful');
    expect(loginRes.body.data).toHaveProperty('token');
  });

  it('should reject login with invalid credentials (wrong password)', async () => {
    const timestamp = Date.now();
    const userData = {
      name: 'Test User',
      email: `test${timestamp}@example.com`,
      password: 'password123',
      role: 'EMPLOYEE'
    };

    await request(app)
      .post('/auth/register')
      .send(userData);

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: userData.email, password: 'wrongpassword' });

    expect(loginRes.status).toBe(401);
    expect(loginRes.body.success).toBe(false);
    expect(loginRes.body.message).toBe('Invalid email or password');
    expect(loginRes.body.data).toBeNull();
  });

  it('should reject login with non-existent email', async () => {
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'password123' });

    expect(loginRes.status).toBe(401);
    expect(loginRes.body.success).toBe(false);
    expect(loginRes.body.message).toBe('Invalid email or password');
    expect(loginRes.body.data).toBeNull();
  });

  afterEach(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: 'test' } } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});