import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as checkoutController from '../controllers/checkoutController';

const router = Router();

const writeRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
});

router.use(authenticate);

router.get(
  '/:reservationId',
  authorize('admin', 'manager', 'front_desk'),
  checkoutController.getSession,
);
router.post(
  '/:reservationId/payments',
  authorize('admin', 'manager', 'front_desk'),
  writeRateLimiter,
  checkoutController.collectPayment,
);
router.post(
  '/:reservationId/complete',
  authorize('admin', 'manager', 'front_desk'),
  writeRateLimiter,
  checkoutController.complete,
);

export default router;
