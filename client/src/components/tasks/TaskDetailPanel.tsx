import { useState, useRef, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { X, MessageSquare, Clock, Tag, User, Calendar, Trash2, Flag } from 'lucide-react';
import { Avatar, Badge, Progress } from '../common';
import { useSocketStore } from '../../store/socketStore';

interface TaskUser { _id: string; name: string; email: string; avatar?: string; }
interface Comment { _id: string; author: TaskUser; content: string; createdAt: string; }
interface Task {
  _id: string; title: string; description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  project: { _id: string; name: string } | string;
  assignee?: TaskUser; reporter: TaskUser;
  dueDate?: string; labels: string[]; comments: Comment[];
  estimatedHours?: number; loggedHours?: number; createdAt: string;
}
interface Member { user: TaskUser; role: string; }

interface TaskDetailPanelProps {
  taskId: string;
  projectId: string;
  members: Member[];
  onClose: () => void;
  currentUserId: string;
}

export default function TaskDetailPanel({ taskId, projectId, members, onClose, currentUserId }: TaskDetailPanelProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [editTitle, setEditTitle] = useState(false);
  const [titleVal, setTitleVal] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const { socket } = useSocketStore();
  const qc = useQueryClient();

  useEffect(() => {
    api.get(`/tasks/${taskId}`).then(r => {
      setTask(r.data.data);
      setTitleVal(r.data.data.title);
      setLoading(false);
    });
  }, [taskId]);

  // typing indicator
  const sendTyping = () => socket?.emit('task:typing', { taskId, projectId });
  const stopTyping = () => socket?.emit('task:stop_typing', { taskId, projectId });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Task>) => api.put(`/tasks/${taskId}`, data),
    onSuccess: (res) => {
      setTask(res.data.data);
      qc.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: () => api.post(`/tasks/${taskId}/comments`, { content: comment }),
    onSuccess: () => {
      setComment('');
      api.get(`/tasks/${taskId}`).then(r => setTask(r.data.data));
      qc.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
    onError: () => toast.error('Failed to add comment'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/tasks/${taskId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] });
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Task deleted');
      onClose();
    },
  });

  const addLabel = () => {
    if (!newLabel.trim() || !task) return;
    const labels = [...task.labels, newLabel.trim()];
    updateMutation.mutate({ labels } as never);
    setTask({ ...task, labels });
    setNewLabel('');
  };

  const removeLabel = (label: string) => {
    if (!task) return;
    const labels = task.labels.filter(l => l !== label);
    updateMutation.mutate({ labels } as never);
    setTask({ ...task, labels });
  };

  if (loading || !task) {
    return (
      <div className="task-panel">
        <div style={{ padding: 32, textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  const PRIORITY_COLORS: Record<string, string> = { low: 'var(--text-muted)', medium: 'var(--blue)', high: 'var(--yellow)', urgent: 'var(--red)' };
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <div className="task-panel">
      {/* Header */}
      <div className="task-panel-header">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
          <select
            className="form-input"
            style={{ width: 140, padding: '6px 10px', fontSize: 12 }}
            value={task.status}
            onChange={e => { updateMutation.mutate({ status: e.target.value } as never); setTask({ ...task, status: e.target.value as Task['status'] }); }}
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
          <select
            className="form-input"
            style={{ width: 120, padding: '6px 10px', fontSize: 12 }}
            value={task.priority}
            onChange={e => { updateMutation.mutate({ priority: e.target.value } as never); setTask({ ...task, priority: e.target.value as Task['priority'] }); }}
          >
            {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => deleteMutation.mutate()} style={{ color: 'var(--red)' }} title="Delete task">
            <Trash2 size={15} />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={18} /></button>
        </div>
      </div>

      <div className="task-panel-body">
        {/* Title */}
        <div style={{ marginBottom: 20 }}>
          {editTitle ? (
            <input
              className="form-input"
              value={titleVal}
              onChange={e => setTitleVal(e.target.value)}
              onBlur={() => { setEditTitle(false); if (titleVal !== task.title) { updateMutation.mutate({ title: titleVal } as never); setTask({ ...task, title: titleVal }); } }}
              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') { setEditTitle(false); setTitleVal(task.title); } }}
              autoFocus
              style={{ fontSize: 20, fontWeight: 700, padding: '8px 12px' }}
            />
          ) : (
            <h2
              style={{ fontSize: 20, fontWeight: 700, cursor: 'text', lineHeight: 1.4, color: 'var(--text-primary)' }}
              onClick={() => setEditTitle(true)}
              title="Click to edit"
            >
              {task.title}
            </h2>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
            <Flag size={12} style={{ color: PRIORITY_COLORS[task.priority] }} />
            <span style={{ color: PRIORITY_COLORS[task.priority], fontWeight: 600 }}>{task.priority}</span>
            <span>·</span>
            <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
            {typeof task.project === 'object' && <><span>·</span><span>{task.project.name}</span></>}
          </div>
        </div>

        {/* Progress (hours) */}
        {task.estimatedHours && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span className="text-muted">Time Progress</span>
              <span>{task.loggedHours || 0}h / {task.estimatedHours}h</span>
            </div>
            <Progress value={Math.min(100, ((task.loggedHours || 0) / task.estimatedHours) * 100)} showLabel />
          </div>
        )}

        {/* Meta Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {/* Assignee */}
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <User size={11} /> ASSIGNEE
            </div>
            <select
              className="form-input"
              style={{ padding: '4px 8px', fontSize: 13 }}
              value={task.assignee?._id || ''}
              onChange={e => { updateMutation.mutate({ assigneeId: e.target.value || null } as never); }}
            >
              <option value="">Unassigned</option>
              {members.map(m => <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}
            </select>
          </div>

          {/* Due Date */}
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={11} /> DUE DATE
            </div>
            <input
              className="form-input"
              type="date"
              style={{ padding: '4px 8px', fontSize: 13, color: isOverdue ? 'var(--red)' : undefined }}
              value={task.dueDate ? task.dueDate.split('T')[0] : ''}
              onChange={e => { updateMutation.mutate({ dueDate: e.target.value } as never); setTask({ ...task, dueDate: e.target.value }); }}
            />
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>DESCRIPTION</div>
          <textarea
            className="form-input"
            rows={3}
            placeholder="Add a description..."
            defaultValue={task.description || ''}
            onBlur={e => { if (e.target.value !== (task.description || '')) updateMutation.mutate({ description: e.target.value } as never); }}
          />
        </div>

        {/* Labels */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Tag size={12} /> LABELS
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {task.labels.map(label => (
              <span key={label} className="task-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {label}
                <button onClick={() => removeLabel(label)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input className="form-input" style={{ flex: 1, padding: '6px 10px', fontSize: 12 }} placeholder="Add label..." value={newLabel} onChange={e => setNewLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && addLabel()} />
            <button className="btn btn-secondary btn-sm" onClick={addLabel}>Add</button>
          </div>
        </div>

        {/* Time Tracking */}
        {task.estimatedHours && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} /> TIME TRACKING
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                className="form-input"
                type="number"
                style={{ width: 80, padding: '6px 10px', fontSize: 13 }}
                placeholder="0"
                defaultValue={task.loggedHours || 0}
                min={0}
                onBlur={e => updateMutation.mutate({ loggedHours: parseFloat(e.target.value) } as never)}
              />
              <span className="text-muted text-sm">hours logged of {task.estimatedHours}h estimated</span>
            </div>
          </div>
        )}

        {/* Comments */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <MessageSquare size={12} /> COMMENTS ({task.comments.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {task.comments.map(c => (
              <div key={c._id} style={{ display: 'flex', gap: 10 }}>
                <Avatar name={c.author.name} size={28} src={c.author.avatar} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{c.author.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', lineHeight: 1.5 }}>
                    {c.content}
                  </div>
                </div>
              </div>
            ))}
            {task.comments.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>No comments yet. Be the first!</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Avatar name={currentUserId} size={28} />
            <div style={{ flex: 1 }}>
              <textarea
                ref={commentRef}
                className="form-input"
                rows={2}
                placeholder="Write a comment... (Enter to send)"
                value={comment}
                onChange={e => { setComment(e.target.value); sendTyping(); }}
                onBlur={stopTyping}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (comment.trim()) commentMutation.mutate();
                  }
                }}
                style={{ resize: 'none', fontSize: 13 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                <button className="btn btn-primary btn-sm" onClick={() => commentMutation.mutate()} disabled={!comment.trim() || commentMutation.isPending}>
                  {commentMutation.isPending ? <span className="spinner" /> : 'Comment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
