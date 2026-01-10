import { Router } from 'express';
import * as recurringController from '../controllers/recurringController';
import authMiddleware from '../middleware/authMiddleware';
import validate from '../middleware/validate';
import { createRecurringSchema, idParamSchema } from '../validations/schemas';

const router = Router();

router.use(authMiddleware);

router.get('/', recurringController.getRecurring);
router.post('/', validate(createRecurringSchema), recurringController.createRecurring);
router.delete('/:id', validate(idParamSchema), recurringController.deleteRecurring);
router.post('/process', recurringController.processRecurring);

export default router;
