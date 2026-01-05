

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Filter, MoreVertical, Settings, ChevronRight, 
  Loader2, Share2, FileText, UserPlus, Printer, Trash2, CircleAlert,
  Landmark, BookOpen, TrendingUp, Scale, MessageSquare, Receipt,
  ArrowDownToLine, CornerUpLeft, Calculator, ClipboardList, Percent, ShoppingCart,
  ArrowUpFromLine, CornerUpRight, ClipboardCopy, Wallet, ArrowLeftRight, X,
  Award, Download, MessageCircle, BellRing, FileInput, Users, Contact
} from 'lucide-react';
import { dbService } from '../db';
import { Invoice, Customer } from '../types';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [activeSegment, setActiveSegment] = useState<'transactions' | 'parties'>('transactions');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [quickLinkModal, setQuickLinkModal] = useState<'none' | 'add_txn' | 'more_options' | 'party_options'>('none');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      dbService.getInvoices(),
      dbService.getCustomers()
    ]).then(([invData, custData]) => {
      setInvoices(invData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setCustomers(custData);
      setLoading(false);
    });
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => 
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.bikeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(cust => 
      cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.bikeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.phone.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  const getCustomerBalance = (name: string) => {
    return invoices
      .filter(i => i.customerName === name && i.paymentStatus === 'Unpaid')
      .reduce((sum, i) => sum + i.finalAmount, 0);
  };

  const handleDeleteInvoice = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this bill?")) {
      await dbService.deleteInvoice(id);
      setInvoices(invoices.filter(i => i.id !== id));
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (window.confirm("Delete this party?")) {
      await dbService.deleteCustomer(id);
      setCustomers(customers.filter(c => c.id !== id));
    }
  };

  return (
    <div className="pb-28 relative">
      {/* Tabs */}
      <div className="flex gap-4 mb-4 px-1">
        <button 
          onClick={() => setActiveSegment('transactions')}
          className={`flex-1 py-2.5 rounded-full text-sm font-bold border transition-all ${
            activeSegment === 'transactions' 
              ? 'bg-red-50 border-red-200 text-red-600' 
              : 'bg-white border-slate-200 text-slate-500'
          }`}
        >
          Transaction Details
        </button>
        <button 
          onClick={() => setActiveSegment('parties')}
          className={`flex-1 py-2.5 rounded-full text-sm font-bold border transition-all ${
            activeSegment === 'parties' 
              ? 'bg-red-50 border-red-200 text-red-600' 
              : 'bg-white border-slate-200 text-slate-500'
          }`}
        >
          Party Details
        </button>
      </div>

      {/* Promotional Banner */}
      <div className="bg-gradient-to-r from-red-100 to-pink-100 rounded-xl p-4 mb-4 flex items-center justify-between shadow-sm border border-red-50">
        <div className="flex items-center gap-3">
           <div className="bg-white p-2 rounded-lg shadow-sm">
             <Printer className="w-6 h-6 text-slate-800" />
           </div>
           <div>
             <h4 className="font-bold text-slate-800 text-sm">Get Vyapar Assured Thermal Printers</h4>
             <p className="text-[10px] text-slate-600 mt-0.5">Built to work flawlessly with Vyapar</p>
           </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-500" />
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-4">
        <h4 className="text-[11px] font-bold text-slate-800 mb-4">Quick Links</h4>
        <div className="flex justify-between">
          {activeSegment === 'transactions' ? (
            <>
               <QuickLink 
                 icon={<Plus className="w-5 h-5 text-white" />} 
                 label="Add Txn" 
                 color="bg-red-500" 
                 onClick={() => setQuickLinkModal('add_txn')} 
               />
               <QuickLink 
                 icon={<FileText className="w-5 h-5 text-blue-500" />} 
                 label="Sale Report" 
                 color="bg-blue-50" 
                 onClick={() => onNavigate('sale_report')} 
               />
               <QuickLink 
                 icon={<Settings className="w-5 h-5 text-blue-500" />} 
                 label="Txn Settings" 
                 color="bg-blue-50" 
                 onClick={() => onNavigate('settings/transaction')} 
               />
               <QuickLink 
                 icon={<ChevronRight className="w-5 h-5 text-blue-500" />} 
                 label="Show All" 
                 color="bg-blue-50" 
                 onClick={() => setQuickLinkModal('more_options')} 
               />
            </>
          ) : (
            <>
              <QuickLink icon={<Share2 className="w-5 h-5 text-white" />} label="Network" color="bg-orange-500" onClick={() => {}} />
              <QuickLink icon={<FileText className="w-5 h-5 text-slate-600" />} label="Party Statement" color="bg-blue-100 border border-blue-200" onClick={() => onNavigate('party_statement')} />
              <QuickLink icon={<Settings className="w-5 h-5 text-slate-600" />} label="Party Settings" color="bg-blue-100 border border-blue-200" onClick={() => onNavigate('settings/party')} />
              <QuickLink icon={<ChevronRight className="w-5 h-5 text-slate-600" />} label="Show All" color="bg-blue-100 border border-blue-200" onClick={() => setQuickLinkModal('party_options')} />
            </>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder={activeSegment === 'transactions' ? "Search for a transaction" : "Search any party"}
            className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2">
             <Filter className="w-5 h-5 text-blue-600" />
          </button>
        </div>
        {activeSegment === 'parties' && (
          <button onClick={() => setQuickLinkModal('party_options')} className="bg-white border border-slate-200 rounded-lg p-3 text-slate-500">
             <MoreVertical className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Lists */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm min-h-[300px]">
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : activeSegment === 'transactions' ? (
          filteredInvoices.length > 0 ? (
            filteredInvoices.map(inv => (
              <TransactionListItem 
                key={inv.id} 
                invoice={inv} 
                onDelete={() => handleDeleteInvoice(inv.id)} 
              />
            ))
          ) : (
            <EmptyState message="No transactions found" />
          )
        ) : (
          filteredCustomers.length > 0 ? (
            filteredCustomers.map(cust => (
              <PartyListItem 
                key={cust.id} 
                customer={cust} 
                balance={getCustomerBalance(cust.name)}
                onDelete={() => handleDeleteCustomer(cust.id)} 
              />
            ))
          ) : (
            <EmptyState message="No parties found" />
          )
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 left-0 right-0 flex justify-center pointer-events-none z-10">
        <button 
          onClick={() => activeSegment === 'parties' ? onNavigate('customers') : setQuickLinkModal('add_txn')}
          className="pointer-events-auto bg-red-600 text-white px-6 py-3.5 rounded-full font-bold flex items-center gap-2 shadow-xl shadow-red-500/30 transform active:scale-95 transition-all"
        >
          {activeSegment === 'parties' ? <UserPlus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {activeSegment === 'parties' ? "Add New Party" : "Add New Sale"}
        </button>
      </div>

      {/* More Options Modal (Transaction context) */}
      {quickLinkModal === 'more_options' && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end justify-center sm:items-center backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
               <h3 className="text-lg font-bold text-slate-800">More Options</h3>
               <button onClick={() => setQuickLinkModal('none')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 grid grid-cols-4 gap-y-6 gap-x-2">
               <OptionItem icon={<Landmark />} label="Bank Accounts" onClick={() => { setQuickLinkModal('none'); onNavigate('dashboard'); }} />
               <OptionItem icon={<BookOpen />} label="Day Book" onClick={() => { setQuickLinkModal('none'); onNavigate('dashboard'); }} />
               <OptionItem icon={<FileText />} label="All Txns Report" onClick={() => { setQuickLinkModal('none'); onNavigate('dashboard'); }} />
               <OptionItem icon={<TrendingUp />} label="Profit & Loss" onClick={() => { setQuickLinkModal('none'); onNavigate('dashboard'); }} iconClass="bg-indigo-100 text-indigo-600" />
               <OptionItem icon={<Scale />} label="Balance Sheet" onClick={() => { setQuickLinkModal('none'); onNavigate('dashboard'); }} />
               <OptionItem icon={<Receipt />} label="Billwise PnL" onClick={() => { setQuickLinkModal('none'); onNavigate('dashboard'); }} iconClass="bg-purple-100 text-purple-600" badge="👑" />
               <OptionItem icon={<Printer />} label="Print Settings" onClick={() => { setQuickLinkModal('none'); onNavigate('settings'); }} />
               <OptionItem icon={<MessageSquare />} label="Txn SMS Settings" onClick={() => { setQuickLinkModal('none'); onNavigate('settings'); }} />
            </div>
          </div>
        </div>
      )}

      {/* Party Options Modal (Home -> Party Details -> Show All) */}
      {quickLinkModal === 'party_options' && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end justify-center sm:items-center backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
               <h3 className="text-lg font-bold text-slate-800">More Options</h3>
               <button onClick={() => setQuickLinkModal('none')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8 grid grid-cols-3 gap-y-8 gap-x-4">
               <OptionItem icon={<Contact />} label="Loyalty Points" onClick={() => {}} iconClass="bg-blue-50 text-blue-600" />
               <OptionItem icon={<Share2 />} label="Invite Party" onClick={() => {}} iconClass="bg-blue-50 text-blue-600" />
               <OptionItem icon={<Users />} label="Partywise PnL" onClick={() => {}} badge="👑" iconClass="bg-blue-50 text-blue-600"/>
               <OptionItem icon={<FileText />} label="All Parties Report" onClick={() => {}} iconClass="bg-blue-50 text-blue-600" />
               <OptionItem icon={<BellRing />} label="Reminder Settings" onClick={() => onNavigate('settings')} iconClass="bg-blue-50 text-blue-600" />
               <OptionItem icon={<MessageCircle />} label="WhatsApp Marketing" onClick={() => onNavigate('settings')} iconClass="bg-blue-50 text-blue-600" />
               <OptionItem icon={<Download />} label="Import Party" onClick={() => {}} iconClass="bg-blue-50 text-blue-600" />
            </div>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {quickLinkModal === 'add_txn' && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end justify-center sm:items-center backdrop-blur-sm animate-in fade-in duration-200">
           <div 
             className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300 max-h-[85vh] overflow-y-auto"
             onClick={e => e.stopPropagation()}
           >
             <div className="flex justify-between items-center p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
                <h3 className="text-lg font-bold text-slate-800">Add Transaction</h3>
                <button onClick={() => setQuickLinkModal('none')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X className="w-6 h-6" /></button>
             </div>
             <div className="p-6 space-y-6">
                <div>
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Sale Transactions</h4>
                   <div className="grid grid-cols-3 gap-y-6">
                      <OptionItem icon={<ArrowDownToLine />} label="Payment-In" onClick={() => {}} iconClass="bg-blue-100 text-blue-600" />
                      <OptionItem icon={<CornerUpLeft />} label="Sale Return" onClick={() => {}} />
                      <OptionItem icon={<Calculator />} label="Estimate/ Quotation" onClick={() => { setQuickLinkModal('none'); onNavigate('billing'); }} />
                      <OptionItem icon={<ClipboardList />} label="Sale Order" onClick={() => {}} />
                      <OptionItem icon={<Percent />} label="Sale Invoice" onClick={() => { setQuickLinkModal('none'); onNavigate('billing'); }} iconClass="bg-blue-100 text-blue-600" />
                   </div>
                </div>
                
                <div className="h-px bg-slate-100 w-full" />

                <div>
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Purchase Transactions</h4>
                   <div className="grid grid-cols-3 gap-y-6">
                      <OptionItem icon={<ShoppingCart />} label="Purchase" onClick={() => { setQuickLinkModal('none'); onNavigate('items'); }} iconClass="bg-blue-100 text-blue-600" />
                      <OptionItem icon={<ArrowUpFromLine />} label="Payment-Out" onClick={() => {}} />
                      <OptionItem icon={<CornerUpRight />} label="Purchase Return" onClick={() => {}} />
                      <OptionItem icon={<ClipboardCopy />} label="Purchase Order" onClick={() => {}} />
                   </div>
                </div>

                <div className="h-px bg-slate-100 w-full" />

                <div>
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Other Transactions</h4>
                   <div className="grid grid-cols-3 gap-y-6">
                      <OptionItem icon={<Wallet />} label="Expenses" onClick={() => { setQuickLinkModal('none'); onNavigate('expenses'); }} iconClass="bg-blue-100 text-blue-600" badge="✨" />
                      <OptionItem icon={<ArrowLeftRight />} label="P2P Transfer" onClick={() => {}} />
                   </div>
                </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

const QuickLink: React.FC<{ icon: React.ReactNode, label: string, color: string, onClick: () => void }> = ({ icon, label, color, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-2 w-16 group active:scale-95 transition-transform">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all ${color}`}>
      {icon}
    </div>
    <span className="text-[10px] font-medium text-slate-600 text-center leading-tight h-8 flex items-center">{label}</span>
  </button>
);

const OptionItem: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void, iconClass?: string, badge?: string }> = ({ icon, label, onClick, iconClass, badge }) => (
   <button onClick={onClick} className="flex flex-col items-center gap-2 group relative active:scale-95 transition-transform">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm group-hover:shadow-md ${iconClass || 'bg-white border border-slate-200 text-slate-600'}`}>
         {React.isValidElement(icon) 
           ? React.cloneElement(icon as React.ReactElement<any>, { className: "w-6 h-6 stroke-[1.5]" })
           : icon}
         {badge && (
           <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-[9px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
             {badge}
           </div>
         )}
      </div>
      <span className="text-[11px] font-medium text-slate-600 text-center leading-tight max-w-[80px]">{label}</span>
   </button>
);

const PartyListItem: React.FC<{ customer: Customer, balance: number, onDelete: () => void }> = ({ customer, balance, onDelete }) => {
  return (
    <div className="flex justify-between items-center p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors group relative">
      <div>
        <h4 className="font-semibold text-slate-800">{customer.name}</h4>
        <p className="text-xs text-slate-400 mt-0.5">{new Date(customer.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}</p>
      </div>
      <div className="text-right">
        <p className={`font-bold ${balance > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
          ₹ {balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
        {balance > 0 && <p className="text-[10px] font-bold text-emerald-600 uppercase">You'll Get</p>}
        {balance === 0 && <p className="text-[10px] text-slate-400">Settled</p>}
      </div>
      
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

const TransactionListItem: React.FC<{ invoice: Invoice, onDelete: () => void }> = ({ invoice, onDelete }) => {
  return (
    <div className="bg-white p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-slate-800 text-sm">{invoice.customerName}</h4>
        <div className="text-right">
           <p className="text-[10px] text-slate-400 font-mono">#{invoice.id.slice(-6).toUpperCase()}</p>
           <p className="text-[10px] text-slate-400 mt-0.5">{new Date(invoice.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}</p>
           <p className="text-[10px] text-slate-400">Due: {new Date(invoice.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}</p>
        </div>
      </div>
      
      <div className="mb-4">
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
          invoice.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        }`}>
          SALE : {invoice.paymentStatus.toUpperCase()}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div className="flex gap-8">
           <div>
             <p className="text-[10px] text-slate-400 mb-0.5">Total</p>
             <p className="font-bold text-slate-900 text-sm">₹ {invoice.finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
           </div>
           <div>
             <p className="text-[10px] text-slate-400 mb-0.5">Balance</p>
             <p className="font-bold text-slate-900 text-sm">₹ {(invoice.paymentStatus === 'Paid' ? 0 : invoice.finalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={() => window.print()} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><Printer className="w-5 h-5 stroke-[1.5]" /></button>
           <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><Share2 className="w-5 h-5 stroke-[1.5]" /></button>
           <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><MoreVertical className="w-5 h-5 stroke-[1.5]" /></button>
        </div>
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="py-16 text-center">
    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
      <CircleAlert className="w-8 h-8 text-slate-300" />
    </div>
    <p className="text-slate-400 font-medium text-sm">{message}</p>
  </div>
);

export default DashboardPage;