const request = require('supertest');
const app = require('../src/index');
const prisma = require('../src/utils/prisma');
const bcrypt = require('bcryptjs');

describe('Auth Endpoints', () => {
    const testUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
    };

    it('should register a new user', async () => {
        const response = await request(app)
            .post('/auth/register')
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
            .post('/auth/login')
            .send({
                identifier: testUser.email,
                password: testUser.password
            });

        expect(response.statusCode).toEqual(200);
        expect(response.body).toHaveProperty('token');
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
            .post('/auth/login')
            .send({
                identifier: testUser.email,
                password: 'wrongpassword'
            });

        expect(response.statusCode).toEqual(401);
    });
});
