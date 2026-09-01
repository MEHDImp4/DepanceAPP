import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { toCents, fromCents } from '../utils/money';
import { assertOwnedCategory } from '../utils/ownership';

interface CreateBudgetBody {
    amount: number;
    period?: 'weekly' | 'monthly' | 'yearly';
    category_id?: number | null;
}

interface UpdateBudgetBody {
    amount?: number;
    period?: 'weekly' | 'monthly' | 'yearly';
}

const getPeriodStart = (period: string, now = new Date()): Date => {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    if (period === 'weekly') {
        const day = start.getDay();
        start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
    } else if (period === 'yearly') {
        start.setMonth(0, 1);
    } else {
        start.setDate(1);
    }
    return start;
};

export const getBudgets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const budgets = await prisma.budget.findMany({
            where: { user_id: userId },
            include: { category: true }
        });

        const budgetsWithSpent = await Promise.all(budgets.map(async (budget) => {
            const whereClause: {
                user_id: number;
                created_at: { gte: Date };
                type: string;
                category_id?: number;
            } = {
                user_id: userId,
                created_at: { gte: getPeriodStart(budget.period) },
                type: 'expense'
            };

            if (budget.category_id) {
                whereClause.category_id = budget.category_id;
            }

            const aggregations = await prisma.transaction.aggregate({
                _sum: { amount: true },
                where: whereClause
            });

            return {
                ...budget,
                amount: fromCents(budget.amount),
                spent: fromCents(aggregations._sum.amount || 0)
            };
        }));

        res.json(budgetsWithSpent);
    } catch (error) {
        next(error);
    }
};

export const createBudget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { amount, period, category_id } = req.body as CreateBudgetBody;
        const userId = req.user!.userId;
        await assertOwnedCategory(category_id, userId);

        const existing = await prisma.budget.findFirst({
            where: {
                user_id: userId,
                category_id: category_id || null
            }
        });

        if (existing) {
            res.status(400).json({ error: 'Budget already exists for this category' });
            return;
        }

        const budget = await prisma.budget.create({
            data: {
                amount: toCents(amount),
                period: period || 'monthly',
                category_id: category_id || null,
                user_id: userId
            }
        });

        res.status(201).json({ ...budget, amount: fromCents(budget.amount) });
    } catch (error) {
        next(error);
    }
};

export const updateBudget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { amount, period } = req.body as UpdateBudgetBody;
        const userId = req.user!.userId;

        const result = await prisma.budget.updateMany({
            where: { id: parseInt(id as string), user_id: userId },
            data: {
                ...(amount !== undefined && { amount: toCents(amount) }),
                ...(period && { period })
            }
        });

        if (result.count === 0) {
            res.status(404).json({ error: 'Budget not found' });
            return;
        }
        res.json({ message: 'Budget updated' });
    } catch (error) {
        next(error);
    }
};

export const deleteBudget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;

        const result = await prisma.budget.deleteMany({
            where: { id: parseInt(id as string), user_id: userId }
        });

        if (result.count === 0) {
            res.status(404).json({ error: 'Budget not found' });
            return;
        }
        res.json({ message: 'Budget deleted' });
    } catch (error) {
        next(error);
    }
};
