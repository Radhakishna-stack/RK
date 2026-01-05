import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileBarChart, Printer, TrendingUp, TrendingDown, Users, 
  Receipt, Landmark, ShieldAlert, Loader2, ChevronRight, 
  ArrowUpRight, ArrowDownRight, Wallet, Banknote, Package, Info
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { dbService } from '../db';
import { Customer, Invoice, Expense, DashboardStats, InventoryItem } from '../types';

const ReportsPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dbService.getDashboardStats(),
      dbService.getInvoices(),
      dbService.getInventory()
    ]).then(([statData, invData, stockData]) => {
      setStats(statData);
      setInvoices(invData);
      setInventory(stockData);
      setLoading(false);
    });
  }, []);

  // Calculate chart data for the last 3 months
  const chartData = useMemo(() => {
    const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
    const currentMonthIndex = new Date().getMonth();
    const lastThree = [
      (currentMonthIndex - 2 + 12) % 12,
      (currentMonthIndex - 1 + 12) % 12,
      currentMonthIndex
    ].map(idx => ({ name: months[idx], total: 0 }));

    invoices.forEach(inv => {
      const d = new Date(inv.date);
      const mIdx = d.getMonth();
      const findMonth = lastThree.find(m => m.name === months[mIdx]);
      if (findMonth) {
        findMonth.total += inv.finalAmount;
      }
    });

    return lastThree;
  }, [invoices]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4 text-slate-400">
      <Loader2 className="animate-spin w-10 h-10 text-blue-500" />
      <p className="font-bold text-sm uppercase tracking-widest">Compiling Reports...</p>
    </div>
  );

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-500 max-w-lg mx-auto">
      {/* Vyapar Reports Banner */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
        <div className="p-6 relative z-10">
          <h3 className="text-sm font-black text-slate-800 tracking-tight mb-1">Vyapar Reports</h3>
          <p className="text-[10px] font-medium text-slate-500 max-w-[180px] leading-relaxed mb-4">
            View more than <span className="font-black text-slate-800">50 reports</span> and gain full control of your business!
          </p>
          <button className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors">
            See Reports
          </button>
        </div>
        {/* Background Graphic Illustration */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-blue-600 rounded-l-[100px] flex items-center justify-center">
            <div className="relative">
               <div className="w-16 h-20 bg-white rounded shadow-lg transform translate-x-2 -translate-y-2"></div>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black">₹</div>
               <div className="absolute -top-4 -left-4 w-4 h-4 bg-emerald-400 rounded-full flex items-center justify-center text-white text-[8px] font-black">+</div>
               <div className="absolute -bottom-4 -right-2 w-4 h-4 bg-red-400 rounded-full flex items-center justify-center text-white text-[8px] font-black">−</div>
            </div>
        </div>
      </div>

      {/* Summary Row: You'll Get / You'll Give */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 bg-emerald-100 rounded text-emerald-600"><ArrowDownRight className="w-3 h-3" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">You'll Get</span>
          </div>
          <p className="text-sm font-black text-slate-800">₹ {stats?.totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 bg-red-100 rounded text-red-600"><ArrowUpRight className="w-3 h-3" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">You'll Give</span>
          </div>
          <p className="text-sm font-black text-slate-800">₹ 0.00</p>
        </div>
      </div>

      {/* Sale Overview Chart Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-6">
        <div className="flex justify-between items-start">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Your Sale Overview (Jan)</h4>
        </div>
        
        <div className="text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Sale</p>
          <h3 className="text-2xl font-black text-emerald-500 tracking-tighter">₹ {chartData[2].total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
          <div className="mt-2 flex items-center justify-center gap-1 text-emerald-500">
             <div className="p-0.5 bg-emerald-50 rounded-full"><TrendingUp className="w-3 h-3" /></div>
             <span className="text-[10px] font-bold">0% More Growth This Month</span>
          </div>
        </div>

        <div className="h-40 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 'bold'}}
                dy={10}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} 
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Purchases Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
        <div>
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Purchases (Jan)</h4>
          <p className="text-lg font-black text-slate-800 mt-1">₹ 0.00</p>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300" />
      </div>

      {/* Cash & Bank Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-50">
          <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Cash & Bank</h4>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 mb-1">Bank Balance</p>
              <p className="text-sm font-black text-emerald-500">₹ {stats?.bankBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 mb-1">Cash In-Hand</p>
              <p className="text-sm font-black text-emerald-500">₹ {stats?.cashInHand.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-dashed border-slate-100 pb-2">List of Banks</p>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600">PHONE PE</span>
              <span className="font-black text-slate-800 tracking-tight">₹ {(stats?.bankBalance || 0 * 0.8).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600">PHONE PE (SIR)</span>
              <span className="font-black text-slate-800 tracking-tight">₹ {(stats?.bankBalance || 0 * 0.2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-50 flex justify-between items-center">
          <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Inventory</h4>
          <button className="text-blue-600 text-[10px] font-black uppercase tracking-widest">See All</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 mb-1">Stock Value</p>
              <p className="text-sm font-black text-emerald-500">₹ {inventory.reduce((s, i) => s + (i.stock * i.unitPrice), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 mb-1">No. of Items</p>
              <p className="text-sm font-black text-slate-800">{inventory.length}</p>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex justify-between items-center mb-3">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Low Stock Items ({inventory.filter(i => i.stock < 5).length})</p>
               <ChevronRight className="w-4 h-4 text-blue-500" />
            </div>
            <div className="space-y-3">
              {inventory.filter(i => i.stock < 10).slice(0, 3).map(item => (
                <div key={item.id} className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600 truncate max-w-[140px] uppercase">{item.name}</span>
                  <span className={`font-black tracking-tight ${item.stock < 0 ? 'text-red-500' : 'text-slate-800'}`}>{item.stock.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="py-4 text-center">
         <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.4em]">Powered by SRK Bike Service</p>
      </div>
    </div>
  );
};

export default ReportsPage;