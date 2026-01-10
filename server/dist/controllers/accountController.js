"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccount = exports.updateAccount = exports.getAccounts = exports.createAccount = exports.getSummary = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const currencyService_1 = require("../utils/currencyService");
const money_1 = require("../utils/money");
const getSummary = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const [user, accounts] = await Promise.all([
            prisma_1.default.user.findUnique({ where: { id: userId } }),
            prisma_1.default.account.findMany({ where: { user_id: userId } })
        ]);
        const targetCurrency = user?.currency || 'USD';
        const amounts = await Promise.all(accounts.map(acc => (0, currencyService_1.convertCurrency)(acc.balance, acc.currency, targetCurrency)));
        const totalBalanceCents = amounts.reduce((sum, amount) => sum + amount, 0);
        res.json({
            totalBalance: (0, money_1.fromCents)(totalBalanceCents),
            currency: targetCurrency,
            accountCount: accounts.length
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSummary = getSummary;
const createAccount = async (req, res, next) => {
    try {
        const { name, type, balance, currency, color } = req.body;
        const userId = req.user.userId;
        const account = await prisma_1.default.account.create({
            data: {
                name,
                type: type || 'normal',
                color: color || 'bg-primary',
                currency: currency || 'USD',
                balance: (0, money_1.toCents)(balance || 0),
                user_id: userId
            }
        });
        res.status(201).json({ ...account, balance: (0, money_1.fromCents)(account.balance) });
    }
    catch (error) {
        next(error);
    }
};
exports.createAccount = createAccount;
const getAccounts = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const accounts = await prisma_1.default.account.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'asc' }
        });
        const accountsWithFloat = accounts.map(acc => ({
            ...acc,
            balance: (0, money_1.fromCents)(acc.balance)
        }));
        res.json(accountsWithFloat);
    }
    catch (error) {
        next(error);
    }
};
exports.getAccounts = getAccounts;
const updateAccount = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, type, currency } = req.body;
        const userId = req.user.userId;
        const account = await prisma_1.default.account.findFirst({
            where: { id: parseInt(id), user_id: userId }
        });
        if (!account) {
            res.status(404).json({ error: 'Account not found' });
            return;
        }
        const updated = await prisma_1.default.account.update({
            where: { id: parseInt(id) },
            data: { name, type, currency }
        });
        res.json({ ...updated, balance: (0, money_1.fromCents)(updated.balance) });
    }
    catch (error) {
        next(error);
    }
};
exports.updateAccount = updateAccount;
const deleteAccount = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const account = await prisma_1.default.account.findFirst({
            where: { id: parseInt(id), user_id: userId }
        });
        if (!account) {
            res.status(404).json({ error: 'Account not found' });
            return;
        }
        if (account.balance !== 0) {
            res.status(400).json({ error: 'Cannot delete account with non-zero balance' });
            return;
        }
        await prisma_1.default.account.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Account deleted' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteAccount = deleteAccount;
//# sourceMappingURL=accountController.js.map