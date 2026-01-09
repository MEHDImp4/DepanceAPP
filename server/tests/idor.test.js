const request = require('supertest');
const app = require('../src/index');
const prisma = require('../src/utils/prisma');
const jwt = require('jsonwebtoken');

describe('IDOR Vulnerability Check', () => {
    let user1, user2;
    let token1, token2;
    let category1;
    let account2;

    beforeAll(async () => {
        // Create User 1 (Victim)
        user1 = await prisma.user.create({
            data: {
                username: 'victim',
                email: 'victim@example.com',
                password_hash: 'hashed'
            }
        });
        token1 = jwt.sign({ userId: user1.id, email: user1.email }, process.env.JWT_SECRET || 'secret_key');

        // Create Category for User 1
        category1 = await prisma.category.create({
            data: {
                name: 'Victim Category',
                type: 'expense',
                user_id: user1.id
            }
        });

        // Create User 2 (Attacker)
        user2 = await prisma.user.create({
            data: {
                username: 'attacker',
                email: 'attacker@example.com',
                password_hash: 'hashed'
            }
        });
        token2 = jwt.sign({ userId: user2.id, email: user2.email }, process.env.JWT_SECRET || 'secret_key');

        // Create Account for User 2
        account2 = await prisma.account.create({
            data: {
                name: 'Attacker Account',
                type: 'bank',
                user_id: user2.id
            }
        });
    });

    afterAll(async () => {
        // Cleanup
        await prisma.transaction.deleteMany();
        await prisma.account.deleteMany();
        await prisma.category.deleteMany();
        await prisma.user.deleteMany();
        await prisma.$disconnect();
    });

    it('should prevent User 2 from using User 1\'s category', async () => {
        const response = await request(app)
            .post('/transactions')
            .set('Cookie', [`token=${token2}`]) // Authenticate as Attacker
            .send({
                amount: 100,
                description: 'IDOR Attempt',
                type: 'expense',
                account_id: account2.id,
                category_id: category1.id // Trying to use Victim's category
            });

        // Expectation: Should fail with 403
        expect(response.statusCode).toBe(403);
    });
});
