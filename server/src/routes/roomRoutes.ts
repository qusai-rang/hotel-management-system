import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as ctrl from '../controllers/roomController';

const router = Router();

router.get('/', ctrl.list);
router.get('/:id/activity', ctrl.getActivity);
router.get('/:id', ctrl.getById);

router.post('/', authenticate, authorize('admin', 'manager'), ctrl.create);
router.patch('/:id', authenticate, authorize('admin', 'manager'), ctrl.update);

export default router;
