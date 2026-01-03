const prisma = require('../utils/prisma');

exports.createTransaction = async (req, res) => {
    try {
        const { amount, description, type, account_id, category_id } = req.body;
        const userId = req.user.userId;

        const account = await prisma.account.findFirst({ where: { id: parseInt(account_id), user_id: userId } });
        if (!account) return res.status(404).json({ error: 'Account not found' });

        const transactionAmount = parseFloat(amount);
        const balanceChange = type === 'income' ? transactionAmount : -transactionAmount;

        const [transaction, updatedAccount] = await prisma.$transaction([
            prisma.transaction.create({
                data: {
                    amount: transactionAmount,
                    description,
                    type,
                    account_id: parseInt(account_id),
                    user_id: userId,
                    category_id: category_id ? parseInt(category_id) : null
                }
            }),
            prisma.account.update({
                where: { id: parseInt(account_id) },
                data: { balance: { increment: balanceChange } }
            })
        ]);

        res.status(201).json({ transaction, newBalance: updatedAccount.balance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getTransactions = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { accountId } = req.query;

        const [user, transactions] = await Promise.all([
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
            })
        ]);

        const targetCurrency = user.currency || 'USD';
        const { convertCurrency } = require('../utils/currencyService');

        const txsWithConversion = await Promise.all(transactions.map(async (tx) => {
            const convertedAmount = await convertCurrency(tx.amount, tx.account?.currency || 'USD', targetCurrency);
            return {
                ...tx,
                convertedAmount,
                convertedCurrency: targetCurrency
            };
        }));

        res.json(txsWithConversion);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const tx = await prisma.transaction.findFirst({ where: { id: parseInt(id), user_id: userId } });
        if (!tx) return res.status(404).json({ error: 'Transaction not found' });

        const balanceChange = tx.type === 'income' ? -tx.amount : tx.amount; // reverse

        await prisma.$transaction([
            prisma.transaction.delete({ where: { id: parseInt(id) } }),
            prisma.account.update({
                where: { id: tx.account_id },
                data: { balance: { increment: balanceChange } }
            })
        ]);
        res.json({ message: 'Transaction deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
