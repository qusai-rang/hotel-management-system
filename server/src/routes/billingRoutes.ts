import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as ctrl from '../controllers/billingController';

const router = Router();

router.get('/transactions', authenticate, authorize('admin', 'manager', 'front_desk'), ctrl.listTransactions);
router.get('/metrics', authenticate, authorize('admin', 'manager', 'front_desk'), ctrl.getMetrics);

export default router;
