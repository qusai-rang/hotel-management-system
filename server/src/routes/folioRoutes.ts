import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as ctrl from '../controllers/folioController';

const router = Router();

router.post('/', authenticate, authorize('admin', 'manager', 'front_desk'), ctrl.create);
router.get('/:id', authenticate, authorize('admin', 'manager', 'front_desk'), ctrl.getById);
router.post('/:id/charges', authenticate, authorize('admin', 'manager', 'front_desk'), ctrl.addCharge);
router.post('/:id/discounts', authenticate, authorize('admin', 'manager', 'front_desk'), ctrl.addDiscount);
router.post('/:id/payments', authenticate, authorize('admin', 'manager', 'front_desk'), ctrl.addPayment);
router.post('/:id/payments/:paymentId/refund', authenticate, authorize('admin', 'manager', 'front_desk'), ctrl.refund);

export default router;
