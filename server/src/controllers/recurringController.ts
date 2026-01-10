import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { toCents, fromCents } from '../utils/money';

interface CreateRecurringBody {
    amount: number;
    description: string;
    type: 'income' | 'expense';
    interval: 'weekly' | 'monthly' | 'yearly';
    start_date?: string;
    account_id: number;
    category_id?: number | null;
}

const MAX_RECURRING_LOOPS = 12;

export const getRecurring = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const recurring = await prisma.recurringTransaction.findMany({
            where: { user_id: userId },
            include: { category: true, account: true },
            orderBy: { created_at: 'desc' }
        });
        const recurringWithFloat = recurring.map(r => ({ ...r, amount: fromCents(r.amount) }));
        res.json(recurringWithFloat);
    } catch (error) {
        next(error);
    }
};

export const createRecurring = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { amount, description, type, interval, start_date, account_id, category_id } = req.body as CreateRecurringBody;
        const userId = req.user!.userId;

        // SECURITY: Verify account ownership to prevent IDOR
        const account = await prisma.account.findFirst({
            where: { id: account_id, user_id: userId }
        });
        if (!account) {
            res.status(404).json({ error: 'Account not found' });
            return;
        }

        // Verify category ownership if provided
        if (category_id) {
            const category = await prisma.category.findFirst({
                where: { id: category_id, user_id: userId }
            });
            if (!category) {
                res.status(403).json({ error: 'Invalid category or access denied' });
                return;
            }
        }

        const recurring = await prisma.recurringTransaction.create({
            data: {
                amount: toCents(amount),
                description,
                type,
                interval,
                next_run_date: new Date(start_date || new Date()),
                account_id,
                category_id: category_id || null,
                user_id: userId
            }
        });
        res.status(201).json({ ...recurring, amount: fromCents(recurring.amount) });
    } catch (error) {
        next(error);
    }
};

export const deleteRecurring = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;
        await prisma.recurringTransaction.deleteMany({
            where: { id: parseInt(id), user_id: userId }
        });
        res.json({ message: 'Deleted' });
    } catch (error) {
        next(error);
    }
};

interface RecurringRule {
    id: number;
    amount: number;
    description: string;
    type: string;
    interval: string;
    next_run_date: Date;
    account_id: number;
    category_id: number | null;
}

async function processRuleCycles(
    rule: RecurringRule,
    userId: number,
    now: Date
): Promise<{ id: number; amount: number }[]> {
    const nextDate = new Date(rule.next_run_date);
    const createdTransactions: { id: number; amount: number }[] = [];
    let safetyCounter = 0;

    while (nextDate <= now && safetyCounter < MAX_RECURRING_LOOPS) {
        const balanceChange = rule.type === 'income' ? rule.amount : -rule.amount;

        const [tx] = await prisma.$transaction([
            prisma.transaction.create({
                data: {
                    amount: rule.amount,
                    description: `${rule.description} (Auto)`,
                    type: rule.type,
                    account_id: rule.account_id,
                    category_id: rule.category_id,
                    user_id: userId,
                    created_at: new Date(nextDate)
                }
            }),
            prisma.account.update({
                where: { id: rule.account_id },
                data: { balance: { increment: balanceChange } }
            })
        ]);

        createdTransactions.push({ id: tx.id, amount: tx.amount });

        if (rule.interval === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
        else if (rule.interval === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        else if (rule.interval === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

        safetyCounter++;
    }

    if (createdTransactions.length > 0) {
        await prisma.recurringTransaction.update({
            where: { id: rule.id },
            data: { next_run_date: nextDate }
        });
    }

    return createdTransactions;
}

export const processRecurring = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const now = new Date();

        const dueRules = await prisma.recurringTransaction.findMany({
            where: {
                user_id: userId,
                active: true,
                next_run_date: { lte: now }
            }
        });

        const results = await Promise.all(
            dueRules.map(rule => processRuleCycles(rule, userId, now))
        );
        const createdTransactions = results.flat();
        const txsWithFloat = createdTransactions.map(tx => ({ ...tx, amount: fromCents(tx.amount) }));

        res.json({ processed: txsWithFloat.length, transactions: txsWithFloat });
    } catch (error) {
        next(error);
    }
};
