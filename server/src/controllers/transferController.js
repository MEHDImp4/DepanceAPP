const prisma = require('../utils/prisma');
const { convertCurrency } = require('../utils/currencyService');
const { toCents, fromCents } = require('../utils/money');

exports.createTransfer = async (req, res) => {
    try {
        const { from_account_id, to_account_id, amount, description } = req.body;
        const userId = req.user.userId;

        // Verify ownership of both accounts
        const fromAccount = await prisma.account.findFirst({ where: { id: parseInt(from_account_id), user_id: userId } });
        const toAccount = await prisma.account.findFirst({ where: { id: parseInt(to_account_id), user_id: userId } });

        if (!fromAccount || !toAccount) return res.status(404).json({ error: 'One or both accounts not found' });
        if (fromAccount.id === toAccount.id) return res.status(400).json({ error: 'Cannot transfer to same account' });

        const originalAmount = toCents(amount);
        if (isNaN(originalAmount) || originalAmount <= 0) return res.status(400).json({ error: 'Invalid amount' });

        // Handle Currency Conversion
        let creditedAmount = originalAmount;
        let conversionRate = 1;
        let isConversion = false;

        if (fromAccount.currency !== toAccount.currency) {
            // convertCurrency takes cents, returns float cents
            const convertedCents = await convertCurrency(originalAmount, fromAccount.currency, toAccount.currency);
            // We must round to store as integer cents
            creditedAmount = Math.round(convertedCents);
            conversionRate = creditedAmount / originalAmount;
            isConversion = true;
        }

        const RADIX_36 = 36;
        const transferId = 'sf-' + Date.now() + '-' + Math.random().toString(RADIX_36).substr(2, 9);

        await prisma.$transaction([
            // Debit from source (in source currency)
            prisma.transaction.create({
                data: {
                    amount: originalAmount,
                    description: description || `Transfer to ${toAccount.name} (${toAccount.currency})`,
                    type: 'expense',
                    account_id: fromAccount.id,
                    user_id: userId,
                    transfer_id: transferId
                }
            }),
            prisma.account.update({
                where: { id: fromAccount.id },
                data: { balance: { decrement: originalAmount } }
            }),
            // Credit to destination (in destination currency)
            prisma.transaction.create({
                data: {
                    amount: creditedAmount,
                    description: description || `Transfer from ${fromAccount.name} (${fromAccount.currency})` + (isConversion ? ` @ ${conversionRate.toFixed(4)}` : ''),
                    type: 'income',
                    account_id: toAccount.id,
                    user_id: userId,
                    transfer_id: transferId
                }
            }),
            prisma.account.update({
                where: { id: toAccount.id },
                data: { balance: { increment: creditedAmount } }
            })
        ]);

        res.status(201).json({
            message: 'Transfer successful',
            transferId,
            creditedAmount: fromCents(creditedAmount),
            rate: conversionRate
        });
    } catch (error) {
        next(error);
    }
};
