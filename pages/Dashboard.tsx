
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Filter, MoreVertical, Settings, ChevronRight, 
  Loader2, Share2, FileText, UserPlus, Printer, Trash2, CircleAlert,
  Landmark, BookOpen, TrendingUp, Scale, MessageSquare, Receipt,
  ArrowDownToLine, CornerUpLeft, Calculator, ClipboardList, Percent, ShoppingCart,
  ArrowUpFromLine, CornerUpRight, ClipboardCopy, Wallet, ArrowLeftRight, X,
  Award, Download, MessageCircle, BellRing, FileInput, Users, Contact,
  ClipboardCheck, Package, Eye, CheckCircle, Calendar, RefreshCcw, Sparkles, Wand2,
  Clock, Hammer, CheckCircle2
} from 'lucide-react';
import { dbService } from '../db';
import { Invoice, Customer, DashboardStats, Complaint, ComplaintStatus } from '../types';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [activeSegment, setActiveSegment] = useState<'transactions' | 'parties'>('transactions');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dailyInsight, setDailyInsight] = useState<string>('Aligning your business stars...');
  
  // Date Filtering State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Modal State
  const [quickLinkModal, setQuickLinkModal] = useState<'none' | 'add_txn' | 'more_options' | 'party_options'>('none');
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    loadData();
    fetchQuickInsight();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, custData, statData, compData] = await Promise.all([
        dbService.getInvoices(),
        dbService.getCustomers(),
        dbService.getDashboardStats(),
        dbService.getComplaints()
      ]);
      setInvoices(invData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setCustomers(custData);
      setStats(statData);
      setComplaints(compData);
    } catch (err) {
      console.error("Dashboard load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuickInsight = async () => {
    try {
      const insight = await dbService.getBusinessHoroscope("SRK BIKE SERVICE");
      setDailyInsight(insight);
    } catch (err) {
      setDailyInsight("Your business gears are perfectly aligned today. Keep riding!");
    }
  };

  // Job Status Counts
  const jobStats = useMemo(() => {
    return {
      pending: complaints.filter(c => c.status === ComplaintStatus.PENDING).length,
      inProgress: complaints.filter(c => c.status === ComplaintStatus.IN_PROGRESS).length,
      completed: complaints.filter(c => c.status === ComplaintStatus.COMPLETED).length
    };
  }, [complaints]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const searchKey = searchTerm.toLowerCase();
      const matchSearch = inv.customerName.toLowerCase().includes(searchKey) ||
                         inv.bikeNumber.toLowerCase().includes(searchKey) ||
                         inv.id.toLowerCase().includes(searchKey);
      
      const invDate = new Date(inv.date).setHours(0,0,0,0);
      const start = startDate ? new Date(startDate).setHours(0,0,0,0) : null;
      const end = endDate ? new Date(endDate).setHours(23,59,59,999) : null;
      
      const matchDate = (!start || invDate >= start) && (!end || invDate <= end);
      
      return matchSearch && matchDate;
    });
  }, [invoices, searchTerm, startDate, endDate]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(cust => {
      const searchKey = searchTerm.toLowerCase();
      return cust.name.toLowerCase().includes(searchKey) ||
             cust.bikeNumber.toLowerCase().includes(searchKey) ||
             cust.phone.includes(searchTerm);
    });
  }, [customers, searchTerm]);

  const getCustomerBalance = (name: string) => {
    return invoices
      .filter(i => i.customerName === name && i.paymentStatus === 'Unpaid')
      .reduce((sum, i) => sum + i.finalAmount, 0);
  };

  const handleDeleteInvoice = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this bill?")) {
      await dbService.deleteInvoice(id);
      loadData();
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (window.confirm("Delete this party?")) {
      await dbService.deleteCustomer(id);
      loadData();
    }
  };

  const shareWhatsApp = (inv: Invoice) => {
    const customer = customers.find(c => c.name === inv.customerName || c.bikeNumber === inv.bikeNumber);
    const phone = customer?.phone || '';
    const msg = `Dear ${inv.customerName}, your bill for ${inv.bikeNumber} at Moto Gear SRK is ready. Amount: ₹${inv.finalAmount.toLocaleString()}. Thank you!`;
    dbService.sendWhatsApp(phone, msg);
  };

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
  };

  return (
    <div className="pb-28 relative animate-in fade-in duration-500">
      
      {/* AI Wisdom Banner */}
      <div 
        onClick={() => onNavigate('horoscope')}
        className="mb-6 bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 p-6 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden cursor-pointer group active:scale-[0.98] transition-all"
      >
        <div className="relative z-10">
           <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-300">Daily Mechanic Wisdom</span>
           </div>
           <p className="text-white text-sm font-medium leading-relaxed italic line-clamp-2 pr-12 group-hover:line-clamp-none transition-all">
             "{dailyInsight}"
           </p>
           <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest">
              Read Full Insight <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
           </div>
        </div>
        <Wand2 className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-white/5 -rotate-12 group-hover:rotate-0 transition-transform" />
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4 px-1">
         <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-5 rounded-[24px] shadow-lg shadow-blue-500/20 cursor-pointer active:scale-95 transition-all text-white" onClick={() => onNavigate('sale_report')}>
            <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-2 opacity-80">Total Sales</p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black tracking-tight">₹{stats?.totalReceived.toLocaleString() || '0'}</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 bg-white/20 w-fit px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3" />
              <span className="text-[8px] font-bold uppercase">Report</span>
            </div>
         </div>
         <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm cursor-pointer active:scale-95 transition-all" onClick={() => onNavigate('dashboard')}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Net Profit</p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-slate-900 tracking-tight">₹{stats?.netProfit.toLocaleString() || '0'}</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 bg-emerald-50 text-emerald-600 w-fit px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3" />
              <span className="text-[8px] font-bold uppercase">Live</span>
            </div>
         </div>
      </div>

      {/* NEW: Job Status Tracker Bar */}
      <div className="px-1 mb-6">
        <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm">
           <div className="flex justify-between items-center mb-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Service Queue</h4>
              <button onClick={() => onNavigate('complaints')} className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1">
                 View All <ChevronRight className="w-3 h-3" />
              </button>
           </div>
           <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => onNavigate('complaints')}
                className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100 flex flex-col items-center gap-1 active:scale-95 transition-all"
              >
                 <Clock className="w-4 h-4 text-amber-500" />
                 <span className="text-xl font-black text-amber-600 tracking-tight">{jobStats.pending}</span>
                 <span className="text-[8px] font-black uppercase text-amber-500 tracking-widest">Pending</span>
              </button>
              <button 
                onClick={() => onNavigate('complaints')}
                className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100 flex flex-col items-center gap-1 active:scale-95 transition-all"
              >
                 <Hammer className="w-4 h-4 text-blue-500" />
                 <span className="text-xl font-black text-blue-600 tracking-tight">{jobStats.inProgress}</span>
                 <span className="text-[8px] font-black uppercase text-blue-500 tracking-widest">In Progress</span>
              </button>
              <button 
                onClick={() => onNavigate('complaints')}
                className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100 flex flex-col items-center gap-1 active:scale-95 transition-all"
              >
                 <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                 <span className="text-xl font-black text-emerald-600 tracking-tight">{jobStats.completed}</span>
                 <span className="text-[8px] font-black uppercase text-emerald-500 tracking-widest">Finished</span>
              </button>
           </div>
        </div>
      </div>

      {/* Segmented Controller */}
      <div className="bg-slate-100/50 p-1 rounded-2xl flex gap-1 mb-6 border border-slate-100">
        <button 
          onClick={() => setActiveSegment('transactions')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeSegment === 'transactions' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Transactions
        </button>
        <button 
          onClick={() => setActiveSegment('parties')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeSegment === 'parties' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Parties / Customers
        </button>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
           <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Quick Access</h4>
           <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-[8px] font-black text-blue-600 uppercase">Live DB</span>
           </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {activeSegment === 'transactions' ? (
            <>
               <QuickLink icon={<Plus className="w-5 h-5 text-white" />} label="New Bill" color="bg-blue-600 shadow-blue-500/30" onClick={() => onNavigate('billing')} />
               <QuickLink icon={<ClipboardCheck className="w-5 h-5 text-blue-600" />} label="Job Card" color="bg-blue-50" onClick={() => onNavigate('complaints')} />
               <QuickLink icon={<Package className="w-5 h-5 text-blue-600" />} label="Inventory" color="bg-blue-50" onClick={() => onNavigate('items')} />
               <QuickLink icon={<Wallet className="w-5 h-5 text-blue-600" />} label="Expenses" color="bg-blue-50" onClick={() => onNavigate('expenses')} />
            </>
          ) : (
            <>
              <QuickLink icon={<UserPlus className="w-5 h-5 text-white" />} label="New Party" color="bg-slate-900" onClick={() => onNavigate('customers')} />
              <QuickLink icon={<FileText className="w-5 h-5 text-blue-600" />} label="Statement" color="bg-blue-50" onClick={() => onNavigate('party_statement')} />
              <QuickLink icon={<Settings className="w-5 h-5 text-blue-600" />} label="Setup" color="bg-blue-50" onClick={() => onNavigate('settings/party')} />
              <QuickLink icon={<ChevronRight className="w-5 h-5 text-blue-600" />} label="Other" color="bg-blue-50" onClick={() => setQuickLinkModal('party_options')} />
            </>
          )}
        </div>
      </div>

      {/* Search & List */}
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder={activeSegment === 'transactions' ? "SEARCH BILLS BY BIKE OR NAME..." : "SEARCH CUSTOMERS..."}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-blue-500/5 outline-none shadow-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {activeSegment === 'transactions' && (
            <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-[120px]">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input 
                  type="date" 
                  className="bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black p-2 outline-none text-slate-600 flex-1 uppercase"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div className="text-[10px] font-black text-slate-300">TO</div>
              <div className="flex items-center gap-3 flex-1 min-w-[120px]">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input 
                  type="date" 
                  className="bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black p-2 outline-none text-slate-600 flex-1 uppercase"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
              {(startDate || endDate || searchTerm) && (
                <button 
                  onClick={resetFilters}
                  className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all active:scale-90"
                >
                  <RefreshCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm min-h-[400px]">
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-4">
               <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fetching data...</p>
            </div>
          ) : activeSegment === 'transactions' ? (
            filteredInvoices.length > 0 ? (
              filteredInvoices.map(inv => (
                <TransactionListItem 
                  key={inv.id} 
                  invoice={inv} 
                  onView={() => setViewingInvoice(inv)}
                  onShare={() => shareWhatsApp(inv)}
                  onDelete={(e) => handleDeleteInvoice(e, inv.id)} 
                />
              ))
            ) : <EmptyState message="No transactions found" />
          ) : (
            filteredCustomers.length > 0 ? (
              filteredCustomers.map(cust => (
                <PartyListItem key={cust.id} customer={cust} balance={getCustomerBalance(cust.name)} onDelete={() => handleDeleteCustomer(cust.id)} onNavigate={onNavigate} />
              ))
            ) : <EmptyState message="No customers found" />
          )}
        </div>
      </div>

      {/* FAB */}
      <div className="fixed bottom-24 left-0 right-0 flex justify-center pointer-events-none z-10 px-6">
        <button 
          onClick={() => activeSegment === 'parties' ? onNavigate('customers') : onNavigate('billing')}
          className="pointer-events-auto w-full max-w-sm bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] shadow-2xl flex items-center justify-center gap-3 transform active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          {activeSegment === 'parties' ? "Add New Customer" : "Generate New Bill"}
        </button>
      </div>

      {/* Quick Links Modal */}
      {quickLinkModal !== 'none' && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-end justify-center sm:items-center backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setQuickLinkModal('none')}>
           <div 
             className="bg-white w-full sm:max-w-md rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300"
             onClick={e => e.stopPropagation()}
           >
             <div className="p-8">
                <div className="flex justify-between items-center mb-10">
                   <h3 className="text-xl font-black tracking-tighter uppercase">Extra Tools</h3>
                   <button onClick={() => setQuickLinkModal('none')} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X className="w-6 h-6" /></button>
                </div>
                <div className="grid grid-cols-4 gap-8 pb-6">
                   <OptionItem icon={<Landmark />} label="Banks" onClick={() => onNavigate('dashboard')} />
                   <OptionItem icon={<BookOpen />} label="Day Book" onClick={() => onNavigate('dashboard')} />
                   <OptionItem icon={<FileText />} label="Sales" onClick={() => onNavigate('sale_report')} />
                   <OptionItem icon={<TrendingUp />} label="Ads" onClick={() => onNavigate('ads')} />
                   <OptionItem icon={<Settings />} label="Setup" onClick={() => onNavigate('settings')} />
                   <OptionItem icon={<Calculator />} label="Billing" onClick={() => onNavigate('billing')} />
                   <OptionItem icon={<Users />} label="Parties" onClick={() => onNavigate('customers')} />
                   <OptionItem icon={<MessageSquare />} label="Help" onClick={() => {}} />
                </div>
             </div>
           </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 bg-slate-900/80 z-70 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Bill Record</h3>
                 <button onClick={() => setViewingInvoice(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-10">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-blue-600 rounded-[28px] flex items-center justify-center mx-auto mb-6 text-white shadow-xl shadow-blue-500/20">
                       <Receipt className="w-10 h-10" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tighter uppercase mb-1">SRK BIKE SERVICE</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-80">Ref: #{viewingInvoice.id.slice(-6).toUpperCase()}</p>
                 </div>
                 
                 <div className="bg-slate-50 p-6 rounded-[32px] space-y-4">
                    <div className="flex justify-between items-center text-xs">
                       <span className="font-bold text-slate-400 uppercase tracking-widest">Customer</span>
                       <span className="font-black uppercase text-slate-900">{viewingInvoice.customerName}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className="font-bold text-slate-400 uppercase tracking-widest">Bike No</span>
                       <span className="font-black uppercase bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px]">{viewingInvoice.bikeNumber}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className="font-bold text-slate-400 uppercase tracking-widest">Date</span>
                       <span className="font-black text-slate-900">{new Date(viewingInvoice.date).toLocaleDateString('en-GB')}</span>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Line Items</p>
                    {viewingInvoice.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-start text-xs border-b border-dashed border-slate-100 pb-3 last:border-0">
                        <div>
                          <p className="font-black uppercase text-slate-800">{item.description}</p>
                          <p className="text-[9px] font-bold text-slate-400">GST Rate: {item.gstRate}%</p>
                        </div>
                        <p className="font-black text-slate-900">₹{item.amount.toLocaleString()}</p>
                      </div>
                    ))}
                 </div>

                 <div className="pt-6 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Grand Total</span>
                       <span className="text-4xl font-black tracking-tighter text-slate-900">₹{viewingInvoice.finalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className={`text-[9px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${viewingInvoice.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                          {viewingInvoice.paymentStatus}
                       </span>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">VIA {viewingInvoice.paymentMode}</span>
                    </div>
                 </div>

                 {viewingInvoice.paymentStatus === 'Paid' && (
                   <div className="bg-emerald-50 p-5 rounded-[24px] flex items-center gap-4 border border-emerald-100">
                      <div className="bg-emerald-600 p-2 rounded-xl text-white">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                         <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Verified Payment</p>
                         <p className="text-[9px] font-bold text-emerald-600 opacity-70 uppercase">Transaction ID: MGS-TX-{viewingInvoice.id.slice(-4)}</p>
                      </div>
                   </div>
                 )}
              </div>

              <div className="p-8 border-t border-slate-100 flex flex-col gap-3 bg-white">
                 <div className="flex gap-4">
                    <button 
                      onClick={() => shareWhatsApp(viewingInvoice)}
                      className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                        <MessageCircle className="w-5 h-5" /> Share
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                        <Printer className="w-5 h-5" /> Print
                    </button>
                 </div>
                 <button 
                   onClick={() => window.print()}
                   className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-red-500/20"
                 >
                    <Download className="w-5 h-5" /> Save as PDF
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const QuickLink: React.FC<{ icon: React.ReactNode, label: string, color: string, onClick: () => void }> = ({ icon, label, color, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-3 group active:scale-95 transition-all">
    <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center shadow-sm group-hover:shadow-lg transition-all ${color}`}>
      {icon}
    </div>
    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center leading-tight">{label}</span>
  </button>
);

const OptionItem: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
   <button onClick={onClick} className="flex flex-col items-center gap-3 group active:scale-95 transition-all">
      <div className="w-16 h-16 rounded-[24px] bg-blue-50/80 flex items-center justify-center text-blue-600 transition-all border border-blue-100 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-xl group-hover:shadow-blue-500/20">
         {React.cloneElement(icon as React.ReactElement<any>, { className: "w-7 h-7 stroke-[2]" })}
      </div>
      <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.1em] text-center">{label}</span>
   </button>
);

const TransactionListItem: React.FC<{ invoice: Invoice, onView: () => void, onShare: () => void, onDelete: (e: React.MouseEvent) => void }> = ({ invoice, onView, onShare, onDelete }) => (
  <div 
    onClick={onView}
    className="p-5 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-all cursor-pointer active:bg-slate-100/50 flex justify-between items-center"
  >
    <div className="flex-1">
      <div className="flex justify-between items-start mb-2 pr-4">
        <h4 className="font-black text-slate-900 text-[11px] uppercase tracking-tight">{invoice.customerName}</h4>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
      </div>
      <div className="flex justify-between items-end pr-4">
        <div className="space-y-1.5">
            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 w-fit px-2 py-0.5 rounded-lg border border-blue-100">{invoice.bikeNumber}</p>
            <p className="text-sm font-black text-slate-900 tracking-tight">₹ {invoice.finalAmount.toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-3">
            <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-widest ${invoice.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
              {invoice.paymentStatus}
            </span>
        </div>
      </div>
    </div>
    <div className="flex flex-col gap-2">
       <button 
         onClick={(e) => { e.stopPropagation(); onShare(); }}
         className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all active:scale-90"
       >
          <MessageCircle className="w-5 h-5" />
       </button>
       <button 
         onClick={onDelete} 
         className="p-3 bg-red-50 text-red-300 hover:text-red-500 rounded-2xl transition-colors"
       >
          <Trash2 className="w-5 h-5" />
       </button>
    </div>
  </div>
);

const PartyListItem: React.FC<{ customer: Customer, balance: number, onDelete: () => void, onNavigate: (t: string) => void }> = ({ customer, balance, onDelete, onNavigate }) => (
  <div className="p-5 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-all flex justify-between items-center group relative">
    <div onClick={() => onNavigate('party_statement')} className="cursor-pointer flex-1">
      <h4 className="font-black text-slate-900 text-[11px] uppercase tracking-tight">{customer.name}</h4>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 bg-slate-50 w-fit px-2 py-0.5 rounded-lg">{customer.bikeNumber}</p>
    </div>
    <div className="text-right flex items-center gap-6">
      <div>
        <p className={`text-sm font-black tracking-tight ${balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>₹ {balance.toLocaleString()}</p>
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{balance > 0 ? 'Balance Due' : 'All Settled'}</p>
      </div>
      <button onClick={onDelete} className="p-2 text-slate-200 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
    </div>
  </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="py-32 text-center flex flex-col items-center gap-4">
    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
       <CircleAlert className="w-8 h-8 text-slate-200" />
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{message}</p>
  </div>
);

export default DashboardPage;
