import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as ctrl from '../controllers/reservationController';

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
router.get('/:id/folio', authenticate, authorize('admin', 'manager', 'front_desk'), ctrl.getFolio);
router.post(
  '/:id/check-in',
  authenticate,
  authorize('admin', 'manager', 'front_desk'),
  writeRateLimiter,
  ctrl.checkIn,
);
router.post(
  '/:id/notes',
  authenticate,
  authorize('admin', 'manager', 'front_desk'),
  writeRateLimiter,
  ctrl.addNote,
);
router.get('/:id', authenticate, authorize('admin', 'manager', 'front_desk'), ctrl.getById);
router.post(
  '/',
  authenticate,
  authorize('admin', 'manager', 'front_desk'),
  writeRateLimiter,
  ctrl.create,
);
router.patch(
  '/:id',
  authenticate,
  authorize('admin', 'manager', 'front_desk'),
  writeRateLimiter,
  ctrl.update,
);
router.post(
  '/:id/cancel',
  authenticate,
  authorize('admin', 'manager', 'front_desk'),
  writeRateLimiter,
  ctrl.cancel,
);

export default router;
