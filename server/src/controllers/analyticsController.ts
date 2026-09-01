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

        // Current Month Totals
        const currentTotals = await prisma.transaction.aggregate({
            where: {
                user_id: userId,
                created_at: { gte: startCurrent, lte: endCurrent }
            },
            _sum: { amount: true },
            _count: true
        });

        // Income vs Expense for Current
        const typeTotals = await prisma.transaction.groupBy({
            by: ['type'],
            where: {
                user_id: userId,
                created_at: { gte: startCurrent, lte: endCurrent }
            },
            _sum: { amount: true }
        });

        // Top Category (Expense only)
        const categoryStats = await prisma.transaction.groupBy({
            by: ['category_id'],
            where: {
                user_id: userId,
                created_at: { gte: startCurrent, lte: endCurrent },
                type: 'expense',
                category_id: { not: null }
            },
            _sum: { amount: true },
            orderBy: {
                _sum: { amount: 'desc' }
            },
            take: 1
        });

        let topCategory = null;
        if (categoryStats.length > 0 && categoryStats[0].category_id) {
            const cat = await prisma.category.findUnique({
                where: { id: categoryStats[0].category_id }
            });
            if (cat) {
                topCategory = { name: cat.name, amount: fromCents(categoryStats[0]._sum.amount || 0), color: cat.color, icon: cat.icon };
            }
        }

        // Biggest Purchase
        const biggestPurchase = await prisma.transaction.findFirst({
            where: {
                user_id: userId,
                created_at: { gte: startCurrent, lte: endCurrent },
                type: 'expense'
            },
            orderBy: { amount: 'desc' },
            include: { category: true } // Include category details
        });

        // Previous Month Comparison (Total Expense)
        const lastMonthStats = await prisma.transaction.groupBy({
            by: ['type'],
            where: {
                user_id: userId,
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
            comparisonPercentage = 100; // 100% increase if last month was 0
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
        const period = (req.query.period as string) || 'month'; // 'week', 'month', 'year', 'all'

        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        if (period === 'week') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === 'month') {
            startDate.setMonth(startDate.getMonth() - 1);
        } else if (period === 'year') {
            startDate.setFullYear(startDate.getFullYear() - 1);
        } else if (period === 'all') {
            // Unanble to use very old date due to potential perf issues, let's limit to 5 years
            startDate.setFullYear(startDate.getFullYear() - 5);
        }

        const transactions = await prisma.transaction.findMany({
            where: {
                user_id: userId,
                created_at: {
                    gte: startDate
                }
            },
            orderBy: {
                created_at: 'asc'
            }
        });

        // Group by day (for week/month) or by month (for year/all)
        const formatByMonth = period === 'year' || period === 'all';

        const groupedData: Record<string, { income: number; expense: number }> = {};

        // Generate empty points for the requested timeline
        if (!formatByMonth) {
            let currentDate = new Date(startDate);
            const endDate = new Date();
            while (currentDate <= endDate) {
                const dateKey = currentDate.toISOString().split('T')[0];
                groupedData[dateKey] = { income: 0, expense: 0 };
                currentDate.setDate(currentDate.getDate() + 1);
            }
        } else {
            let currentDate = new Date(startDate);
            const endDate = new Date();
            while (currentDate <= endDate) {
                const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
                groupedData[monthKey] = { income: 0, expense: 0 };
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
        }

        transactions.forEach(t => {
            const dateObj = new Date(t.created_at);
            const key = formatByMonth
                ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}` // YYYY-MM
                : dateObj.toISOString().split('T')[0]; // YYYY-MM-DD

            if (groupedData[key]) {
                if (t.type === 'income') groupedData[key].income += t.amount;
                if (t.type === 'expense') groupedData[key].expense += t.amount;
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
