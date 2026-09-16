import cron from 'node-cron';
import logger from './utils/logger';
import * as recurringService from './services/recurringService';
import prisma from './utils/prisma';

const runMaintenance = async () => {
    try {
        const expiredKeys = await prisma.idempotencyKey.deleteMany({
            where: { expires_at: { lt: new Date() } }
        });
        if (expiredKeys.count > 0) {
            logger.info(`Removed ${expiredKeys.count} expired idempotency keys.`);
        }

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

    // Catch up overdue recurring rules after a restart instead of waiting until midnight.
    void runMaintenance();

    // Hourly processing limits downtime gaps while the occurrence uniqueness constraint
    // continues to protect against duplicate processing across multiple instances.
    cron.schedule('0 * * * *', runMaintenance);

    logger.info('Scheduler initialized.');
};
