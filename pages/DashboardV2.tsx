
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Settings, ChevronRight, Loader2, ArrowUpRight, 
  ArrowDownRight, Landmark, Wallet, Box, TrendingUp, IndianRupee,
  Bell, User, CreditCard, ChevronDown
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { dbService } from '../db';
import { DashboardStats, InventoryItem, Invoice } from '../types';

interface DashboardV2Props {
  onNavigate: (tab: string) => void;
}

const DashboardV2: React.FC<DashboardV2Props> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, iData] = await Promise.all([
        dbService.getDashboardStats(),
        dbService.getInventory()
      ]);
      setStats(sData);
      setInventory(iData);
    } catch (err) {
      console.error("Dashboard V2 load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for the trend chart
  const chartData = [
    { name: 'Nov', total: 12000 },
    { name: 'Dec', total: 18500 },
    { name: 'Jan', total: stats?.totalReceived || 0 },
  ];

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 text-slate-400">
      <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      <p className="text-[10px] font-black uppercase tracking-widest">Loading Dashboard...</p>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#F1F7FF] relative animate-in fade-in duration-500 pb-32">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center shadow-sm overflow-hidden">
             <img src="https://img.freepik.com/free-vector/bike-service-logo-template_23-2148151523.jpg" className="w-full h-full object-cover" alt="logo" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 uppercase">SRK BIKE SERVICE</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-pink-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
             <div className="w-4 h-4 bg-pink-400 rounded-sm transform rotate-45"></div>
          </div>
          <button onClick={() => onNavigate('settings')} className="text-slate-500 hover:text-blue-600 transition-colors">
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        
        {/* Receivables/Payables Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-emerald-50 rounded text-emerald-500 border border-emerald-100">
                <ArrowDownRight className="w-3 h-3" />
              </div>
              <span className="text-[11px] font-medium text-slate-400">You'll Get</span>
            </div>
            <p className="text-lg font-black text-slate-800 tracking-tight">₹ {stats?.totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-red-50 rounded text-red-500 border border-red-100">
                <ArrowUpRight className="w-3 h-3" />
              </div>
              <span className="text-[11px] font-medium text-slate-400">You'll Give</span>
            </div>
            <p className="text-lg font-black text-slate-800 tracking-tight">₹ {stats?.totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Sale Overview Chart Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-start">
            <h4 className="text-sm font-bold text-slate-700">Your Sale Overview (Jan)</h4>
          </div>
          
          <div className="text-center py-2">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">Total Sale</p>
            <h3 className="text-3xl font-black text-emerald-500 tracking-tighter">₹ {stats?.totalReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            <div className="mt-2 flex items-center justify-center gap-1 text-emerald-500">
               <ArrowUpRight className="w-3 h-3" />
               <span className="text-[10px] font-bold">0% more growth this month</span>
            </div>
          </div>

          <div className="h-44 w-full relative">
            <div className="absolute inset-x-0 top-1/2 h-px bg-slate-50 border-t border-dashed border-slate-100 -z-10"></div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 'bold'}}
                  dy={10}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorTotal)"
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Purchase Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
           <p className="text-sm font-bold text-slate-400 mb-1">Purchases (Jan)</p>
           <h4 className="text-xl font-black text-slate-800 tracking-tight">₹ 0.00</h4>
        </div>

        {/* Cash & Bank Section */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-50">
            <h4 className="text-sm font-bold text-slate-800">Cash & Bank</h4>
          </div>
          <div className="p-5 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                <p className="text-[11px] font-bold text-slate-500 mb-1">Bank Balance</p>
                <p className="text-lg font-black text-emerald-500">₹ {stats?.bankBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                <p className="text-[11px] font-bold text-slate-500 mb-1">Cash In Hand</p>
                <p className="text-lg font-black text-emerald-500">₹ {stats?.cashInHand.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex justify-between items-center text-xs font-bold text-slate-400 border-b border-dashed border-slate-100 pb-2">
                  <span>List of Banks</span>
               </div>
               
               <div className="space-y-4">
                  <BankRow name="PHONE PE" amount={11830.00} />
                  <BankRow name="PHONE PE (SIR)" amount={2190.00} />
               </div>
            </div>
          </div>
        </div>

        {/* Inventory Snapshot Section */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-50 flex justify-between items-center">
            <h4 className="text-sm font-bold text-slate-800">Inventory</h4>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <p className="text-[11px] font-bold text-slate-500 mb-1">Stock Value</p>
              <p className="text-lg font-black text-emerald-500">₹ {inventory.reduce((s, i) => s + (i.stock * i.unitPrice), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <p className="text-[11px] font-bold text-slate-500 mb-1">No. of Items</p>
              <p className="text-lg font-black text-slate-800">{inventory.reduce((s, i) => s + i.stock, 0).toFixed(0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button - Redesigned to match screenshot */}
      <div className="fixed bottom-24 left-0 right-0 flex justify-center pointer-events-none z-[60]">
        <button 
          onClick={() => onNavigate('billing')}
          className="pointer-events-auto bg-pink-600 text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transform active:scale-95 transition-all shadow-pink-500/40"
        >
          <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
             <IndianRupee className="w-4 h-4" />
          </div>
          Add Sale Now
        </button>
      </div>

    </div>
  );
};

const BankRow: React.FC<{ name: string, amount: number }> = ({ name, amount }) => (
  <div className="flex justify-between items-center group">
     <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{name}</span>
     <span className="text-xs font-black text-slate-800">₹ {amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
  </div>
);

export default DashboardV2;
