require('dotenv').config();
const prisma = require('../src/utils/prisma');

beforeAll(async () => {
    // Connect to database
    await prisma.$connect();
});

afterEach(async () => {
    // Clean up database after each test
    const deleteTransactions = prisma.transaction.deleteMany();
    const deleteAccounts = prisma.account.deleteMany();
    const deleteBudgets = prisma.budget.deleteMany();
    const deleteRecurring = prisma.recurringTransaction.deleteMany();
    const deleteCategories = prisma.category.deleteMany();
    const deleteUsers = prisma.user.deleteMany();

    // Use transaction to ensure order or just await all
    // Note: Foreign key constraints might require specific order
    // Deleting users should cascade if set up, but let's be explicit/careful
    // Order: Transactions -> Accounts/Categories -> Users
    try {
        await prisma.$transaction([
            deleteTransactions,
            deleteRecurring,
            deleteBudgets,
            deleteAccounts,
            deleteCategories,
            deleteUsers
        ]);
    } catch (error) {
        console.error('Error cleaning up database:', error);
    }
});

afterAll(async () => {
    await prisma.$disconnect();
});
