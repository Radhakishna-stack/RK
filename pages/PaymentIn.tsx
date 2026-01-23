
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, IndianRupee, ChevronRight, Bike, Phone, MapPin, Loader2, CheckCircle, Wallet, ArrowDownCircle, History, Clock, X, MessageCircle, Info, Receipt, Sparkles, User, AlertCircle, Landmark } from 'lucide-react';
import { dbService } from '../db';
import { Customer, Transaction, BankAccount } from '../types';

const PaymentInPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form State
  const [amount, setAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('CASH-01');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadBaseData();
    searchInputRef.current?.focus();
  }, []);

  const loadBaseData = async () => {
    const [cData, aData] = await Promise.all([
      dbService.getCustomers(),
      dbService.getBankAccounts()
    ]);
    setCustomers(cData || []);
    setAccounts(aData || []);
  };

  const suggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const key = searchTerm.toLowerCase();
    return customers.filter(c => {
      const nameMatch = (c.name || '').toLowerCase().includes(key);
      const bikeMatch = (c.bikeNumber || '').toLowerCase().includes(key);
      const phoneMatch = (c.phone || '').toLowerCase().includes(key);
      return nameMatch || bikeMatch || phoneMatch;
    }).slice(0, 5);
  }, [customers, searchTerm]);

  const fetchLedger = async (cust: Customer) => {
    setLoading(true);
    try {
      const balance = await dbService.getCustomerBalance(cust.bikeNumber, cust.name);
      const allTxns = await dbService.getTransactions();
      const relevant = allTxns.filter(t => t.entityId === cust.bikeNumber).slice(0, 5);
      
      setCurrentBalance(balance);
      setRecentTxns(relevant);
      setSelectedCustomer(cust);
      setSearchTerm(cust.bikeNumber);
      setShowSuggestions(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedCustomer || !amount || parseFloat(amount) <= 0) return;

    setIsSubmitting(true);
    try {
      const accName = accounts.find(a => a.id === selectedAccountId)?.name || 'Generic';
      await dbService.addTransaction({
        entityId: selectedCustomer.bikeNumber,
        accountId: selectedAccountId,
        type: 'IN',
        amount: parseFloat(amount),
        paymentMode: accName,
        description: description || 'Account Payment'
      });
      
      await fetchLedger(selectedCustomer);
      setAmount('');
      setDescription('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      alert("Error saving transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const payFullBalance = () => {
    if (currentBalance > 0) {
      setAmount(currentBalance.toString());
      setDescription(`Settlement - ${selectedCustomer?.bikeNumber}`);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-28 animate-in fade-in duration-500 px-1 relative">
      {showSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4">
           <div className="bg-emerald-600 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-3 border border-emerald-400">
              <Sparkles className="w-5 h-5 text-emerald-200 fill-emerald-200" />
              <span className="text-sm font-black uppercase tracking-widest">Entry Recorded</span>
           </div>
        </div>
      )}

      <header className="flex flex-col items-center pt-4">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Payment In</h2>
        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.4em] mt-2">Party Settle Terminal</p>
      </header>

      <div className="bg-white p-5 rounded-[40px] border border-slate-100 shadow-sm relative z-[60]">
        <div className="relative group">
           <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500 w-5 h-5" />
           <input 
             ref={searchInputRef}
             type="text" 
             placeholder="SEARCH PARTY IDENTITY..."
             className="w-full pl-14 pr-12 py-5 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-8 focus:ring-emerald-500/5 outline-none font-black text-[11px] tracking-widest transition-all uppercase"
             value={searchTerm}
             onChange={e => { setSearchTerm(e.target.value); setShowSuggestions(true); }}
             onFocus={() => setShowSuggestions(true)}
           />
           {searchTerm && <button onClick={() => { setSearchTerm(''); setSelectedCustomer(null); searchInputRef.current?.focus(); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300"><X className="w-5 h-5" /></button>}

           {showSuggestions && suggestions.length > 0 && (
             <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-100 rounded-[32px] shadow-2xl overflow-hidden z-[70] animate-in slide-in-from-top-2">
                {suggestions.map(c => (
                  <button key={c.id} onMouseDown={() => fetchLedger(c)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-emerald-50 transition-colors border-b border-slate-50 last:border-0 group text-left">
                     <div className="flex items-center gap-4">
                        <div className="bg-emerald-50 p-2 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors"><Bike className="w-5 h-5" /></div>
                        <div>
                           <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{c.bikeNumber}</p>
                           <p className="text-[10px] text-slate-400 font-bold uppercase">{c.name}</p>
                        </div>
                     </div>
                     <ChevronRight className="w-5 h-5 text-slate-300" />
                  </button>
                ))}
             </div>
           )}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-300"><Loader2 className="w-10 h-10 animate-spin text-emerald-500" /><p className="text-[10px] font-black uppercase tracking-[0.4em]">Loading Financials...</p></div>
      ) : selectedCustomer && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
           <div className={`p-8 rounded-[40px] border shadow-xl flex flex-col items-center gap-4 relative overflow-hidden ${currentBalance > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
              {currentBalance > 0 && <button onClick={payFullBalance} className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg border border-red-400">Settle Full</button>}
              <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${currentBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{currentBalance > 0 ? 'Balance Due' : 'Account Settled'}</p>
              <div className="flex items-baseline gap-1"><span className="text-xl font-black opacity-40">₹</span><h3 className={`text-5xl font-black tracking-tighter ${currentBalance > 0 ? 'text-red-900' : 'text-emerald-900'}`}>{Math.abs(currentBalance).toLocaleString()}</h3></div>
              <div className="flex items-center gap-2 bg-white/50 px-4 py-1.5 rounded-full border border-black/5"><User className="w-3 h-3 text-slate-400" /><span className="text-[10px] font-black uppercase text-slate-600">{selectedCustomer.name} • {selectedCustomer.bikeNumber}</span></div>
           </div>

           <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
              <form onSubmit={handlePayment} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Received Amount</label>
                    <div className="relative group">
                       <IndianRupee className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500 transition-transform group-focus-within:scale-110" />
                       <input required type="number" placeholder="0.00" className="w-full pl-16 pr-6 py-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-black text-2xl text-slate-900 focus:ring-8 focus:ring-emerald-500/5 transition-all" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                 </div>

                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deposit Into Account</p>
                    <div className="grid grid-cols-1 gap-2">
                       {accounts.map(acc => (
                         <button 
                           key={acc.id} 
                           type="button" 
                           onClick={() => setSelectedAccountId(acc.id)} 
                           className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase border-2 transition-all flex items-center justify-between ${selectedAccountId === acc.id ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                         >
                            <div className="flex items-center gap-2">
                              {acc.type === 'Cash' ? <Wallet className="w-4 h-4" /> : <Landmark className="w-4 h-4" />}
                              {acc.name}
                            </div>
                            {selectedAccountId === acc.id && <CheckCircle className="w-4 h-4" />}
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Internal Note</label>
                    <input type="text" placeholder="MEMO..." className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-xs font-bold text-slate-700 uppercase" value={description} onChange={e => setDescription(e.target.value)} />
                 </div>

                 <button type="submit" disabled={isSubmitting || !amount} className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">{isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />} Commit Collection</button>
              </form>
           </div>

           <div className="space-y-4 px-1">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><History className="w-4 h-4 text-emerald-500" /> Recent Activity</h4>
              <div className="space-y-3">
                 {recentTxns.length > 0 ? recentTxns.map(t => (
                    <div key={t.id} className="bg-white p-5 rounded-[28px] border border-slate-100 flex items-center justify-between group animate-in slide-in-from-right-2">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm"><Receipt className="w-4 h-4" /></div>
                          <div>
                             <p className="text-xs font-black text-slate-900 uppercase truncate max-w-[120px]">{t.description}</p>
                             <p className="text-[9px] font-black text-emerald-600 uppercase">{t.paymentMode} • {new Date(t.date).toLocaleDateString()}</p>
                          </div>
                       </div>
                       <p className="text-sm font-black text-emerald-600">+ ₹{t.amount.toLocaleString()}</p>
                    </div>
                 )) : <div className="bg-slate-50 p-12 rounded-[40px] border border-dashed border-slate-200 text-center"><p className="text-[10px] font-black text-slate-300 uppercase">No recent entries</p></div>}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PaymentInPage;
