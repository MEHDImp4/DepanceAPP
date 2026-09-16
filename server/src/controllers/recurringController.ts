import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { toCents, fromCents } from '../utils/money';
import * as recurringService from '../services/recurringService';
import { AuditAction, logAudit } from '../utils/auditService';

interface CreateRecurringBody {
    amount: number;
    description: string;
    type: 'income' | 'expense';
    interval: 'weekly' | 'monthly' | 'yearly';
    start_date?: string;
    account_id: number;
    category_id?: number | null;
}

export const getRecurring = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const recurring = await prisma.recurringTransaction.findMany({
            where: { user_id: userId },
            include: { category: true, account: true },
            orderBy: { created_at: 'desc' }
        });
        res.json(recurring.map(rule => ({ ...rule, amount: fromCents(rule.amount) })));
    } catch (error) {
        next(error);
    }
};

export const createRecurring = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { amount, description, type, interval, start_date, account_id, category_id } = req.body as CreateRecurringBody;
        const userId = req.user!.userId;

        const [account, category] = await Promise.all([
            prisma.account.findFirst({ where: { id: account_id, user_id: userId } }),
            category_id
                ? prisma.category.findFirst({ where: { id: category_id, user_id: userId } })
                : Promise.resolve(null)
        ]);

        if (!account) {
            res.status(404).json({ error: 'Account not found' });
            return;
        }
        if (category_id && !category) {
            res.status(403).json({ error: 'Invalid category or access denied' });
            return;
        }
        if (category && category.type !== type) {
            res.status(409).json({
                error: `A ${type} recurring transaction requires a ${type} category`,
                code: 'CATEGORY_TYPE_MISMATCH'
            });
            return;
        }

        const nextRunDate = start_date ? new Date(start_date) : new Date();
        const recurring = await prisma.recurringTransaction.create({
            data: {
                amount: toCents(amount),
                description,
                type,
                interval,
                anchor_day: nextRunDate.getDate(),
                next_run_date: nextRunDate,
                account_id,
                category_id: category_id || null,
                user_id: userId
            }
        });

        await logAudit({
            userId,
            action: AuditAction.RECURRING_CREATE,
            entityType: 'recurring',
            entityId: recurring.id,
            newValue: recurring,
            req
        });

        res.status(201).json({ ...recurring, amount: fromCents(recurring.amount) });
    } catch (error) {
        next(error);
    }
};

export const deleteRecurring = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const recurringId = parseInt(req.params.id as string, 10);
        const userId = req.user!.userId;
        const existing = await prisma.recurringTransaction.findFirst({ where: { id: recurringId, user_id: userId } });

        if (!existing) {
            res.status(404).json({ error: 'Recurring transaction not found' });
            return;
        }

        await prisma.recurringTransaction.delete({ where: { id: recurringId } });
        await logAudit({
            userId,
            action: AuditAction.RECURRING_DELETE,
            entityType: 'recurring',
            entityId: recurringId,
            oldValue: existing,
            req
        });

        res.json({ message: 'Deleted' });
    } catch (error) {
        next(error);
    }
};

export const processRecurring = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const createdTransactions = await recurringService.processDueTransactions(userId);

        if (createdTransactions.length > 0) {
            await logAudit({
                userId,
                action: AuditAction.RECURRING_PROCESS,
                entityType: 'recurring',
                newValue: { transactionIds: createdTransactions.map(tx => tx.id) },
                req
            });
        }

        res.json({
            processed: createdTransactions.length,
            transactions: createdTransactions.map(tx => ({ ...tx, amount: fromCents(tx.amount) }))
        });
    } catch (error) {
        next(error);
    }
};
