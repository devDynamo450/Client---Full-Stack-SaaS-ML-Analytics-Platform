import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, X, FolderKanban, Calendar } from 'lucide-react';

interface Project {
  _id: string; name: string; description: string; status: string;
  progress: number; tags: string[]; coverColor: string;
  taskCount: { total: number; completed: number };
  members: { user: { name: string } }[];
  dueDate?: string;
}

const STATUS_COLORS: Record<string, string> = {
  planning: '#3b82f6', active: '#10b981', on_hold: '#f59e0b', completed: '#6366f1', archived: '#666688'
};

export default function ProjectsPage() {
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ name: '', description: '', dueDate: '', coverColor: '#6366f1' });
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['projects', filter],
    queryFn: () => api.get(`/projects${filter !== 'all' ? `?status=${filter}` : ''}`).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/projects', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created!');
      setShowModal(false);
      setForm({ name: '', description: '', dueDate: '', coverColor: '#6366f1' });
    },
    onError: (err: unknown) => { const e = err as { response?: { data?: { error?: string } } }; toast.error(e?.response?.data?.error || 'Failed'); },
  });

  const projects: Project[] = data?.data || [];
  const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#3b82f6'];

  return (
    <div>
      <div className="section-header mb-8">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Projects</h1>
          <p className="text-muted">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['all','planning','active','on_hold','completed','archived'].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="loading-screen" style={{ height: 300 }}><div className="spinner" /></div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <FolderKanban size={48} style={{ margin: '0 auto 16px', display: 'block' }} />
          <h3>No projects found</h3>
          <p>Create your first project to start managing work</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Project</button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(p => (
            <div key={p._id} className="project-card" onClick={() => navigate(`/projects/${p._id}`)}>
              <div className="project-card-header" style={{ background: p.coverColor || STATUS_COLORS[p.status] || '#6366f1' }} />
              <div className="project-card-body">
                <div className="flex items-center justify-between mb-2">
                  <span className={`badge badge-${p.status}`}>{p.status.replace('_', ' ')}</span>
                  <span className="text-xs text-muted">{p.taskCount?.completed}/{p.taskCount?.total} tasks</span>
                </div>
                <div className="project-name">{p.name}</div>
                <div className="project-desc">{p.description || 'No description'}</div>
                {p.tags?.length > 0 && (
                  <div className="project-tags">
                    {p.tags.slice(0, 3).map(t => <span key={t} className="project-tag">#{t}</span>)}
                  </div>
                )}
                <div className="progress-bar mb-2">
                  <div className="progress-fill" style={{ width: `${p.progress || 0}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="project-members">
                    {p.members?.slice(0, 4).map((m, i) => (
                      <div key={i} className="member-avatar">{m.user?.name?.[0] || '?'}</div>
                    ))}
                    {p.members?.length > 4 && <div className="member-avatar">+{p.members.length - 4}</div>}
                  </div>
                  {p.dueDate && (
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <Calendar size={12} /> {new Date(p.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">New Project</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Website Redesign" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What is this project about?" rows={3} />
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input className="form-input" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Cover Color</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => setForm({ ...form, coverColor: c })} style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: form.coverColor === c ? '3px solid white' : 'none', cursor: 'pointer' }} />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn btn-secondary w-full" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary w-full" onClick={() => createMutation.mutate(form)} disabled={!form.name || createMutation.isPending}>
                {createMutation.isPending ? <span className="spinner" /> : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
