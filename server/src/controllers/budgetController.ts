import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { assertCurrencyAmount, toCents, fromCents } from '../utils/money';
import { AuditAction, createAuditEntry } from '../utils/auditService';
import {
    calculateExchange,
    getRates,
    parseRatesSnapshot,
    serializeRatesSnapshot
} from '../utils/currencyService';
import type { ExchangeRates } from '../types';
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

const canConvert = (rates: ExchangeRates | null, fromCurrency: string, toCurrency: string) => {
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();
    if (from === to) return true;
    return Boolean(rates?.[from] && rates?.[to]);
};

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
        let liveRatesPromise: ReturnType<typeof getRates> | null = null;
        const missingSnapshots = new Map<number, ExchangeRates>();

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
                    id: true,
                    amount: true,
                    fx_rates_snapshot: true,
                    account: { select: { currency: true } }
                }
            });

            let spentCents = 0;
            for (const tx of transactions) {
                const sourceCurrency = tx.account.currency.toUpperCase();
                const targetCurrency = budget.currency.toUpperCase();
                if (sourceCurrency === targetCurrency) {
                    spentCents += tx.amount;
                    continue;
                }

                const snapshot = parseRatesSnapshot(tx.fx_rates_snapshot);
                let rates: ExchangeRates | null = canConvert(snapshot, sourceCurrency, targetCurrency) ? snapshot : null;
                if (!rates) {
                    rates = await (liveRatesPromise ??= getRates());
                    if (!tx.fx_rates_snapshot) missingSnapshots.set(tx.id, rates);
                }
                spentCents += Math.round(calculateExchange(tx.amount, sourceCurrency, targetCurrency, rates));
            }

            return {
                ...budget,
                amount: fromCents(budget.amount),
                spent: fromCents(spentCents)
            };
        }));

        if (missingSnapshots.size > 0) {
            await Promise.all([...missingSnapshots.entries()].map(([id, rates]) =>
                prisma.transaction.updateMany({
                    where: { id, fx_rates_snapshot: null, transfer_id: null },
                    data: { fx_rates_snapshot: serializeRatesSnapshot(rates) }
                })
            ));
        }

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

        const currency = user.currency.toUpperCase();
        assertCurrencyAmount(amount, currency);

        const budget = await prisma.$transaction(async database => {
            const created = await database.budget.create({
                data: {
                    amount: toCents(amount),
                    currency,
                    period: period || 'monthly',
                    category_id: category_id || null,
                    scope_key: budgetScopeKey(category_id),
                    user_id: userId
                }
            });
            await createAuditEntry(database, {
                userId,
                action: AuditAction.BUDGET_CREATE,
                entityType: 'budget',
                entityId: created.id,
                newValue: created,
                req
            });
            return created;
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
        if (amount !== undefined) assertCurrencyAmount(amount, existing.currency);

        const updated = await prisma.$transaction(async database => {
            const saved = await database.budget.update({
                where: { id: budgetId },
                data: {
                    ...(amount !== undefined && { amount: toCents(amount) }),
                    ...(period && { period })
                }
            });
            await createAuditEntry(database, {
                userId,
                action: AuditAction.BUDGET_UPDATE,
                entityType: 'budget',
                entityId: budgetId,
                oldValue: existing,
                newValue: saved,
                req
            });
            return saved;
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

        await prisma.$transaction(async database => {
            await database.budget.delete({ where: { id: budgetId } });
            await createAuditEntry(database, {
                userId,
                action: AuditAction.BUDGET_DELETE,
                entityType: 'budget',
                entityId: budgetId,
                oldValue: existing,
                req
            });
        });

        res.json({ message: 'Budget deleted' });
    } catch (error) {
        next(error);
    }
};
