import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { CheckSquare, Clock, AlertCircle, Search, Filter, ArrowRight } from 'lucide-react';
import { Badge, StatCard, Empty } from '../../components/common';

interface Task {
  _id: string; title: string; status: string; priority: string;
  project: { _id: string; name: string } | string;
  dueDate?: string; assignee?: { name: string };
  estimatedHours?: number; loggedHours?: number;
}

const STATUS_NEXT: Record<string, string> = { todo: 'in_progress', in_progress: 'review', review: 'done', done: 'todo' };
const STATUS_LABEL: Record<string, string> = { todo: '▶ Start', in_progress: '🔍 Review', review: '✅ Done', done: '↩ Reopen' };

export default function TasksPage() {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'mine' | 'all' | 'overdue'>('mine');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // My tasks
  const { data: myTasksData, isLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => api.get(`/tasks?assigneeId=${user?._id}`).then(r => r.data.data),
    enabled: !!user?._id,
  });

  // All tasks (manager/admin only)
  const { data: allTasksData } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => api.get('/tasks').then(r => r.data.data),
    enabled: user?.role === 'admin' || user?.role === 'manager',
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.put(`/tasks/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-tasks'] });
      qc.invalidateQueries({ queryKey: ['all-tasks'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Task updated!');
    },
  });

  const myTasks: Task[] = myTasksData || [];
  const allTasks: Task[] = allTasksData || [];

  const now = new Date();
  const overdueTasks = myTasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done');

  const activeTasks = tab === 'mine' ? myTasks : tab === 'all' ? allTasks : overdueTasks;

  const filtered = useMemo(() => {
    return activeTasks.filter(t => {
      const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
      const matchPriority = !priorityFilter || t.priority === priorityFilter;
      return matchSearch && matchPriority;
    });
  }, [activeTasks, search, priorityFilter]);

  const todo = myTasks.filter(t => t.status === 'todo').length;
  const inProgress = myTasks.filter(t => t.status === 'in_progress').length;
  const done = myTasks.filter(t => t.status === 'done').length;

  const canSeeAll = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div>
      <div className="section-header mb-8">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Tasks</h1>
          <p className="text-muted">{myTasks.length} tasks assigned to you{overdueTasks.length > 0 && <span style={{ color: 'var(--red)', marginLeft: 8 }}>· {overdueTasks.length} overdue</span>}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <StatCard label="To Do" value={todo} icon={<AlertCircle size={20} />} color="#3b82f6" bg="var(--blue-light)" />
        <StatCard label="In Progress" value={inProgress} icon={<Clock size={20} />} color="#f59e0b" bg="var(--yellow-light)" />
        <StatCard label="Completed" value={done} icon={<CheckSquare size={20} />} color="#10b981" bg="var(--green-light)" />
        <StatCard label="Overdue" value={overdueTasks.length} icon={<AlertCircle size={20} />} color="#ef4444" bg="var(--red-light)" change={overdueTasks.length > 0 ? 'Needs attention' : 'All on track'} changeType={overdueTasks.length > 0 ? 'down' : 'up'} />
      </div>

      {/* Tabs + Filters */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div className="tab-bar" style={{ margin: 0, border: 'none' }}>
            <button className={`tab-btn ${tab === 'mine' ? 'active' : ''}`} onClick={() => setTab('mine')}>
              My Tasks ({myTasks.length})
            </button>
            {canSeeAll && (
              <button className={`tab-btn ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
                All Tasks ({allTasks.length})
              </button>
            )}
            <button className={`tab-btn ${tab === 'overdue' ? 'active' : ''}`} onClick={() => setTab('overdue')}>
              ⚠️ Overdue ({overdueTasks.length})
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <div className="search-wrapper">
              <Search size={14} className="search-icon" />
              <input className="search-input" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 180 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Filter size={14} style={{ color: 'var(--text-muted)' }} />
              <select className="form-input" style={{ width: 120, padding: '6px 10px' }} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                <option value="">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <Empty
            icon={<CheckSquare size={48} />}
            title={tab === 'overdue' ? 'No overdue tasks! 🎉' : 'No tasks found'}
            description={tab === 'mine' ? 'Tasks assigned to you will appear here' : 'Try adjusting your filters'}
          />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Priority</th>
                  {canSeeAll && tab === 'all' && <th>Assignee</th>}
                  <th>Due Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(task => {
                  const overdue = task.dueDate && new Date(task.dueDate) < now && task.status !== 'done';
                  return (
                    <tr key={task._id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/projects/${typeof task.project === 'object' ? task.project._id : task.project}`)}>
                      <td>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {overdue && <AlertCircle size={14} style={{ color: 'var(--red)', flexShrink: 0 }} />}
                          <span style={{ color: overdue ? 'var(--red)' : undefined }}>{task.title}</span>
                        </div>
                      </td>
                      <td className="text-muted text-sm">{typeof task.project === 'object' ? task.project.name : '—'}</td>
                      <td><Badge variant={task.status}>{task.status.replace('_', ' ')}</Badge></td>
                      <td><Badge variant={task.priority}>{task.priority}</Badge></td>
                      {canSeeAll && tab === 'all' && (
                        <td className="text-sm text-muted">{task.assignee?.name || '—'}</td>
                      )}
                      <td className={`text-sm ${overdue ? 'overdue' : 'text-muted'}`}>
                        {task.dueDate ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} /> {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        ) : '—'}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => updateStatus.mutate({ id: task._id, status: STATUS_NEXT[task.status] })}
                          disabled={updateStatus.isPending}
                        >
                          {STATUS_LABEL[task.status]}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick link to projects */}
      {myTasks.length === 0 && !isLoading && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button className="btn btn-primary" onClick={() => navigate('/projects')}>
            Go to Projects <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
