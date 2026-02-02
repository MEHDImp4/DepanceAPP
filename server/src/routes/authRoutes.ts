import { Router } from 'express';
import * as authController from '../controllers/authController';
import authMiddleware from '../middleware/authMiddleware';
import validate from '../middleware/validate';
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from '../validations/schemas';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, validate(updateProfileSchema), authController.updateProfile);
router.post('/change-password', authMiddleware, validate(changePasswordSchema), authController.changePassword);
router.get('/login-history', authMiddleware, authController.getLoginHistory);
router.get('/security-alerts', authMiddleware, authController.getSecurityAlerts);

export default router;
