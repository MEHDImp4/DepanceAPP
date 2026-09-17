import cron from 'node-cron';
import logger from './utils/logger';
import * as recurringService from './services/recurringService';
import prisma from './utils/prisma';
import { getRates } from './utils/currencyService';

const parseRetentionDays = (value: string | undefined, fallback: number): number => {
    const parsed = Number.parseInt(value || '', 10);
    return Number.isInteger(parsed) && parsed >= 1 ? parsed : fallback;
};

const LOGIN_HISTORY_RETENTION_DAYS = parseRetentionDays(process.env.LOGIN_HISTORY_RETENTION_DAYS, 180);
const AUDIT_RETENTION_DAYS = parseRetentionDays(process.env.AUDIT_RETENTION_DAYS, 365);
const ROTATED_REFRESH_TOKEN_RETENTION_MS = 5 * 60 * 1000;

const runDataRetention = async (now: Date) => {
    const [expiredKeys, expiredRefreshTokens, oldRotatedRefreshTokens, oldLoginHistory, oldAuditLogs] = await Promise.all([
        prisma.idempotencyKey.deleteMany({
            where: { expires_at: { lt: now } }
        }),
        prisma.refreshToken.deleteMany({
            where: { expiresAt: { lt: now } }
        }),
        prisma.refreshToken.deleteMany({
            where: {
                rotatedAt: { lt: new Date(now.getTime() - ROTATED_REFRESH_TOKEN_RETENTION_MS) }
            }
        }),
        prisma.loginHistory.deleteMany({
            where: {
                createdAt: { lt: new Date(now.getTime() - LOGIN_HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000) }
            }
        }),
        prisma.auditLog.deleteMany({
            where: {
                createdAt: { lt: new Date(now.getTime() - AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000) }
            }
        })
    ]);

    const removed =
        expiredKeys.count +
        expiredRefreshTokens.count +
        oldRotatedRefreshTokens.count +
        oldLoginHistory.count +
        oldAuditLogs.count;

    if (removed > 0) {
        logger.info('Data retention cleanup completed', {
            idempotencyKeys: expiredKeys.count,
            expiredRefreshTokens: expiredRefreshTokens.count,
            rotatedRefreshTokens: oldRotatedRefreshTokens.count,
            loginHistory: oldLoginHistory.count,
            auditLogs: oldAuditLogs.count
        });
    }
};

const warmExchangeRates = async () => {
    try {
        await getRates();
    } catch (error) {
        // Financial writes must not become unavailable merely because the FX
        // provider is down. Reads that truly need uncached conversion fail safely.
        logger.warn('Unable to refresh exchange-rate cache', {
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

const runMaintenance = async () => {
    const now = new Date();

    try {
        await runDataRetention(now);
    } catch (error) {
        logger.error('Error running data-retention maintenance:', error);
    }

    await warmExchangeRates();

    try {
        const processed = await recurringService.processDueTransactions();
        if (processed.length > 0) {
            logger.info(`Scheduler processed ${processed.length} recurring transactions.`);
        }
    } catch (error) {
        logger.error('Error running recurring transaction maintenance:', error);
    }
};

export const initScheduler = () => {
    logger.info('Initializing scheduler...');

    void runMaintenance();
    cron.schedule('0 * * * *', runMaintenance);

    logger.info('Scheduler initialized.');
};
