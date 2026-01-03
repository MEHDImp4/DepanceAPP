const prisma = require('../utils/prisma');
const { convertCurrency } = require('../utils/currencyService');

exports.getSummary = async (req, res) => {
    try {
        const userId = req.user.userId;
        const [user, accounts] = await Promise.all([
            await prisma.user.findUnique({ where: { id: userId } }),
            await prisma.account.findMany({ where: { user_id: userId } })
        ]);

        const amounts = await Promise.all(accounts.map(acc =>
            convertCurrency(acc.balance, acc.currency, targetCurrency)
        ));

        const totalBalance = amounts.reduce((sum, amount) => sum + amount, 0);

        res.json({ totalBalance, currency: targetCurrency, accountCount: accounts.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createAccount = async (req, res) => {
    try {
        const { name, type, balance, currency } = req.body;
        const userId = req.user.userId;

        const account = await prisma.account.create({
            data: {
                name,
                type: type || 'normal',
                currency: currency || 'USD',
                balance: parseFloat(balance) || 0,
                user_id: userId
            }
        });

        res.status(201).json(account);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAccounts = async (req, res) => {
    try {
        const userId = req.user.userId;
        const accounts = await prisma.account.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'asc' }
        });
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, currency } = req.body;
        const userId = req.user.userId;

        // Verify ownership
        const account = await prisma.account.findFirst({ where: { id: parseInt(id), user_id: userId } });
        if (!account) return res.status(404).json({ error: 'Account not found' });

        const updated = await prisma.account.update({
            where: { id: parseInt(id) },
            data: { name, type, currency }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const account = await prisma.account.findFirst({ where: { id: parseInt(id), user_id: userId } });
        if (!account) return res.status(404).json({ error: 'Account not found' });

        if (account.balance !== 0) {
            return res.status(400).json({ error: 'Cannot delete account with non-zero balance' });
        }

        await prisma.account.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Account deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
