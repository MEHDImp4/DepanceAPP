import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { toCents, fromCents } from '../utils/money';
import { getRates, calculateExchange } from '../utils/currencyService';
import { runIdempotent } from '../utils/idempotency';
import { AuditAction, logAudit, logTransactionCreate } from '../utils/auditService';

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
            if (category.type !== type) {
                res.status(409).json({
                    error: `A ${type} transaction requires a ${type} category`,
                    code: 'CATEGORY_TYPE_MISMATCH'
                });
                return;
            }
        }

        const transactionAmount = toCents(amount);
        if (!Number.isSafeInteger(transactionAmount) || transactionAmount <= 0) {
            res.status(400).json({ error: 'Invalid amount' });
            return;
        }

        const balanceChange = type === 'income' ? transactionAmount : -transactionAmount;
        const requestPayload = { amount, description, type, account_id, category_id: category_id ?? null };

        const result = await runIdempotent(
            userId,
            'transaction.create',
            req.get('Idempotency-Key'),
            requestPayload,
            async database => {
                const transaction = await database.transaction.create({
                    data: {
                        amount: transactionAmount,
                        description,
                        type,
                        account_id,
                        user_id: userId,
                        category_id: category_id || null
                    }
                });
                const updatedAccount = await database.account.update({
                    where: { id: account_id },
                    data: { balance: { increment: balanceChange } }
                });

                return {
                    statusCode: 201,
                    body: {
                        transaction: { ...transaction, amount: fromCents(transaction.amount) },
                        newBalance: fromCents(updatedAccount.balance)
                    }
                };
            }
        );

        if (result.replayed) {
            res.set('Idempotency-Replayed', 'true');
        } else {
            const responseBody = result.body as { transaction?: Record<string, unknown> };
            if (responseBody.transaction) {
                await logTransactionCreate(userId, {
                    ...responseBody.transaction,
                    amount: transactionAmount,
                    account_id,
                    category_id: category_id || null,
                    type,
                    description
                }, req);
            }
        }

        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
};

export const getTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { accountId, cursor, limit: rawLimit } = req.query as { accountId?: string; cursor?: string; limit?: string };

        const limit = Math.min(Math.max(Number.parseInt(rawLimit || '50', 10) || 50, 1), 100);
        const parsedAccountId = accountId ? Number.parseInt(accountId, 10) : undefined;
        const cursorId = cursor ? Number.parseInt(cursor, 10) : undefined;

        if (accountId && (!Number.isInteger(parsedAccountId) || (parsedAccountId as number) <= 0)) {
            res.status(400).json({ error: 'Invalid accountId' });
            return;
        }
        if (cursor && (!Number.isInteger(cursorId) || (cursorId as number) <= 0)) {
            res.status(400).json({ error: 'Invalid cursor' });
            return;
        }

        const [user, transactions, rates] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId }, select: { currency: true } }),
            prisma.transaction.findMany({
                where: {
                    user_id: userId,
                    ...(parsedAccountId ? { account_id: parsedAccountId } : {})
                },
                orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
                take: limit + 1,
                ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
                include: {
                    account: { select: { name: true, currency: true } },
                    category: true
                }
            }),
            getRates()
        ]);

        const targetCurrency = user?.currency || 'USD';
        const hasMore = transactions.length > limit;
        const page = hasMore ? transactions.slice(0, limit) : transactions;

        const txsWithConversion = page.map(tx => {
            try {
                const sourceCurrency = tx.account?.currency || 'USD';
                const convertedAmountCents = Math.round(calculateExchange(tx.amount, sourceCurrency, targetCurrency, rates));

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

        res.json({
            items: txsWithConversion,
            nextCursor: hasMore ? String(page[page.length - 1].id) : null
        });
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
        const transactionId = parseInt(id as string);

        const tx = await prisma.transaction.findFirst({
            where: { id: transactionId, user_id: userId }
        });
        if (!tx) {
            res.status(404).json({ error: 'Transaction not found' });
            return;
        }

        if (tx.transfer_id) {
            res.status(409).json({
                error: 'Transfer transactions must be cancelled through the transfer endpoint',
                code: 'TRANSFER_TRANSACTION_IMMUTABLE',
                transferId: tx.transfer_id
            });
            return;
        }

        const balanceChange = tx.type === 'income' ? -tx.amount : tx.amount;

        await prisma.$transaction([
            prisma.transaction.delete({ where: { id: transactionId } }),
            prisma.account.update({
                where: { id: tx.account_id },
                data: { balance: { increment: balanceChange } }
            })
        ]);

        await logAudit({
            userId,
            action: AuditAction.TRANSACTION_DELETE,
            entityType: 'transaction',
            entityId: tx.id,
            oldValue: {
                amount: tx.amount,
                type: tx.type,
                description: tx.description,
                accountId: tx.account_id,
                categoryId: tx.category_id
            },
            req
        });

        res.json({ message: 'Transaction deleted' });
    } catch (error) {
        next(error);
    }
};
