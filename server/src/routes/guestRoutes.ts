import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as ctrl from '../controllers/guestController';

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

router.get('/', authenticate, authorize('admin', 'manager', 'front_desk'), ctrl.list);
router.get('/:slug', authenticate, authorize('admin', 'manager', 'front_desk'), ctrl.getBySlug);
router.get(
  '/:slug/stays',
  authenticate,
  authorize('admin', 'manager', 'front_desk'),
  ctrl.getStays,
);

router.post(
  '/',
  authenticate,
  authorize('admin', 'manager', 'front_desk'),
  writeRateLimiter,
  ctrl.create,
);
router.patch(
  '/:slug',
  authenticate,
  authorize('admin', 'manager', 'front_desk'),
  writeRateLimiter,
  ctrl.update,
);

export default router;
