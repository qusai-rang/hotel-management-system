import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as housekeepingController from '../controllers/housekeepingController';

const router = Router();

router.use(authenticate);

// GET /housekeeping/tasks — list with filters
router.get('/tasks', authorize('admin', 'manager', 'housekeeping'), housekeepingController.list);

// POST /housekeeping/tasks — create task
router.post('/tasks', authorize('admin', 'manager', 'housekeeping'), housekeepingController.create);

// GET /housekeeping/stats — aggregated statistics
router.get('/stats', authorize('admin', 'manager', 'housekeeping'), housekeepingController.stats);

// GET /housekeeping/staff-schedule — current staff assignments
router.get('/staff-schedule', authorize('admin', 'manager', 'housekeeping'), housekeepingController.staffSchedule);

// GET /housekeeping/rooms/:roomId/tasks — tasks for a specific room
router.get('/rooms/:roomId/tasks', authorize('admin', 'manager', 'housekeeping'), housekeepingController.getForRoom);

// PATCH /housekeeping/tasks/:id — update task
router.patch('/tasks/:id', authorize('admin', 'manager', 'housekeeping'), housekeepingController.update);

export default router;
