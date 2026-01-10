const express = require('express');
const router = express.Router();
const recurringController = require('../controllers/recurringController');
const authenticateToken = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createRecurringSchema, idParamSchema } = require('../validations/schemas');

router.use(authenticateToken);

router.get('/', recurringController.getRecurring);
router.post('/', validate(createRecurringSchema), recurringController.createRecurring);
router.delete('/:id', validate(idParamSchema), recurringController.deleteRecurring);

// Special endpoint to trigger processing manually or on load
router.post('/process', recurringController.processRecurring);

module.exports = router;
