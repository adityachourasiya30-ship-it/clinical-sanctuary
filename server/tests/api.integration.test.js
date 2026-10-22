import request from 'supertest';
import app from '../src/app.js';

describe('API Integration & Route Validation Suite', () => {
  test('GET /api/health should return system status ONLINE with project metadata', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ONLINE');
    expect(res.body.project).toContain('Clinical Sanctuary');
    expect(res.body.timestamp).toBeDefined();
  });

  test('GET /unknown-route should trigger 404 handler with sanitized error payload', async () => {
    const res = await request(app).get('/api/non-existent-endpoint');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('not found');
  });

  test('GET /api/hospitals/nearby should return 400 when lat/lng query params are missing', async () => {
    const res = await request(app).get('/api/hospitals/nearby');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Valid latitude');
  });

  test('GET /api/hospitals/nearby should return healthcare facilities with coordinates and distance', async () => {
    const res = await request(app).get('/api/hospitals/nearby?lat=26.2183&lng=78.1828&radius=5000');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.hospitals)).toBe(true);
    expect(res.body.count).toBeGreaterThan(0);
    expect(res.body.hospitals[0].name).toBeDefined();
    expect(res.body.hospitals[0].distanceKm).toBeDefined();
  });

  test('POST /api/auth/register should return 400 for incomplete registration body', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'incomplete@test.com' }); // Missing name and password

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login should return 400 for missing credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/contacts should return 401 Unauthorized when unauthenticated', async () => {
    const res = await request(app).get('/api/contacts');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/incidents/sos should return 401 Unauthorized when unauthenticated', async () => {
    const res = await request(app)
      .post('/api/incidents/sos')
      .send({ category: 'MEDICAL' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/medical should return 401 Unauthorized when unauthenticated', async () => {
    const res = await request(app).get('/api/medical');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
