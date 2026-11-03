import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { login, logout, me } from '../controllers/authController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many login attempts, please try again later' },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
});

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, me);

export default router;
