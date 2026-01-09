const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { transactionSchema } = require('../validations/schemas');

router.use(authMiddleware);

router.post('/', validate(transactionSchema), transactionController.createTransaction);
router.get('/', transactionController.getTransactions);
router.get('/:id', transactionController.getTransaction);
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
