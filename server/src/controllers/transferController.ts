import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { convertCurrency } from '../utils/currencyService';
import { assertCurrencyAmount, toCents, fromCents } from '../utils/money';
import { runIdempotent } from '../utils/idempotency';
import { AuditAction, createAuditEntry } from '../utils/auditService';

interface CreateTransferBody {
    from_account_id: number;
    to_account_id: number;
    amount: number;
    description?: string;
}

const domainError = (message: string, statusCode: number, code: string) =>
    Object.assign(new Error(message), { statusCode, code });

export const createTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { from_account_id, to_account_id, amount, description } = req.body as CreateTransferBody;
        const userId = req.user!.userId;

        const [fromAccount, toAccount] = await Promise.all([
            prisma.account.findFirst({ where: { id: from_account_id, user_id: userId } }),
            prisma.account.findFirst({ where: { id: to_account_id, user_id: userId } })
        ]);

        if (!fromAccount || !toAccount) {
            res.status(404).json({ error: 'One or both accounts not found' });
            return;
        }
        if (fromAccount.id === toAccount.id) {
            res.status(400).json({ error: 'Cannot transfer to same account' });
            return;
        }

        assertCurrencyAmount(amount, fromAccount.currency);
        const originalAmount = toCents(amount);

        let creditedAmount = originalAmount;
        let conversionRate = 1;
        let isConversion = false;

        if (fromAccount.currency.toUpperCase() !== toAccount.currency.toUpperCase()) {
            const convertedCents = await convertCurrency(originalAmount, fromAccount.currency, toAccount.currency);
            creditedAmount = Math.round(convertedCents);
            if (!Number.isSafeInteger(creditedAmount) || creditedAmount <= 0) {
                res.status(422).json({
                    error: 'Transfer amount is too small after currency conversion',
                    code: 'TRANSFER_CONVERTED_AMOUNT_TOO_SMALL'
                });
                return;
            }
            conversionRate = creditedAmount / originalAmount;
            isConversion = true;
        }

        const transferId = randomUUID();
        const requestPayload = {
            from_account_id,
            to_account_id,
            amount,
            description: description ?? null
        };

        const result = await runIdempotent(
            userId,
            'transfer.create',
            req.get('Idempotency-Key'),
            requestPayload,
            async database => {
                const sourceEntry = await database.transaction.create({
                    data: {
                        amount: originalAmount,
                        description: description || `Transfer to ${toAccount.name} (${toAccount.currency})`,
                        type: 'expense',
                        account_id: fromAccount.id,
                        user_id: userId,
                        transfer_id: transferId
                    }
                });
                await database.account.update({
                    where: { id: fromAccount.id },
                    data: { balance: { decrement: originalAmount } }
                });

                const destinationEntry = await database.transaction.create({
                    data: {
                        amount: creditedAmount,
                        description: description || `Transfer from ${fromAccount.name} (${fromAccount.currency})${isConversion ? ` @ ${conversionRate.toFixed(6)}` : ''}`,
                        type: 'income',
                        account_id: toAccount.id,
                        user_id: userId,
                        transfer_id: transferId
                    }
                });
                await database.account.update({
                    where: { id: toAccount.id },
                    data: { balance: { increment: creditedAmount } }
                });

                await createAuditEntry(database, {
                    userId,
                    action: AuditAction.TRANSFER_CREATE,
                    entityType: 'transfer',
                    entityId: null,
                    newValue: {
                        transferId,
                        sourceTransactionId: sourceEntry.id,
                        destinationTransactionId: destinationEntry.id,
                        fromAccountId: fromAccount.id,
                        toAccountId: toAccount.id,
                        sourceAmount: originalAmount,
                        creditedAmount,
                        sourceCurrency: fromAccount.currency,
                        destinationCurrency: toAccount.currency,
                        conversionRate
                    },
                    req,
                    metadata: { transferId }
                });

                return {
                    statusCode: 201,
                    body: {
                        message: 'Transfer successful',
                        transferId,
                        sourceAmount: fromCents(originalAmount),
                        sourceCurrency: fromAccount.currency,
                        creditedAmount: fromCents(creditedAmount),
                        destinationCurrency: toAccount.currency,
                        rate: conversionRate
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

export const cancelTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const transferId = String(req.params.transferId || '').trim();
        const userId = req.user!.userId;

        if (!transferId || transferId.length > 128) {
            res.status(400).json({ error: 'Invalid transfer ID' });
            return;
        }

        await prisma.$transaction(async database => {
            const entries = await database.transaction.findMany({
                where: { transfer_id: transferId, user_id: userId },
                orderBy: { id: 'asc' }
            });

            if (entries.length === 0) {
                throw domainError('Transfer not found', 404, 'TRANSFER_NOT_FOUND');
            }

            if (
                entries.length !== 2 ||
                entries.some(entry => entry.type !== 'income' && entry.type !== 'expense') ||
                entries.filter(entry => entry.type === 'income').length !== 1 ||
                entries.filter(entry => entry.type === 'expense').length !== 1
            ) {
                throw domainError(
                    'Transfer is inconsistent and cannot be cancelled automatically',
                    409,
                    'TRANSFER_INCONSISTENT'
                );
            }

            // Claim the transfer rows before touching balances. If another request
            // already cancelled the transfer, its delete wins and this transaction
            // aborts without applying a second balance reversal.
            const deleted = await database.transaction.deleteMany({
                where: { transfer_id: transferId, user_id: userId }
            });
            if (deleted.count !== 2) {
                throw domainError(
                    'Transfer cancellation raced with another request',
                    409,
                    'TRANSFER_CANCEL_CONFLICT'
                );
            }

            for (const entry of entries) {
                const reverseBalanceChange = entry.type === 'income' ? -entry.amount : entry.amount;
                await database.account.update({
                    where: { id: entry.account_id },
                    data: { balance: { increment: reverseBalanceChange } }
                });
            }

            await createAuditEntry(database, {
                userId,
                action: AuditAction.TRANSFER_CANCEL,
                entityType: 'transfer',
                entityId: null,
                oldValue: entries.map(entry => ({
                    id: entry.id,
                    amount: entry.amount,
                    type: entry.type,
                    accountId: entry.account_id
                })),
                req,
                metadata: { transferId }
            });
        });

        res.json({ message: 'Transfer cancelled', transferId });
    } catch (error) {
        next(error);
    }
};
