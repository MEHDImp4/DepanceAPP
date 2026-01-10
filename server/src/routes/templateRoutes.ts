import { Router } from 'express';
import * as templateController from '../controllers/templateController';
import authMiddleware from '../middleware/authMiddleware';
import validate from '../middleware/validate';
import { createTemplateSchema, updateTemplateSchema, idParamSchema } from '../validations/schemas';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createTemplateSchema), templateController.createTemplate);
router.get('/', templateController.getTemplates);
router.put('/:id', validate(updateTemplateSchema), templateController.updateTemplate);
router.delete('/:id', validate(idParamSchema), templateController.deleteTemplate);

export default router;
