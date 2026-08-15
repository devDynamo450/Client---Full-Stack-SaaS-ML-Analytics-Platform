import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Project } from '../models/Project.model';
import { Task } from '../models/Task.model';
import { Activity } from '../models/Activity.model';

// GET /api/projects
export const getProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { status, page = '1', limit = '10' } = req.query;

    const query: Record<string, unknown> = {
      $or: [{ owner: userId }, { 'members.user': userId }],
    };
    if (status) query.status = status;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const total = await Project.countDocuments(query);

    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    // Attach task counts
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCount = await Task.countDocuments({ project: project._id });
        const completedCount = await Task.countDocuments({ project: project._id, status: 'done' });
        return {
          ...project.toObject(),
          taskCount: { total: taskCount, completed: completedCount },
          progress: taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0,
        };
      })
    );

    res.json({
      success: true,
      data: projectsWithCounts,
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

// GET /api/projects/:id
export const getProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' });
      return;
    }

    const taskCount = await Task.countDocuments({ project: project._id });
    const completedCount = await Task.countDocuments({ project: project._id, status: 'done' });

    res.json({
      success: true,
      data: {
        ...project.toObject(),
        taskCount: { total: taskCount, completed: completedCount },
        progress: taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/projects
export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { name, description, dueDate, tags, coverColor } = req.body;

    const project = await Project.create({
      name,
      description,
      dueDate,
      tags: tags || [],
      coverColor: coverColor || '#6366f1',
      owner: userId,
      members: [{ user: userId, role: 'owner', joinedAt: new Date() }],
    });

    await Activity.create({
      user: userId,
      action: 'created_project',
      resource: 'project',
      resourceId: project._id.toString(),
      details: { projectName: name },
    });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.status(201).json({ success: true, data: populated, message: 'Project created' });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/projects/:id
export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, status, dueDate, tags, coverColor } = req.body;

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description, status, dueDate, tags, coverColor },
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' });
      return;
    }

    res.json({ success: true, data: project, message: 'Project updated' });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/projects/:id
export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' });
      return;
    }

    // Delete all associated tasks
    await Task.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Project and all its tasks deleted' });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/projects/:id/members
export const addMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, role = 'member' } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' });
      return;
    }

    const alreadyMember = project.members.some((m) => m.user.toString() === userId);
    if (alreadyMember) {
      res.status(400).json({ success: false, error: 'User is already a member' });
      return;
    }

    project.members.push({ user: userId, role, joinedAt: new Date() });
    await project.save();

    const updated = await Project.findById(project._id).populate('members.user', 'name email avatar');
    res.json({ success: true, data: updated, message: 'Member added' });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
};
