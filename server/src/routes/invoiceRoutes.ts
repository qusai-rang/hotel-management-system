import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as invoiceController from '../controllers/invoiceController';

const router = Router();

router.use(authenticate);

router.get('/', authorize('admin', 'manager', 'front_desk'), invoiceController.list);
router.post('/', authorize('admin', 'manager', 'front_desk'), invoiceController.generate);
router.get('/:number', authorize('admin', 'manager', 'front_desk'), invoiceController.getByNumber);

export default router;
