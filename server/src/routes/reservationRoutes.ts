import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as ctrl from '../controllers/reservationController';

const router = Router();

router.get('/', authenticate, authorize('admin', 'manager', 'front_desk'), ctrl.list);
router.get('/:id/folio', authenticate, authorize('admin', 'manager', 'front_desk'), ctrl.getFolio);
router.post('/:id/check-in', authenticate, authorize('admin', 'manager', 'front_desk'), ctrl.checkIn);
router.get('/:id', authenticate, authorize('admin', 'manager', 'front_desk'), ctrl.getById);
router.post('/', authenticate, authorize('admin', 'manager', 'front_desk'), ctrl.create);
router.patch('/:id', authenticate, authorize('admin', 'manager', 'front_desk'), ctrl.update);
router.post('/:id/cancel', authenticate, authorize('admin', 'manager', 'front_desk'), ctrl.cancel);

export default router;
