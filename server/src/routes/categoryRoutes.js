const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authenticateToken = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createCategorySchema, updateCategorySchema, idParamSchema } = require('../validations/schemas');

router.use(authenticateToken);

router.get('/', categoryController.getCategories);
router.post('/', validate(createCategorySchema), categoryController.createCategory);
router.put('/:id', validate(updateCategorySchema), categoryController.updateCategory);
router.delete('/:id', validate(idParamSchema), categoryController.deleteCategory);

module.exports = router;
