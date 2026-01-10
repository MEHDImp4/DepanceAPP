"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTransaction = exports.getTransaction = exports.getTransactions = exports.createTransaction = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const money_1 = require("../utils/money");
const currencyService_1 = require("../utils/currencyService");
const createTransaction = async (req, res, next) => {
    try {
        const { amount, description, type, account_id, category_id } = req.body;
        const userId = req.user.userId;
        const account = await prisma_1.default.account.findFirst({
            where: { id: account_id, user_id: userId }
        });
        if (!account) {
            res.status(404).json({ error: 'Account not found' });
            return;
        }
        if (category_id) {
            const category = await prisma_1.default.category.findFirst({
                where: { id: category_id, user_id: userId }
            });
            if (!category) {
                res.status(403).json({ error: 'Invalid category or access denied' });
                return;
            }
        }
        const transactionAmount = (0, money_1.toCents)(amount);
        const balanceChange = type === 'income' ? transactionAmount : -transactionAmount;
        const [transaction, updatedAccount] = await prisma_1.default.$transaction([
            prisma_1.default.transaction.create({
                data: {
                    amount: transactionAmount,
                    description,
                    type,
                    account_id,
                    user_id: userId,
                    category_id: category_id || null
                }
            }),
            prisma_1.default.account.update({
                where: { id: account_id },
                data: { balance: { increment: balanceChange } }
            })
        ]);
        res.status(201).json({
            transaction: { ...transaction, amount: (0, money_1.fromCents)(transaction.amount) },
            newBalance: (0, money_1.fromCents)(updatedAccount.balance)
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createTransaction = createTransaction;
const getTransactions = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { accountId } = req.query;
        const [user, transactions, rates] = await Promise.all([
            prisma_1.default.user.findUnique({ where: { id: userId }, select: { currency: true } }),
            prisma_1.default.transaction.findMany({
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
            (0, currencyService_1.getRates)()
        ]);
        const targetCurrency = user?.currency || 'USD';
        const txsWithConversion = transactions.map((tx) => {
            try {
                const sourceCurrency = tx.account?.currency || 'USD';
                const convertedAmountCents = (0, currencyService_1.calculateExchange)(tx.amount, sourceCurrency, targetCurrency, rates);
                return {
                    ...tx,
                    amount: (0, money_1.fromCents)(tx.amount),
                    convertedAmount: (0, money_1.fromCents)(convertedAmountCents),
                    convertedCurrency: targetCurrency
                };
            }
            catch (err) {
                console.error(`Conversion error for tx ${tx.id}:`, err.message);
                return {
                    ...tx,
                    amount: (0, money_1.fromCents)(tx.amount),
                    convertedAmount: (0, money_1.fromCents)(tx.amount),
                    convertedCurrency: tx.account?.currency || 'USD'
                };
            }
        });
        res.json(txsWithConversion);
    }
    catch (error) {
        next(error);
    }
};
exports.getTransactions = getTransactions;
const getTransaction = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const transaction = await prisma_1.default.transaction.findFirst({
            where: { id: parseInt(id), user_id: userId },
            include: { account: true, category: true }
        });
        if (!transaction) {
            res.status(404).json({ error: 'Transaction not found' });
            return;
        }
        res.json({ ...transaction, amount: (0, money_1.fromCents)(transaction.amount) });
    }
    catch (error) {
        next(error);
    }
};
exports.getTransaction = getTransaction;
const deleteTransaction = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const tx = await prisma_1.default.transaction.findFirst({
            where: { id: parseInt(id), user_id: userId }
        });
        if (!tx) {
            res.status(404).json({ error: 'Transaction not found' });
            return;
        }
        const balanceChange = tx.type === 'income' ? -tx.amount : tx.amount;
        await prisma_1.default.$transaction([
            prisma_1.default.transaction.delete({ where: { id: parseInt(id) } }),
            prisma_1.default.account.update({
                where: { id: tx.account_id },
                data: { balance: { increment: balanceChange } }
            })
        ]);
        res.json({ message: 'Transaction deleted' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteTransaction = deleteTransaction;
//# sourceMappingURL=transactionController.js.map