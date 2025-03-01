import request from 'supertest';
import app from '../app';

describe('Server', () => {
  it('should return API is running on GET /', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toBe('API is running...');
  });
});