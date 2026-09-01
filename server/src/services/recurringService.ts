import prisma from '../utils/prisma';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';

const MAX_RECURRING_LOOPS = 12;

interface RecurringRule {
    id: number;
    amount: number;
    description: string;
    type: string;
    interval: string;
    next_run_date: Date;
    account_id: number;
    category_id: number | null;
    user_id: number;
}

export const processDueTransactions = async (userId?: number) => {
    const now = new Date();

    // Build query conditions
    const whereCondition: any = {
        active: true,
        next_run_date: { lte: now }
    };

    if (userId) {
        whereCondition.user_id = userId;
    }

    const dueRules = await prisma.recurringTransaction.findMany({
        where: whereCondition
    });

    logger.info(`Found ${dueRules.length} due recurring transactions to process${userId ? ` for user ${userId}` : ''}`);

    const results = await Promise.all(
        dueRules.map(rule => processRuleCycles(rule as unknown as RecurringRule, now))
    );

    const createdTransactions = results.flat();
    return createdTransactions;
};

async function processRuleCycles(
    rule: RecurringRule,
    now: Date
): Promise<{ id: number; amount: number }[]> {
    const nextDate = new Date(rule.next_run_date);
    const createdTransactions: { id: number; amount: number }[] = [];
    let safetyCounter = 0;

    // While the next date is in the past, keep processing cycles
    while (nextDate <= now && safetyCounter < MAX_RECURRING_LOOPS) {
        const balanceChange = rule.type === 'income' ? rule.amount : -rule.amount;

        try {
            const tx = await prisma.$transaction(async (database) => {
                await database.recurringOccurrence.create({
                    data: { recurring_rule_id: rule.id, scheduled_at: new Date(nextDate) }
                });
                const transaction = await database.transaction.create({
                    data: {
                        amount: rule.amount,
                        description: `${rule.description} (Auto)`,
                        type: rule.type,
                        account_id: rule.account_id,
                        category_id: rule.category_id,
                        user_id: rule.user_id,
                        created_at: new Date(nextDate) // Use the theoretical date it should have run
                    }
                });
                await database.account.update({
                    where: { id: rule.account_id },
                    data: { balance: { increment: balanceChange } }
                });
                return transaction;
            });

            createdTransactions.push({ id: tx.id, amount: tx.amount });
            logger.info(`Processed recurring transaction ${rule.id} for date ${nextDate.toISOString()}`);

        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                logger.info(`Recurring transaction ${rule.id} for ${nextDate.toISOString()} was already processed`);
            } else {
            logger.error(`Failed to process recurring rule ${rule.id}:`, error);
                break;
            }
        }

        // Advance date
        if (rule.interval === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
        else if (rule.interval === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        else if (rule.interval === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

        safetyCounter++;
    }

    // Update the rule with the new next_run_date
    if (createdTransactions.length > 0 || safetyCounter > 0) {
        await prisma.recurringTransaction.update({
            where: { id: rule.id },
            data: { next_run_date: nextDate }
        });
    }

    return createdTransactions;
}
