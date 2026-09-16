import { Request, Response, NextFunction } from 'express';
import type { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { toCents, fromCents } from '../utils/money';
import { assertOwnedCategory } from '../utils/ownership';
import { AuditAction, logAudit } from '../utils/auditService';

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

        const budgetsWithSpent = await Promise.all(budgets.map(async budget => {
            const whereClause: Prisma.TransactionWhereInput = {
                user_id: userId,
                created_at: { gte: getPeriodStart(budget.period) },
                type: 'expense',
                transfer_id: null,
                ...(budget.category_id ? { category_id: budget.category_id } : {})
            };

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
            res.status(409).json({ error: 'Budget already exists for this category' });
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

        await logAudit({
            userId,
            action: AuditAction.BUDGET_CREATE,
            entityType: 'budget',
            entityId: budget.id,
            newValue: budget,
            req
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
        const budgetId = parseInt(id as string, 10);

        const existing = await prisma.budget.findFirst({ where: { id: budgetId, user_id: userId } });
        if (!existing) {
            res.status(404).json({ error: 'Budget not found' });
            return;
        }

        const updated = await prisma.budget.update({
            where: { id: budgetId },
            data: {
                ...(amount !== undefined && { amount: toCents(amount) }),
                ...(period && { period })
            }
        });

        await logAudit({
            userId,
            action: AuditAction.BUDGET_UPDATE,
            entityType: 'budget',
            entityId: budgetId,
            oldValue: existing,
            newValue: updated,
            req
        });

        res.json({ ...updated, amount: fromCents(updated.amount) });
    } catch (error) {
        next(error);
    }
};

export const deleteBudget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;
        const budgetId = parseInt(id as string, 10);

        const existing = await prisma.budget.findFirst({ where: { id: budgetId, user_id: userId } });
        if (!existing) {
            res.status(404).json({ error: 'Budget not found' });
            return;
        }

        await prisma.budget.delete({ where: { id: budgetId } });
        await logAudit({
            userId,
            action: AuditAction.BUDGET_DELETE,
            entityType: 'budget',
            entityId: budgetId,
            oldValue: existing,
            req
        });

        res.json({ message: 'Budget deleted' });
    } catch (error) {
        next(error);
    }
};
