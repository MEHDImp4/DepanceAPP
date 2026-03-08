"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccount = exports.updateAccount = exports.getUserAccounts = exports.createAccount = exports.getAccountSummary = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const currencyService_1 = require("../utils/currencyService");
const money_1 = require("../utils/money");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const getAccountSummary = async (userId) => {
    const [user, accounts] = await Promise.all([
        prisma_1.default.user.findUnique({ where: { id: userId } }),
        prisma_1.default.account.findMany({ where: { user_id: userId } })
    ]);
    const targetCurrency = user?.currency || 'USD';
    const amounts = await Promise.all(accounts.map(acc => (0, currencyService_1.convertCurrency)(acc.balance, acc.currency, targetCurrency)));
    const totalBalanceCents = amounts.reduce((sum, amount) => sum + amount, 0);
    return {
        totalBalance: (0, money_1.fromCents)(totalBalanceCents),
        currency: targetCurrency,
        accountCount: accounts.length
    };
};
exports.getAccountSummary = getAccountSummary;
const createAccount = async (data) => {
    const { name, type, balance, currency, color, userId } = data;
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
    return { ...account, balance: (0, money_1.fromCents)(account.balance) };
};
exports.createAccount = createAccount;
const getUserAccounts = async (userId) => {
    const accounts = await prisma_1.default.account.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'asc' }
    });
    return accounts.map(acc => ({
        ...acc,
        balance: (0, money_1.fromCents)(acc.balance)
    }));
};
exports.getUserAccounts = getUserAccounts;
const updateAccount = async (data) => {
    const { id, userId, name, type, currency } = data;
    const account = await prisma_1.default.account.findFirst({
        where: { id, user_id: userId }
    });
    if (!account) {
        throw new Error('Account not found');
    }
    const updated = await prisma_1.default.account.update({
        where: { id },
        data: { name, type, currency }
    });
    return { ...updated, balance: (0, money_1.fromCents)(updated.balance) };
};
exports.updateAccount = updateAccount;
const deleteAccount = async (id, userId, password) => {
    if (!password) {
        throw new Error('Password is required');
    }
    const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new Error('User not found');
    }
    const isPasswordValid = await bcryptjs_1.default.compare(password, user.password_hash);
    if (!isPasswordValid) {
        throw new Error('Invalid password');
    }
    const account = await prisma_1.default.account.findFirst({
        where: { id, user_id: userId }
    });
    if (!account) {
        throw new Error('Account not found');
    }
    await prisma_1.default.account.delete({ where: { id } });
    return true;
};
exports.deleteAccount = deleteAccount;
//# sourceMappingURL=accountService.js.map