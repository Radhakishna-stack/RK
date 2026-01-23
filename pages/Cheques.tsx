
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, CreditCard, Search, Plus, Loader2, X,
  CheckCircle2, History, Clock, Activity, ShieldCheck,
  AlertCircle, ChevronRight, FileText, Trash2, Calendar,
  Filter, Landmark, User, ExternalLink, Printer,
  // Added Info and IndianRupee to fix "Cannot find name" errors
  Info, IndianRupee
} from 'lucide-react';
import { dbService } from '../db';
import { Transaction } from '../types';

const ChequesPage: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [cheques, setCheques] = useState<Transaction[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'cleared'>('pending');

  useEffect(() => {
    dbService.getTransactions().then(data => {
      // Filter for Cheque transactions
      setCheques(data.filter(t => t.paymentMode === 'Cheque'));
      setLoading(false);
    });
  }, []);

  const totalChequeValue = useMemo(() => {
    return cheques.reduce((sum, c) => sum + c.amount, 0);
  }, [cheques]);

  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
       <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Loading Paper Ledger...</p>
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
              <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase leading-none">Cheque Registry</h2>
              <div className="flex items-center gap-2 mt-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Paper Payment Tracker</span>
              </div>
           </div>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-indigo-600 text-white p-3 rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      {/* Cheque Summary HUD */}
      <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden">
         <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-start">
               <div className="space-y-1">
                  <div className="flex items-center gap-2 bg-indigo-500/20 w-fit px-3 py-1 rounded-full border border-indigo-500/30">
                     <FileText className="w-3 h-3 text-indigo-400" />
                     <span className="text-[8px] font-black uppercase tracking-widest text-indigo-300">Total Uncleared Value</span>
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter">₹ {totalChequeValue.toLocaleString()}</h3>
               </div>
               <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                  <CreditCard className="w-6 h-6 text-indigo-400" />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                  <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Active Cheques</p>
                  <p className="text-xl font-black text-indigo-400">{cheques.length}</p>
               </div>
               <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                  <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Bounce Alert</p>
                  <p className="text-xl font-black text-red-400">0</p>
               </div>
            </div>
         </div>
         <Activity className="absolute right-[-20px] bottom-[-20px] w-32 h-32 text-white/5 -rotate-12" />
      </div>

      {/* Tab Nav */}
      <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 border border-slate-200">
         <button onClick={() => setActiveTab('pending')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Pending</button>
         <button onClick={() => setActiveTab('cleared')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'cleared' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Cleared</button>
      </div>

      {/* Cheque List */}
      <div className="space-y-4 px-1 pb-10">
         {cheques.length > 0 ? (
            cheques.map(c => (
               <div key={c.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden group">
                  <div className="p-6 space-y-6">
                     <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shadow-inner">
                              <Landmark className="w-7 h-7 stroke-[1.5]" />
                           </div>
                           <div>
                              <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">{c.entityId || 'External Party'}</h4>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                 <Calendar className="w-3 h-3" /> Received {new Date(c.date).toLocaleDateString()}
                              </p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-xl font-black text-slate-900 tracking-tighter">₹ {c.amount.toLocaleString()}</p>
                           <span className="text-[8px] font-black uppercase bg-amber-50 text-amber-600 px-2 py-0.5 rounded border border-amber-100">In Clearing</span>
                        </div>
                     </div>
                     
                     <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                           <Info className="w-4 h-4 text-slate-300" />
                           <p className="text-[10px] font-bold text-slate-500 uppercase truncate">{c.description || 'General Cheque Entry'}</p>
                        </div>
                        <p className="text-[9px] font-mono font-black text-slate-400 uppercase">#CHQ-8821</p>
                     </div>

                     <div className="flex gap-2">
                        <button className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-indigo-500/20">Mark Cleared</button>
                        <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-red-500 active:scale-90"><Trash2 className="w-4 h-4" /></button>
                     </div>
                  </div>
               </div>
            ))
         ) : (
            <div className="bg-white border-2 border-dashed border-slate-100 rounded-[40px] p-20 text-center space-y-4">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CreditCard className="w-10 h-10 text-slate-200" />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Cheques in Log</p>
                  <p className="text-[9px] font-bold text-slate-300 uppercase">Registry is clear for this segment</p>
               </div>
            </div>
         )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
           <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Cheque Entry</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paper Payment Registry</p>
                 </div>
                 <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Party / Bike Number</label>
                       <input className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-sm uppercase" placeholder="SEARCH OR TYPE..." />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cheque Amount</label>
                       <div className="relative group">
                          <IndianRupee className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-indigo-500 transition-transform group-focus-within:scale-110" />
                          <input required type="number" placeholder="0.00" className="w-full pl-16 pr-6 py-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-black text-2xl text-slate-900 focus:ring-8 focus:ring-indigo-500/5 transition-all" />
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bank Name</label>
                          <input className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-xs uppercase" placeholder="E.G. HDFC" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cheque Number</label>
                          <input className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-xs uppercase" placeholder="6-DIGITS" />
                       </div>
                    </div>
                    <button className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
                       <CheckCircle2 className="w-5 h-5 text-indigo-400" /> Log to Registry
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ChequesPage;
