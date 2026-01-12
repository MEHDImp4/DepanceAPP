import request from 'supertest';
import app from '../src/index';

describe('Health Check', () => {
    it('should return 200 OK', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toEqual(200);
        expect(response.text).toContain('DepanceAPP API is running');
    });
});
