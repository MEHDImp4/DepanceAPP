import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

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
                topCategory = { name: cat.name, amount: categoryStats[0]._sum.amount, color: cat.color, icon: cat.icon };
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
            totalSpent: currentExpense,
            totalIncome: typeTotals.find(t => t.type === 'income')?._sum.amount || 0,
            transactionCount: currentTotals._count,
            topCategory,
            biggestPurchase,
            comparison: {
                lastMonthSpent: lastExpense,
                percentageChange: comparisonPercentage
            }
        });

    } catch (error) {
        next(error);
    }
};
