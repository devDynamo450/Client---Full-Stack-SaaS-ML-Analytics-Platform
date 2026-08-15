import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { FolderKanban, CheckSquare, TrendingUp, Zap, Plus, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import { StatCard, Progress, Badge, AvatarGroup, CardSkeleton } from '../../components/common';

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6'];

interface ActivityItem {
  _id: string; action: string; resource: string;
  user: { name: string; avatar?: string };
  createdAt: string; details?: Record<string, unknown>;
}
interface Project {
  _id: string; name: string; status: string; progress: number;
  taskCount: { total: number; completed: number };
  members: { user: { name: string; avatar?: string } }[];
  coverColor: string; dueDate?: string;
}
interface Task {
  _id: string; title: string; status: string; priority: string;
  project: { _id: string; name: string };
  dueDate?: string;
}

const ACTION_EMOJI: Record<string, string> = {
  created_project: '📁', created_task: '✅', subscribed: '⭐',
  registered: '👋', default: '📌',
};

export default function DashboardPage() {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get('/analytics/overview').then(r => r.data.data),
  });

  const { data: projectsData, isLoading: projLoading } = useQuery({
    queryKey: ['projects-recent'],
    queryFn: () => api.get('/projects?limit=4').then(r => r.data),
  });

  const { data: myTasksData } = useQuery({
    queryKey: ['my-tasks-recent'],
    queryFn: () => api.get(`/tasks?assigneeId=${user?._id}`).then(r => r.data.data),
    enabled: !!user?._id,
  });

  const projects: Project[] = projectsData?.data || [];
  const myTasks: Task[] = (myTasksData || []).filter((t: Task) => t.status !== 'done').slice(0, 5);
  const recentActivity: ActivityItem[] = analytics?.recentActivity || [];

  const priorityData = analytics ? Object.entries(analytics.tasksByPriority || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1), value,
  })) : [];

  const statusChartData = analytics ? Object.entries(analytics.projectsByStatus || {}).map(([name, value]) => ({
    name: name.replace('_', ' '), value,
  })) : [];

  const isOverdue = (t: Task) => t.dueDate && new Date(t.dueDate) < new Date();

  const stats = [
    { label: 'Total Projects', value: analytics?.totalProjects ?? '—', icon: <FolderKanban size={20} />, color: '#6366f1', bg: 'var(--accent-light)', change: `${analytics?.activeProjects || 0} active`, changeType: 'up' as const },
    { label: 'Total Tasks', value: analytics?.totalTasks ?? '—', icon: <CheckSquare size={20} />, color: '#10b981', bg: 'var(--green-light)', change: `${analytics?.completedTasks || 0} done`, changeType: 'up' as const },
    { label: 'In Progress', value: analytics?.inProgressTasks ?? '—', icon: <Zap size={20} />, color: '#f59e0b', bg: 'var(--yellow-light)' },
    { label: 'Productivity', value: `${analytics?.productivityScore ?? 0}%`, icon: <TrendingUp size={20} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', change: 'completion rate', changeType: 'neutral' as const },
  ];

  return (
    <div>
      {/* Header */}
      <div className="section-header mb-8">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted">Here's what's happening with your projects today.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/projects')}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Stats */}
      {analyticsLoading ? (
        <div className="stats-grid"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
      ) : (
        <div className="stats-grid">
          {stats.map((s, i) => <StatCard key={i} {...s} />)}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid-2 mb-6">
        <div className="chart-container">
          <div className="chart-title">Tasks by Priority</div>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {priorityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No tasks yet</div>}
        </div>

        <div className="chart-container">
          <div className="chart-title">Project Status Overview</div>
          {statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={statusChartData}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Area type="monotone" dataKey="value" stroke="#6366f1" fill="url(#areaGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data yet</div>}
        </div>
      </div>

      {/* Bottom Row: Projects + My Tasks + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Recent Projects */}
        <div className="widget">
          <div className="widget-header">
            <span className="widget-title">📁 Recent Projects</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="widget-body" style={{ padding: '8px 0' }}>
            {projLoading ? <CardSkeleton /> : projects.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No projects yet. <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>Create one →</button>
              </div>
            ) : projects.map(p => (
              <div key={p._id} onClick={() => navigate(`/projects/${p._id}`)}
                style={{ padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid var(--border)', transition: 'var(--transition)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.coverColor || '#6366f1' }} />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</span>
                  </div>
                  <Badge variant={p.status}>{p.status.replace('_', ' ')}</Badge>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}><Progress value={p.progress || 0} showLabel /></div>
                  <AvatarGroup members={p.members.map(m => ({ name: m.user.name, avatar: m.user.avatar }))} max={3} size={22} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Tasks */}
        <div className="widget">
          <div className="widget-header">
            <span className="widget-title">✅ My Pending Tasks</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')}>View all <ArrowRight size={12} /></button>
          </div>
          <div className="widget-body" style={{ padding: '8px 0' }}>
            {myTasks.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>🎉 All tasks done!</div>
            ) : myTasks.map(task => (
              <div key={task._id}
                onClick={() => navigate(`/projects/${typeof task.project === 'object' ? task.project._id : task.project}`)}
                style={{ padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center', transition: 'var(--transition)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3, color: isOverdue(task) ? 'var(--red)' : undefined }}>
                    {isOverdue(task) && <AlertCircle size={12} style={{ display: 'inline', marginRight: 4 }} />}
                    {task.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 8 }}>
                    <span>{typeof task.project === 'object' ? task.project.name : ''}</span>
                    {task.dueDate && (
                      <span style={{ color: isOverdue(task) ? 'var(--red)' : undefined, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={10} /> {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant={task.priority}>{task.priority}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="widget">
        <div className="widget-header">
          <span className="widget-title">📊 Recent Activity</span>
        </div>
        <div className="widget-body">
          {recentActivity.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>No recent activity</p>
          ) : (
            <div>
              {recentActivity.map(a => (
                <div key={a._id} className="activity-item">
                  <div className="activity-dot">{ACTION_EMOJI[a.action] || ACTION_EMOJI.default}</div>
                  <div>
                    <div className="activity-text">
                      <strong>{a.user?.name || 'Someone'}</strong>{' '}
                      {a.action.replace(/_/g, ' ')}{' '}
                      {a.details?.projectName && <strong>{String(a.details.projectName)}</strong>}
                      {a.details?.taskTitle && <strong>"{String(a.details.taskTitle)}"</strong>}
                    </div>
                    <div className="activity-time">{new Date(a.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
