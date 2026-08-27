import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as dashboardController from '../controllers/dashboardController';

const router = Router();

router.use(authenticate);

router.get('/summary', authorize('admin', 'manager', 'front_desk'), dashboardController.summary);

export default router;
