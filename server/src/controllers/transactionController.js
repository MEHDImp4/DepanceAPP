const prisma = require('../utils/prisma');

exports.createTransaction = async (req, res) => {
    try {
        const { amount, description, type, account_id } = req.body;
        const userId = req.user.userId;

        const account = await prisma.account.findFirst({ where: { id: parseInt(account_id), user_id: userId } });
        if (!account) return res.status(404).json({ error: 'Account not found' });

        const val = parseFloat(amount);
        const balanceChange = type === 'income' ? val : -val;

        const [transaction, updatedAccount] = await prisma.$transaction([
            prisma.transaction.create({
                data: {
                    amount: val,
                    description,
                    type,
                    account_id: parseInt(account_id),
                    user_id: userId
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

        const where = { user_id: userId };
        if (accountId) where.account_id = parseInt(accountId);

        const transactions = await prisma.transaction.findMany({
            where,
            orderBy: { created_at: 'desc' },
            include: { account: { select: { name: true } } }
        });
        res.json(transactions);
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
