interface BadgeProps {
  variant: string;
  children: React.ReactNode;
  size?: 'sm' | 'md';
}

export function Badge({ variant, children, size = 'md' }: BadgeProps) {
  return (
    <span className={`badge badge-${variant} ${size === 'sm' ? 'text-xs' : ''}`}>
      {children}
    </span>
  );
}

interface AvatarProps {
  name: string;
  size?: number;
  src?: string;
}

export function Avatar({ name, size = 32, src }: AvatarProps) {
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  return (
    <div
      className="user-avatar"
      style={{ width: size, height: size, fontSize: size * 0.4, flexShrink: 0 }}
      title={name}
    >
      {src ? <img src={src} alt={name} /> : initials}
    </div>
  );
}

interface AvatarGroupProps {
  members: { name: string; avatar?: string }[];
  max?: number;
  size?: number;
}

export function AvatarGroup({ members, max = 4, size = 28 }: AvatarGroupProps) {
  const visible = members.slice(0, max);
  const overflow = members.length - max;
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {visible.map((m, i) => (
        <div key={i} style={{ marginLeft: i > 0 ? -8 : 0 }}>
          <Avatar name={m.name} size={size} src={m.avatar} />
        </div>
      ))}
      {overflow > 0 && (
        <div className="user-avatar" style={{ width: size, height: size, fontSize: size * 0.35, marginLeft: -8, background: 'var(--bg-hover)', border: '2px solid var(--bg-card)', color: 'var(--text-muted)' }}>
          +{overflow}
        </div>
      )}
    </div>
  );
}

interface ProgressProps {
  value: number;
  showLabel?: boolean;
  color?: string;
  height?: number;
}

export function Progress({ value, showLabel = false, height = 6 }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
      <div className="progress-bar" style={{ flex: 1, height }}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      {showLabel && <span className="text-xs text-muted" style={{ minWidth: 32 }}>{pct}%</span>}
    </div>
  );
}

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 6, style }: SkeletonProps) {
  return (
    <div style={{
      width, height, borderRadius,
      background: 'linear-gradient(90deg, var(--bg-card) 25%, var(--bg-hover) 50%, var(--bg-card) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      ...style,
    }} />
  );
}

export function CardSkeleton() {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Skeleton height={20} width="60%" />
      <Skeleton height={14} />
      <Skeleton height={14} width="80%" />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <Skeleton height={24} width={70} borderRadius={20} />
        <Skeleton height={24} width={70} borderRadius={20} />
      </div>
    </div>
  );
}

interface EmptyProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function Empty({ icon, title, description, action }: EmptyProps) {
  return (
    <div className="empty-state">
      <div style={{ opacity: 0.3, marginBottom: 16 }}>{icon}</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bg: string;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
}

export function StatCard({ label, value, icon, color, bg, change, changeType }: StatCardProps) {
  const changeColor = changeType === 'up' ? 'var(--green)' : changeType === 'down' ? 'var(--red)' : 'var(--text-muted)';
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: bg, color }}>{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {change && <div className="stat-change" style={{ color: changeColor }}>{change}</div>}
    </div>
  );
}

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmModal({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, onConfirm, onCancel, loading }: ConfirmModalProps) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onCancel}>{cancelLabel}</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={loading}>
            {loading ? <span className="spinner" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }} title={content}>
      {children}
    </div>
  );
}
