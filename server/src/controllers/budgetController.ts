import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { toCents, fromCents } from '../utils/money';
import { AuditAction, logAudit } from '../utils/auditService';
import { calculateExchange, getRates } from '../utils/currencyService';
import { getPeriodStart, normalizeTimeZone } from '../utils/reportingTime';

interface CreateBudgetBody {
    amount: number;
    period?: 'weekly' | 'monthly' | 'yearly';
    category_id?: number | null;
}

interface UpdateBudgetBody {
    amount?: number;
    period?: 'weekly' | 'monthly' | 'yearly';
}

const budgetScopeKey = (categoryId?: number | null) =>
    categoryId ? `category:${categoryId}` : 'global';

export const getBudgets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const [user, budgets] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } }),
            prisma.budget.findMany({
                where: { user_id: userId },
                include: { category: true }
            })
        ]);

        const timeZone = normalizeTimeZone(user?.timezone);
        let ratesPromise: ReturnType<typeof getRates> | null = null;

        const budgetsWithSpent = await Promise.all(budgets.map(async budget => {
            const transactions = await prisma.transaction.findMany({
                where: {
                    user_id: userId,
                    created_at: { gte: getPeriodStart(budget.period as 'weekly' | 'monthly' | 'yearly', timeZone) },
                    type: 'expense',
                    transfer_id: null,
                    ...(budget.category_id ? { category_id: budget.category_id } : {})
                },
                select: {
                    amount: true,
                    account: { select: { currency: true } }
                }
            });

            const needsConversion = transactions.some(
                tx => tx.account.currency.toUpperCase() !== budget.currency.toUpperCase()
            );
            const rates = needsConversion
                ? await (ratesPromise ??= getRates())
                : {};

            const spentCents = transactions.reduce((sum, tx) => {
                const converted = tx.account.currency.toUpperCase() === budget.currency.toUpperCase()
                    ? tx.amount
                    : Math.round(calculateExchange(tx.amount, tx.account.currency, budget.currency, rates));
                return sum + converted;
            }, 0);

            return {
                ...budget,
                amount: fromCents(budget.amount),
                spent: fromCents(spentCents)
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

        const [user, category] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId }, select: { currency: true } }),
            category_id
                ? prisma.category.findFirst({ where: { id: category_id, user_id: userId } })
                : Promise.resolve(null)
        ]);

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        if (category_id && !category) {
            res.status(403).json({ error: 'Invalid category or access denied' });
            return;
        }
        if (category && category.type !== 'expense') {
            res.status(409).json({
                error: 'Budgets can only target expense categories',
                code: 'BUDGET_CATEGORY_TYPE_MISMATCH'
            });
            return;
        }

        const budget = await prisma.budget.create({
            data: {
                amount: toCents(amount),
                currency: user.currency.toUpperCase(),
                period: period || 'monthly',
                category_id: category_id || null,
                scope_key: budgetScopeKey(category_id),
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
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            res.status(409).json({ error: 'Budget already exists for this scope', code: 'BUDGET_ALREADY_EXISTS' });
            return;
        }
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
