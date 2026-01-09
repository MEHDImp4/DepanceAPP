const request = require('supertest');
const app = require('../src/index');
const prisma = require('../src/utils/prisma');
const jwt = require('jsonwebtoken');

describe('Transaction Endpoints', () => {
    let token;
    let userId;
    let accountId;

    beforeEach(async () => {
        const user = await prisma.user.create({
            data: {
                username: 'testuser',
                email: 'test@example.com',
                password_hash: 'hashedpassword'
            }
        });
        userId = user.id;
        token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1h' });

        const account = await prisma.account.create({
            data: {
                name: 'Checking',
                type: 'bank',
                balance: 100000, // 1000.00 USD in cents
                currency: 'USD',
                user_id: userId
            }
        });
        accountId = account.id;
    });

    it('should create a transaction and update balance', async () => {
        const response = await request(app)
            .post('/transactions')
            .set('Authorization', `Bearer ${token}`)
            .send({
                amount: 100,
                description: 'Grocery',
                type: 'expense',
                account_id: accountId
            });

        expect(response.statusCode).toEqual(201);
        expect(response.body.transaction.amount).toBe(100);
        expect(response.body.newBalance).toBe(900); // 1000 - 100

        // Verify simple account fetch
        const updatedAccount = await prisma.account.findUnique({ where: { id: accountId } });
        expect(updatedAccount.balance).toBe(90000); // 1000.00 -> 100000 - 10000 = 90000 cents
    });

    it('should get transactions', async () => {
        await prisma.transaction.create({
            data: {
                amount: 5000,
                description: 'Coffee',
                type: 'expense',
                account_id: accountId,
                user_id: userId
            }
        });

        const response = await request(app)
            .get('/transactions')
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toEqual(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].description).toBe('Coffee');
    });
});
