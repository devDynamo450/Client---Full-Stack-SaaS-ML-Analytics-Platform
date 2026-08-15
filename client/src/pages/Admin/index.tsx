import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, DollarSign, TrendingUp, FolderKanban, Search, Shield } from 'lucide-react';

interface AdminStats {
  totalUsers: number; activeUsers: number; newUsersThisMonth: number;
  totalRevenue: number; revenueThisMonth: number; totalProjects: number; totalTasks: number;
  subscriptionBreakdown: Record<string, number>;
  userGrowth: { date: string; value: number }[];
  revenueGrowth: { date: string; value: number }[];
  recentPayments: { plan: string; amount: number; createdAt: string }[];
}
interface AdminUser { _id: string; name: string; email: string; role: string; isActive: boolean; 'subscription.plan'?: string; subscription: { plan: string; status: string }; createdAt: string; }

export default function AdminPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const qc = useQueryClient();

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data.data),
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users', search, roleFilter],
    queryFn: () => api.get(`/admin/users?search=${search}&role=${roleFilter}&limit=20`).then(r => r.data),
  });

  const updateUser = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => api.patch(`/admin/users/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); qc.invalidateQueries({ queryKey: ['admin-stats'] }); toast.success('User updated'); },
  });

  const users: AdminUser[] = usersData?.data || [];

  const summaryStats = stats ? [
    { label: 'Total Users', value: stats.totalUsers, sub: `+${stats.newUsersThisMonth} this month`, icon: <Users size={20} />, color: '#6366f1', bg: 'var(--accent-light)' },
    { label: 'Total Revenue', value: `$${stats.totalRevenue}`, sub: `$${stats.revenueThisMonth} this month`, icon: <DollarSign size={20} />, color: '#10b981', bg: 'var(--green-light)' },
    { label: 'Active Projects', value: stats.totalProjects, icon: <FolderKanban size={20} />, color: '#f59e0b', bg: 'var(--yellow-light)' },
    { label: 'Total Tasks', value: stats.totalTasks, icon: <TrendingUp size={20} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  ] : [];

  return (
    <div>
      <div className="section-header mb-8">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
            <Shield size={22} style={{ display: 'inline', marginRight: 8, color: 'var(--red)' }} />Admin Dashboard
          </h1>
          <p className="text-muted">Full platform overview and management</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid mb-6">
        {summaryStats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            {s.sub && <div className="stat-change">{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Plan Breakdown */}
      <div className="mb-6" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="chart-container" style={{ flex: 1 }}>
            <div className="chart-title">Subscription Breakdown</div>
            {stats && Object.entries(stats.subscriptionBreakdown).map(([plan, count]) => (
              <div key={plan} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span className={`badge badge-${plan}`} style={{ minWidth: 80 }}>{plan}</span>
                <div className="progress-bar" style={{ flex: 1 }}>
                  <div className="progress-fill" style={{ width: `${stats.totalUsers ? (count / stats.totalUsers) * 100 : 0}%` }} />
                </div>
                <span className="text-xs text-muted">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-title">User Growth (6 months)</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={stats?.userGrowth || []}>
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="chart-container mb-6">
        <div className="chart-title">Revenue Growth (6 months)</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={stats?.revenueGrowth || []}>
            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} formatter={(val) => [`$${val}`, 'Revenue']} />
            <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* User Management */}
      <div className="card">
        <div className="section-header mb-4">
          <h2 className="section-title">User Management</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="search-wrapper">
              <Search size={14} className="search-icon" />
              <input className="search-input" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-input" style={{ width: 120 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="member">Member</option>
              <option value="guest">Guest</option>
            </select>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>User</th><th>Role</th><th>Plan</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                  </td>
                  <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                  <td><span className={`badge badge-${u.subscription?.plan}`}>{u.subscription?.plan}</span></td>
                  <td>
                    <span style={{ fontSize: 12, color: u.isActive ? 'var(--green)' : 'var(--red)' }}>
                      {u.isActive ? '● Active' : '● Inactive'}
                    </span>
                  </td>
                  <td className="text-muted text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <select
                        className="form-input"
                        style={{ padding: '4px 8px', fontSize: 12, width: 100 }}
                        value={u.role}
                        onChange={e => updateUser.mutate({ id: u._id, data: { role: e.target.value } })}
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="member">Member</option>
                        <option value="guest">Guest</option>
                      </select>
                      <button
                        className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-secondary'}`}
                        onClick={() => updateUser.mutate({ id: u._id, data: { isActive: !u.isActive } })}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
