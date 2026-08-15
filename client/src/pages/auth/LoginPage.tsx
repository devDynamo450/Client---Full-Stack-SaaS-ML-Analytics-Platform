import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error?.response?.data?.error || 'Login failed');
    }
  };

  const fillDemo = (role: string) => {
    const demos: Record<string, { email: string; password: string }> = {
      admin: { email: 'admin@projectflow.com', password: 'admin123' },
      manager: { email: 'sarah@projectflow.com', password: 'password123' },
      member: { email: 'alex@projectflow.com', password: 'password123' },
    };
    setEmail(demos[role].email);
    setPassword(demos[role].password);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon" style={{ width: 56, height: 56, margin: '0 auto 12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
          </div>
          <h1>Welcome back</h1>
          <p>Sign in to your Client account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button className="btn btn-primary w-full btn-lg" type="submit" disabled={isLoading} style={{ marginTop: 8 }}>
            {isLoading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider" style={{ margin: '20px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Quick Demo Login</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['admin', 'manager', 'member'].map(role => (
            <button key={role} className="btn btn-secondary btn-sm" style={{ flex: 1, textTransform: 'capitalize' }} onClick={() => fillDemo(role)}>{role}</button>
          ))}
        </div>

        <div className="auth-link">
          Don't have an account? <Link to="/register">Sign up free</Link>
        </div>
      </div>
    </div>
  );
}
