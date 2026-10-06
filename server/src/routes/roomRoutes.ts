import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as ctrl from '../controllers/roomController';

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

router.get('/', ctrl.list);
router.get('/:id/activity', ctrl.getActivity);
router.get('/:id', ctrl.getById);

router.post('/', authenticate, authorize('admin', 'manager'), writeRateLimiter, ctrl.create);
router.patch('/:id', authenticate, authorize('admin', 'manager'), writeRateLimiter, ctrl.update);

export default router;
