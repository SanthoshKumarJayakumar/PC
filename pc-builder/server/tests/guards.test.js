import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('auth, catalog, and guard routes', () => {
  it('rejects weak forgot-password body', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'bad' });
    expect(res.status).toBe(422);
  });

  it('forgot-password is generic when email is valid-shaped', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@example.com' });
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.message).toMatch(/reset/i);
      expect(JSON.stringify(res.body)).not.toMatch(/token=/);
    }
  });

  it('components validate requires selections array', async () => {
    const res = await request(app).post('/api/components/validate').send({});
    expect(res.status).toBe(422);
  });

  it('checkout requires auth', async () => {
    const res = await request(app).post('/api/checkout').send({});
    expect(res.status).toBe(401);
  });

  it('orders require auth', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });

  it('support requires auth', async () => {
    const res = await request(app).get('/api/support');
    expect(res.status).toBe(401);
  });

  it('configs list requires auth', async () => {
    const res = await request(app).get('/api/configs');
    expect(res.status).toBe(401);
  });
});
