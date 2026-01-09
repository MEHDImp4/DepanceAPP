const prisma = require('../utils/prisma');
const { convertCurrency } = require('../utils/currencyService');
const { toCents, fromCents } = require('../utils/money');

exports.getSummary = async (req, res) => {
    try {
        const userId = req.user.userId;
        const [user, accounts] = await Promise.all([
            await prisma.user.findUnique({ where: { id: userId } }),
            await prisma.account.findMany({ where: { user_id: userId } })
        ]);

        const targetCurrency = user?.currency || 'USD';
        const amounts = await Promise.all(accounts.map(acc =>
            convertCurrency(acc.balance, acc.currency, targetCurrency)
        ));

        const totalBalanceCents = amounts.reduce((sum, amount) => sum + amount, 0);

        res.json({ totalBalance: fromCents(totalBalanceCents), currency: targetCurrency, accountCount: accounts.length });
    } catch (error) {
        next(error);
    }
};

exports.createAccount = async (req, res) => {
    try {
        const { name, type, balance, currency, color } = req.body;
        const userId = req.user.userId;

        const account = await prisma.account.create({
            data: {
                name,
                type: type || 'normal',
                color: color || 'bg-primary',
                currency: currency || 'USD',
                balance: toCents(balance),
                user_id: userId
            }
        });

        const accountResponse = { ...account, balance: fromCents(account.balance) };
        res.status(201).json(accountResponse);
    } catch (error) {
        next(error);
    }
};

exports.getAccounts = async (req, res) => {
    try {
        const userId = req.user.userId;
        const accounts = await prisma.account.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'asc' }
        });
        const accountsWithFloat = accounts.map(acc => ({
            ...acc,
            balance: fromCents(acc.balance)
        }));
        res.json(accountsWithFloat);
    } catch (error) {
        next(error);
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
        const response = { ...updated, balance: fromCents(updated.balance) };
        res.json(response);
    } catch (error) {
        next(error);
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
        next(error);
    }
};
