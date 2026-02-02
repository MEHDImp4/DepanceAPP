import prisma from '../src/utils/prisma';
import { processDueTransactions } from '../src/services/recurringService';

// Mock prisma
jest.mock('../src/utils/prisma', () => ({
    recurringTransaction: {
        findMany: jest.fn(),
        update: jest.fn(),
    },
    transaction: {
        create: jest.fn(),
    },
    account: {
        update: jest.fn(),
    },
    $transaction: jest.fn((promises) => Promise.all(promises)),
}));

describe('Recurring Service', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should process due recurring transactions', async () => {
        const mockRecurring = {
            id: 1,
            amount: 1000,
            description: 'Test Rent',
            type: 'expense',
            interval: 'monthly',
            next_run_date: new Date('2023-01-01'), // Past date
            account_id: 1,
            category_id: 1,
            user_id: 1,
        };

        const mockTx = { id: 101, amount: 1000 };

        (prisma.recurringTransaction.findMany as jest.Mock).mockResolvedValue([mockRecurring]);
        (prisma.transaction.create as jest.Mock).mockResolvedValue(mockTx);
        (prisma.account.update as jest.Mock).mockResolvedValue({});

        const result = await processDueTransactions();

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({ id: 101, amount: 1000 });
        expect(prisma.recurringTransaction.update).toHaveBeenCalled();
    });

    it('should not process future transactions', async () => {
        (prisma.recurringTransaction.findMany as jest.Mock).mockResolvedValue([]);

        const result = await processDueTransactions();

        expect(result).toHaveLength(0);
        expect(prisma.transaction.create).not.toHaveBeenCalled();
    });
});
