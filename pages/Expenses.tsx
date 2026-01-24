
import React, { useState, useEffect } from 'react';
import {
  Plus, Search, DollarSign, Calendar, Trash2, Tag, TrendingDown, ArrowLeft
} from 'lucide-react';
import { dbService } from '../db';
import { Expense } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';

interface ExpensesPageProps {
  onNavigate: (tab: string) => void;
}

const ExpensesPage: React.FC<ExpensesPageProps> = ({ onNavigate }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'Cash'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await dbService.getExpenses();
      setExpenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await dbService.addExpense({
        ...formData,
        amount: parseFloat(formData.amount)
      });

      await loadData();
      setIsModalOpen(false);
      setFormData({ description: '', amount: '', category: '', date: new Date().toISOString().split('T')[0], paymentMode: 'Cash' });
    } catch (err) {
      alert('Failed to add expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this expense? This action cannot be undone.')) {
      await dbService.deleteExpense(id);
      loadData();
    }
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const thisMonthExpenses = expenses
    .filter(exp => new Date(exp.date).getMonth() === new Date().getMonth())
    .reduce((sum, exp) => sum + exp.amount, 0);

  // Common categories
  const categories = ['Rent', 'Utilities', 'Salaries', 'Stock Purchase', 'Maintenance', 'Other'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('home')} className="text-slate-700 hover:bg-slate-100 p-2 -ml-2 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
            <p className="text-sm text-slate-600 mt-1">{expenses.length} total expenses</p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-red-500 to-red-600 border-0 text-white">
          <div>
            <p className="text-sm text-red-100 mb-1">This Month</p>
            <h2 className="text-3xl font-bold">₹{thisMonthExpenses.toLocaleString()}</h2>
          </div>
        </Card>

        <Card className="bg-white">
          <div>
            <p className="text-sm text-slate-600 mb-1">Total Expenses</p>
            <h2 className="text-3xl font-bold text-red-600">₹{totalExpenses.toLocaleString()}</h2>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Input
        type="text"
        placeholder="Search by description or category..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        icon={<Search className="w-5 h-5" />}
      />

      {/* Expenses List */}
      <div className="space-y-3">
        {filteredExpenses.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <TrendingDown className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {searchTerm ? 'No matching expenses' : 'No expenses recorded'}
              </h3>
              <p className="text-slate-600 mb-4">
                {searchTerm ? 'Try a different search term' : 'Add your first expense to start tracking'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="w-5 h-5 mr-2" />
                  Add First Expense
                </Button>
              )}
            </div>
          </Card>
        ) : (
          filteredExpenses.map((expense) => (
            <Card key={expense.id} padding="md">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900">{expense.description}</h3>
                    <Badge variant="neutral" size="sm">
                      <Tag className="w-3 h-3 mr-1" />
                      {expense.category}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(expense.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span>{expense.paymentMode}</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <p className="text-2xl font-bold text-red-600">₹{expense.amount.toLocaleString()}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(expense.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Expense"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Description"
            type="text"
            required
            placeholder="What was this expense for?"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount"
              type="number"
              required
              placeholder="₹ 0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              icon={<DollarSign className="w-5 h-5" />}
            />

            <Input
              label="Date"
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              icon={<Calendar className="w-5 h-5" />}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat })}
                  className={`
                    p-2 rounded-xl font-semibold text-xs transition-all
                    ${formData.category === cat
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
                  `}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">
              Payment Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Cash', 'Card', 'UPI'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentMode: mode })}
                  className={`
                    p-3 rounded-xl font-semibold text-sm transition-all
                    ${formData.paymentMode === mode
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
                  `}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 mt-6 flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="flex-1"
            >
              Add Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExpensesPage;