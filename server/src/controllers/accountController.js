const prisma = require('../utils/prisma');

exports.createAccount = async (req, res) => {
    try {
        const { name, type, balance } = req.body;
        const userId = req.user.userId;

        const account = await prisma.account.create({
            data: {
                name,
                type: type || 'normal',
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
        const { name, type } = req.body;
        const userId = req.user.userId;

        // Verify ownership
        const account = await prisma.account.findFirst({ where: { id: parseInt(id), user_id: userId } });
        if (!account) return res.status(404).json({ error: 'Account not found' });

        const updated = await prisma.account.update({
            where: { id: parseInt(id) },
            data: { name, type }
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
