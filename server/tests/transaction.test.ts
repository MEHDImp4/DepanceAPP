import request from 'supertest';
import app from '../src/index';
import prisma from '../src/utils/prisma';
import { signAccessToken } from '../src/utils/tokens';

jest.setTimeout(10_000);

describe('Transaction Endpoints', () => {
    let token: string;
    let userId: number;
    let accountId: number;

    beforeEach(async () => {
        const user = await prisma.user.create({
            data: {
                username: 'testuser',
                email: 'test@example.com',
                password_hash: 'hashedpassword'
            }
        });
        userId = user.id;
        token = signAccessToken(user);

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
            .post('/api/transactions')
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
        expect(updatedAccount?.balance).toBe(90000); // 1000.00 -> 100000 - 10000 = 90000 cents
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
            .get('/api/transactions')
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toEqual(200);
        expect(response.body.items).toHaveLength(1);
        expect(response.body.items[0].description).toBe('Coffee');
        expect(response.body.nextCursor).toBeNull();
    });

    it('should paginate transactions with an opaque cursor contract', async () => {
        await prisma.transaction.createMany({
            data: [1, 2, 3].map(index => ({
                amount: index * 100,
                description: `Transaction ${index}`,
                type: 'expense',
                account_id: accountId,
                user_id: userId,
                created_at: new Date(Date.now() + index * 1000)
            }))
        });

        const first = await request(app).get('/api/transactions?limit=2').set('Authorization', `Bearer ${token}`);
        const second = await request(app).get(`/api/transactions?limit=2&cursor=${first.body.nextCursor}`).set('Authorization', `Bearer ${token}`);

        expect(first.body.items).toHaveLength(2);
        expect(first.body.nextCursor).not.toBeNull();
        expect(second.body.items).toHaveLength(1);
        expect(second.body.nextCursor).toBeNull();
        expect(new Set([...first.body.items, ...second.body.items].map(item => item.id)).size).toBe(3);
    });
});
