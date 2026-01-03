const prisma = require('../utils/prisma');

exports.getRecurring = async (req, res) => {
    try {
        const userId = req.user.userId;
        const recurring = await prisma.recurringTransaction.findMany({
            where: { user_id: userId },
            include: { category: true, account: true },
            orderBy: { created_at: 'desc' }
        });
        res.json(recurring);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createRecurring = async (req, res) => {
    try {
        const { amount, description, type, interval, start_date, account_id, category_id } = req.body;
        const userId = req.user.userId;

        const recurring = await prisma.recurringTransaction.create({
            data: {
                amount: parseFloat(amount),
                description,
                type,
                interval,
                next_run_date: new Date(start_date || new Date()),
                account_id: parseInt(account_id),
                category_id: category_id ? parseInt(category_id) : null,
                user_id: userId
            }
        });
        res.status(201).json(recurring);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteRecurring = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        await prisma.recurringTransaction.deleteMany({
            where: { id: parseInt(id), user_id: userId }
        });
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Core Logic: Process due transactions
// Helper: Process a single recurring rule
async function processRuleCycles(rule, userId, now) {
    let nextDate = new Date(rule.next_run_date);
    const createdTransactions = [];
    let safetyCounter = 0;

    // While the next date is still in the past (handle missed cycles)
    // Limit to e.g. 12 cycles to prevent infinite loops
    const MAX_RECURRING_LOOPS = 12;
    while (nextDate <= now && safetyCounter < MAX_RECURRING_LOOPS) {
        const type = rule.type;
        const transactionAmount = rule.amount;
        const balanceChange = type === 'income' ? transactionAmount : -transactionAmount;

        const [tx, updatedAccount] = await prisma.$transaction([
            prisma.transaction.create({
                data: {
                    amount: rule.amount,
                    description: `${rule.description} (Auto)`,
                    type: rule.type,
                    account_id: rule.account_id,
                    category_id: rule.category_id,
                    user_id: userId,
                    created_at: nextDate // Backdate it to when it should have happened
                }
            }),
            prisma.account.update({
                where: { id: rule.account_id },
                data: { balance: { increment: balanceChange } }
            })
        ]);

        createdTransactions.push(tx);

        // Advance the date
        if (rule.interval === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
        else if (rule.interval === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        else if (rule.interval === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

        safetyCounter++;
    }

    // Update the rule with the new next_run_date
    if (createdTransactions.length > 0) {
        await prisma.recurringTransaction.update({
            where: { id: rule.id },
            data: { next_run_date: nextDate }
        });
    }

    return createdTransactions;
}

exports.processRecurring = async (req, res) => {
    try {
        const userId = req.user.userId;
        const now = new Date();

        // Find all active rules that look "due" (next_run_date <= now)
        const dueRules = await prisma.recurringTransaction.findMany({
            where: {
                user_id: userId,
                active: true,
                next_run_date: { lte: now }
            }
        });

        const results = await Promise.all(dueRules.map(rule => processRuleCycles(rule, userId, now)));
        const createdTransactions = results.flat();

        res.json({ processed: createdTransactions.length, transactions: createdTransactions });
    } catch (error) {
        // console.error("Auto-process error:", error);
        res.status(500).json({ error: error.message });
    }
};
