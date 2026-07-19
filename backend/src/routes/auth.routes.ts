import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '@/controllers/auth.controller';
import { validate } from '@/middleware/validate';
import { loginSchema } from '@/validators/auth.validator';
import { authenticate } from '@/middleware/auth';

const router = Router();

// Basic brute-force protection on the login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
});

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
