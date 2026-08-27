import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as ctrl from '../controllers/availabilityController';

const router = Router();

router.get('/', authenticate, ctrl.search);

export default router;
