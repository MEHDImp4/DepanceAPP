import { Router } from 'express';
import * as categoryController from '../controllers/categoryController';
import authMiddleware from '../middleware/authMiddleware';
import validate from '../middleware/validate';
import { createCategorySchema, updateCategorySchema, idParamSchema } from '../validations/schemas';

const router = Router();

router.use(authMiddleware);

router.get('/', categoryController.getCategories);
router.post('/', validate(createCategorySchema), categoryController.createCategory);
router.put('/:id', validate(updateCategorySchema), categoryController.updateCategory);
router.delete('/:id', validate(idParamSchema), categoryController.deleteCategory);

export default router;
