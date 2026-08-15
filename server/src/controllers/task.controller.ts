import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Task } from '../models/Task.model';
import { Activity } from '../models/Activity.model';
import { Notification } from '../models/Notification.model';
import { emitToProject, emitToUser } from '../socket';

// GET /api/tasks?projectId=xxx
export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, status, priority, assigneeId } = req.query;
    const query: Record<string, unknown> = {};
    if (projectId) query.project = projectId;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assigneeId) query.assignee = assigneeId;

    const tasks = await Task.find(query)
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('comments.author', 'name email avatar')
      .sort({ position: 1, createdAt: -1 });

    res.json({ success: true, data: tasks });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// GET /api/tasks/:id
export const getTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('comments.author', 'name email avatar')
      .populate('project', 'name');

    if (!task) { res.status(404).json({ success: false, error: 'Task not found' }); return; }
    res.json({ success: true, data: task });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// POST /api/tasks
export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { title, description, priority, projectId, assigneeId, dueDate, labels, estimatedHours } = req.body;

    const taskCount = await Task.countDocuments({ project: projectId });
    const task = await Task.create({
      title, description,
      priority: priority || 'medium',
      project: projectId,
      assignee: assigneeId || null,
      reporter: userId, dueDate,
      labels: labels || [],
      estimatedHours,
      position: taskCount,
    });

    await Activity.create({
      user: userId, action: 'created_task', resource: 'task',
      resourceId: task._id.toString(), details: { taskTitle: title, projectId },
    });

    if (assigneeId && assigneeId !== userId) {
      await Notification.create({
        user: assigneeId, title: 'New task assigned',
        message: `You have been assigned to: "${title}"`,
        type: 'info', link: `/tasks/${task._id}`,
      });
      emitToUser(assigneeId, 'notification:new', { title: 'New task assigned', message: `"${title}"`, type: 'info' });
    }

    const populated = await Task.findById(task._id)
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar');

    // Emit real-time to project room
    emitToProject(projectId, 'task:created', populated);

    res.status(201).json({ success: true, data: populated, message: 'Task created' });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// PUT /api/tasks/:id
export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, status, priority, assigneeId, dueDate, labels, loggedHours } = req.body;
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (assigneeId !== undefined) updateData.assignee = assigneeId || null;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (labels !== undefined) updateData.labels = labels;
    if (loggedHours !== undefined) updateData.loggedHours = loggedHours;

    const task = await Task.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar');

    if (!task) { res.status(404).json({ success: false, error: 'Task not found' }); return; }

    // Emit real-time to project room
    emitToProject(task.project.toString(), 'task:updated', task);

    res.json({ success: true, data: task, message: 'Task updated' });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// DELETE /api/tasks/:id
export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) { res.status(404).json({ success: false, error: 'Task not found' }); return; }

    emitToProject(task.project.toString(), 'task:deleted', { taskId: req.params.id });

    res.json({ success: true, message: 'Task deleted' });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// POST /api/tasks/:id/comments
export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { content } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) { res.status(404).json({ success: false, error: 'Task not found' }); return; }

    task.comments.push({ author: userId, content } as never);
    await task.save();

    const updated = await Task.findById(task._id).populate('comments.author', 'name email avatar');
    const newComment = updated?.comments[updated.comments.length - 1];

    emitToProject(task.project.toString(), 'task:commented', {
      taskId: task._id, comment: newComment,
    });

    res.status(201).json({ success: true, data: updated?.comments, message: 'Comment added' });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// PATCH /api/tasks/:id/move — Kanban drag-and-drop reorder
export const moveTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, position, projectId } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id, { status, position }, { new: true }
    ).populate('assignee', 'name email avatar');

    if (!task) { res.status(404).json({ success: false, error: 'Task not found' }); return; }

    emitToProject(projectId, 'task:moved', { taskId: req.params.id, status, position });

    res.json({ success: true, data: task });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};
