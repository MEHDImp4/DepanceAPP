const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const authenticateToken = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createBudgetSchema, updateBudgetSchema, idParamSchema } = require('../validations/schemas');

router.use(authenticateToken);

router.get('/', budgetController.getBudgets);
router.post('/', validate(createBudgetSchema), budgetController.createBudget);
router.put('/:id', validate(updateBudgetSchema), budgetController.updateBudget);
router.delete('/:id', validate(idParamSchema), budgetController.deleteBudget);

module.exports = router;
