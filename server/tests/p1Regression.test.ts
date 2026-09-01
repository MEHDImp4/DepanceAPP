import request from 'supertest';
import app from '../src/index';
import prisma from '../src/utils/prisma';
import { signAccessToken } from '../src/utils/tokens';

describe('P1 financial integrity regressions', () => {
  const createFixture = async () => {
    const user = await prisma.user.create({
      data: { email: `p1-${Date.now()}@example.com`, username: `p1-${Date.now()}`, password_hash: 'hash' }
    });
    const account = await prisma.account.create({
      data: { name: 'Main', type: 'normal', user_id: user.id }
    });
    return { user, account, token: signAccessToken(user) };
  };

  it('replays a transaction creation without changing the balance twice', async () => {
    const { user, account, token } = await createFixture();
    const send = () => request(app).post('/api/transactions')
      .set('Cookie', `token=${token}`)
      .set('Idempotency-Key', 'mobile-retry-001')
      .send({ amount: 12.34, description: 'Lunch', type: 'expense', account_id: account.id });

    const first = await send();
    const replay = await send();

    expect(first.statusCode).toBe(201);
    expect(replay.statusCode).toBe(201);
    expect(replay.headers['idempotency-replayed']).toBe('true');
    expect(replay.body).toEqual(first.body);
    expect(await prisma.transaction.count({ where: { user_id: user.id } })).toBe(1);
    expect((await prisma.account.findUnique({ where: { id: account.id } }))?.balance).toBe(-1234);
  });

  it('returns analytics amounts in currency units instead of cents', async () => {
    const { user, account, token } = await createFixture();
    await prisma.transaction.create({
      data: { amount: 1234, description: 'Purchase', type: 'expense', account_id: account.id, user_id: user.id }
    });

    const response = await request(app).get('/api/analytics/recap').set('Cookie', `token=${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.totalSpent).toBe(12.34);
    expect(response.body.biggestPurchase.amount).toBe(12.34);
  });

  it('calculates weekly and yearly budgets from their actual period starts', async () => {
    const { user, account, token } = await createFixture();
    const weeklyCategory = await prisma.category.create({ data: { name: 'Weekly', type: 'expense', user_id: user.id } });
    const yearlyCategory = await prisma.category.create({ data: { name: 'Yearly', type: 'expense', user_id: user.id } });
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const previousYear = new Date(new Date().getFullYear() - 1, 11, 1);
    await prisma.budget.createMany({ data: [
      { amount: 10000, period: 'weekly', category_id: weeklyCategory.id, user_id: user.id },
      { amount: 100000, period: 'yearly', category_id: yearlyCategory.id, user_id: user.id }
    ] });
    await prisma.transaction.createMany({ data: [
      { amount: 1000, description: 'This week', type: 'expense', account_id: account.id, category_id: weeklyCategory.id, user_id: user.id },
      { amount: 2000, description: 'Older', type: 'expense', account_id: account.id, category_id: weeklyCategory.id, user_id: user.id, created_at: eightDaysAgo },
      { amount: 3000, description: 'This year', type: 'expense', account_id: account.id, category_id: yearlyCategory.id, user_id: user.id },
      { amount: 4000, description: 'Previous year', type: 'expense', account_id: account.id, category_id: yearlyCategory.id, user_id: user.id, created_at: previousYear }
    ] });

    const response = await request(app).get('/api/budgets').set('Cookie', `token=${token}`);
    const weekly = response.body.find((budget: { period: string }) => budget.period === 'weekly');
    const yearly = response.body.find((budget: { period: string }) => budget.period === 'yearly');
    expect(weekly.spent).toBe(10);
    expect(yearly.spent).toBe(30);
  });
});
