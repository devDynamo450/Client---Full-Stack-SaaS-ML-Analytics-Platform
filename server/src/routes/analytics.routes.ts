import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { Project } from '../models/Project.model';
import { Task } from '../models/Task.model';
import { Activity } from '../models/Activity.model';
import { Response } from 'express';

const router = Router();
router.use(authenticate);

// GET /api/analytics/overview
router.get('/overview', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const userProjects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
    }).select('_id status');

    const projectIds = userProjects.map((p) => p._id);
    const totalTasks = await Task.countDocuments({ project: { $in: projectIds } });
    const completedTasks = await Task.countDocuments({ project: { $in: projectIds }, status: 'done' });
    const inProgressTasks = await Task.countDocuments({ project: { $in: projectIds }, status: 'in_progress' });

    const tasksByPriority = await Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const projectsByStatus = userProjects.reduce((acc: Record<string, number>, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});

    const recentActivity = await Activity.find({ user: userId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10);

    const productivityScore = totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        totalProjects: userProjects.length,
        activeProjects: userProjects.filter((p) => p.status === 'active').length,
        completedProjects: userProjects.filter((p) => p.status === 'completed').length,
        totalTasks,
        completedTasks,
        inProgressTasks,
        projectsByStatus,
        tasksByPriority: Object.fromEntries(tasksByPriority.map((t: { _id: string; count: number }) => [t._id, t.count])),
        recentActivity,
        productivityScore,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
