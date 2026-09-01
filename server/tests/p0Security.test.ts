import request from 'supertest';
import app from '../src/index';
import prisma from '../src/utils/prisma';
import { signAccessToken } from '../src/utils/tokens';

describe('P0 security regressions', () => {
  it('rejects a refresh token used as a bearer access token', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'token-types@example.com', username: 'tokentypes', password: 'Password123!'
    });
    const login = await request(app).post('/api/auth/login').send({
      identifier: 'token-types@example.com', password: 'Password123!'
    });
    const cookies = login.headers['set-cookie'];
    expect(Array.isArray(cookies)).toBe(true);
    const refresh = (cookies as unknown as string[])
      .find(cookie => cookie.startsWith('refreshToken='))!
      .split(';')[0].split('=')[1];

    const response = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${refresh}`);

    expect(response.statusCode).toBe(401);
  });

  it('rejects foreign categories in budgets and templates', async () => {
    const victim = await prisma.user.create({
      data: { email: 'owner@example.com', username: 'owner', password_hash: 'hash' }
    });
    const attacker = await prisma.user.create({
      data: { email: 'attacker-p0@example.com', username: 'attackerp0', password_hash: 'hash' }
    });
    const category = await prisma.category.create({
      data: { name: 'Private', type: 'expense', user_id: victim.id }
    });
    const account = await prisma.account.create({
      data: { name: 'Private account', type: 'normal', user_id: victim.id }
    });
    const token = signAccessToken(attacker);

    const budget = await request(app).post('/api/budgets').set('Cookie', `token=${token}`).send({
      amount: 100, period: 'monthly', category_id: category.id
    });
    const template = await request(app).post('/api/templates').set('Cookie', `token=${token}`).send({
      name: 'Stolen refs', amount: 10, type: 'expense',
      category_id: category.id, default_account_id: account.id
    });

    expect(budget.statusCode).toBe(400);
    expect(template.statusCode).toBe(400);
    expect(await prisma.budget.count({ where: { user_id: attacker.id } })).toBe(0);
    expect(await prisma.template.count({ where: { user_id: attacker.id } })).toBe(0);
  });
});
