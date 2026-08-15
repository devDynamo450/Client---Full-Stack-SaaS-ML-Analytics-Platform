import { Router } from 'express';
import { User } from '../models/User.model';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { Response } from 'express';

const router = Router();
router.use(authenticate);

// GET /api/users (list for member selection)
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({ isActive: true }).select('name email avatar role').limit(100);
    res.json({ success: true, data: users });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    res.json({ success: true, data: user });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/users/profile
router.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findByIdAndUpdate(req.user!.userId, { name, avatar }, { new: true }).select('-password');
    res.json({ success: true, data: user, message: 'Profile updated' });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
