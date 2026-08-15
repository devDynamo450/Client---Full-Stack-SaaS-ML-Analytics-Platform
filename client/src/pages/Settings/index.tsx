import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { User, Shield, Bell, Palette } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [tab, setTab] = useState('profile');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const toggleTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const updateProfile = useMutation({
    mutationFn: (data: { name: string }) => api.put('/users/profile', data),
    onSuccess: (res) => {
      updateUser(res.data.data);
      toast.success('Profile updated!');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const cancelSub = useMutation({
    mutationFn: () => api.delete('/subscriptions/cancel'),
    onSuccess: () => toast.success('Subscription cancelled'),
    onError: () => toast.error('Failed'),
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User size={16} /> },
    { id: 'subscription', label: 'Subscription', icon: <Shield size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
  ];

  return (
    <div>
      <div className="section-header mb-8">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Settings</h1>
          <p className="text-muted">Manage your account and preferences</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Sidebar Tabs */}
        <div style={{ width: 200, flexShrink: 0 }}>
          {tabs.map(t => (
            <button key={t.id} className={`nav-item w-full ${tab === t.id ? 'active' : ''}`} style={{ marginBottom: 2, border: 'none', background: tab === t.id ? 'var(--accent-light)' : 'none', textAlign: 'left' }} onClick={() => setTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }}>
          {tab === 'profile' && (
            <div className="card">
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Profile Information</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div className="user-avatar" style={{ width: 64, height: 64, fontSize: 22 }}>
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{user?.email}</div>
                  <span className={`badge badge-${user?.role}`} style={{ marginTop: 4 }}>{user?.role}</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" value={user?.email} disabled style={{ opacity: 0.5 }} />
              </div>
              <button className="btn btn-primary" onClick={() => updateProfile.mutate({ name })} disabled={updateProfile.isPending}>
                {updateProfile.isPending ? <span className="spinner" /> : 'Save Changes'}
              </button>
            </div>
          )}

          {tab === 'subscription' && (
            <div className="card">
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Subscription</h2>
              <div style={{ padding: 20, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span className="text-muted">Current Plan</span>
                  <span className={`badge badge-${user?.subscription?.plan}`}>{user?.subscription?.plan}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span className="text-muted">Status</span>
                  <span style={{ color: user?.subscription?.status === 'active' ? 'var(--green)' : 'var(--red)' }}>
                    {user?.subscription?.status}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Start Date</span>
                  <span>{user?.subscription?.startDate ? new Date(user.subscription.startDate).toLocaleDateString() : '—'}</span>
                </div>
              </div>
              {user?.subscription?.plan !== 'free' && (
                <button className="btn btn-danger" onClick={() => cancelSub.mutate()} disabled={cancelSub.isPending}>
                  Cancel Subscription
                </button>
              )}
            </div>
          )}

          {tab === 'notifications' && (
            <div className="card">
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Notification Preferences</h2>
              {[
                { label: 'Task assignments', desc: 'When a task is assigned to you' },
                { label: 'Task status changes', desc: 'When tasks you created are updated' },
                { label: 'Project updates', desc: 'When your projects are modified' },
                { label: 'Billing alerts', desc: 'Subscription and payment notifications' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{item.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.desc}</div>
                  </div>
                  <label style={{ cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
                  </label>
                </div>
              ))}
              <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => toast.success('Preferences saved!')}>Save Preferences</button>
            </div>
          )}

          {tab === 'appearance' && (
            <div className="card">
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Appearance</h2>
              <div 
                onClick={() => toggleTheme('dark')}
                style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', marginBottom: 12, border: theme === 'dark' ? '2px solid var(--accent)' : '1px solid var(--border)', cursor: 'pointer' }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>🌑 Dark Theme</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Professional dark theme, easy on the eyes</div>
              </div>
              <div 
                onClick={() => toggleTheme('light')}
                style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: theme === 'light' ? '2px solid var(--accent)' : '1px solid var(--border)', cursor: 'pointer' }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>☀️ Light Theme (Glassmorphic)</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Bright, clean, and modern frosted glass design</div>
              </div>

              {/* Danger Zone */}
              <div style={{ marginTop: 32, padding: 20, border: '1px solid var(--red)', borderRadius: 'var(--radius-sm)' }}>
                <h3 style={{ color: 'var(--red)', marginBottom: 8 }}>Danger Zone</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>These actions are permanent and cannot be undone.</p>
                <button className="btn btn-danger" onClick={() => { logout(); window.location.href = '/login'; }}>Sign Out All Devices</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
