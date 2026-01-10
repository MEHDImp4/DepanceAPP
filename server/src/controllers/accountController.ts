import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { convertCurrency } from '../utils/currencyService';
import { toCents, fromCents } from '../utils/money';

interface CreateAccountBody {
    name: string;
    type?: string;
    balance?: number;
    currency?: string;
    color?: string;
}

interface UpdateAccountBody {
    name?: string;
    type?: string;
    currency?: string;
}

interface IdParams {
    id: string;
}

export const getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const [user, accounts] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId } }),
            prisma.account.findMany({ where: { user_id: userId } })
        ]);

        const targetCurrency = user?.currency || 'USD';
        const amounts = await Promise.all(accounts.map(acc =>
            convertCurrency(acc.balance, acc.currency, targetCurrency)
        ));

        const totalBalanceCents = amounts.reduce((sum, amount) => sum + amount, 0);

        res.json({
            totalBalance: fromCents(totalBalanceCents),
            currency: targetCurrency,
            accountCount: accounts.length
        });
    } catch (error) {
        next(error);
    }
};

export const createAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, type, balance, currency, color } = req.body as CreateAccountBody;
        const userId = req.user!.userId;

        const account = await prisma.account.create({
            data: {
                name,
                type: type || 'normal',
                color: color || 'bg-primary',
                currency: currency || 'USD',
                balance: toCents(balance || 0),
                user_id: userId
            }
        });

        res.status(201).json({ ...account, balance: fromCents(account.balance) });
    } catch (error) {
        next(error);
    }
};

export const getAccounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const accounts = await prisma.account.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'asc' }
        });
        const accountsWithFloat = accounts.map(acc => ({
            ...acc,
            balance: fromCents(acc.balance)
        }));
        res.json(accountsWithFloat);
    } catch (error) {
        next(error);
    }
};

export const updateAccount = async (req: Request<IdParams, unknown, UpdateAccountBody>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, type, currency } = req.body as UpdateAccountBody;
        const userId = req.user!.userId;

        const account = await prisma.account.findFirst({
            where: { id: parseInt(id), user_id: userId }
        });
        if (!account) {
            res.status(404).json({ error: 'Account not found' });
            return;
        }

        const updated = await prisma.account.update({
            where: { id: parseInt(id) },
            data: { name, type, currency }
        });
        res.json({ ...updated, balance: fromCents(updated.balance) });
    } catch (error) {
        next(error);
    }
};

export const deleteAccount = async (req: Request<IdParams>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;

        const account = await prisma.account.findFirst({
            where: { id: parseInt(id), user_id: userId }
        });
        if (!account) {
            res.status(404).json({ error: 'Account not found' });
            return;
        }

        if (account.balance !== 0) {
            res.status(400).json({ error: 'Cannot delete account with non-zero balance' });
            return;
        }

        await prisma.account.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Account deleted' });
    } catch (error) {
        next(error);
    }
};
