import dotenv from 'dotenv';
import prisma from '../src/utils/prisma';

dotenv.config();

beforeAll(async () => {
    try {
        await prisma.$connect();
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Failed to connect to database in setup.ts:', error);
        throw error;
    }
});

afterEach(async () => {
    try {
        await prisma.$transaction([
            prisma.transaction.deleteMany(),
            prisma.recurringOccurrence.deleteMany(),
            prisma.recurringTransaction.deleteMany(),
            prisma.goal.deleteMany(),
            prisma.template.deleteMany(),
            prisma.budget.deleteMany(),
            prisma.account.deleteMany(),
            prisma.category.deleteMany(),
            prisma.refreshToken.deleteMany(),
            prisma.idempotencyKey.deleteMany(),
            prisma.loginHistory.deleteMany(),
            prisma.auditLog.deleteMany(),
            prisma.exchangeRate.deleteMany(),
            prisma.user.deleteMany()
        ]);
    } catch (error) {
        console.error('Error cleaning up database:', error);
        throw error;
    }
});

afterAll(async () => {
    await prisma.$disconnect();
});
