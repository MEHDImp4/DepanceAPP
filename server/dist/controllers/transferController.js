"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransfer = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const currencyService_1 = require("../utils/currencyService");
const money_1 = require("../utils/money");
const RADIX_36 = 36;
const createTransfer = async (req, res, next) => {
    try {
        const { from_account_id, to_account_id, amount, description } = req.body;
        const userId = req.user.userId;
        // Verify ownership of both accounts
        const fromAccount = await prisma_1.default.account.findFirst({
            where: { id: from_account_id, user_id: userId }
        });
        const toAccount = await prisma_1.default.account.findFirst({
            where: { id: to_account_id, user_id: userId }
        });
        if (!fromAccount || !toAccount) {
            res.status(404).json({ error: 'One or both accounts not found' });
            return;
        }
        if (fromAccount.id === toAccount.id) {
            res.status(400).json({ error: 'Cannot transfer to same account' });
            return;
        }
        const originalAmount = (0, money_1.toCents)(amount);
        if (isNaN(originalAmount) || originalAmount <= 0) {
            res.status(400).json({ error: 'Invalid amount' });
            return;
        }
        // Handle Currency Conversion
        let creditedAmount = originalAmount;
        let conversionRate = 1;
        let isConversion = false;
        if (fromAccount.currency !== toAccount.currency) {
            const convertedCents = await (0, currencyService_1.convertCurrency)(originalAmount, fromAccount.currency, toAccount.currency);
            creditedAmount = Math.round(convertedCents);
            conversionRate = creditedAmount / originalAmount;
            isConversion = true;
        }
        const transferId = 'sf-' + Date.now() + '-' + Math.random().toString(RADIX_36).substr(2, 9);
        await prisma_1.default.$transaction([
            // Debit from source
            prisma_1.default.transaction.create({
                data: {
                    amount: originalAmount,
                    description: description || `Transfer to ${toAccount.name} (${toAccount.currency})`,
                    type: 'expense',
                    account_id: fromAccount.id,
                    user_id: userId,
                    transfer_id: transferId
                }
            }),
            prisma_1.default.account.update({
                where: { id: fromAccount.id },
                data: { balance: { decrement: originalAmount } }
            }),
            // Credit to destination
            prisma_1.default.transaction.create({
                data: {
                    amount: creditedAmount,
                    description: description || `Transfer from ${fromAccount.name} (${fromAccount.currency})` + (isConversion ? ` @ ${conversionRate.toFixed(4)}` : ''),
                    type: 'income',
                    account_id: toAccount.id,
                    user_id: userId,
                    transfer_id: transferId
                }
            }),
            prisma_1.default.account.update({
                where: { id: toAccount.id },
                data: { balance: { increment: creditedAmount } }
            })
        ]);
        res.status(201).json({
            message: 'Transfer successful',
            transferId,
            creditedAmount: (0, money_1.fromCents)(creditedAmount),
            rate: conversionRate
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createTransfer = createTransfer;
//# sourceMappingURL=transferController.js.map