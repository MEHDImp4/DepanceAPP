import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { toCents, fromCents } from '../utils/money';
import { getRates, calculateExchange } from '../utils/currencyService';

interface CreateTransactionBody {
    amount: number;
    description: string;
    type: 'income' | 'expense';
    account_id: number;
    category_id?: number | null;
}

export const createTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { amount, description, type, account_id, category_id } = req.body as CreateTransactionBody;
        const userId = req.user!.userId;

        const account = await prisma.account.findFirst({
            where: { id: account_id, user_id: userId }
        });
        if (!account) {
            res.status(404).json({ error: 'Account not found' });
            return;
        }

        if (category_id) {
            const category = await prisma.category.findFirst({
                where: { id: category_id, user_id: userId }
            });
            if (!category) {
                res.status(403).json({ error: 'Invalid category or access denied' });
                return;
            }
        }

        const transactionAmount = toCents(amount);
        const balanceChange = type === 'income' ? transactionAmount : -transactionAmount;

        const [transaction, updatedAccount] = await prisma.$transaction([
            prisma.transaction.create({
                data: {
                    amount: transactionAmount,
                    description,
                    type,
                    account_id,
                    user_id: userId,
                    category_id: category_id || null
                }
            }),
            prisma.account.update({
                where: { id: account_id },
                data: { balance: { increment: balanceChange } }
            })
        ]);

        res.status(201).json({
            transaction: { ...transaction, amount: fromCents(transaction.amount) },
            newBalance: fromCents(updatedAccount.balance)
        });
    } catch (error) {
        next(error);
    }
};

export const getTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { accountId } = req.query as { accountId?: string };

        const [user, transactions, rates] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId }, select: { currency: true } }),
            prisma.transaction.findMany({
                where: {
                    user_id: userId,
                    ...(accountId ? { account_id: parseInt(accountId) } : {})
                },
                orderBy: { created_at: 'desc' },
                include: {
                    account: { select: { name: true, currency: true } },
                    category: true
                }
            }),
            getRates()
        ]);

        const targetCurrency = user?.currency || 'USD';

        const txsWithConversion = transactions.map((tx) => {
            try {
                const sourceCurrency = tx.account?.currency || 'USD';
                const convertedAmountCents = calculateExchange(tx.amount, sourceCurrency, targetCurrency, rates);

                return {
                    ...tx,
                    amount: fromCents(tx.amount),
                    convertedAmount: fromCents(convertedAmountCents),
                    convertedCurrency: targetCurrency
                };
            } catch (err) {
                console.error(`Conversion error for tx ${tx.id}:`, (err as Error).message);
                return {
                    ...tx,
                    amount: fromCents(tx.amount),
                    convertedAmount: fromCents(tx.amount),
                    convertedCurrency: tx.account?.currency || 'USD'
                };
            }
        });

        res.json(txsWithConversion);
    } catch (error) {
        next(error);
    }
};

export const getTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;

        const transaction = await prisma.transaction.findFirst({
            where: { id: parseInt(id as string), user_id: userId },
            include: { account: true, category: true }
        });

        if (!transaction) {
            res.status(404).json({ error: 'Transaction not found' });
            return;
        }

        res.json({ ...transaction, amount: fromCents(transaction.amount) });
    } catch (error) {
        next(error);
    }
};

export const deleteTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;

        const tx = await prisma.transaction.findFirst({
            where: { id: parseInt(id as string), user_id: userId }
        });
        if (!tx) {
            res.status(404).json({ error: 'Transaction not found' });
            return;
        }

        const balanceChange = tx.type === 'income' ? -tx.amount : tx.amount;

        await prisma.$transaction([
            prisma.transaction.delete({ where: { id: parseInt(id as string) } }),
            prisma.account.update({
                where: { id: tx.account_id },
                data: { balance: { increment: balanceChange } }
            })
        ]);

        res.json({ message: 'Transaction deleted' });
    } catch (error) {
        next(error);
    }
};
