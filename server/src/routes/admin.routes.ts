import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getAdminStats, getAdminUsers, updateAdminUser, deleteAdminUser, getActivityLogs } from '../controllers/admin.controller';

const router = Router();
router.use(authenticate);
router.use(authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.patch('/users/:id', updateAdminUser);
router.delete('/users/:id', deleteAdminUser);
router.get('/activity', getActivityLogs);

export default router;
