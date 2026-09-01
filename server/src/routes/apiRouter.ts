import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import authRoutes from './authRoutes';
import accountRoutes from './accountRoutes';
import transactionRoutes from './transactionRoutes';
import transferRoutes from './transferRoutes';
import templateRoutes from './templateRoutes';
import categoryRoutes from './categoryRoutes';
import budgetRoutes from './budgetRoutes';
import recurringRoutes from './recurringRoutes';
import goalRoutes from './goalRoutes';
import analyticsRoutes from './analyticsRoutes';

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts, please try again later.' }
});

const apiRouter = Router();

apiRouter.use('/auth', authLimiter, authRoutes);
apiRouter.use('/accounts', accountRoutes);
apiRouter.use('/transactions', transactionRoutes);
apiRouter.use('/transfers', transferRoutes);
apiRouter.use('/templates', templateRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/budgets', budgetRoutes);
apiRouter.use('/recurring', recurringRoutes);
apiRouter.use('/goals', goalRoutes);
apiRouter.use('/analytics', analyticsRoutes);

export default apiRouter;
