import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { convertCurrency } from '../utils/currencyService';
import { toCents, fromCents } from '../utils/money';
import { runIdempotent } from '../utils/idempotency';

interface CreateTransferBody {
    from_account_id: number;
    to_account_id: number;
    amount: number;
    description?: string;
}

const RADIX_36 = 36;

export const createTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { from_account_id, to_account_id, amount, description } = req.body as CreateTransferBody;
        const userId = req.user!.userId;

        // Verify ownership of both accounts
        const fromAccount = await prisma.account.findFirst({
            where: { id: from_account_id, user_id: userId }
        });
        const toAccount = await prisma.account.findFirst({
            where: { id: to_account_id, user_id: userId }
        });

        if (!fromAccount || !toAccount) {
            res.status(404).json({ error: 'One or both accounts not found' });
            return;
        }
        if (fromAccount.id === toAccount.id) {
            res.status(400).json({ error: 'Cannot transfer to same account' });
            return;
        }

        const originalAmount = toCents(amount);
        if (isNaN(originalAmount) || originalAmount <= 0) {
            res.status(400).json({ error: 'Invalid amount' });
            return;
        }

        // Handle Currency Conversion
        let creditedAmount = originalAmount;
        let conversionRate = 1;
        let isConversion = false;

        if (fromAccount.currency.toUpperCase() !== toAccount.currency.toUpperCase()) {
            const convertedCents = await convertCurrency(originalAmount, fromAccount.currency, toAccount.currency);
            creditedAmount = Math.round(convertedCents);
            conversionRate = creditedAmount / originalAmount;
            isConversion = true;
        }

        const transferId = 'sf-' + Date.now() + '-' + Math.random().toString(RADIX_36).substr(2, 9);

        const result = await runIdempotent(userId, 'transfer.create', req.get('Idempotency-Key'), async database => {
            // Debit from source
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
            // Credit to destination
            await database.transaction.create({
                data: {
                    amount: creditedAmount,
                    description: description || `Transfer from ${fromAccount.name} (${fromAccount.currency})` + (isConversion ? ` @ ${conversionRate.toFixed(4)}` : ''),
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

        if (result.replayed) res.set('Idempotency-Replayed', 'true');
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
};
