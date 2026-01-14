import request from 'supertest';
import app from '../src/index';
import prisma from '../src/utils/prisma';
import bcrypt from 'bcryptjs';

describe('Auth Endpoints', () => {
    const testUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
    };

    it('should register a new user', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        expect(response.statusCode).toEqual(201);
        expect(response.body).toHaveProperty('userId');
    });

    it('should login an existing user', async () => {
        // Create user first
        const hashedPassword = await bcrypt.hash(testUser.password, 10);
        await prisma.user.create({
            data: {
                username: testUser.username,
                email: testUser.email,
                password_hash: hashedPassword
            }
        });

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                identifier: testUser.email,
                password: testUser.password
            });

        expect(response.statusCode).toEqual(200);
        const cookies = response.headers['set-cookie'];
        expect(cookies).toBeDefined();
        expect(cookies[0]).toMatch(/refreshToken=.+/);
        // expect(response.body).toHaveProperty('token'); // Removed
    });

    it('should not login with wrong password', async () => {
        // Create user
        const hashedPassword = await bcrypt.hash(testUser.password, 10);
        await prisma.user.create({
            data: {
                username: testUser.username,
                email: testUser.email,
                password_hash: hashedPassword
            }
        });

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                identifier: testUser.email,
                password: 'wrongpassword'
            });

        expect(response.statusCode).toEqual(401);
    });
});
