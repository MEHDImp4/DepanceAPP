import prisma from '../utils/prisma';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';
import { AuditAction, createAuditEntry } from '../utils/auditService';
import { getCachedRates, serializeRatesSnapshot } from '../utils/currencyService';
import { getZonedParts, normalizeTimeZone, zonedDateTimeToUtc } from '../utils/reportingTime';

const MAX_RECURRING_LOOPS = 12;

interface RecurringRule {
    id: number;
    amount: number;
    description: string;
    type: string;
    interval: string;
    anchor_day: number | null;
    timezone: string;
    next_run_date: Date;
    account_id: number;
    category_id: number | null;
    user_id: number;
}

const daysInMonth = (year: number, monthOneBased: number): number =>
    new Date(Date.UTC(year, monthOneBased, 0)).getUTCDate();

export const advanceRecurringDate = (
    currentDate: Date,
    interval: string,
    anchorDay?: number,
    timeZone = 'UTC'
): Date => {
    const zone = normalizeTimeZone(timeZone);
    const parts = getZonedParts(currentDate, zone);
    const anchor = anchorDay ?? parts.day;

    let targetYear = parts.year;
    let targetMonth = parts.month;
    let targetDay = parts.day;

    if (interval === 'weekly') {
        const calendar = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
        calendar.setUTCDate(calendar.getUTCDate() + 7);
        targetYear = calendar.getUTCFullYear();
        targetMonth = calendar.getUTCMonth() + 1;
        targetDay = calendar.getUTCDate();
    } else if (interval === 'monthly') {
        const nextMonth = new Date(Date.UTC(parts.year, parts.month, 1));
        targetYear = nextMonth.getUTCFullYear();
        targetMonth = nextMonth.getUTCMonth() + 1;
        targetDay = Math.min(anchor, daysInMonth(targetYear, targetMonth));
    } else if (interval === 'yearly') {
        targetYear = parts.year + 1;
        targetDay = Math.min(anchor, daysInMonth(targetYear, targetMonth));
    } else {
        throw new Error(`Unsupported recurring interval: ${interval}`);
    }

    return zonedDateTimeToUtc(
        targetYear,
        targetMonth,
        targetDay,
        parts.hour,
        parts.minute,
        parts.second,
        zone
    );
};

export const processDueTransactions = async (userId?: number) => {
    const now = new Date();
    const whereCondition: Prisma.RecurringTransactionWhereInput = {
        active: true,
        next_run_date: { lte: now }
    };

    if (userId) whereCondition.user_id = userId;

    const dueRules = await prisma.recurringTransaction.findMany({ where: whereCondition });
    logger.info(`Found ${dueRules.length} due recurring transactions to process${userId ? ` for user ${userId}` : ''}`);

    const results = await Promise.all(
        dueRules.map(rule => processRuleCycles(rule as RecurringRule, now))
    );

    return results.flat();
};

async function processRuleCycles(
    rule: RecurringRule,
    now: Date
): Promise<{ id: number; amount: number }[]> {
    let nextDate = new Date(rule.next_run_date);
    const zone = normalizeTimeZone(rule.timezone);
    const anchorDay = rule.anchor_day ?? getZonedParts(rule.next_run_date, zone).day;
    const createdTransactions: { id: number; amount: number }[] = [];
    const cachedRates = await getCachedRates();
    const fxSnapshot = cachedRates ? serializeRatesSnapshot(cachedRates) : null;
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
                        fx_rates_snapshot: fxSnapshot,
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
                        scheduledAt: scheduledAt.toISOString(),
                        timezone: zone
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

        nextDate = advanceRecurringDate(nextDate, rule.interval, anchorDay, zone);
        safetyCounter++;
    }

    if (safetyCounter > 0) {
        await prisma.recurringTransaction.update({
            where: { id: rule.id },
            data: {
                next_run_date: nextDate,
                anchor_day: anchorDay,
                timezone: zone
            }
        });
    }

    return createdTransactions;
}
