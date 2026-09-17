import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/index';
import prisma from '../src/utils/prisma';
import { signAccessToken } from '../src/utils/tokens';

jest.setTimeout(20_000);

describe('Second audit regression fixes', () => {
    let userId: number;
    let token: string;
    const password = 'ValidPass!123';

    beforeEach(async () => {
        const user = await prisma.user.create({
            data: {
                username: 'reaudit-user',
                email: 'reaudit@example.com',
                password_hash: await bcrypt.hash(password, 4),
                currency: 'USD',
                timezone: 'UTC'
            }
        });
        userId = user.id;
        token = signAccessToken(user);
    });

    it('blocks deleting an account while transfer history exists', async () => {
        const source = await prisma.account.create({
            data: { name: 'Source', type: 'bank', balance: 100_000, currency: 'USD', user_id: userId }
        });
        const destination = await prisma.account.create({
            data: { name: 'Destination', type: 'bank', balance: 0, currency: 'USD', user_id: userId }
        });

        const transfer = await request(app)
            .post('/api/transfers')
            .set('Authorization', `Bearer ${token}`)
            .set('Idempotency-Key', 'delete-account-transfer')
            .send({ from_account_id: source.id, to_account_id: destination.id, amount: 100 });
        expect(transfer.statusCode).toBe(201);

        const deleted = await request(app)
            .delete(`/api/accounts/${source.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ password });

        expect(deleted.statusCode).toBe(409);
        expect(deleted.body.code).toBe('ACCOUNT_HAS_TRANSFERS');
        expect(await prisma.account.findUnique({ where: { id: source.id } })).not.toBeNull();
        expect(await prisma.transaction.count({ where: { transfer_id: transfer.body.transferId } })).toBe(2);
    });

    it('rejects reusing an idempotency key with a different payload', async () => {
        const account = await prisma.account.create({
            data: { name: 'Wallet', type: 'cash', balance: 0, currency: 'USD', user_id: userId }
        });

        const first = await request(app)
            .post('/api/transactions')
            .set('Authorization', `Bearer ${token}`)
            .set('Idempotency-Key', 'same-key')
            .send({ amount: 10, description: 'First', type: 'expense', account_id: account.id });
        expect(first.statusCode).toBe(201);

        const second = await request(app)
            .post('/api/transactions')
            .set('Authorization', `Bearer ${token}`)
            .set('Idempotency-Key', 'same-key')
            .send({ amount: 20, description: 'Second', type: 'expense', account_id: account.id });

        expect(second.statusCode).toBe(409);
        expect(second.body.code).toBe('IDEMPOTENCY_KEY_REUSED');
        expect(await prisma.transaction.count({ where: { user_id: userId } })).toBe(1);
    });

    it('enforces one global budget even under concurrent requests', async () => {
        const responses = await Promise.all([
            request(app).post('/api/budgets').set('Authorization', `Bearer ${token}`).send({ amount: 100, period: 'monthly' }),
            request(app).post('/api/budgets').set('Authorization', `Bearer ${token}`).send({ amount: 200, period: 'monthly' })
        ]);

        expect(responses.map(response => response.statusCode).sort()).toEqual([201, 409]);
        expect(await prisma.budget.count({ where: { user_id: userId, scope_key: 'global' } })).toBe(1);
    });

    it('converts mixed account currencies before budget and analytics aggregation', async () => {
        await prisma.exchangeRate.createMany({
            data: [
                { currency: 'USD', rate: 1 },
                { currency: 'MAD', rate: 10 }
            ]
        });

        const usd = await prisma.account.create({
            data: { name: 'USD', type: 'bank', balance: 0, currency: 'USD', user_id: userId }
        });
        const mad = await prisma.account.create({
            data: { name: 'MAD', type: 'cash', balance: 0, currency: 'MAD', user_id: userId }
        });
        const category = await prisma.category.create({
            data: { name: 'Food', type: 'expense', user_id: userId }
        });
        await prisma.budget.create({
            data: {
                amount: 50_000,
                currency: 'USD',
                period: 'monthly',
                category_id: category.id,
                scope_key: `category:${category.id}`,
                user_id: userId
            }
        });
        await prisma.transaction.createMany({
            data: [
                { amount: 10_000, description: 'USD expense', type: 'expense', account_id: usd.id, category_id: category.id, user_id: userId },
                { amount: 10_000, description: 'MAD expense', type: 'expense', account_id: mad.id, category_id: category.id, user_id: userId }
            ]
        });

        const budgets = await request(app).get('/api/budgets').set('Authorization', `Bearer ${token}`);
        expect(budgets.statusCode).toBe(200);
        expect(budgets.body[0].currency).toBe('USD');
        expect(budgets.body[0].spent).toBe(110);

        const recap = await request(app).get('/api/analytics/recap').set('Authorization', `Bearer ${token}`);
        expect(recap.statusCode).toBe(200);
        expect(recap.body.currency).toBe('USD');
        expect(recap.body.totalSpent).toBe(110);
    });

    it('rejects mismatched category types and locks used category type changes', async () => {
        const account = await prisma.account.create({
            data: { name: 'Wallet', type: 'cash', balance: 0, currency: 'USD', user_id: userId }
        });
        const category = await prisma.category.create({
            data: { name: 'Salary', type: 'income', user_id: userId }
        });

        const mismatch = await request(app)
            .post('/api/transactions')
            .set('Authorization', `Bearer ${token}`)
            .send({ amount: 10, description: 'Wrong category', type: 'expense', account_id: account.id, category_id: category.id });
        expect(mismatch.statusCode).toBe(409);
        expect(mismatch.body.code).toBe('CATEGORY_TYPE_MISMATCH');

        await prisma.transaction.create({
            data: { amount: 1_000, description: 'Salary', type: 'income', account_id: account.id, category_id: category.id, user_id: userId }
        });
        const changeType = await request(app)
            .put(`/api/categories/${category.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ type: 'expense' });
        expect(changeType.statusCode).toBe(409);
        expect(changeType.body.code).toBe('CATEGORY_TYPE_LOCKED');
    });

    it('keeps goal and budget currency stable when profile reporting currency changes', async () => {
        const goal = await request(app)
            .post('/api/goals')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Laptop', targetAmount: 1000 });
        const budget = await request(app)
            .post('/api/budgets')
            .set('Authorization', `Bearer ${token}`)
            .send({ amount: 500, period: 'monthly' });
        expect(goal.body.currency).toBe('USD');
        expect(budget.body.currency).toBe('USD');

        const profile = await request(app)
            .put('/api/auth/profile')
            .set('Authorization', `Bearer ${token}`)
            .send({ currency: 'MAD', timezone: 'Africa/Casablanca' });
        expect(profile.statusCode).toBe(200);
        expect(profile.body.currency).toBe('MAD');
        expect(profile.body.timezone).toBe('Africa/Casablanca');

        const storedGoal = await prisma.goal.findUnique({ where: { id: goal.body.id } });
        const storedBudget = await prisma.budget.findUnique({ where: { id: budget.body.id } });
        expect(storedGoal?.currency).toBe('USD');
        expect(storedBudget?.currency).toBe('USD');
    });
});
