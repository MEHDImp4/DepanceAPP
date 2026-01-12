import { Router } from 'express';
import * as goalController from '../controllers/goalController';
import authMiddleware from '../middleware/authMiddleware';
import validate from '../middleware/validate';
import { createGoalSchema, updateGoalSchema, idParamSchema } from '../validations/schemas';

const router = Router();

router.use(authMiddleware);

router.get('/', goalController.getGoals);
router.post('/', validate(createGoalSchema), goalController.createGoal);
router.put('/:id', validate(updateGoalSchema), goalController.updateGoal);
router.delete('/:id', validate(idParamSchema), goalController.deleteGoal);

export default router;
