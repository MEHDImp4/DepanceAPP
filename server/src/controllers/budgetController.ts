import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { toCents, fromCents } from '../utils/money';

interface CreateBudgetBody {
    amount: number;
    period?: 'weekly' | 'monthly' | 'yearly';
    category_id?: number | null;
}

interface UpdateBudgetBody {
    amount?: number;
    period?: 'weekly' | 'monthly' | 'yearly';
}

export const getBudgets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const budgets = await prisma.budget.findMany({
            where: { user_id: userId },
            include: { category: true }
        });

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const budgetsWithSpent = await Promise.all(budgets.map(async (budget) => {
            const whereClause: {
                user_id: number;
                created_at: { gte: Date };
                type: string;
                category_id?: number;
            } = {
                user_id: userId,
                created_at: { gte: startOfMonth },
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
            where: { id: parseInt(id), user_id: userId },
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
            where: { id: parseInt(id), user_id: userId }
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
