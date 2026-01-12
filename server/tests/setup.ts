import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import prisma from '../src/utils/prisma';

dotenv.config();

beforeAll(async () => {
    try {
        // Connect to database
        await prisma.$connect();
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Failed to connect to database in setup.ts:', error);
        throw error;
    }
});

afterEach(async () => {
    // Clean up database after each test
    const deleteTransactions = prisma.transaction.deleteMany();
    const deleteAccounts = prisma.account.deleteMany();
    const deleteBudgets = prisma.budget.deleteMany();
    const deleteRecurring = prisma.recurringTransaction.deleteMany();
    const deleteCategories = prisma.category.deleteMany();
    const deleteUsers = prisma.user.deleteMany();
    const deleteGoals = prisma.goal.deleteMany();
    const deleteTemplates = prisma.template.deleteMany();

    // Use transaction to ensure order or just await all
    try {
        await prisma.$transaction([
            deleteTransactions,
            deleteRecurring,
            deleteBudgets,
            deleteAccounts,
            deleteCategories,
            deleteUsers,
            deleteGoals,
            deleteTemplates
        ]);
    } catch (error) {
        console.error('Error cleaning up database:', error);
    }
});

afterAll(async () => {
    await prisma.$disconnect();
});
