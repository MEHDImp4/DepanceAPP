const prisma = require('../utils/prisma');
const { toCents, fromCents } = require('../utils/money');

exports.createTransaction = async (req, res, next) => {
    try {
        const { amount, description, type, account_id, category_id } = req.body;
        const userId = req.user.userId;

        const account = await prisma.account.findFirst({ where: { id: parseInt(account_id), user_id: userId } });
        if (!account) return res.status(404).json({ error: 'Account not found' });

        if (category_id) {
            const category = await prisma.category.findFirst({ where: { id: parseInt(category_id), user_id: userId } });
            if (!category) return res.status(403).json({ error: 'Invalid category or access denied' });
        }

        const transactionAmount = toCents(amount);
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

        const responseTx = { ...transaction, amount: fromCents(transaction.amount) };
        res.status(201).json({ transaction: responseTx, newBalance: fromCents(updatedAccount.balance) });
    } catch (error) {
        next(error);
    }
};

exports.getTransactions = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { accountId } = req.query;

        // Fetch user preferences, transactions, and exchange rates in parallel
        const { getRates, calculateExchange } = require('../utils/currencyService');

        const [user, transactions, rates] = await Promise.all([
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
            }),
            getRates() // Fetch rates once
        ]);

        const targetCurrency = user?.currency || 'USD';

        // Perform synchronous conversion using the pre-fetched rates
        const txsWithConversion = transactions.map((tx) => {
            try {
                const sourceCurrency = tx.account?.currency || 'USD';

                // Use synchronous calculation
                const convertedAmountCents = calculateExchange(tx.amount, sourceCurrency, targetCurrency, rates);

                return {
                    ...tx,
                    amount: fromCents(tx.amount), // Convert stored amount to float
                    convertedAmount: fromCents(convertedAmountCents), // Convert calculated cents to float units
                    convertedCurrency: targetCurrency
                };
            } catch (err) {
                console.error(`Conversion error for tx ${tx.id}:`, err.message);
                return {
                    ...tx,
                    amount: fromCents(tx.amount),
                    convertedAmount: fromCents(tx.amount), // Fallback
                    convertedCurrency: tx.account?.currency || 'USD'
                };
            }
        });

        res.json(txsWithConversion);
    } catch (error) {
        console.error("getTransactions Error:", error);
        next(error);
    }
};

exports.getTransaction = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const transaction = await prisma.transaction.findFirst({
            where: { id: parseInt(id), user_id: userId },
            include: {
                account: true,
                category: true
            }
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        const responseTx = { ...transaction, amount: fromCents(transaction.amount) };
        res.json(responseTx);
    } catch (error) {
        console.error("getTransaction Error:", error);
        next(error);
    }
};

exports.deleteTransaction = async (req, res, next) => {
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
        next(error);
    }
};
