import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useSocketStore } from '../../store/socketStore';
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import {
  LayoutDashboard, FolderKanban, CheckSquare, CreditCard,
  Settings, Shield, Bell, LogOut, Search, Zap, Activity
} from 'lucide-react';

interface Notification { _id: string; title: string; message: string; read: boolean; createdAt: string; type: string; }

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const { connected } = useSocketStore();
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const { data: notifData, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    refetchInterval: 30000,
  });

  const notifications: Notification[] = notifData?.data || [];
  const unreadCount: number = notifData?.unreadCount || 0;

  const markAllRead = async () => { await api.patch('/notifications/read-all'); refetch(); };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/projects', icon: <FolderKanban size={18} />, label: 'Projects' },
    { to: '/tasks', icon: <CheckSquare size={18} />, label: 'My Tasks' },
    { to: '/expenses', icon: <Activity size={18} />, label: 'Expenses & ML' },
    { to: '/pricing', icon: <CreditCard size={18} />, label: 'Billing & Plans' },
  ];

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
          </div>
          <div className="logo-text">Client</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">Workspace</div>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              {item.icon} {item.label}
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <>
              <div className="nav-label">Admin</div>
              <NavLink to="/admin" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <Shield size={18} /> Admin Panel
              </NavLink>
            </>
          )}

          <div className="nav-label">Account</div>
          <NavLink to="/settings" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Settings size={18} /> Settings
          </NavLink>
          <button className="nav-item w-full" style={{ border: 'none', background: 'none', textAlign: 'left' }}
            onClick={() => { logout(); navigate('/login'); }}>
            <LogOut size={18} /> Logout
          </button>
        </nav>

        {/* User info + WS status */}
        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name">{user?.name}</div>
            <div className="user-plan">{user?.subscription?.plan} plan</div>
          </div>
        </div>
        <div style={{ padding: '8px 16px 16px', display: 'flex', justifyContent: 'center' }}>
          <div className={`ws-indicator ${connected ? 'connected' : 'disconnected'}`}>
            <div className={`ws-dot ${connected ? 'on' : 'off'}`} />
            {connected ? 'Live' : 'Offline'}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <div className="search-wrapper">
            <Search size={14} className="search-icon" />
            <input className="search-input" placeholder="Search projects, tasks..." />
          </div>

          <div className="topbar-actions">
            {user?.subscription?.plan === 'free' && (
              <button className="btn btn-sm btn-primary" onClick={() => navigate('/pricing')}>
                <Zap size={14} /> Upgrade
              </button>
            )}

            {/* Role chip */}
            <div className={`role-chip ${user?.role}`}>{user?.role}</div>

            {/* Notifications */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button className="btn btn-ghost btn-sm" style={{ position: 'relative' }} onClick={() => setShowNotif(!showNotif)}>
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, background: 'var(--red)', borderRadius: '50%' }} />
                )}
              </button>

              {showNotif && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <span style={{ fontWeight: 700 }}>Notifications {unreadCount > 0 && `(${unreadCount})`}</span>
                    {unreadCount > 0 && <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Mark all read</button>}
                  </div>
                  <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No notifications</div>
                    ) : notifications.map(n => (
                      <div key={n._id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
                        <div className="notif-title">{n.title}</div>
                        <div className="notif-msg">{n.message}</div>
                        <div className="notif-time">{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="user-avatar" style={{ cursor: 'pointer' }} onClick={() => navigate('/settings')}>{initials}</div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
