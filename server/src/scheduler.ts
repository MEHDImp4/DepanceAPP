import cron from 'node-cron';
import logger from './utils/logger';
import * as recurringService from './services/recurringService';
import prisma from './utils/prisma';

export const initScheduler = () => {
    logger.info('Initializing scheduler...');

    // Run every day at midnight (00:00)
    cron.schedule('0 0 * * *', async () => {
        logger.info('Running daily recurring transaction check...');
        try {
            const expiredKeys = await prisma.idempotencyKey.deleteMany({
                where: { expires_at: { lt: new Date() } }
            });
            if (expiredKeys.count > 0) logger.info(`Removed ${expiredKeys.count} expired idempotency keys.`);
            const processed = await recurringService.processDueTransactions();
            if (processed.length > 0) {
                logger.info(`Scheduler processed ${processed.length} recurring transactions.`);
            } else {
                logger.info('No due recurring transactions found.');
            }
        } catch (error) {
            logger.error('Error running daily recurring transaction job:', error);
        }
    });

    logger.info('Scheduler initialized. Jobs are running.');
};
