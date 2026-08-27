import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as ctrl from '../controllers/guestController';

const router = Router();

router.get('/', authenticate, authorize('admin', 'manager', 'front_desk'), ctrl.list);
router.get('/:slug', authenticate, authorize('admin', 'manager', 'front_desk'), ctrl.getBySlug);
router.get('/:slug/stays', authenticate, authorize('admin', 'manager', 'front_desk'), ctrl.getStays);

router.post('/', authenticate, authorize('admin', 'manager', 'front_desk'), ctrl.create);
router.patch('/:slug', authenticate, authorize('admin', 'manager', 'front_desk'), ctrl.update);

export default router;
