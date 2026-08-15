import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/User.model';
import { Project } from '../models/Project.model';
import { Task } from '../models/Task.model';
import { Payment } from '../models/Payment.model';
import { Activity } from '../models/Activity.model';

// GET /api/admin/stats
export const getAdminStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      totalProjects,
      totalTasks,
      allPayments,
      monthlyPayments,
      subBreakdown,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ createdAt: { $gte: monthStart } }),
      Project.countDocuments(),
      Task.countDocuments(),
      Payment.find({ status: 'completed' }).select('amount createdAt plan').sort({ createdAt: -1 }),
      Payment.find({ status: 'completed', createdAt: { $gte: monthStart } }).select('amount'),
      User.aggregate([
        { $group: { _id: '$subscription.plan', count: { $sum: 1 } } },
      ]),
    ]);

    const totalRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const revenueThisMonth = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

    const subscriptionBreakdown: Record<string, number> = {
      free: 0, starter: 0, pro: 0, enterprise: 0,
    };
    subBreakdown.forEach((item: { _id: string; count: number }) => {
      subscriptionBreakdown[item._id] = item.count;
    });

    // User growth - last 6 months
    const userGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = await User.countDocuments({
        createdAt: { $gte: date, $lt: endDate },
      });
      userGrowth.push({
        date: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        value: count,
      });
    }

    // Revenue growth - last 6 months
    const revenueGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const payments = await Payment.find({
        status: 'completed',
        createdAt: { $gte: date, $lt: endDate },
      }).select('amount');
      const revenue = payments.reduce((sum, p) => sum + p.amount, 0);
      revenueGrowth.push({
        date: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        value: revenue,
      });
    }

    const recentPayments = allPayments.slice(0, 5);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        newUsersThisMonth,
        totalRevenue,
        revenueThisMonth,
        totalProjects,
        totalTasks,
        subscriptionBreakdown,
        recentPayments,
        userGrowth,
        revenueGrowth,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/admin/users
export const getAdminUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', search, role, plan } = req.query;
    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;
    if (plan) query['subscription.plan'] = plan;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const total = await User.countDocuments(query);

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
};

// PATCH /api/admin/users/:id
export const updateAdminUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, isActive, subscription } = req.body;
    const updateData: Record<string, unknown> = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (subscription !== undefined) {
      Object.keys(subscription).forEach((key) => {
        updateData[`subscription.${key}`] = subscription[key];
      });
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.json({ success: true, data: user, message: 'User updated' });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/admin/users/:id
export const deleteAdminUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.json({ success: true, message: 'User deactivated' });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/admin/activity
export const getActivityLogs = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const logs = await Activity.find()
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: logs });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
};
