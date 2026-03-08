"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processRecurring = exports.deleteRecurring = exports.createRecurring = exports.getRecurring = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const money_1 = require("../utils/money");
const recurringService = __importStar(require("../services/recurringService"));
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
const processRecurring = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const createdTransactions = await recurringService.processDueTransactions(userId);
        const txsWithFloat = createdTransactions.map(tx => ({ ...tx, amount: (0, money_1.fromCents)(tx.amount) }));
        res.json({ processed: txsWithFloat.length, transactions: txsWithFloat });
    }
    catch (error) {
        next(error);
    }
};
exports.processRecurring = processRecurring;
//# sourceMappingURL=recurringController.js.map