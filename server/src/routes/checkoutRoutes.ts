import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as checkoutController from '../controllers/checkoutController';

const router = Router();

router.use(authenticate);

router.get('/:reservationId', authorize('admin', 'manager', 'front_desk'), checkoutController.getSession);
router.post('/:reservationId/payments', authorize('admin', 'manager', 'front_desk'), checkoutController.collectPayment);
router.post('/:reservationId/complete', authorize('admin', 'manager', 'front_desk'), checkoutController.complete);

export default router;
