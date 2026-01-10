const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createAccountSchema, updateAccountSchema, idParamSchema } = require('../validations/schemas');

router.use(authMiddleware);

router.get('/summary', accountController.getSummary);
router.post('/', validate(createAccountSchema), accountController.createAccount);
router.get('/', accountController.getAccounts);
router.put('/:id', validate(updateAccountSchema), accountController.updateAccount);
router.delete('/:id', validate(idParamSchema), accountController.deleteAccount);

module.exports = router;
