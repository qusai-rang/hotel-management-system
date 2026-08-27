import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as ctrl from '../controllers/roomTypeController';

const router = Router();

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);

router.post('/', authenticate, authorize('admin', 'manager'), ctrl.create);
router.patch('/:id', authenticate, authorize('admin', 'manager'), ctrl.update);
router.delete('/:id', authenticate, authorize('admin', 'manager'), ctrl.remove);

export default router;
