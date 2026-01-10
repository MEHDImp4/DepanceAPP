import { Router } from 'express';
import * as transferController from '../controllers/transferController';
import authMiddleware from '../middleware/authMiddleware';
import validate from '../middleware/validate';
import { createTransferSchema } from '../validations/schemas';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createTransferSchema), transferController.createTransfer);

export default router;
