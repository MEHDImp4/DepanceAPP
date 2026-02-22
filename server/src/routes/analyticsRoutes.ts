import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController';
import authMiddleware from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/recap', analyticsController.getMonthlyRecap);
router.get('/spending-trends', analyticsController.getSpendingTrends);

export default router;
