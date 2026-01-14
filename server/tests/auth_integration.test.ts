import request from 'supertest';
import app from '../src/index';
import prisma from '../src/utils/prisma';

describe('Auth Integration Tests', () => {

    // Clean up is handled by setup.js

    describe('POST /auth/register', () => {
        it('should return 400 for invalid email', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    email: 'invalid-email',
                    username: 'testuser',
                    password: 'password123'
                });
            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toContain('Invalid email');
        });

        it('should return 400 if fields are missing', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    username: 'testu'
                });
            expect(res.statusCode).toEqual(400);
        });

        it('should return 400 for short password', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    email: 'test@example.com',
                    username: 'testuser',
                    password: 'short'
                });
            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toContain('at least 8 characters');
        });

        it('should register successfully with valid data', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    email: 'newuser@example.com',
                    username: 'newuser',
                    password: 'password123'
                });
            expect(res.statusCode).toEqual(201);
            expect(res.body.user).toHaveProperty('id');
        });
    });

    describe('POST /auth/login', () => {
        beforeEach(async () => {
            // Ensure cleanup before creating fresh user
            // First delete refresh tokens for any user with this email
            const existingUser = await prisma.user.findUnique({
                where: { email: 'login@example.com' }
            });
            if (existingUser) {
                await prisma.refreshToken.deleteMany({
                    where: { userId: existingUser.id }
                });
                await prisma.loginHistory.deleteMany({
                    where: { userId: existingUser.id }
                });
            }
            await prisma.user.deleteMany({
                where: { email: 'login@example.com' }
            });

            await request(app).post('/auth/register').send({
                email: 'login@example.com',
                username: 'loginuser',
                password: 'password123'
            });

            // Delete the refresh token created during registration
            // to prevent collision when login creates a new one
            const newUser = await prisma.user.findUnique({
                where: { email: 'login@example.com' }
            });
            if (newUser) {
                await prisma.refreshToken.deleteMany({
                    where: { userId: newUser.id }
                });
            }
        });

        it('should login successfully with valid credentials', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    identifier: 'login@example.com',
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.user).toHaveProperty('email', 'login@example.com');
            // Check for refreshToken cookie
            const cookies = res.headers['set-cookie'];
            expect(cookies).toBeDefined();
            // @ts-expect-error supertest types might be slightly off for headers
            expect(cookies?.some((c: string) => c.includes('refreshToken'))).toBe(true);
        });

        it('should fail with wrong password', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    identifier: 'login@example.com',
                    password: 'wrongpassword'
                });
            expect(res.statusCode).toEqual(401);
        });
    });
});
