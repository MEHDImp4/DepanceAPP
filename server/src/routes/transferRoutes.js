const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createTransferSchema } = require('../validations/schemas');

router.use(authMiddleware);

router.post('/', validate(createTransferSchema), transferController.createTransfer);

module.exports = router;
