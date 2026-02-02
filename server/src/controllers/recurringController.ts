import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { toCents, fromCents } from '../utils/money';
import * as recurringService from '../services/recurringService';

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
            where: { id: parseInt(id as string), user_id: userId }
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

        const txsWithFloat = createdTransactions.map(tx => ({ ...tx, amount: fromCents(tx.amount) }));

        res.json({ processed: txsWithFloat.length, transactions: txsWithFloat });
    } catch (error) {
        next(error);
    }
};
