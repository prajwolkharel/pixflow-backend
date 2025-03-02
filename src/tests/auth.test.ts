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
});