import request from 'supertest';
import app from '../src/index';
import prisma from '../src/utils/prisma';
import jwt from 'jsonwebtoken';

describe('Account Endpoints', () => {
    let token: string;
    let userId: number;

    beforeEach(async () => {
        // Create a user and generate token
        const user = await prisma.user.create({
            data: {
                username: 'testuser',
                email: 'test@example.com',
                password_hash: 'hashedpassword'
            }
        });
        userId = user.id;
        token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1h' });
    });

    it('should create a new account', async () => {
        const response = await request(app)
            .post('/api/accounts')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Main Bank',
                type: 'bank',
                balance: 1000,
                currency: 'USD'
            });

        expect(response.statusCode).toEqual(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe('Main Bank');
        expect(response.body.balance).toBe(1000);
    });

    it('should get accounts for user', async () => {
        // Create an account manually
        await prisma.account.create({
            data: {
                name: 'Savings',
                type: 'bank',
                balance: 50000,
                currency: 'USD',
                user_id: userId
            }
        });

        const response = await request(app)
            .get('/api/accounts')
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toEqual(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1);
        expect(response.body[0].name).toBe('Savings');
    });
});
