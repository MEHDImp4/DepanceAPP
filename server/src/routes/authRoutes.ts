import { Router } from 'express';
import * as authController from '../controllers/authController';
import authMiddleware from '../middleware/authMiddleware';
import validate from '../middleware/validate';
import { registerSchema, loginSchema, updateProfileSchema } from '../validations/schemas';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, validate(updateProfileSchema), authController.updateProfile);

export default router;
