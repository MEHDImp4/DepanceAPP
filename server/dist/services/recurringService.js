"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processDueTransactions = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const logger_1 = __importDefault(require("../utils/logger"));
const MAX_RECURRING_LOOPS = 12;
const processDueTransactions = async (userId) => {
    const now = new Date();
    // Build query conditions
    const whereCondition = {
        active: true,
        next_run_date: { lte: now }
    };
    if (userId) {
        whereCondition.user_id = userId;
    }
    const dueRules = await prisma_1.default.recurringTransaction.findMany({
        where: whereCondition
    });
    logger_1.default.info(`Found ${dueRules.length} due recurring transactions to process${userId ? ` for user ${userId}` : ''}`);
    const results = await Promise.all(dueRules.map(rule => processRuleCycles(rule, now)));
    const createdTransactions = results.flat();
    return createdTransactions;
};
exports.processDueTransactions = processDueTransactions;
async function processRuleCycles(rule, now) {
    const nextDate = new Date(rule.next_run_date);
    const createdTransactions = [];
    let safetyCounter = 0;
    // While the next date is in the past, keep processing cycles
    while (nextDate <= now && safetyCounter < MAX_RECURRING_LOOPS) {
        const balanceChange = rule.type === 'income' ? rule.amount : -rule.amount;
        try {
            const results = await prisma_1.default.$transaction([
                prisma_1.default.transaction.create({
                    data: {
                        amount: rule.amount,
                        description: `${rule.description} (Auto)`,
                        type: rule.type,
                        account_id: rule.account_id,
                        category_id: rule.category_id,
                        user_id: rule.user_id,
                        created_at: new Date(nextDate) // Use the theoretical date it should have run
                    }
                }),
                prisma_1.default.account.update({
                    where: { id: rule.account_id },
                    data: { balance: { increment: balanceChange } }
                })
            ]);
            const tx = results[0];
            createdTransactions.push({ id: tx.id, amount: tx.amount });
            logger_1.default.info(`Processed recurring transaction ${rule.id} for date ${nextDate.toISOString()}`);
        }
        catch (error) {
            logger_1.default.error(`Failed to process recurring rule ${rule.id}:`, error);
            // Break loop on error to prevent infinite retries of broken rules
            break;
        }
        // Advance date
        if (rule.interval === 'weekly')
            nextDate.setDate(nextDate.getDate() + 7);
        else if (rule.interval === 'monthly')
            nextDate.setMonth(nextDate.getMonth() + 1);
        else if (rule.interval === 'yearly')
            nextDate.setFullYear(nextDate.getFullYear() + 1);
        safetyCounter++;
    }
    // Update the rule with the new next_run_date
    if (createdTransactions.length > 0 || safetyCounter > 0) {
        await prisma_1.default.recurringTransaction.update({
            where: { id: rule.id },
            data: { next_run_date: nextDate }
        });
    }
    return createdTransactions;
}
//# sourceMappingURL=recurringService.js.map