import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { Check, X, CreditCard, FileText } from 'lucide-react';

const PLANS = [
  { id: 'free', name: 'Free', price: 0, desc: 'For individuals', features: ['3 projects', '5 team members', '1 GB storage', 'Basic analytics'], notFeatures: ['Priority support', 'API access', 'Custom integrations'] },
  { id: 'starter', name: 'Starter', price: 9, desc: 'For small teams', features: ['10 projects', '15 team members', '10 GB storage', 'API access'], notFeatures: ['Advanced analytics', 'Priority support', 'Custom integrations'] },
  { id: 'pro', name: 'Pro', price: 29, desc: 'For growing teams', features: ['50 projects', '50 team members', '100 GB storage', 'Advanced analytics', 'Priority support', 'API access'], notFeatures: ['Custom integrations'], popular: true },
  { id: 'enterprise', name: 'Enterprise', price: 99, desc: 'For large orgs', features: ['Unlimited projects', 'Unlimited members', '1 TB storage', 'Everything in Pro', 'Custom integrations', 'SLA guarantee'], notFeatures: [] },
];

export default function PricingPage() {
  const user = useAuthStore(s => s.user);
  const updateUser = useAuthStore(s => s.updateUser);
  const [payForm, setPayForm] = useState({ cardNumber: '', cardExpiry: '', cardCVC: '' });
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);

  const { data: historyData } = useQuery({
    queryKey: ['payment-history'],
    queryFn: () => api.get('/subscriptions/payments').then(r => r.data.data),
  });

  const subscribeMutation = useMutation({
    mutationFn: (data: { planId: string; cardNumber: string; cardExpiry: string; cardCVC: string }) =>
      api.post('/subscriptions/subscribe', data),
    onSuccess: (res) => {
      toast.success(res.data.message);
      setShowPayModal(false);
      setPayForm({ cardNumber: '', cardExpiry: '', cardCVC: '' });
      // Update user subscription in store
      if (user) updateUser({ ...user, subscription: { ...user.subscription, plan: selectedPlan || user.subscription.plan, status: 'active', startDate: new Date().toISOString() } });
    },
    onError: (err: unknown) => { const e = err as { response?: { data?: { error?: string } } }; toast.error(e?.response?.data?.error || 'Payment failed'); },
  });

  const handleSubscribe = (planId: string) => {
    if (planId === 'free') { toast('You are already on the Free plan'); return; }
    setSelectedPlan(planId);
    setShowPayModal(true);
  };

  const handleViewInvoice = async (paymentId: string) => {
    try {
      const res = await api.get(`/subscriptions/payments/${paymentId}/invoice`);
      const newWin = window.open('', '_blank');
      if (newWin) {
        newWin.document.write(res.data);
        newWin.document.close();
      }
    } catch (error) {
      toast.error('Failed to load invoice');
    }
  };

  const payments: { _id: string; plan: string; amount: number; status: string; transactionId: string; createdAt: string }[] = historyData || [];
  const currentPlan = user?.subscription?.plan;

  return (
    <div>
      <div className="section-header mb-8">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Billing & Plans</h1>
          <p className="text-muted">Current plan: <span className={`badge badge-${currentPlan}`} style={{ marginLeft: 4 }}>{currentPlan}</span></p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="pricing-grid mb-8">
        {PLANS.map(plan => (
          <div key={plan.id} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
            {plan.popular && <div className="popular-badge">⭐ Most Popular</div>}
            <div className="pricing-plan">{plan.name}</div>
            <div className="pricing-price">${plan.price}<span>/mo</span></div>
            <div className="pricing-desc">{plan.desc}</div>
            <ul className="pricing-features">
              {plan.features.map(f => <li key={f}><Check size={14} className="check" />{f}</li>)}
              {plan.notFeatures.map(f => <li key={f} style={{ opacity: 0.4 }}><X size={14} className="cross" />{f}</li>)}
            </ul>
            <button
              className={`btn w-full ${currentPlan === plan.id ? 'btn-secondary' : 'btn-primary'}`}
              disabled={currentPlan === plan.id}
              onClick={() => handleSubscribe(plan.id)}
            >
              {currentPlan === plan.id ? '✓ Current Plan' : plan.price === 0 ? 'Downgrade' : 'Upgrade'}
            </button>
          </div>
        ))}
      </div>

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="card">
          <h2 className="section-title mb-4">Payment History</h2>
          <div className="table-container">
            <table>
              <thead><tr><th>Date</th><th>Plan</th><th>Amount</th><th>Status</th><th>Transaction ID</th><th>Invoice</th></tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p._id}>
                    <td className="text-muted">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td><span className={`badge badge-${p.plan}`}>{p.plan}</span></td>
                    <td style={{ fontWeight: 600 }}>${p.amount}</td>
                    <td><span className={`badge badge-${p.status === 'completed' ? 'active' : p.status}`}>{p.status}</span></td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.transactionId}</td>
                    <td>
                      {p.status === 'completed' && (
                        <button onClick={() => handleViewInvoice(p._id)} className="btn btn-ghost btn-sm" title="View Invoice">
                          <FileText size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowPayModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title"><CreditCard size={18} style={{ marginRight: 8 }} />Payment Details</h2>
              <button className="modal-close" onClick={() => setShowPayModal(false)}><X size={20} /></button>
            </div>
            <div style={{ padding: '12px 16px', background: 'var(--blue-light)', borderRadius: 'var(--radius-sm)', marginBottom: 20, fontSize: 13, color: 'var(--blue)' }}>
              🧪 Test: Use card <strong>4242 4242 4242 4242</strong> to succeed, or <strong>4000 0000 0000 0002</strong> to decline
            </div>
            <div className="form-group">
              <label className="form-label">Card Number</label>
              <input className="form-input" value={payForm.cardNumber} onChange={e => setPayForm({ ...payForm, cardNumber: e.target.value })} placeholder="4242 4242 4242 4242" maxLength={19} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Expiry</label>
                <input className="form-input" value={payForm.cardExpiry} onChange={e => setPayForm({ ...payForm, cardExpiry: e.target.value })} placeholder="MM/YY" maxLength={5} />
              </div>
              <div className="form-group">
                <label className="form-label">CVC</label>
                <input className="form-input" value={payForm.cardCVC} onChange={e => setPayForm({ ...payForm, cardCVC: e.target.value })} placeholder="123" maxLength={3} />
              </div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Upgrading to:</span>
                <strong className={`badge badge-${selectedPlan}`}>{selectedPlan}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span>Total/month:</span>
                <strong>${PLANS.find(p => p.id === selectedPlan)?.price}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary w-full" onClick={() => setShowPayModal(false)}>Cancel</button>
              <button className="btn btn-primary w-full" disabled={subscribeMutation.isPending || !payForm.cardNumber}
                onClick={() => subscribeMutation.mutate({ planId: selectedPlan!, ...payForm })}>
                {subscribeMutation.isPending ? <span className="spinner" /> : 'Pay & Upgrade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
