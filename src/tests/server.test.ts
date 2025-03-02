import request from 'supertest';
import app from '../app.js';

describe('Server', () => {
  it('should return API is running on GET /', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('API is running...');
    expect(res.body.data).toBeNull();
  });
});