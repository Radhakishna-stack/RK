import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Receipt, Search, Calendar, FileText, IndianRupee, Loader2, Trash2 } from 'lucide-react';
import { dbService } from '../db';
import { Expense } from '../types';

const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState<{
    title: string;
    amount: number;
    notes: string;
    paymentMode: 'Cash' | 'UPI' | 'Card' | 'Cheque';
  }>({
    title: '',
    amount: 0,
    notes: '',
    paymentMode: 'Cash'
  });

  // Fetch data on mount
  useEffect(() => {
    dbService.getExpenses().then(data => {
      setExpenses(data);
      setLoading(false);
    });
  }, []);

  const totalExpense = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const newExpense = await dbService.addExpense(formData);
    setExpenses([newExpense, ...expenses]);
    setIsModalOpen(false);
    setFormData({ title: '', amount: 0, notes: '', paymentMode: 'Cash' });
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this expense record?")) {
      setLoading(true);
      await dbService.deleteExpense(id);
      setExpenses(expenses.filter(e => e.id !== id));
      setLoading(false);
    }
  };

  if (loading && expenses.length === 0) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-red-500" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Expenses</h2>
          <p className="text-slate-500">Track business overheads and miscellaneous costs</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
        >
          <Plus className="w-5 h-5" />
          Add Expense
        </button>
      </header>

      {/* Summary Card */}
      <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-red-100 rounded-xl text-red-600">
            <IndianRupee className="w-8 h-8" />
          </div>
          <div>
            <p className="text-red-700 font-bold uppercase tracking-widest text-xs">Total Outflow</p>
            <h4 className="text-3xl font-black text-red-900">₹{totalExpense.toLocaleString()}</h4>
          </div>
        </div>
        <TrendingTrend value={-12.5} />
      </div>

      {/* Expense List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {expenses.map(expense => (
          <div key={expense.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-red-100 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-slate-50 rounded-lg"><Receipt className="w-5 h-5 text-slate-400" /></div>
              <div className="flex items-center gap-2">
                 <span className="text-lg font-black text-red-600">₹{expense.amount.toLocaleString()}</span>
                 <button onClick={() => handleDelete(expense.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 transition-all">
                    <Trash2 className="w-4 h-4" />
                 </button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">{expense.title}</h3>
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-4">
              <Calendar className="w-3 h-3" />
              {new Date(expense.date).toLocaleDateString()}
            </div>
            {expense.notes && (
              <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg text-sm text-slate-600 italic">
                <FileText className="w-4 h-4 text-slate-300 shrink-0" />
                {expense.notes}
              </div>
            )}
            <div className="mt-4 flex justify-between items-center text-[10px] text-slate-300 font-mono">
               <span>{expense.id}</span>
               <span className="font-bold text-slate-400 uppercase">{expense.paymentMode}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">New Expense</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expense Title</label>
                <input 
                  required 
                  placeholder="e.g. Rent, Electricity, Tool Purchase"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
                <input 
                  required 
                  type="number"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Mode</label>
                <select 
                  required 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  value={formData.paymentMode}
                  onChange={e => setFormData({...formData, paymentMode: e.target.value as any})}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                <textarea 
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none"
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 shadow-lg shadow-red-500/20"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const TrendingTrend: React.FC<{ value: number }> = ({ value }) => (
  <div className={`px-3 py-1 rounded-full text-xs font-bold ${value > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
    {value > 0 ? '+' : ''}{value}% from last month
  </div>
);

export default ExpensesPage;