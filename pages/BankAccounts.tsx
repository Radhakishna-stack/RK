
import React, { useState, useEffect, useMemo } from 'react';
// Added IndianRupee to resolve "Cannot find name 'IndianRupee'" error on line 249
import { 
  ArrowLeft, Landmark, Plus, Search, ChevronRight, 
  RefreshCw, TrendingUp, ArrowUpRight, ArrowDownRight, 
  ExternalLink, Loader2, CreditCard, Building2, Smartphone,
  Activity, ShieldCheck, MoreVertical, X, CheckCircle2,
  Receipt, Wallet, Trash2, Edit3, IndianRupee
} from 'lucide-react';
import { dbService } from '../db';
import { Transaction, BankAccount } from '../types';

const BankAccountsPage: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [bankBalances, setBankBalances] = useState<Record<string, number>>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Form State
  const [newBank, setNewBank] = useState<Omit<BankAccount, 'id' | 'createdAt'>>({
    name: '',
    type: 'UPI/Wallet',
    openingBalance: 0
  });

  const loadData = async () => {
    setLoading(true);
    const [accounts, allTxns] = await Promise.all([
      dbService.getBankAccounts(),
      dbService.getTransactions()
    ]);
    
    const balances: Record<string, number> = {};
    for (const acc of accounts) {
      balances[acc.id] = await dbService.getAccountBalance(acc.id);
    }

    setBanks(accounts);
    setBankBalances(balances);
    setTransactions(allTxns.filter(t => t.accountId !== 'CASH-01').slice(0, 10));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalBalance = useMemo(() => Object.values(bankBalances).reduce((sum, b) => sum + b, 0), [bankBalances]);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBank.name) return;
    setLoading(true);
    await dbService.addBankAccount(newBank);
    setIsAddModalOpen(false);
    setNewBank({ name: '', type: 'UPI/Wallet', openingBalance: 0 });
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (id === 'CASH-01') return;
    if (window.confirm("CRITICAL: Deleting this account will detach its history but keep the transactions. Proceed?")) {
      await dbService.deleteBankAccount(id);
      await loadData();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'UPI/Wallet': return <Smartphone />;
      case 'Savings': return <Building2 />;
      case 'Current': return <Landmark />;
      default: return <Wallet />;
    }
  };

  if (loading && banks.length === 0) return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
       <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Synchronizing Vaults...</p>
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
              <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase leading-none">Bank Accounts</h2>
              <div className="flex items-center gap-2 mt-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Multi-Ledger</span>
              </div>
           </div>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 text-white p-3 rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      {/* Net Worth HUD */}
      <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden">
         <div className="relative z-10 space-y-8">
            <div className="flex justify-between items-start">
               <div className="space-y-1">
                  <div className="flex items-center gap-2 bg-blue-500/20 w-fit px-3 py-1 rounded-full border border-blue-500/30">
                     <ShieldCheck className="w-3 h-3 text-blue-400" />
                     <span className="text-[8px] font-black uppercase tracking-widest text-blue-300">Total Digital Value</span>
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter">₹ {totalBalance.toLocaleString()}</h3>
               </div>
               <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                  <Landmark className="w-6 h-6 text-blue-400" />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <p className="text-[8px] font-black uppercase text-blue-300 mb-1">Accounts</p>
                  <div className="flex items-center gap-2">
                     <span className="text-lg font-black tracking-tight text-white">{banks.length} Nodes</span>
                  </div>
               </div>
               <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <p className="text-[8px] font-black uppercase text-red-300 mb-1">Last Updated</p>
                  <div className="flex items-center gap-2">
                     <span className="text-lg font-black tracking-tight text-white">Just Now</span>
                  </div>
               </div>
            </div>
         </div>
         <Activity className="absolute right-[-20px] bottom-[-20px] w-48 h-48 text-white/5 -rotate-12" />
      </div>

      {/* Account List */}
      <div className="space-y-4">
         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Registered Accounts</h4>
         <div className="space-y-3">
            {banks.map(bank => (
               <div key={bank.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4 group transition-all hover:border-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors border border-slate-100 shadow-inner">
                          {React.cloneElement(getIcon(bank.type) as React.ReactElement<any>, { className: 'w-7 h-7 stroke-[1.5]' })}
                      </div>
                      <div>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none mb-1.5">{bank.name}</h4>
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{bank.type}</span>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-lg font-black text-slate-900 tracking-tighter">₹ {(bankBalances[bank.id] || 0).toLocaleString()}</p>
                       <p className="text-[8px] font-bold text-emerald-500 uppercase">Settled</p>
                    </div>
                  </div>
                  {bank.id !== 'CASH-01' && (
                    <div className="flex gap-2 pt-2 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button className="flex-1 py-2 bg-slate-50 text-slate-400 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-2">
                          <Edit3 className="w-3 h-3" /> Rename
                       </button>
                       <button onClick={() => handleDelete(bank.id)} className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-2">
                          <Trash2 className="w-3 h-3" /> Deactivate
                       </button>
                    </div>
                  )}
               </div>
            ))}
         </div>
      </div>

      {/* Digital Activity */}
      <div className="space-y-4 px-1 pb-10">
         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" /> Digital Activity Log
         </h4>
         <div className="space-y-3">
            {transactions.length > 0 ? (
               transactions.map(t => (
                  <div key={t.id} className="bg-white p-5 rounded-[28px] border border-slate-100 flex items-center justify-between shadow-sm animate-in slide-in-from-bottom-2">
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                           {t.type === 'IN' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div>
                           <p className="text-xs font-black text-slate-800 uppercase tracking-tight leading-tight">{t.description}</p>
                           <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded">{t.paymentMode}</span>
                              <span className="text-[9px] font-bold text-slate-400">{new Date(t.date).toLocaleDateString()}</span>
                           </div>
                        </div>
                     </div>
                     <p className={`text-sm font-black tracking-tight ${t.type === 'IN' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {t.type === 'IN' ? '+' : '-'}₹{t.amount.toLocaleString()}
                     </p>
                  </div>
               ))
            ) : (
               <div className="bg-white p-12 rounded-[40px] border-2 border-dashed border-slate-100 text-center">
                  <p className="text-[10px] font-black text-slate-300 uppercase">No digital transactions recorded</p>
               </div>
            )}
         </div>
      </div>

      {/* Add Account Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
           <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">New Payment Node</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bank or Wallet Integration</p>
                 </div>
                 <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleAddAccount} className="p-8 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Display Name</label>
                       <input 
                         required
                         className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                         placeholder="E.G. PHONEPE SHOP / HDFC MAIN"
                         value={newBank.name}
                         onChange={e => setNewBank({...newBank, name: e.target.value.toUpperCase()})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Type</label>
                       <select 
                         className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                         value={newBank.type}
                         onChange={e => setNewBank({...newBank, type: e.target.value as any})}
                       >
                          <option value="UPI/Wallet">Digital Wallet / UPI</option>
                          <option value="Savings">Savings Account</option>
                          <option value="Current">Current Account</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Opening Balance (₹)</label>
                       <div className="relative group">
                          <IndianRupee className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 transition-transform group-focus-within:scale-110" />
                          <input 
                            required
                            type="number"
                            placeholder="0.00"
                            className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-lg focus:ring-4 focus:ring-blue-500/5 transition-all"
                            value={newBank.openingBalance || ''}
                            onChange={e => setNewBank({...newBank, openingBalance: parseFloat(e.target.value) || 0})}
                          />
                       </div>
                    </div>
                    <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
                       <CheckCircle2 className="w-5 h-5 text-blue-400" /> Confirm Registration
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default BankAccountsPage;
