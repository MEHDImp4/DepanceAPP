import { Router } from 'express';
import * as accountController from '../controllers/accountController';
import authMiddleware from '../middleware/authMiddleware';
import validate from '../middleware/validate';
import { createAccountSchema, updateAccountSchema, idParamSchema } from '../validations/schemas';

const router = Router();

router.use(authMiddleware);

router.get('/summary', accountController.getSummary);
router.post('/', validate(createAccountSchema), accountController.createAccount);
router.get('/', accountController.getAccounts);
router.put('/:id', validate(updateAccountSchema), accountController.updateAccount);
router.delete('/:id', validate(idParamSchema), accountController.deleteAccount);

export default router;
