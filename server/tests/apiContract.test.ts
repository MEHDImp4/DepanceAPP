import request from 'supertest';
import app from '../src/index';

describe('API v1 contract', () => {
    it('serves the stable versioned API', async () => {
        const response = await request(app).get('/api/v1/accounts');

        expect(response.status).toBe(401);
        expect(response.headers['x-request-id']).toBeDefined();
        expect(response.body).toMatchObject({
            error: expect.any(String),
            code: 'UNAUTHORIZED',
            requestId: response.headers['x-request-id']
        });
    });

    it('keeps the legacy API available with deprecation headers', async () => {
        const response = await request(app).get('/api/accounts');

        expect(response.status).toBe(401);
        expect(response.headers.deprecation).toBe('true');
        expect(response.headers.sunset).toBeDefined();
        expect(response.headers.link).toContain('/api/v1');
    });

    it('returns a documented error for unknown v1 routes', async () => {
        const response = await request(app).get('/api/v1/unknown');

        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({
            code: 'NOT_FOUND',
            requestId: expect.any(String)
        });
    });

    it('publishes the OpenAPI 3.1 contract', async () => {
        const response = await request(app).get('/api-docs.json');

        expect(response.status).toBe(200);
        expect(response.body.openapi).toBe('3.1.0');
        expect(response.body.servers[0].url).toBe('/api/v1');
    });
});
