
import React, { useState, useEffect } from 'react';
import {
  Plus, Clock, TrendingUp, Receipt, ArrowDownCircle, AlertCircle,
  ClipboardCheck, Users, Package, Bike, Phone, Wallet
} from 'lucide-react';
import { dbService } from '../db';
import { Invoice, Customer, DashboardStats, Complaint, ComplaintStatus } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statData, compData, invData] = await Promise.all([
        dbService.getDashboardStats(),
        dbService.getComplaints(),
        dbService.getInvoices()
      ]);
      setStats(statData);
      setComplaints(compData);
      setRecentInvoices(invData.slice(0, 5)); // Only show 5 most recent
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate job counts
  const pendingJobs = complaints.filter(c => c.status === ComplaintStatus.PENDING).length;
  const activeJobs = complaints.filter(c => c.status === ComplaintStatus.IN_PROGRESS).length;
  const completedJobs = complaints.filter(c => c.status === ComplaintStatus.COMPLETED).length;

  // Get today's date
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">Welcome Back!</h1>
        <p className="text-sm text-slate-600">{today}</p>
      </div>

      {/* Today's Revenue - Most Important Metric */}
      <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-100 mb-1">Today's Revenue</p>
            <h2 className="text-4xl font-bold">₹{(stats?.totalReceived || 0).toLocaleString()}</h2>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <Wallet className="w-8 h-8" />
          </div>
        </div>
      </Card>

      {/* Quick Actions - 6 Most Common */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          <QuickAction icon={<ClipboardCheck />} label="New Job" onClick={() => onNavigate('complaints')} />
          <QuickAction icon={<Receipt />} label="New Sale" onClick={() => onNavigate('sales')} />
          <QuickAction icon={<Package />} label="Stock" onClick={() => onNavigate('items')} />
          <QuickAction icon={<TrendingUp />} label="Reports" onClick={() => onNavigate('sale_report')} />
          <QuickAction icon={<ArrowDownCircle />} label="Payment In" onClick={() => onNavigate('payment_receipt')} />
        </div>
      </div>

      {/* Workshop Status */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Workshop Status</h2>
        <div onClick={() => onNavigate('complaints')}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="grid grid-cols-3 gap-4">
              <StatusCard
                label="Pending"
                value={pendingJobs}
                variant="warning"
                icon={<Clock className="w-5 h-5" />}
              />
              <StatusCard
                label="Active"
                value={activeJobs}
                variant="info"
                icon={<ClipboardCheck className="w-5 h-5" />}
              />
              <StatusCard
                label="Ready"
                value={completedJobs}
                variant="success"
                icon={<ClipboardCheck className="w-5 h-5" />}
              />
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <Button variant="ghost" className="w-full justify-center">
                View All Jobs →
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Recent Invoices</h2>
          <button
            onClick={() => onNavigate('sale_report')}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            View All →
          </button>
        </div>
        <Card padding="none">
          {recentInvoices.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No invoices yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentInvoices.map((invoice) => (
                <div key={invoice.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{invoice.customerName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Bike className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-sm text-slate-600">{invoice.bikeNumber}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">₹{invoice.finalAmount.toLocaleString()}</p>
                      <Badge
                        variant={invoice.paymentStatus === 'Paid' ? 'success' : 'warning'}
                        size="sm"
                        className="mt-1"
                      >
                        {invoice.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Financial Summary */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Financial Summary</h2>
        <div className="grid grid-cols-2 gap-3">
          <Card padding="sm" onClick={() => onNavigate('expenses')}>
            <div className="text-center">
              <p className="text-xs text-slate-600 mb-1">Total Expenses</p>
              <p className="text-xl font-bold text-red-600">₹{(stats?.totalExpenses || 0).toLocaleString()}</p>
            </div>
          </Card>
          <Card padding="sm" onClick={() => onNavigate('dashboard')}>
            <div className="text-center">
              <p className="text-xs text-slate-600 mb-1">Net Profit</p>
              <p className="text-xl font-bold text-green-600">₹{(stats?.netProfit || 0).toLocaleString()}</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <MiniStat
          label="Customers"
          value={stats?.totalCustomers || 0}
          icon={<Users className="w-5 h-5" />}
          onClick={() => onNavigate('customers')}
        />
        <MiniStat
          label="Cash Balance"
          value={`₹${(stats?.cashInHand || 0).toLocaleString()}`}
          icon={<Wallet className="w-5 h-5" />}
          onClick={() => onNavigate('cash_in_hand')}
        />
        <MiniStat
          label="Bank Balance"
          value={`₹${(stats?.bankBalance || 0).toLocaleString()}`}
          icon={<Wallet className="w-5 h-5" />}
          onClick={() => onNavigate('bank_accounts')}
        />
      </div>

      {/* Payment Alerts */}
      {(stats?.totalPending || 0) > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-1">Pending Payments</h3>
              <p className="text-sm text-amber-700 mb-3">
                You have ₹{stats.totalPending.toLocaleString()} in pending payments
              </p>
              <Button size="sm" variant="secondary" onClick={() => onNavigate('sale_report')}>
                View Details
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

// Quick Action Component
const QuickAction: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-slate-200 rounded-2xl hover:border-blue-600 hover:bg-blue-50 transition-all active:scale-95"
  >
    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
    </div>
    <span className="text-xs font-semibold text-slate-700 text-center leading-tight">{label}</span>
  </button>
);

// Status Card Component
const StatusCard: React.FC<{
  label: string;
  value: number;
  variant: 'success' | 'warning' | 'info';
  icon: React.ReactNode;
}> = ({ label, value, variant, icon }) => {
  const colors = {
    success: 'bg-green-50 text-green-700',
    warning: 'bg-amber-50 text-amber-700',
    info: 'bg-blue-50 text-blue-700'
  };

  return (
    <div className="text-center">
      <div className={`w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center ${colors[variant]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-600 mt-1">{label}</p>
    </div>
  );
};

// Mini Stat Component
const MiniStat: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  onClick: () => void;
}> = ({ label, value, icon, onClick }) => (
  <Card padding="sm" onClick={onClick} className="cursor-pointer hover:shadow-md transition-shadow">
    <div className="flex flex-col items-center gap-2">
      <div className="text-slate-400">
        {icon}
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-600">{label}</p>
      </div>
    </div>
  </Card>
);

export default DashboardPage;
