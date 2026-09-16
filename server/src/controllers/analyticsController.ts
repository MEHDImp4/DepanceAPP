import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { fromCents } from '../utils/money';

export const getMonthlyRecap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const now = new Date();
        const startCurrent = new Date(now.getFullYear(), now.getMonth(), 1);
        const endCurrent = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const startLast = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endLast = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        const currentTotals = await prisma.transaction.aggregate({
            where: {
                user_id: userId,
                transfer_id: null,
                created_at: { gte: startCurrent, lte: endCurrent }
            },
            _sum: { amount: true },
            _count: true
        });

        const typeTotals = await prisma.transaction.groupBy({
            by: ['type'],
            where: {
                user_id: userId,
                transfer_id: null,
                created_at: { gte: startCurrent, lte: endCurrent }
            },
            _sum: { amount: true }
        });

        const categoryStats = await prisma.transaction.groupBy({
            by: ['category_id'],
            where: {
                user_id: userId,
                transfer_id: null,
                created_at: { gte: startCurrent, lte: endCurrent },
                type: 'expense',
                category_id: { not: null }
            },
            _sum: { amount: true },
            orderBy: { _sum: { amount: 'desc' } },
            take: 1
        });

        let topCategory = null;
        if (categoryStats.length > 0 && categoryStats[0].category_id) {
            const cat = await prisma.category.findUnique({ where: { id: categoryStats[0].category_id } });
            if (cat) {
                topCategory = {
                    name: cat.name,
                    amount: fromCents(categoryStats[0]._sum.amount || 0),
                    color: cat.color,
                    icon: cat.icon
                };
            }
        }

        const biggestPurchase = await prisma.transaction.findFirst({
            where: {
                user_id: userId,
                transfer_id: null,
                created_at: { gte: startCurrent, lte: endCurrent },
                type: 'expense'
            },
            orderBy: { amount: 'desc' },
            include: { category: true }
        });

        const lastMonthStats = await prisma.transaction.groupBy({
            by: ['type'],
            where: {
                user_id: userId,
                transfer_id: null,
                created_at: { gte: startLast, lte: endLast }
            },
            _sum: { amount: true }
        });

        const currentExpense = typeTotals.find(t => t.type === 'expense')?._sum.amount || 0;
        const lastExpense = lastMonthStats.find(t => t.type === 'expense')?._sum.amount || 0;

        let comparisonPercentage = 0;
        if (lastExpense > 0) {
            comparisonPercentage = Math.round(((currentExpense - lastExpense) / lastExpense) * 100);
        } else if (currentExpense > 0) {
            comparisonPercentage = 100;
        }

        res.json({
            month: now.toLocaleString('default', { month: 'long' }),
            year: now.getFullYear(),
            totalSpent: fromCents(currentExpense),
            totalIncome: fromCents(typeTotals.find(t => t.type === 'income')?._sum.amount || 0),
            transactionCount: currentTotals._count,
            topCategory,
            biggestPurchase: biggestPurchase ? { ...biggestPurchase, amount: fromCents(biggestPurchase.amount) } : null,
            comparison: {
                lastMonthSpent: fromCents(lastExpense),
                percentageChange: comparisonPercentage
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getSpendingTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const period = (req.query.period as string) || 'month';

        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        if (period === 'week') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === 'month') {
            startDate.setMonth(startDate.getMonth() - 1);
        } else if (period === 'year') {
            startDate.setFullYear(startDate.getFullYear() - 1);
        } else if (period === 'all') {
            startDate.setFullYear(startDate.getFullYear() - 5);
        }

        const transactions = await prisma.transaction.findMany({
            where: {
                user_id: userId,
                transfer_id: null,
                created_at: { gte: startDate }
            },
            orderBy: { created_at: 'asc' }
        });

        const formatByMonth = period === 'year' || period === 'all';
        const groupedData: Record<string, { income: number; expense: number }> = {};

        if (!formatByMonth) {
            const currentDate = new Date(startDate);
            const endDate = new Date();
            while (currentDate <= endDate) {
                const dateKey = currentDate.toISOString().split('T')[0];
                groupedData[dateKey] = { income: 0, expense: 0 };
                currentDate.setDate(currentDate.getDate() + 1);
            }
        } else {
            const currentDate = new Date(startDate);
            const endDate = new Date();
            while (currentDate <= endDate) {
                const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
                groupedData[monthKey] = { income: 0, expense: 0 };
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
        }

        transactions.forEach(transaction => {
            const dateObj = new Date(transaction.created_at);
            const key = formatByMonth
                ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`
                : dateObj.toISOString().split('T')[0];

            if (groupedData[key]) {
                if (transaction.type === 'income') groupedData[key].income += transaction.amount;
                if (transaction.type === 'expense') groupedData[key].expense += transaction.amount;
            }
        });

        const sortedChartData = Object.keys(groupedData)
            .sort()
            .map(dateKey => ({
                date: dateKey,
                income: fromCents(groupedData[dateKey].income),
                expense: fromCents(groupedData[dateKey].expense)
            }));

        res.json(sortedChartData);
    } catch (error) {
        next(error);
    }
};
