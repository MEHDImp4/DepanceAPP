const prisma = require('../utils/prisma');
const { toCents, fromCents } = require('../utils/money');

exports.getBudgets = async (req, res) => {
    try {
        const userId = req.user.userId;
        const budgets = await prisma.budget.findMany({
            where: { user_id: userId },
            include: { category: true }
        });

        // Calculate spent amount for the current month for each budget
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const budgetsWithSpent = await Promise.all(budgets.map(async (budget) => {
            const whereClause = {
                user_id: userId,
                created_at: { gte: startOfMonth },
                type: 'expense'
            };

            if (budget.category_id) {
                whereClause.category_id = budget.category_id;
            } else {
                // Global budget: all expenses
            }

            const aggregations = await prisma.transaction.aggregate({
                _sum: { amount: true },
                where: whereClause
            });

            return {
                ...budget,
                amount: fromCents(budget.amount),
                spent: fromCents(aggregations._sum.amount || 0)
            };
        }));

        res.json(budgetsWithSpent);
    } catch (error) {
        next(error);
    }
};

exports.createBudget = async (req, res) => {
    try {
        const { amount, period, category_id } = req.body;
        const userId = req.user.userId;

        // Check if budget already exists for this category
        const existing = await prisma.budget.findFirst({
            where: {
                user_id: userId,
                category_id: category_id ? parseInt(category_id) : null
            }
        });

        if (existing) {
            return res.status(400).json({ error: 'Budget already exists for this category' });
        }

        const budget = await prisma.budget.create({
            data: {
                amount: toCents(amount),
                period: period || 'monthly',
                category_id: category_id ? parseInt(category_id) : null,
                user_id: userId
            }
        });
        const responseCtx = { ...budget, amount: fromCents(budget.amount) };
        res.status(201).json(responseCtx);
    } catch (error) {
        next(error);
    }
};

exports.updateBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, period } = req.body;
        const userId = req.user.userId;

        const budget = await prisma.budget.updateMany({
            where: { id: parseInt(id), user_id: userId },
            data: { amount: toCents(amount), period }
        });

        if (budget.count === 0) return res.status(404).json({ error: 'Budget not found' });
        res.json({ message: 'Budget updated' });
    } catch (error) {
        next(error);
    }
};

exports.deleteBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const budget = await prisma.budget.deleteMany({
            where: { id: parseInt(id), user_id: userId }
        });

        if (budget.count === 0) return res.status(404).json({ error: 'Budget not found' });
        res.json({ message: 'Budget deleted' });
    } catch (error) {
        next(error);
    }
};
