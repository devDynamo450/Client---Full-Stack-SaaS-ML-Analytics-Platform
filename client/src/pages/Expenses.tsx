import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { DollarSign, TrendingUp, Plus, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

interface Expense {
  _id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [predictionData, setPredictionData] = useState<{ prediction: number, chartData: string } | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await api.get('/expenses');
      if (res.data.success) {
        setExpenses(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch expenses', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrediction = async () => {
    try {
      toast.loading('Analyzing data with ML...', { id: 'ml-load' });
      const res = await api.get('/expenses/predict');
      if (res.data.success) {
        setPredictionData({
          prediction: res.data.prediction,
          chartData: res.data.chartData
        });
        toast.success('ML Prediction generated!', { id: 'ml-load' });
      } else {
        toast.error(res.data.error, { id: 'ml-load' });
      }
    } catch (error) {
      toast.error('Failed to get ML prediction.', { id: 'ml-load' });
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return toast.error('Amount and Category required');
    
    try {
      const res = await api.post('/expenses', {
        amount: Number(amount),
        category,
        description,
        date: new Date(date)
      });
      
      if (res.data.success) {
        toast.success('Expense added successfully');
        setAmount('');
        setCategory('');
        setDescription('');
        fetchExpenses();
        // Automatically refresh ML if data exists
        if (predictionData) fetchPrediction();
      }
    } catch (error) {
      toast.error('Failed to add expense');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div><p>Loading expenses...</p></div>;

  return (
    <div className="page-content">
      <div className="section-header">
        <h1 className="section-title">Expenses & ML Predictions</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><DollarSign /></div>
          <div className="stat-value">
            ${expenses.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
          </div>
          <div className="stat-label">Total Historical Expenses</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><TrendingUp /></div>
          <div className="stat-value">
            {predictionData ? `$${predictionData.prediction.toFixed(2)}` : 'N/A'}
          </div>
          <div className="stat-label">Next Month Prediction (ML)</div>
        </div>
      </div>

      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        
        {/* Add Expense Form */}
        <div className="card">
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2"><Plus size={16} /> Add Expense</h2>
          <form onSubmit={handleAddExpense}>
            <div className="form-group">
              <label className="form-label">Amount ($)</label>
              <input type="number" className="form-input" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <input type="text" className="form-input" value={category} onChange={e => setCategory(e.target.value)} placeholder="Software, Marketing, etc." />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input type="text" className="form-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief note" />
            </div>
            <button type="submit" className="btn btn-primary w-full mt-2">Record Expense</button>
          </form>
        </div>

        {/* ML Prediction Visuals */}
        <div className="card flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold flex items-center gap-2"><Activity size={16} /> Matplotlib Analytics</h2>
            <button className="btn btn-secondary btn-sm" onClick={fetchPrediction}>Run ML Model</button>
          </div>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px dashed rgba(0,0,0,0.1)' }}>
            {predictionData ? (
              <img src={predictionData.chartData} alt="ML Prediction Chart" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
            ) : (
              <div className="text-center text-muted">
                <Activity size={32} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                <p>Click "Run ML Model" to train the model and generate a Matplotlib chart.</p>
                <p className="text-xs mt-2">Requires at least 2 distinct months of data.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
