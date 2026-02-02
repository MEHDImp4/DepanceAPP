import request from 'supertest';
import app from '../src/index';
import prisma from '../src/utils/prisma';

describe('Auth Integration Tests', () => {

    // Clean up is handled by setup.js

    describe('POST /auth/register', () => {
        it('should return 400 for invalid email', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'invalid-email',
                    username: 'testuser',
                    password: 'Password123!'
                });
            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toContain('Invalid email');
        });

        it('should return 400 if fields are missing', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testu'
                });
            expect(res.statusCode).toEqual(400);
        });

        it('should return 400 for short password', async () => {
            const res = await request(app)
                .post('/api/auth/register')
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
                .post('/api/auth/register')
                .send({
                    email: 'newuser@example.com',
                    username: 'newuser',
                    password: 'Password123!'
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

            await request(app).post('/api/auth/register').send({
                email: 'login@example.com',
                username: 'loginuser',
                password: 'Password123!'
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
                .post('/api/auth/login')
                .send({
                    identifier: 'login@example.com',
                    password: 'Password123!'
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
                .post('/api/auth/login')
                .send({
                    identifier: 'login@example.com',
                    password: 'wrongpassword'
                });
            expect(res.statusCode).toEqual(401);
        });
    });

    describe('POST /auth/change-password', () => {
        let token: string;
        let userId: number;

        beforeEach(async () => {
            // Create user and get token
            await prisma.user.deleteMany({ where: { email: 'passcheck@example.com' } });
            const regRes = await request(app).post('/api/auth/register').send({
                email: 'passcheck@example.com',
                username: 'passcheck',
                password: 'OldPassword123!'
            });
            userId = regRes.body.userId;
            const loginRes = await request(app).post('/api/auth/login').send({
                identifier: 'passcheck@example.com',
                password: 'OldPassword123!'
            });
            // Extract cookie
            const cookies = loginRes.headers['set-cookie'];
            if (!Array.isArray(cookies)) {
                throw new Error('No cookies set or cookies is not an array');
            }
            const tokenCookie = cookies.find((c: string) => c.startsWith('token='));
            if (!tokenCookie) {
                throw new Error('Token cookie not found');
            }
            token = tokenCookie.split(';')[0].split('=')[1];
        });

        afterEach(async () => {
            // cleanup
            if (userId) {
                await prisma.refreshToken.deleteMany({ where: { userId } });
                await prisma.loginHistory.deleteMany({ where: { userId } });
                await prisma.user.delete({ where: { id: userId } });
            }
        });

        it('should change password successfully', async () => {
            const res = await request(app)
                .post('/api/auth/change-password')
                .set('Cookie', `token=${token}`)
                .send({
                    oldPassword: 'OldPassword123!',
                    newPassword: 'NewPassword123!'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toEqual('Password updated successfully');

            // Verify login with OLD password fails
            const failRes = await request(app).post('/api/auth/login').send({
                identifier: 'passcheck@example.com',
                password: 'OldPassword123!'
            });
            expect(failRes.statusCode).toEqual(401);

            // Verify login with NEW password succeeds
            const successRes = await request(app).post('/api/auth/login').send({
                identifier: 'passcheck@example.com',
                password: 'NewPassword123!'
            });
            expect(successRes.statusCode).toEqual(200);
        });

        it('should fail if old password is wrong', async () => {
            const res = await request(app)
                .post('/api/auth/change-password')
                .set('Cookie', `token=${token}`)
                .send({
                    oldPassword: 'WrongPassword123!',
                    newPassword: 'NewPassword123!'
                });

            expect(res.statusCode).toEqual(400);
        });

        it('should fail if new password is too short', async () => {
            const res = await request(app)
                .post('/api/auth/change-password')
                .set('Cookie', `token=${token}`)
                .send({
                    oldPassword: 'OldPassword123!',
                    newPassword: 'short'
                });

            expect(res.statusCode).toEqual(400);
        });
    });
});
