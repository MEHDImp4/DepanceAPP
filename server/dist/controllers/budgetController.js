"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBudget = exports.updateBudget = exports.createBudget = exports.getBudgets = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const money_1 = require("../utils/money");
const getBudgets = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const budgets = await prisma_1.default.budget.findMany({
            where: { user_id: userId },
            include: { category: true }
        });
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
            }
            const aggregations = await prisma_1.default.transaction.aggregate({
                _sum: { amount: true },
                where: whereClause
            });
            return {
                ...budget,
                amount: (0, money_1.fromCents)(budget.amount),
                spent: (0, money_1.fromCents)(aggregations._sum.amount || 0)
            };
        }));
        res.json(budgetsWithSpent);
    }
    catch (error) {
        next(error);
    }
};
exports.getBudgets = getBudgets;
const createBudget = async (req, res, next) => {
    try {
        const { amount, period, category_id } = req.body;
        const userId = req.user.userId;
        const existing = await prisma_1.default.budget.findFirst({
            where: {
                user_id: userId,
                category_id: category_id || null
            }
        });
        if (existing) {
            res.status(400).json({ error: 'Budget already exists for this category' });
            return;
        }
        const budget = await prisma_1.default.budget.create({
            data: {
                amount: (0, money_1.toCents)(amount),
                period: period || 'monthly',
                category_id: category_id || null,
                user_id: userId
            }
        });
        res.status(201).json({ ...budget, amount: (0, money_1.fromCents)(budget.amount) });
    }
    catch (error) {
        next(error);
    }
};
exports.createBudget = createBudget;
const updateBudget = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amount, period } = req.body;
        const userId = req.user.userId;
        const result = await prisma_1.default.budget.updateMany({
            where: { id: parseInt(id), user_id: userId },
            data: {
                ...(amount !== undefined && { amount: (0, money_1.toCents)(amount) }),
                ...(period && { period })
            }
        });
        if (result.count === 0) {
            res.status(404).json({ error: 'Budget not found' });
            return;
        }
        res.json({ message: 'Budget updated' });
    }
    catch (error) {
        next(error);
    }
};
exports.updateBudget = updateBudget;
const deleteBudget = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const result = await prisma_1.default.budget.deleteMany({
            where: { id: parseInt(id), user_id: userId }
        });
        if (result.count === 0) {
            res.status(404).json({ error: 'Budget not found' });
            return;
        }
        res.json({ message: 'Budget deleted' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteBudget = deleteBudget;
//# sourceMappingURL=budgetController.js.map