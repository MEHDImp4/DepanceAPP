const express = require('express');
const router = express.Router();
const recurringController = require('../controllers/recurringController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', recurringController.getRecurring);
router.post('/', recurringController.createRecurring);
router.delete('/:id', recurringController.deleteRecurring);

// Special endpoint to trigger processing manually or on load
router.post('/process', recurringController.processRecurring);

module.exports = router;
