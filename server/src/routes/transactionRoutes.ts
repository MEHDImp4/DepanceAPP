import { Router } from 'express';
import * as transactionController from '../controllers/transactionController';
import authMiddleware from '../middleware/authMiddleware';
import validate from '../middleware/validate';
import { transactionSchema, idParamSchema } from '../validations/schemas';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(transactionSchema), transactionController.createTransaction);
router.get('/', transactionController.getTransactions);
router.get('/:id', validate(idParamSchema), transactionController.getTransaction);
router.delete('/:id', validate(idParamSchema), transactionController.deleteTransaction);

export default router;
