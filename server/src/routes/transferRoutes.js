const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.post('/', transferController.createTransfer);

module.exports = router;
