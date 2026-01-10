"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processRecurring = exports.deleteRecurring = exports.createRecurring = exports.getRecurring = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const money_1 = require("../utils/money");
const MAX_RECURRING_LOOPS = 12;
const getRecurring = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const recurring = await prisma_1.default.recurringTransaction.findMany({
            where: { user_id: userId },
            include: { category: true, account: true },
            orderBy: { created_at: 'desc' }
        });
        const recurringWithFloat = recurring.map(r => ({ ...r, amount: (0, money_1.fromCents)(r.amount) }));
        res.json(recurringWithFloat);
    }
    catch (error) {
        next(error);
    }
};
exports.getRecurring = getRecurring;
const createRecurring = async (req, res, next) => {
    try {
        const { amount, description, type, interval, start_date, account_id, category_id } = req.body;
        const userId = req.user.userId;
        // SECURITY: Verify account ownership to prevent IDOR
        const account = await prisma_1.default.account.findFirst({
            where: { id: account_id, user_id: userId }
        });
        if (!account) {
            res.status(404).json({ error: 'Account not found' });
            return;
        }
        // Verify category ownership if provided
        if (category_id) {
            const category = await prisma_1.default.category.findFirst({
                where: { id: category_id, user_id: userId }
            });
            if (!category) {
                res.status(403).json({ error: 'Invalid category or access denied' });
                return;
            }
        }
        const recurring = await prisma_1.default.recurringTransaction.create({
            data: {
                amount: (0, money_1.toCents)(amount),
                description,
                type,
                interval,
                next_run_date: new Date(start_date || new Date()),
                account_id,
                category_id: category_id || null,
                user_id: userId
            }
        });
        res.status(201).json({ ...recurring, amount: (0, money_1.fromCents)(recurring.amount) });
    }
    catch (error) {
        next(error);
    }
};
exports.createRecurring = createRecurring;
const deleteRecurring = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        await prisma_1.default.recurringTransaction.deleteMany({
            where: { id: parseInt(id), user_id: userId }
        });
        res.json({ message: 'Deleted' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteRecurring = deleteRecurring;
async function processRuleCycles(rule, userId, now) {
    const nextDate = new Date(rule.next_run_date);
    const createdTransactions = [];
    let safetyCounter = 0;
    while (nextDate <= now && safetyCounter < MAX_RECURRING_LOOPS) {
        const balanceChange = rule.type === 'income' ? rule.amount : -rule.amount;
        const [tx] = await prisma_1.default.$transaction([
            prisma_1.default.transaction.create({
                data: {
                    amount: rule.amount,
                    description: `${rule.description} (Auto)`,
                    type: rule.type,
                    account_id: rule.account_id,
                    category_id: rule.category_id,
                    user_id: userId,
                    created_at: new Date(nextDate)
                }
            }),
            prisma_1.default.account.update({
                where: { id: rule.account_id },
                data: { balance: { increment: balanceChange } }
            })
        ]);
        createdTransactions.push({ id: tx.id, amount: tx.amount });
        if (rule.interval === 'weekly')
            nextDate.setDate(nextDate.getDate() + 7);
        else if (rule.interval === 'monthly')
            nextDate.setMonth(nextDate.getMonth() + 1);
        else if (rule.interval === 'yearly')
            nextDate.setFullYear(nextDate.getFullYear() + 1);
        safetyCounter++;
    }
    if (createdTransactions.length > 0) {
        await prisma_1.default.recurringTransaction.update({
            where: { id: rule.id },
            data: { next_run_date: nextDate }
        });
    }
    return createdTransactions;
}
const processRecurring = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const now = new Date();
        const dueRules = await prisma_1.default.recurringTransaction.findMany({
            where: {
                user_id: userId,
                active: true,
                next_run_date: { lte: now }
            }
        });
        const results = await Promise.all(dueRules.map(rule => processRuleCycles(rule, userId, now)));
        const createdTransactions = results.flat();
        const txsWithFloat = createdTransactions.map(tx => ({ ...tx, amount: (0, money_1.fromCents)(tx.amount) }));
        res.json({ processed: txsWithFloat.length, transactions: txsWithFloat });
    }
    catch (error) {
        next(error);
    }
};
exports.processRecurring = processRecurring;
//# sourceMappingURL=recurringController.js.map