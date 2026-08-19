import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('HTTP API smoke', () => {
  it('returns health payload', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.service).toBe('aetherforge-api');
  });

  it('serves robots.txt', async () => {
    const res = await request(app).get('/robots.txt');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Disallow: /admin');
  });

  it('rejects invalid registration payloads', async () => {
    const res = await request(app).post('/api/auth/register').send({
      firstName: 'A',
      email: 'not-an-email',
      password: 'short',
    });
    expect(res.status).toBe(422);
  });

  it('rejects unauthenticated cart', async () => {
    const res = await request(app).get('/api/cart');
    expect(res.status).toBe(401);
  });

  it('rejects unauthenticated admin', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });
});
