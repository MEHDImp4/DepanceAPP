const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.post('/', templateController.createTemplate);
router.get('/', templateController.getTemplates);

module.exports = router;
