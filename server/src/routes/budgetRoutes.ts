import { Router } from 'express';
import * as budgetController from '../controllers/budgetController';
import authMiddleware from '../middleware/authMiddleware';
import validate from '../middleware/validate';
import { createBudgetSchema, updateBudgetSchema, idParamSchema } from '../validations/schemas';

const router = Router();

router.use(authMiddleware);

router.get('/', budgetController.getBudgets);
router.post('/', validate(createBudgetSchema), budgetController.createBudget);
router.put('/:id', validate(updateBudgetSchema), budgetController.updateBudget);
router.delete('/:id', validate(idParamSchema), budgetController.deleteBudget);

export default router;
