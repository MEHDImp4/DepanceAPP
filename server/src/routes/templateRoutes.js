const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { createTemplateSchema, updateTemplateSchema, idParamSchema } = require('../validations/schemas');

router.use(authMiddleware);

router.post('/', validate(createTemplateSchema), templateController.createTemplate);
router.get('/', templateController.getTemplates);
router.put('/:id', validate(updateTemplateSchema), templateController.updateTemplate);
router.delete('/:id', validate(idParamSchema), templateController.deleteTemplate);

module.exports = router;
