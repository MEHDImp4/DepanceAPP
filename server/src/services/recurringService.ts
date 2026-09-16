import prisma from '../utils/prisma';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';
import { AuditAction, createAuditEntry } from '../utils/auditService';

const MAX_RECURRING_LOOPS = 12;

interface RecurringRule {
    id: number;
    amount: number;
    description: string;
    type: string;
    interval: string;
    anchor_day: number | null;
    next_run_date: Date;
    account_id: number;
    category_id: number | null;
    user_id: number;
}

const daysInMonth = (year: number, month: number): number =>
    new Date(year, month + 1, 0).getDate();

export const advanceRecurringDate = (
    currentDate: Date,
    interval: string,
    anchorDay = currentDate.getDate()
): Date => {
    const next = new Date(currentDate);

    if (interval === 'weekly') {
        next.setDate(next.getDate() + 7);
        return next;
    }

    if (interval === 'monthly') {
        next.setDate(1);
        next.setMonth(next.getMonth() + 1);
        next.setDate(Math.min(anchorDay, daysInMonth(next.getFullYear(), next.getMonth())));
        return next;
    }

    if (interval === 'yearly') {
        const month = next.getMonth();
        next.setDate(1);
        next.setFullYear(next.getFullYear() + 1);
        next.setMonth(month);
        next.setDate(Math.min(anchorDay, daysInMonth(next.getFullYear(), month)));
        return next;
    }

    throw new Error(`Unsupported recurring interval: ${interval}`);
};

export const processDueTransactions = async (userId?: number) => {
    const now = new Date();
    const whereCondition: any = {
        active: true,
        next_run_date: { lte: now }
    };

    if (userId) whereCondition.user_id = userId;

    const dueRules = await prisma.recurringTransaction.findMany({ where: whereCondition });
    logger.info(`Found ${dueRules.length} due recurring transactions to process${userId ? ` for user ${userId}` : ''}`);

    const results = await Promise.all(
        dueRules.map(rule => processRuleCycles(rule as unknown as RecurringRule, now))
    );

    return results.flat();
};

async function processRuleCycles(
    rule: RecurringRule,
    now: Date
): Promise<{ id: number; amount: number }[]> {
    let nextDate = new Date(rule.next_run_date);
    const anchorDay = rule.anchor_day ?? rule.next_run_date.getDate();
    const createdTransactions: { id: number; amount: number }[] = [];
    let safetyCounter = 0;

    while (nextDate <= now && safetyCounter < MAX_RECURRING_LOOPS) {
        const scheduledAt = new Date(nextDate);
        const balanceChange = rule.type === 'income' ? rule.amount : -rule.amount;

        try {
            const tx = await prisma.$transaction(async database => {
                await database.recurringOccurrence.create({
                    data: { recurring_rule_id: rule.id, scheduled_at: scheduledAt }
                });

                const transaction = await database.transaction.create({
                    data: {
                        amount: rule.amount,
                        description: `${rule.description} (Auto)`,
                        type: rule.type,
                        account_id: rule.account_id,
                        category_id: rule.category_id,
                        user_id: rule.user_id,
                        created_at: scheduledAt
                    }
                });

                await database.account.update({
                    where: { id: rule.account_id },
                    data: { balance: { increment: balanceChange } }
                });

                await createAuditEntry(database, {
                    userId: rule.user_id,
                    action: AuditAction.RECURRING_PROCESS,
                    entityType: 'recurring',
                    entityId: rule.id,
                    newValue: {
                        transactionId: transaction.id,
                        amount: transaction.amount,
                        type: transaction.type,
                        accountId: transaction.account_id,
                        categoryId: transaction.category_id,
                        scheduledAt: scheduledAt.toISOString()
                    },
                    metadata: { source: 'scheduler' }
                });

                return transaction;
            });

            createdTransactions.push({ id: tx.id, amount: tx.amount });
            logger.info(`Processed recurring transaction ${rule.id} for date ${scheduledAt.toISOString()}`);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                logger.info(`Recurring transaction ${rule.id} for ${scheduledAt.toISOString()} was already processed`);
            } else {
                logger.error(`Failed to process recurring rule ${rule.id}:`, error);
                break;
            }
        }

        nextDate = advanceRecurringDate(nextDate, rule.interval, anchorDay);
        safetyCounter++;
    }

    if (createdTransactions.length > 0 || safetyCounter > 0) {
        await prisma.recurringTransaction.update({
            where: { id: rule.id },
            data: {
                next_run_date: nextDate,
                anchor_day: anchorDay
            }
        });
    }

    return createdTransactions;
}
