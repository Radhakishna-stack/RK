
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, ChevronRight, Loader2, Trash2, CircleAlert, TrendingUp, Receipt, X, 
  MessageCircle, Users, ClipboardCheck, Package, CheckCircle, Calendar, RefreshCcw, 
  Sparkles, Wand2, Terminal, Map as MapIcon, Wallet, FileText, ShoppingCart, 
  ArrowDownCircle, ArrowUpCircle, IndianRupee, LayoutGrid, Clock, UserPlus, Phone, MapPin, Bike,
  UserCheck, ClipboardList, AlertCircle, CalendarClock
} from 'lucide-react';
import { dbService } from '../db';
import { Invoice, Customer, DashboardStats, Complaint, ComplaintStatus, AppSettings } from '../types';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [activeSegment, setActiveSegment] = useState<'transactions' | 'parties'>('transactions');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dailyInsight, setDailyInsight] = useState<string>('Aligning your business stars...');
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  
  // Quick Customer Creation State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    bikeNumber: '',
    city: ''
  });

  useEffect(() => {
    loadData();
    fetchQuickInsight();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, custData, statData, compData, settingsData] = await Promise.all([
        dbService.getInvoices(),
        dbService.getCustomers(),
        dbService.getDashboardStats(),
        dbService.getComplaints(),
        dbService.getSettings()
      ]);
      setInvoices(invData);
      setCustomers(custData);
      setStats(statData);
      setComplaints(compData);
      setSettings(settingsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuickInsight = async () => {
    try {
      const insight = await dbService.getBusinessHoroscope("MOTO GEAR SRK");
      setDailyInsight(insight);
    } catch (err) {
      setDailyInsight("Perfect day for growth! Keep riding safe.");
    }
  };

  const jobStats = useMemo(() => ({
    pending: complaints.filter(c => c.status === ComplaintStatus.PENDING).length,
    inProgress: complaints.filter(c => c.status === ComplaintStatus.IN_PROGRESS).length,
    completed: complaints.filter(c => c.status === ComplaintStatus.COMPLETED).length
  }), [complaints]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const key = searchTerm.toLowerCase();
      return inv.customerName.toLowerCase().includes(key) || inv.bikeNumber.toLowerCase().includes(key);
    });
  }, [invoices, searchTerm]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(cust => {
      const key = searchTerm.toLowerCase();
      return cust.name.toLowerCase().includes(key) || cust.bikeNumber.toLowerCase().includes(key);
    });
  }, [customers, searchTerm]);

  const getTransactionStatus = (inv: Invoice) => {
    if (inv.paymentStatus === 'Paid') return 'PAID';
    
    const overdueLimit = settings?.transaction.overdueDaysLimit || 15;
    const invoiceDate = new Date(inv.date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - invoiceDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > overdueLimit ? 'OVERDUE' : 'UNPAID';
  };

  const handleQuickCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCustomer(true);
    try {
      await dbService.addCustomer(customerForm);
      await loadData();
      setIsCustomerModalOpen(false);
      setCustomerForm({ name: '', phone: '', bikeNumber: '', city: '' });
    } catch (err) {
      alert("Failed to add customer. Please check input details.");
    } finally {
      setIsSubmittingCustomer(false);
    }
  };

  const handleDeleteInvoice = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Delete this bill?")) {
      await dbService.deleteInvoice(id);
      loadData();
    }
  };

  const shareWhatsApp = (inv: Invoice) => {
    const customer = customers.find(c => c.name === inv.customerName || c.bikeNumber === inv.bikeNumber);
    const msg = `Dear ${inv.customerName}, your bill for ${inv.bikeNumber} at Moto Gear SRK is ₹${inv.finalAmount}. Thank you!`;
    dbService.sendWhatsApp(customer?.phone || '', msg);
  };

  const handleQuickAction = (tab: string) => {
    if (tab === 'coming_soon') {
      alert("This module is currently in assembly. Ready for delivery soon!");
    } else if (tab === 'new_customer') {
      setIsCustomerModalOpen(true);
    } else {
      onNavigate(tab);
    }
  };

  return (
    <div className="pb-32 relative animate-in">
      {/* Top Identity & AI Banner */}
      <div 
        onClick={() => onNavigate('horoscope')}
        className="mb-8 bg-slate-900 p-8 rounded-[40px] shadow-2xl relative overflow-hidden cursor-pointer group active:scale-[0.98] transition-all border border-white/5"
      >
        <div className="relative z-10">
           <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-300">Daily Wisdom</span>
           </div>
           <p className="text-white text-lg font-black leading-tight italic line-clamp-2">
             "{dailyInsight}"
           </p>
        </div>
        <Wand2 className="absolute right-[-20px] bottom-[-20px] w-32 h-32 text-white/5 -rotate-12" />
      </div>

      {/* Main Revenue Snapshot */}
      <div className="grid grid-cols-2 gap-4 mb-8">
         <SummaryCard label="Total Sales" value={stats?.totalReceived || 0} color="text-blue-500" onClick={() => onNavigate('sale_report')} />
         <SummaryCard label="Net Profit" value={stats?.netProfit || 0} color="text-emerald-500" onClick={() => onNavigate('dashboard')} />
      </div>

      {/* QUICK ACTIONS COMMAND CENTER */}
      <div className="mb-10 bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
           <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" /> Shortcut Terminal
           </h3>
           <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
        </div>
        
        <div className="p-6 space-y-10">
          {/* Sale Section */}
          <section className="space-y-4">
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Core Business</p>
            <div className="grid grid-cols-3 gap-6">
              <QuickActionItem icon={<UserCheck />} label="Walk-in Log" onClick={() => handleQuickAction('visitors')} />
              <QuickActionItem icon={<UserPlus />} label="New Party" onClick={() => handleQuickAction('new_customer')} />
              <QuickActionItem icon={<ClipboardCheck />} label="Job Card" onClick={() => handleQuickAction('complaints')} />
              <QuickActionItem icon={<Receipt />} label="Sale Invoice" onClick={() => handleQuickAction('billing')} />
              <QuickActionItem icon={<ArrowDownCircle />} label="Payment-In" onClick={() => handleQuickAction('payment_in')} />
              <QuickActionItem icon={<FileText />} label="Estimate" onClick={() => handleQuickAction('estimate')} />
            </div>
          </section>

          {/* Supply Chain Section */}
          <section className="space-y-4">
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Supply Chain</p>
            <div className="grid grid-cols-3 gap-6">
              <QuickActionItem icon={<ShoppingCart />} label="Purchase" onClick={() => handleQuickAction('purchase')} />
              <QuickActionItem icon={<ClipboardList />} label="Stock Wanting" onClick={() => handleQuickAction('stock_wanting')} />
              <QuickActionItem icon={<Wallet />} label="Expenses" onClick={() => handleQuickAction('expenses')} />
            </div>
          </section>
        </div>
      </div>

      {/* Workshop Pulse Section */}
      <div className="mb-8">
        <div className="bg-slate-900 rounded-[48px] p-8 text-white shadow-2xl relative overflow-hidden">
           <div className="relative z-10 space-y-8">
              <div className="flex justify-between items-start">
                 <div className="space-y-1">
                    <div className="flex items-center gap-3 text-emerald-400 mb-2">
                       <RefreshCcw className="w-5 h-5 animate-spin-slow" />
                       <span className="text-[10px] font-black uppercase tracking-[0.3em]">Workshop Pulse</span>
                    </div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter">Live Status</h3>
                 </div>
                 <div className="p-4 bg-white/10 rounded-[24px] backdrop-blur-md">
                    <Terminal className="w-8 h-8 text-blue-400" />
                 </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                 <PulseCard label="Pending" value={jobStats.pending} color="text-amber-500" />
                 <PulseCard label="Active" value={jobStats.inProgress} color="text-blue-500" />
                 <PulseCard label="Ready" value={jobStats.completed} color="text-emerald-500" />
              </div>
              <button onClick={() => onNavigate('complaints')} className="w-full bg-white text-slate-900 py-4 rounded-[22px] font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all">Open Job Board</button>
           </div>
        </div>
      </div>

      <div className="bg-slate-100/50 p-1.5 rounded-2xl flex gap-1.5 mb-8 border border-slate-100">
        <TabBtn active={activeSegment === 'transactions'} onClick={() => setActiveSegment('transactions')} label="Transactions" />
        <TabBtn active={activeSegment === 'parties'} onClick={() => setActiveSegment('parties')} label="Parties" />
      </div>

      <div className="space-y-4">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="SEARCH RECORDS..."
            className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[28px] text-[11px] font-black uppercase tracking-widest outline-none shadow-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-sm min-h-[300px]">
          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>
          ) : activeSegment === 'transactions' ? (
            filteredInvoices.map(inv => {
              const status = getTransactionStatus(inv);
              return (
                <div key={inv.id} onClick={() => setViewingInvoice(inv)} className="p-6 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-all cursor-pointer flex justify-between items-center group">
                  <div className="flex-1">
                     <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">{inv.customerName}</h4>
                        {status === 'PAID' && <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest border border-emerald-100">PAID</span>}
                        {status === 'UNPAID' && <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest border border-amber-100 uppercase">Unpaid</span>}
                        {status === 'OVERDUE' && <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest animate-pulse border border-red-400">OVERDUE</span>}
                     </div>
                     <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{inv.bikeNumber}</span>
                        <p className="text-lg font-black text-slate-900 tracking-tighter">₹{inv.finalAmount.toLocaleString()}</p>
                     </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={(e) => { e.stopPropagation(); shareWhatsApp(inv); }} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><MessageCircle className="w-5 h-5" /></button>
                     <button onClick={(e) => handleDeleteInvoice(e, inv.id)} className="p-3 bg-red-50 text-red-300 rounded-xl"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              );
            })
          ) : (
            filteredCustomers.map(cust => (
              <div key={cust.id} className="p-6 border-b border-slate-50 last:border-0 flex justify-between items-center group">
                 <div>
                    <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">{cust.name}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{cust.bikeNumber}</p>
                 </div>
                 <button onClick={() => onNavigate('party_statement')} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest">Statement</button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- QUICK CUSTOMER MODAL --- */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
           <div className="bg-white w-full max-w-lg rounded-t-[48px] sm:rounded-[48px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300">
              <div className="px-8 py-8 border-b border-slate-50 flex justify-between items-center bg-white">
                 <div>
                   <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Quick Onboarding</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Register New Party</p>
                 </div>
                 <button onClick={() => setIsCustomerModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all active:scale-90"><X className="w-7 h-7" /></button>
              </div>
              
              <form onSubmit={handleQuickCustomerSubmit} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Party Name</label>
                    <div className="relative group">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                      <input 
                        required 
                        type="text"
                        placeholder="ENTER NAME..."
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none font-bold text-sm text-slate-700 uppercase" 
                        value={customerForm.name}
                        onChange={e => setCustomerForm({...customerForm, name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Link</label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                          required 
                          type="tel"
                          placeholder="MOBILE NO."
                          className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 outline-none font-bold text-sm text-slate-700" 
                          value={customerForm.phone}
                          onChange={e => setCustomerForm({...customerForm, phone: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bike Number</label>
                      <div className="relative group">
                        <Bike className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                          required 
                          type="text"
                          placeholder="MH12..."
                          className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none font-bold text-sm text-slate-700 uppercase" 
                          value={customerForm.bikeNumber}
                          onChange={e => setCustomerForm({...customerForm, bikeNumber: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">City / Location</label>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-red-500 transition-colors" />
                      <input 
                        required 
                        type="text"
                        placeholder="CITY NAME..."
                        className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none font-bold text-sm text-slate-700 uppercase" 
                        value={customerForm.city}
                        onChange={e => setCustomerForm({...customerForm, city: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="flex-1 p-5 border border-slate-200 rounded-3xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Discard</button>
                  <button 
                    type="submit" 
                    disabled={isSubmittingCustomer}
                    className="flex-[2] p-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSubmittingCustomer ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                    Register Now
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}

      {viewingInvoice && (
        <InvoiceModal invoice={viewingInvoice} onClose={() => setViewingInvoice(null)} onShare={() => shareWhatsApp(viewingInvoice)} />
      )}
    </div>
  );
};

const SummaryCard = ({ label, value, color, onClick }: any) => (
  <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm cursor-pointer active:scale-95 transition-all" onClick={onClick}>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
    <span className={`text-2xl font-black ${color} tracking-tighter`}>₹{value.toLocaleString()}</span>
    <div className="mt-4 flex items-center gap-2 bg-slate-50 text-slate-400 w-fit px-3 py-1 rounded-full">
      <TrendingUp className="w-3 h-3" />
      <span className="text-[9px] font-black uppercase">Stats</span>
    </div>
  </div>
);

const PulseCard = ({ label, value, color }: any) => (
  <div className="bg-white/5 p-4 rounded-[28px] border border-white/5">
    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
    <p className={`text-4xl font-black ${color}`}>{value}</p>
  </div>
);

const TabBtn = ({ active, onClick, label }: any) => (
  <button onClick={onClick} className={`flex-1 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${active ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{label}</button>
);

const QuickActionItem: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-3 group active:scale-90 transition-all">
    <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
       {/* Added React.ReactElement<any> cast to fix TS error with className prop */}
       {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6 stroke-[2.5]' })}
    </div>
    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight text-center leading-none max-w-[64px]">{label}</span>
  </button>
);

const InvoiceModal = ({ invoice, onClose, onShare }: any) => (
  <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-6 backdrop-blur-xl animate-in">
    <div className="bg-white w-full max-w-lg rounded-[56px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Bill Record</h3>
        <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-full"><X className="w-8 h-8" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-10 space-y-12">
          <div className="text-center">
            <div className="w-24 h-24 bg-blue-600 rounded-[32px] flex items-center justify-center mx-auto mb-8 text-white">
              <Receipt className="w-12 h-12" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase mb-2">MOTO GEAR SRK</h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">#{invoice.id.slice(-8).toUpperCase()}</p>
          </div>
          <div className="bg-slate-50 p-8 rounded-[40px] space-y-5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-widest">Customer</span>
              <span className="font-black uppercase text-slate-900">{invoice.customerName}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-black uppercase bg-slate-900 text-white px-4 py-1.5 rounded-xl text-[10px] tracking-widest shadow-md">{invoice.bikeNumber}</span>
            </div>
          </div>
          <div className="pt-10 border-t border-slate-100 text-center">
            <p className="text-[12px] font-black uppercase text-slate-400 tracking-widest mb-2">Grand Total</p>
            <span className="text-5xl font-black tracking-tighter text-slate-900">₹{invoice.finalAmount.toLocaleString()}</span>
          </div>
      </div>
      <div className="p-10 border-t border-slate-100 flex gap-4 bg-white">
          <button onClick={onShare} className="flex-1 bg-emerald-600 text-white py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-emerald-500/20"><MessageCircle className="w-6 h-6" /> WhatsApp</button>
          <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 shadow-xl"><CheckCircle className="w-6 h-6" /> Finalize</button>
      </div>
    </div>
  </div>
);

export default DashboardPage;
