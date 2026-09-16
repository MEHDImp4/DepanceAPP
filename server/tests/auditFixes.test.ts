import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/index';
import prisma from '../src/utils/prisma';
import { signAccessToken } from '../src/utils/tokens';

jest.setTimeout(15_000);

describe('Audit regression fixes', () => {
    let token: string;
    let userId: number;

    beforeEach(async () => {
        const user = await prisma.user.create({
            data: {
                username: 'audit-user',
                email: 'audit@example.com',
                password_hash: await bcrypt.hash('ValidPass!123', 4),
                currency: 'USD'
            }
        });
        userId = user.id;
        token = signAccessToken(user);
    });

    it('prevents deleting one half of a transfer and cancels both halves atomically', async () => {
        const source = await prisma.account.create({
            data: { name: 'Source', type: 'bank', balance: 100_000, currency: 'USD', user_id: userId }
        });
        const destination = await prisma.account.create({
            data: { name: 'Destination', type: 'bank', balance: 50_000, currency: 'USD', user_id: userId }
        });

        const transfer = await request(app)
            .post('/api/transfers')
            .set('Authorization', `Bearer ${token}`)
            .set('Idempotency-Key', 'transfer-regression-1')
            .send({ from_account_id: source.id, to_account_id: destination.id, amount: 100 });

        expect(transfer.statusCode).toBe(201);
        expect(transfer.body.transferId).toBeTruthy();

        const entries = await prisma.transaction.findMany({
            where: { transfer_id: transfer.body.transferId },
            orderBy: { id: 'asc' }
        });
        expect(entries).toHaveLength(2);

        const partialDelete = await request(app)
            .delete(`/api/transactions/${entries[0].id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(partialDelete.statusCode).toBe(409);
        expect(partialDelete.body.code).toBe('TRANSFER_TRANSACTION_IMMUTABLE');

        const balancesAfterTransfer = await prisma.account.findMany({
            where: { id: { in: [source.id, destination.id] } },
            orderBy: { id: 'asc' }
        });
        expect(balancesAfterTransfer.map(account => account.balance).sort((a, b) => a - b)).toEqual([60_000, 90_000]);

        const cancelled = await request(app)
            .delete(`/api/transfers/${transfer.body.transferId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(cancelled.statusCode).toBe(200);
        expect(await prisma.transaction.count({ where: { transfer_id: transfer.body.transferId } })).toBe(0);

        const restoredSource = await prisma.account.findUnique({ where: { id: source.id } });
        const restoredDestination = await prisma.account.findUnique({ where: { id: destination.id } });
        expect(restoredSource?.balance).toBe(100_000);
        expect(restoredDestination?.balance).toBe(50_000);
    });

    it('locks account currency after financial activity', async () => {
        const account = await prisma.account.create({
            data: { name: 'Active', type: 'bank', balance: 0, currency: 'USD', user_id: userId }
        });
        await prisma.transaction.create({
            data: {
                amount: 1_000,
                description: 'Existing activity',
                type: 'expense',
                account_id: account.id,
                user_id: userId
            }
        });

        const response = await request(app)
            .put(`/api/accounts/${account.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ currency: 'MAD' });

        expect(response.statusCode).toBe(409);
        expect(response.body.code).toBe('ACCOUNT_CURRENCY_LOCKED');
        const unchanged = await prisma.account.findUnique({ where: { id: account.id } });
        expect(unchanged?.currency).toBe('USD');
    });

    it('preserves a template type on partial update', async () => {
        const template = await prisma.template.create({
            data: {
                name: 'Salary',
                amount: 100_000,
                type: 'income',
                user_id: userId
            }
        });

        const response = await request(app)
            .put(`/api/templates/${template.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Monthly salary' });

        expect(response.statusCode).toBe(200);
        expect(response.body.type).toBe('income');
    });

    it('stores goal decimal values in cents while keeping API units stable', async () => {
        const create = await request(app)
            .post('/api/goals')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Laptop', targetAmount: 1234.56, currentAmount: 78.9 });

        expect(create.statusCode).toBe(201);
        expect(create.body.targetAmount).toBe(1234.56);
        expect(create.body.currentAmount).toBe(78.9);

        const stored = await prisma.goal.findUnique({ where: { id: create.body.id } });
        expect(stored?.targetAmount).toBe(123_456);
        expect(stored?.currentAmount).toBe(7_890);
    });

    it('does not count internal transfers as budget spending', async () => {
        const source = await prisma.account.create({
            data: { name: 'A', type: 'bank', balance: 100_000, currency: 'USD', user_id: userId }
        });
        const destination = await prisma.account.create({
            data: { name: 'B', type: 'bank', balance: 0, currency: 'USD', user_id: userId }
        });
        await prisma.budget.create({
            data: { amount: 50_000, period: 'monthly', category_id: null, user_id: userId }
        });

        await request(app)
            .post('/api/transfers')
            .set('Authorization', `Bearer ${token}`)
            .set('Idempotency-Key', 'budget-transfer-regression')
            .send({ from_account_id: source.id, to_account_id: destination.id, amount: 200 });

        const budgets = await request(app)
            .get('/api/budgets')
            .set('Authorization', `Bearer ${token}`);

        expect(budgets.statusCode).toBe(200);
        expect(budgets.body[0].spent).toBe(0);
    });
});
