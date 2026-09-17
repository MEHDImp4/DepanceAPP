import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/index';
import prisma from '../src/utils/prisma';
import { hashToken, signAccessToken } from '../src/utils/tokens';

jest.setTimeout(30_000);

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

    it('blocks deleting an account while any financial history exists', async () => {
        const account = await prisma.account.create({
            data: { name: 'Wallet', type: 'cash', balance: 10_000, currency: 'USD', user_id: userId }
        });
        await prisma.transaction.create({
            data: { amount: 1_000, description: 'Historical expense', type: 'expense', account_id: account.id, user_id: userId }
        });

        const deleted = await request(app)
            .delete(`/api/accounts/${account.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ password });

        expect(deleted.statusCode).toBe(409);
        expect(deleted.body.code).toBe('ACCOUNT_HAS_ACTIVITY');
        expect(await prisma.account.findUnique({ where: { id: account.id } })).not.toBeNull();
        expect(await prisma.transaction.count({ where: { account_id: account.id } })).toBe(1);
    });

    it('cancels a transfer at most once under concurrent requests', async () => {
        const source = await prisma.account.create({
            data: { name: 'Source', type: 'bank', balance: 100_000, currency: 'USD', user_id: userId }
        });
        const destination = await prisma.account.create({
            data: { name: 'Destination', type: 'bank', balance: 0, currency: 'USD', user_id: userId }
        });

        const transfer = await request(app)
            .post('/api/transfers')
            .set('Authorization', `Bearer ${token}`)
            .send({ from_account_id: source.id, to_account_id: destination.id, amount: 100 });
        expect(transfer.statusCode).toBe(201);

        const responses = await Promise.all([
            request(app).delete(`/api/transfers/${transfer.body.transferId}`).set('Authorization', `Bearer ${token}`),
            request(app).delete(`/api/transfers/${transfer.body.transferId}`).set('Authorization', `Bearer ${token}`)
        ]);

        expect(responses.filter(response => response.statusCode === 200)).toHaveLength(1);
        expect(responses.filter(response => [404, 409].includes(response.statusCode))).toHaveLength(1);
        expect((await prisma.account.findUnique({ where: { id: source.id } }))?.balance).toBe(100_000);
        expect((await prisma.account.findUnique({ where: { id: destination.id } }))?.balance).toBe(0);
        expect(await prisma.transaction.count({ where: { transfer_id: transfer.body.transferId } })).toBe(0);
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

    it('allows an expired idempotency key to be reused immediately', async () => {
        const account = await prisma.account.create({
            data: { name: 'Wallet', type: 'cash', balance: 0, currency: 'USD', user_id: userId }
        });
        const payload = { amount: 10, description: 'Repeat after expiry', type: 'expense', account_id: account.id };

        const first = await request(app)
            .post('/api/transactions')
            .set('Authorization', `Bearer ${token}`)
            .set('Idempotency-Key', 'expired-key')
            .send(payload);
        expect(first.statusCode).toBe(201);

        await prisma.idempotencyKey.updateMany({
            where: { user_id: userId, key: 'expired-key' },
            data: { expires_at: new Date(Date.now() - 1_000) }
        });

        const second = await request(app)
            .post('/api/transactions')
            .set('Authorization', `Bearer ${token}`)
            .set('Idempotency-Key', 'expired-key')
            .send(payload);

        expect(second.statusCode).toBe(201);
        expect(second.headers['idempotency-replayed']).toBeUndefined();
        expect(await prisma.transaction.count({ where: { user_id: userId } })).toBe(2);
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

    it('freezes historical reporting to the transaction FX snapshot', async () => {
        await prisma.exchangeRate.createMany({
            data: [
                { currency: 'USD', rate: 1 },
                { currency: 'MAD', rate: 10 }
            ]
        });
        const mad = await prisma.account.create({
            data: { name: 'MAD wallet', type: 'cash', balance: 0, currency: 'MAD', user_id: userId }
        });

        const created = await request(app)
            .post('/api/transactions')
            .set('Authorization', `Bearer ${token}`)
            .send({ amount: 100, description: 'MAD purchase', type: 'expense', account_id: mad.id });
        expect(created.statusCode).toBe(201);

        await prisma.exchangeRate.update({ where: { currency: 'MAD' }, data: { rate: 20 } });

        const recap = await request(app).get('/api/analytics/recap').set('Authorization', `Bearer ${token}`);
        expect(recap.statusCode).toBe(200);
        expect(recap.body.totalSpent).toBe(10);
    });

    it('does not require exchange rates for same-currency transaction listing', async () => {
        const account = await prisma.account.create({
            data: { name: 'USD wallet', type: 'cash', balance: 0, currency: 'USD', user_id: userId }
        });
        await prisma.transaction.create({
            data: { amount: 1_000, description: 'Local transaction', type: 'expense', account_id: account.id, user_id: userId }
        });

        const response = await request(app).get('/api/transactions').set('Authorization', `Bearer ${token}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.items[0].convertedAmount).toBe(10);
        expect(response.body.items[0].convertedCurrency).toBe('USD');
    });

    it('includes data older than five years in all-time trends', async () => {
        const account = await prisma.account.create({
            data: { name: 'USD wallet', type: 'cash', balance: 0, currency: 'USD', user_id: userId }
        });
        await prisma.transaction.create({
            data: {
                amount: 1_000,
                description: 'Old expense',
                type: 'expense',
                account_id: account.id,
                user_id: userId,
                created_at: new Date('2010-01-15T12:00:00.000Z')
            }
        });

        const response = await request(app)
            .get('/api/analytics/spending-trends?period=all')
            .set('Authorization', `Bearer ${token}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.some((point: { date: string }) => point.date === '2010-01')).toBe(true);
    });

    it('rejects fractional JPY financial amounts', async () => {
        const account = await prisma.account.create({
            data: { name: 'JPY wallet', type: 'cash', balance: 0, currency: 'JPY', user_id: userId }
        });

        const response = await request(app)
            .post('/api/transactions')
            .set('Authorization', `Bearer ${token}`)
            .send({ amount: 1.5, description: 'Fractional yen', type: 'expense', account_id: account.id });

        expect(response.statusCode).toBe(400);
        expect(response.body.code).toBe('CURRENCY_FRACTION_UNSUPPORTED');
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

    it('rejects an FX transfer when rounding would credit zero destination units', async () => {
        await prisma.exchangeRate.createMany({
            data: [
                { currency: 'USD', rate: 1 },
                { currency: 'MAD', rate: 0.001 }
            ]
        });
        const source = await prisma.account.create({
            data: { name: 'Tiny source', type: 'bank', balance: 100, currency: 'USD', user_id: userId }
        });
        const destination = await prisma.account.create({
            data: { name: 'Tiny destination', type: 'bank', balance: 0, currency: 'MAD', user_id: userId }
        });

        const response = await request(app)
            .post('/api/transfers')
            .set('Authorization', `Bearer ${token}`)
            .send({ from_account_id: source.id, to_account_id: destination.id, amount: 0.01 });

        expect(response.statusCode).toBe(422);
        expect(response.body.code).toBe('TRANSFER_CONVERTED_AMOUNT_TOO_SMALL');
        expect(await prisma.transaction.count({ where: { user_id: userId } })).toBe(0);
        expect((await prisma.account.findUnique({ where: { id: source.id } }))?.balance).toBe(100);
        expect((await prisma.account.findUnique({ where: { id: destination.id } }))?.balance).toBe(0);
    });

    it('treats simultaneous refreshes as a recoverable race instead of revoking the family', async () => {
        const login = await request(app)
            .post('/api/auth/login')
            .send({ identifier: 'reaudit@example.com', password });
        expect(login.statusCode).toBe(200);

        const refreshCookie = (login.headers['set-cookie'] as unknown as string[])
            .find(cookie => cookie.startsWith('refreshToken='))!
            .split(';')[0];

        const responses = await Promise.all([
            request(app).post('/api/auth/refresh').set('Cookie', refreshCookie),
            request(app).post('/api/auth/refresh').set('Cookie', refreshCookie)
        ]);

        expect(responses.map(response => response.statusCode).sort()).toEqual([200, 409]);
        const winner = responses.find(response => response.statusCode === 200)!;
        const rotatedCookie = (winner.headers['set-cookie'] as unknown as string[])
            .find(cookie => cookie.startsWith('refreshToken='))!
            .split(';')[0];

        const stillValid = await request(app).post('/api/auth/refresh').set('Cookie', rotatedCookie);
        expect(stillValid.statusCode).toBe(200);
    });

    it('revokes the refresh-token family for a replay outside the race grace period', async () => {
        const login = await request(app)
            .post('/api/auth/login')
            .send({ identifier: 'reaudit@example.com', password });
        const firstRefreshCookie = (login.headers['set-cookie'] as unknown as string[])
            .find(cookie => cookie.startsWith('refreshToken='))!
            .split(';')[0];

        const rotated = await request(app).post('/api/auth/refresh').set('Cookie', firstRefreshCookie);
        expect(rotated.statusCode).toBe(200);
        const secondRefreshCookie = (rotated.headers['set-cookie'] as unknown as string[])
            .find(cookie => cookie.startsWith('refreshToken='))!
            .split(';')[0];

        const firstTokenValue = firstRefreshCookie.slice('refreshToken='.length);
        await prisma.refreshToken.update({
            where: { token: hashToken(firstTokenValue) },
            data: { rotatedAt: new Date(Date.now() - 20_000) }
        });

        const replay = await request(app).post('/api/auth/refresh').set('Cookie', firstRefreshCookie);
        expect(replay.statusCode).toBe(401);
        expect(replay.body.code).toBe('REFRESH_TOKEN_REUSE_DETECTED');

        const familyRevoked = await request(app).post('/api/auth/refresh').set('Cookie', secondRefreshCookie);
        expect(familyRevoked.statusCode).toBe(401);
    });
});
