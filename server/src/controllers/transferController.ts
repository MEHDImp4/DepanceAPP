import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { convertCurrency } from '../utils/currencyService';
import { toCents, fromCents } from '../utils/money';
import { runIdempotent } from '../utils/idempotency';
import { AuditAction, logAudit, logTransferCreate } from '../utils/auditService';

interface CreateTransferBody {
    from_account_id: number;
    to_account_id: number;
    amount: number;
    description?: string;
}

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

        const originalAmount = toCents(amount);
        if (!Number.isSafeInteger(originalAmount) || originalAmount <= 0) {
            res.status(400).json({ error: 'Invalid amount' });
            return;
        }

        let creditedAmount = originalAmount;
        let conversionRate = 1;
        let isConversion = false;

        if (fromAccount.currency.toUpperCase() !== toAccount.currency.toUpperCase()) {
            const convertedCents = await convertCurrency(originalAmount, fromAccount.currency, toAccount.currency);
            creditedAmount = Math.round(convertedCents);
            conversionRate = creditedAmount / originalAmount;
            isConversion = true;
        }

        const transferId = randomUUID();

        const result = await runIdempotent(userId, 'transfer.create', req.get('Idempotency-Key'), async database => {
            await database.transaction.create({
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

            await database.transaction.create({
                data: {
                    amount: creditedAmount,
                    description: description || `Transfer from ${fromAccount.name} (${fromAccount.currency})${isConversion ? ` @ ${conversionRate.toFixed(4)}` : ''}`,
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

            return {
                statusCode: 201,
                body: {
                    message: 'Transfer successful',
                    transferId,
                    creditedAmount: fromCents(creditedAmount),
                    rate: conversionRate
                }
            };
        });

        if (result.replayed) {
            res.set('Idempotency-Replayed', 'true');
        } else {
            await logTransferCreate(userId, transferId, fromAccount.id, toAccount.id, originalAmount, req);
        }

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

        const entries = await prisma.transaction.findMany({
            where: { transfer_id: transferId, user_id: userId },
            orderBy: { id: 'asc' }
        });

        if (entries.length === 0) {
            res.status(404).json({ error: 'Transfer not found' });
            return;
        }

        if (entries.length !== 2 || entries.some(entry => entry.type !== 'income' && entry.type !== 'expense')) {
            res.status(409).json({ error: 'Transfer is inconsistent and cannot be cancelled automatically' });
            return;
        }

        await prisma.$transaction(async database => {
            for (const entry of entries) {
                const reverseBalanceChange = entry.type === 'income' ? -entry.amount : entry.amount;
                await database.account.update({
                    where: { id: entry.account_id },
                    data: { balance: { increment: reverseBalanceChange } }
                });
            }

            await database.transaction.deleteMany({
                where: { transfer_id: transferId, user_id: userId }
            });
        });

        await logAudit({
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

        res.json({ message: 'Transfer cancelled', transferId });
    } catch (error) {
        next(error);
    }
};
