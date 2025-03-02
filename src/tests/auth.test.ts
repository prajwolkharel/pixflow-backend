import request from 'supertest';
import app from '../app.js';

describe('Auth', () => {
  it('should register a user with POST /auth/register', async () => {
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

  it("should return an error if the email is invalid", async () => {
    const invalidUserData =  {
      name: "Test User",
      email: "invalidemail",
      password: "password123",
      role: "EMPLOYEE",
    };

    const res = await request(app)
      .post("/auth/register")
      .send(invalidUserData);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Invalid email format");
  });

  it("should return an error if the role is invalid", async () => {
    const invalidUserData = {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      role: "INVALID_ROLE",
    }

    const res = await request(app)
      .post("/auth/register")
      .send(invalidUserData);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Invalid role");
  });

  it('should return an error if required fields are missing', async () => {
    const incompleteUserData = {
      name: '', // Missing required field
      email: '', // Missing required field
      password: '123', // Password too short
      role: '', // Missing required field
    };

    const res = await request(app)
      .post('/auth/register')
      .send(incompleteUserData);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Name is required');
    expect(res.body.message).toContain('Email is required');
    expect(res.body.message).toContain('Password must be at least 6 characters');
    expect(res.body.message).toContain('Role is required');
  });
});