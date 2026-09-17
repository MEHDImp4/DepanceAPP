import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { assertCurrencyAmount, toCents, fromCents } from '../utils/money';
import {
    getRates,
    getCachedRates,
    calculateExchange,
    parseRatesSnapshot,
    serializeRatesSnapshot
} from '../utils/currencyService';
import { runIdempotent } from '../utils/idempotency';
import { AuditAction, createAuditEntry } from '../utils/auditService';
import type { ExchangeRates } from '../types';

interface CreateTransactionBody {
    amount: number;
    description: string;
    type: 'income' | 'expense';
    account_id: number;
    category_id?: number | null;
}

const canConvert = (rates: ExchangeRates | null, fromCurrency: string, toCurrency: string) => {
    if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) return true;
    if (!rates) return false;
    return Boolean(rates[fromCurrency.toUpperCase()] && rates[toCurrency.toUpperCase()]);
};

const serializeTransaction = <T extends { amount: number; fx_rates_snapshot?: string | null }>(transaction: T) => {
    const { fx_rates_snapshot: _snapshot, ...safeTransaction } = transaction;
    return { ...safeTransaction, amount: fromCents(transaction.amount) };
};

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

        assertCurrencyAmount(amount, account.currency);
        const transactionAmount = toCents(amount);
        const balanceChange = type === 'income' ? transactionAmount : -transactionAmount;
        const requestPayload = { amount, description, type, account_id, category_id: category_id ?? null };
        const cachedRates = await getCachedRates();
        const fxSnapshot = cachedRates ? serializeRatesSnapshot(cachedRates) : null;

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
                        category_id: category_id || null,
                        fx_rates_snapshot: fxSnapshot
                    }
                });
                const updatedAccount = await database.account.update({
                    where: { id: account_id },
                    data: { balance: { increment: balanceChange } }
                });

                await createAuditEntry(database, {
                    userId,
                    action: AuditAction.TRANSACTION_CREATE,
                    entityType: 'transaction',
                    entityId: transaction.id,
                    newValue: {
                        amount: transaction.amount,
                        type: transaction.type,
                        description: transaction.description,
                        accountId: transaction.account_id,
                        categoryId: transaction.category_id
                    },
                    req
                });

                return {
                    statusCode: 201,
                    body: {
                        transaction: serializeTransaction(transaction),
                        newBalance: fromCents(updatedAccount.balance)
                    }
                };
            }
        );

        if (result.replayed) res.set('Idempotency-Replayed', 'true');
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

        const [user, transactions] = await Promise.all([
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
            })
        ]);

        const targetCurrency = (user?.currency || 'USD').toUpperCase();
        const hasMore = transactions.length > limit;
        const page = hasMore ? transactions.slice(0, limit) : transactions;

        const requiresLiveRates = page.some(tx => {
            const sourceCurrency = tx.account.currency.toUpperCase();
            if (sourceCurrency === targetCurrency) return false;
            return !canConvert(parseRatesSnapshot(tx.fx_rates_snapshot), sourceCurrency, targetCurrency);
        });
        const liveRates = requiresLiveRates ? await getRates() : null;
        const liveSnapshot = liveRates ? serializeRatesSnapshot(liveRates) : null;

        const missingSnapshotIds: number[] = [];
        const txsWithConversion = page.map(tx => {
            const sourceCurrency = tx.account.currency.toUpperCase();
            const snapshotRates = parseRatesSnapshot(tx.fx_rates_snapshot);
            const rates = canConvert(snapshotRates, sourceCurrency, targetCurrency)
                ? snapshotRates
                : liveRates;

            let convertedAmountCents = tx.amount;
            let convertedCurrency = sourceCurrency;

            if (sourceCurrency === targetCurrency) {
                convertedCurrency = targetCurrency;
            } else if (rates) {
                convertedAmountCents = Math.round(calculateExchange(tx.amount, sourceCurrency, targetCurrency, rates));
                convertedCurrency = targetCurrency;
                if (!tx.fx_rates_snapshot && liveSnapshot && !tx.transfer_id) {
                    missingSnapshotIds.push(tx.id);
                }
            }

            const { fx_rates_snapshot: _snapshot, ...safeTx } = tx;
            return {
                ...safeTx,
                amount: fromCents(tx.amount),
                convertedAmount: fromCents(convertedAmountCents),
                convertedCurrency
            };
        });

        if (missingSnapshotIds.length > 0 && liveSnapshot) {
            await prisma.transaction.updateMany({
                where: { id: { in: missingSnapshotIds }, fx_rates_snapshot: null },
                data: { fx_rates_snapshot: liveSnapshot }
            });
        }

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

        res.json(serializeTransaction(transaction));
    } catch (error) {
        next(error);
    }
};

export const deleteTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;
        const transactionId = parseInt(id as string, 10);

        await prisma.$transaction(async database => {
            const tx = await database.transaction.findFirst({
                where: { id: transactionId, user_id: userId }
            });
            if (!tx) {
                throw Object.assign(new Error('Transaction not found'), {
                    statusCode: 404,
                    code: 'TRANSACTION_NOT_FOUND'
                });
            }

            if (tx.transfer_id) {
                throw Object.assign(
                    new Error('Transfer transactions must be cancelled through the transfer endpoint'),
                    {
                        statusCode: 409,
                        code: 'TRANSFER_TRANSACTION_IMMUTABLE',
                        transferId: tx.transfer_id
                    }
                );
            }

            const deleted = await database.transaction.deleteMany({
                where: { id: transactionId, user_id: userId, transfer_id: null }
            });
            if (deleted.count !== 1) {
                throw Object.assign(new Error('Transaction deletion raced with another request'), {
                    statusCode: 409,
                    code: 'TRANSACTION_DELETE_CONFLICT'
                });
            }

            const balanceChange = tx.type === 'income' ? -tx.amount : tx.amount;
            await database.account.update({
                where: { id: tx.account_id },
                data: { balance: { increment: balanceChange } }
            });
            await createAuditEntry(database, {
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
        });

        res.json({ message: 'Transaction deleted' });
    } catch (error) {
        next(error);
    }
};
