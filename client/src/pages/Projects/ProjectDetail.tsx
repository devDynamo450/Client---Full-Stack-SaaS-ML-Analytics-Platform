import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, X, Users, BarChart2, List } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useProjectSocket } from '../../hooks/useSocket';
import { AvatarGroup, Progress, Badge, ConfirmModal, CardSkeleton } from '../../components/common';
import TaskDetailPanel from '../../components/tasks/TaskDetailPanel';

interface TaskUser { _id: string; name: string; email: string; avatar?: string; }
interface Task {
  _id: string; title: string; description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: TaskUser; dueDate?: string; labels: string[];
  comments: unknown[]; estimatedHours?: number;
}
interface Member { user: TaskUser; role: string; }
interface Project {
  _id: string; name: string; description: string; status: string;
  members: Member[]; progress: number;
  taskCount: { total: number; completed: number };
  coverColor: string; dueDate?: string;
}

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: '#3b82f6', emoji: '📋' },
  { id: 'in_progress', label: 'In Progress', color: '#f59e0b', emoji: '⚡' },
  { id: 'review', label: 'Review', color: '#8b5cf6', emoji: '🔍' },
  { id: 'done', label: 'Done', color: '#10b981', emoji: '✅' },
];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);
  const [showModal, setShowModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assigneeId: '', dueDate: '', estimatedHours: '' });

  // Real-time WebSocket for this project
  useProjectSocket(id);

  const { data: projData, isLoading: projLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get(`/projects/${id}`).then(r => r.data.data),
  });
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => api.get(`/tasks?projectId=${id}`).then(r => r.data.data),
  });

  const project: Project | undefined = projData;
  const tasks: Task[] = tasksData || [];

  const createTask = useMutation({
    mutationFn: (data: typeof form) => api.post('/tasks', { ...data, projectId: id, estimatedHours: data.estimatedHours ? parseFloat(data.estimatedHours) : undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', id] });
      qc.invalidateQueries({ queryKey: ['project', id] });
      toast.success('Task created!');
      setShowModal(false);
      setForm({ title: '', description: '', priority: 'medium', assigneeId: '', dueDate: '', estimatedHours: '' });
    },
    onError: () => toast.error('Failed to create task'),
  });

  const moveTask = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      api.patch(`/tasks/${taskId}/move`, { status, position: 0, projectId: id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', id] });
      qc.invalidateQueries({ queryKey: ['project', id] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: (taskId: string) => api.delete(`/tasks/${taskId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', id] });
      qc.invalidateQueries({ queryKey: ['project', id] });
      toast.success('Task deleted');
      setConfirmDelete(null);
      if (selectedTaskId === confirmDelete) setSelectedTaskId(null);
    },
  });

  const getColumnTasks = (status: string) => tasks.filter(t => t.status === status);
  const isOverdue = (t: Task) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done';

  if (projLoading) return <div style={{ display: 'grid', gap: 16 }}><CardSkeleton /><CardSkeleton /></div>;
  if (!project) return <div className="empty-state"><h3>Project not found</h3></div>;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}><ArrowLeft size={16} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>{project.name}</h1>
            <Badge variant={project.status}>{project.status.replace('_', ' ')}</Badge>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', color: 'var(--text-muted)', fontSize: 13, flexWrap: 'wrap' }}>
            <span>{project.taskCount?.completed}/{project.taskCount?.total} tasks</span>
            <div style={{ width: 120 }}><Progress value={project.progress || 0} showLabel /></div>
            {project.dueDate && <span>Due {new Date(project.dueDate).toLocaleDateString()}</span>}
            <AvatarGroup members={project.members.map(m => ({ name: m.user.name, avatar: m.user.avatar }))} max={5} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 2 }}>
            <button className={`btn btn-sm ${view === 'kanban' ? 'btn-primary' : 'btn-ghost'}`} style={{ padding: '4px 10px' }} onClick={() => setView('kanban')}>
              <BarChart2 size={14} />
            </button>
            <button className={`btn btn-sm ${view === 'list' ? 'btn-primary' : 'btn-ghost'}`} style={{ padding: '4px 10px' }} onClick={() => setView('list')}>
              <List size={14} />
            </button>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/projects')}><Users size={14} /> Members</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><Plus size={14} /> Add Task</button>
        </div>
      </div>

      {/* Views */}
      {tasksLoading ? (
        <div style={{ display: 'flex', gap: 16 }}>
          {[1,2,3,4].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : view === 'kanban' ? (
        /* ── Kanban View ── */
        <div className="kanban-board" style={{ flex: 1 }}>
          {COLUMNS.map(col => {
            const colTasks = getColumnTasks(col.id);
            return (
              <div key={col.id} className="kanban-column">
                <div className="kanban-header" style={{ borderTop: `3px solid ${col.color}` }}>
                  <div className="kanban-title">
                    {col.emoji} {col.label}
                    <span className="kanban-count">{colTasks.length}</span>
                  </div>
                  <button className="btn btn-ghost" style={{ padding: 4, fontSize: 16 }} onClick={() => { setForm(f => ({ ...f, assigneeId: '' })); setShowModal(true); }}>+</button>
                </div>
                <div className="kanban-cards" style={{ minHeight: 200 }}>
                  {colTasks.map(task => (
                    <div
                      key={task._id}
                      className={`task-card ${isOverdue(task) ? 'overdue-card' : ''} ${task.status === 'done' ? 'done-card' : ''}`}
                      onClick={() => setSelectedTaskId(task._id)}
                    >
                      {task.labels?.length > 0 && (
                        <div className="task-labels">
                          {task.labels.map(l => <span key={l} className="task-label">{l}</span>)}
                        </div>
                      )}
                      <div className="task-title">{task.title}</div>
                      {task.comments.length > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                          💬 {task.comments.length}
                        </div>
                      )}
                      <div className="task-meta">
                        <Badge variant={task.priority}>{task.priority}</Badge>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {task.assignee && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{task.assignee.name.split(' ')[0]}</span>}
                          {isOverdue(task) && <span style={{ fontSize: 11, color: 'var(--red)' }}>overdue</span>}
                        </div>
                      </div>
                      {/* Quick move buttons */}
                      <div style={{ display: 'flex', gap: 3, marginTop: 8, flexWrap: 'wrap' }}>
                        {COLUMNS.filter(c => c.id !== col.id).map(c => (
                          <button key={c.id}
                            className="btn btn-ghost"
                            style={{ fontSize: 10, padding: '2px 6px', color: c.color, border: `1px solid ${c.color}30` }}
                            onClick={e => { e.stopPropagation(); moveTask.mutate({ taskId: task._id, status: c.id }); }}
                          >
                            → {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                      Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── List View ── */
        <div className="card">
          <div className="table-container">
            <table>
              <thead><tr><th>Task</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due Date</th><th>Comments</th></tr></thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No tasks yet. Add one!</td></tr>
                ) : tasks.map(task => (
                  <tr key={task._id} style={{ cursor: 'pointer' }} onClick={() => setSelectedTaskId(task._id)}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{task.title}</div>
                      {task.labels.length > 0 && <div className="task-labels" style={{ marginTop: 4 }}>{task.labels.map(l => <span key={l} className="task-label">{l}</span>)}</div>}
                    </td>
                    <td><Badge variant={task.status}>{task.status.replace('_', ' ')}</Badge></td>
                    <td><Badge variant={task.priority}>{task.priority}</Badge></td>
                    <td>{task.assignee ? <span style={{ fontSize: 13 }}>{task.assignee.name}</span> : <span className="text-muted">—</span>}</td>
                    <td className={isOverdue(task) ? 'overdue text-sm' : 'text-muted text-sm'}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</td>
                    <td className="text-muted text-sm">💬 {task.comments.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Detail Panel */}
      {selectedTaskId && (
        <>
          <div className="task-panel-overlay" onClick={() => setSelectedTaskId(null)} />
          <TaskDetailPanel
            taskId={selectedTaskId}
            projectId={id!}
            members={project.members}
            onClose={() => setSelectedTaskId(null)}
            currentUserId={user?._id || ''}
          />
        </>
      )}

      {/* Create Task Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Add Task</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Task title" autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Optional details..." />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input className="form-input" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select className="form-input" value={form.assigneeId} onChange={e => setForm({ ...form, assigneeId: e.target.value })}>
                  <option value="">Unassigned</option>
                  {project.members?.map(m => (
                    <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Estimated Hours</label>
                <input className="form-input" type="number" value={form.estimatedHours} onChange={e => setForm({ ...form, estimatedHours: e.target.value })} placeholder="e.g. 4" min={0} step={0.5} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary w-full" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary w-full" onClick={() => createTask.mutate(form)} disabled={!form.title || createTask.isPending}>
                {createTask.isPending ? <span className="spinner" /> : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <ConfirmModal
          title="Delete Task"
          message="Are you sure you want to delete this task? This action cannot be undone."
          confirmLabel="Delete"
          danger
          onConfirm={() => deleteTask.mutate(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
          loading={deleteTask.isPending}
        />
      )}
    </div>
  );
}
