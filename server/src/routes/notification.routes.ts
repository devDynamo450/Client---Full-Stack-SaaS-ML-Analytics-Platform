import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { Notification } from '../models/Notification.model';
import { Response } from 'express';

const router = Router();
router.use(authenticate);

// GET /api/notifications
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await Notification.find({ user: req.user!.userId })
      .sort({ createdAt: -1 })
      .limit(20);
    const unreadCount = await Notification.countDocuments({ user: req.user!.userId, read: false });
    res.json({ success: true, data: notifications, unreadCount });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user!.userId }, { read: true });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req: AuthRequest, res: Response) => {
  try {
    await Notification.updateMany({ user: req.user!.userId, read: false }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
