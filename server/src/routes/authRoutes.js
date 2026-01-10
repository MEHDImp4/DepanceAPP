const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const authMiddleware = require('../middleware/authMiddleware');

const validate = require('../middleware/validate');
const { registerSchema, loginSchema, updateProfileSchema } = require('../validations/schemas');

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, validate(updateProfileSchema), authController.updateProfile);

// Security & Login History
router.get('/login-history', authMiddleware, authController.getLoginHistory);
router.get('/security-alerts', authMiddleware, authController.getSecurityAlerts);

module.exports = router;
