
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Banknote, IndianRupee, Loader2, RefreshCw, 
  ArrowDownCircle, ArrowUpCircle, History, Clock, Activity,
  TrendingUp, Wallet, CheckCircle2, MoreVertical, X,
  Plus, Minus, Sparkles, Filter, Database, AlertCircle
} from 'lucide-react';
import { dbService } from '../db';
import { Transaction } from '../types';

const CashInHandPage: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [cashTransactions, setCashTransactions] = useState<Transaction[]>([]);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT'>('IN');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNote, setAdjustNote] = useState('');

  const loadData = async () => {
    setLoading(true);
    const txns = await dbService.getTransactions();
    // Filter specifically for the primary Cash account ID
    setCashTransactions(txns.filter(t => t.accountId === 'CASH-01'));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalCash = useMemo(() => {
    return cashTransactions.reduce((sum, t) => t.type === 'IN' ? sum + t.amount : sum - t.amount, 0);
  }, [cashTransactions]);

  const dailyCashFlow = useMemo(() => {
    const today = new Date().toDateString();
    return cashTransactions
      .filter(t => new Date(t.date).toDateString() === today)
      .reduce((acc, t) => {
        if (t.type === 'IN') acc.in += t.amount;
        else acc.out += t.amount;
        return acc;
      }, { in: 0, out: 0 });
  }, [cashTransactions]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustAmount) return;
    setLoading(true);
    await dbService.addTransaction({
      entityId: 'CASH-ADJUST',
      accountId: 'CASH-01',
      type: adjustType,
      amount: parseFloat(adjustAmount),
      paymentMode: 'Cash',
      description: adjustNote || (adjustType === 'IN' ? 'Store Counter Inflow' : 'Store Counter Withdrawal')
    });
    setAdjustAmount('');
    setAdjustNote('');
    setIsAdjustModalOpen(false);
    await loadData();
  };

  if (loading && cashTransactions.length === 0) return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
       <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Counting Physical Assets...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-500 max-w-lg mx-auto px-1">
      <header className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
           <button onClick={() => onNavigate('menu')} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all">
              <ArrowLeft className="w-5 h-5 text-slate-800" />
           </button>
           <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase leading-none">Cash Registry</h2>
              <div className="flex items-center gap-2 mt-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Store Counter Ledger</span>
              </div>
           </div>
        </div>
        <button 
          onClick={() => { setAdjustType('IN'); setIsAdjustModalOpen(true); }}
          className="bg-emerald-600 text-white p-3 rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      {/* Cash Counter Visual HUD */}
      <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
         <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2 bg-emerald-500/20 w-fit px-3 py-1 rounded-full border border-emerald-500/30 mx-auto">
               <Wallet className="w-3 h-3 text-emerald-400" />
               <span className="text-[8px] font-black uppercase tracking-widest text-emerald-300">Physical Register Balance</span>
            </div>
            <div className="flex items-baseline gap-1">
               <span className="text-xl font-black text-emerald-500 opacity-60">₹</span>
               <h3 className="text-6xl font-black tracking-tighter text-white">{totalCash.toLocaleString()}</h3>
            </div>
            <div className="flex items-center gap-6 pt-4 border-t border-white/5">
               <div className="text-center">
                  <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-1">Today In</p>
                  <p className="text-sm font-black text-emerald-400">+₹{dailyCashFlow.in.toLocaleString()}</p>
               </div>
               <div className="w-px h-8 bg-white/10"></div>
               <div className="text-center">
                  <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-1">Today Out</p>
                  <p className="text-sm font-black text-red-400">-₹{dailyCashFlow.out.toLocaleString()}</p>
               </div>
            </div>
         </div>
         <Banknote className="absolute right-[-30px] bottom-[-30px] w-48 h-48 text-white/5 -rotate-45" />
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-2 gap-4">
         <CashQuickAction icon={<Plus className="w-5 h-5" />} label="Add Cash" color="emerald" onClick={() => { setAdjustType('IN'); setIsAdjustModalOpen(true); }} />
         <CashQuickAction icon={<Minus className="w-5 h-5" />} label="Withdraw" color="red" onClick={() => { setAdjustType('OUT'); setIsAdjustModalOpen(true); }} />
      </div>

      {/* Timeline */}
      <div className="space-y-4 px-1 pb-10">
         <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <History className="w-4 h-4 text-emerald-500" /> Counter History
            </h4>
            <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
               <Database className="w-3 h-3 text-slate-400" />
               <span className="text-[8px] font-black text-slate-500 uppercase">{cashTransactions.length} ENTRIES</span>
            </div>
         </div>
         <div className="space-y-3">
            {cashTransactions.length > 0 ? (
               cashTransactions.map(t => (
                  <div key={t.id} className="bg-white p-5 rounded-[28px] border border-slate-100 flex items-center justify-between shadow-sm group animate-in slide-in-from-bottom-2">
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                           {t.type === 'IN' ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
                        </div>
                        <div>
                           <p className="text-xs font-black text-slate-800 uppercase tracking-tight leading-tight">{t.description}</p>
                           <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3 text-slate-300" />
                              <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(t.date).toLocaleDateString()} at {new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           </div>
                        </div>
                     </div>
                     <p className={`text-sm font-black tracking-tight ${t.type === 'IN' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {t.type === 'IN' ? '+' : '-'}₹{t.amount.toLocaleString()}
                     </p>
                  </div>
               ))
            ) : (
               <div className="bg-white p-12 rounded-[40px] border-2 border-dashed border-slate-100 text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-slate-200 mx-auto" />
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Physical register is currently dry</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase italic">Log billing with Cash mode to populate logs</p>
               </div>
            )}
         </div>
      </div>

      {/* Adjust Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
           <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{adjustType === 'IN' ? 'Add Store Cash' : 'Withdrawal Entry'}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Internal Cash Management</p>
                 </div>
                 <button onClick={() => setIsAdjustModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleAdjustSubmit} className="p-8 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Adjustment Amount</label>
                       <div className="relative group">
                          <IndianRupee className={`absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 ${adjustType === 'IN' ? 'text-emerald-500' : 'text-red-500'} transition-transform group-focus-within:scale-110`} />
                          <input 
                            required
                            type="number"
                            placeholder="0.00"
                            className="w-full pl-16 pr-6 py-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-black text-2xl text-slate-900 focus:ring-8 focus:ring-slate-500/5 transition-all"
                            value={adjustAmount}
                            onChange={e => setAdjustAmount(e.target.value)}
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Adjustment Reason</label>
                       <input 
                         type="text"
                         placeholder="E.G. DRAWER INITIALIZATION / OWNER WITHDRAWAL"
                         className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-xs font-bold text-slate-700 uppercase"
                         value={adjustNote}
                         onChange={e => setAdjustNote(e.target.value.toUpperCase())}
                       />
                    </div>
                    <button type="submit" className={`w-full py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 ${adjustType === 'IN' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'}`}>
                       <CheckCircle2 className="w-5 h-5" /> Commit Audit
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

const CashQuickAction: React.FC<{ icon: React.ReactNode, label: string, color: string, onClick: () => void }> = ({ icon, label, color, onClick }) => (
  <button onClick={onClick} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4 group active:scale-95 transition-all hover:border-slate-200">
     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
        {icon}
     </div>
     <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-slate-900">{label}</span>
  </button>
);

export default CashInHandPage;
