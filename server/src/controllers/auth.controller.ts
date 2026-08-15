import { Request, Response } from 'express';
import { User } from '../models/User.model';
import { Activity } from '../models/Activity.model';
import { generateToken, generateRefreshToken } from '../utils/jwt.utils';

const safeUser = (user: InstanceType<typeof User>) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  subscription: user.subscription,
  isActive: user.isActive,
  lastLogin: user.lastLogin,
  createdAt: (user as unknown as { createdAt: Date }).createdAt,
  updatedAt: (user as unknown as { updatedAt: Date }).updatedAt,
});

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ success: false, error: 'Email already registered' });
      return;
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'member',
      subscription: { plan: 'free', status: 'active', startDate: new Date() },
    });

    const token = generateToken({ userId: user._id.toString(), email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id.toString() });

    await Activity.create({
      user: user._id,
      action: 'registered',
      resource: 'user',
      resourceId: user._id.toString(),
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { user: safeUser(user), token, refreshToken },
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken({ userId: user._id.toString(), email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id.toString() });

    res.json({
      success: true,
      message: 'Logged in successfully',
      data: { user: safeUser(user), token, refreshToken },
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/auth/me
export const getMe = async (req: Request & { user?: { userId: string } }, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId).select('-password');
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/auth/logout
export const logout = (_req: Request, res: Response): void => {
  res.json({ success: true, message: 'Logged out successfully' });
};
