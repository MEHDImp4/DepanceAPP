import prisma from '../src/utils/prisma';
import { processDueTransactions } from '../src/services/recurringService';

// Mock prisma - must be at top level before imports are resolved by Jest
jest.mock('../src/utils/prisma', () => {
    const mockDelegate = {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    };

    return {
        __esModule: true,
        default: {
            $connect: jest.fn().mockResolvedValue(undefined),
            $disconnect: jest.fn().mockResolvedValue(undefined),
            $transaction: jest.fn(),
            transaction: { ...mockDelegate },
            account: { ...mockDelegate },
            budget: { ...mockDelegate },
            recurringTransaction: { ...mockDelegate },
            category: { ...mockDelegate },
            refreshToken: { ...mockDelegate },
            loginHistory: { ...mockDelegate },
            user: { ...mockDelegate },
            goal: { ...mockDelegate },
            template: { ...mockDelegate },
        },
    };
});

describe('Recurring Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should process due recurring transactions', async () => {
        const now = new Date();
        const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago

        const mockRecurring = {
            id: 1,
            amount: 1000,
            description: 'Test Rent',
            type: 'expense',
            interval: 'monthly',
            next_run_date: pastDate,
            account_id: 1,
            category_id: 1,
            user_id: 1,
        };

        const mockTx = { id: 101, amount: 1000 };

        (prisma.recurringTransaction.findMany as jest.Mock).mockResolvedValue([mockRecurring]);
        // Mock $transaction to return array with the created transaction first
        (prisma.$transaction as jest.Mock).mockResolvedValue([mockTx, {}]);
        (prisma.recurringTransaction.update as jest.Mock).mockResolvedValue({});

        const result = await processDueTransactions();

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({ id: 101, amount: 1000 });
        expect(prisma.recurringTransaction.update).toHaveBeenCalled();
    });

    it('should not process future transactions', async () => {
        (prisma.recurringTransaction.findMany as jest.Mock).mockResolvedValue([]);

        const result = await processDueTransactions();

        expect(result).toHaveLength(0);
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });
});
