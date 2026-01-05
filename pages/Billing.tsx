

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Receipt, CreditCard, Wallet, Smartphone, Printer, CheckCircle, Loader2, Plus, Trash2, IndianRupee } from 'lucide-react';
import { dbService } from '../db';
import { Complaint, Invoice, ComplaintStatus, AppSettings, InvoiceItem } from '../types';

const BillingPage: React.FC = () => {
  const [complaintId, setComplaintId] = useState('');
  const [foundComplaint, setFoundComplaint] = useState<Complaint | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card'>('Cash');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid'>('Paid');
  const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dbService.getSettings().then(setSettings);
  }, []);

  const totals = useMemo(() => {
    let subTotal = 0;
    let taxAmount = 0;

    items.forEach(item => {
      const amount = item.amount || 0;
      const rate = item.gstRate || 0;
      
      // Assume amount entered is exclusive of tax for simplicity in this basic version,
      // or implement "inclusiveTax" check from settings.
      // Here: Amount entered is treated as taxable value.
      const tax = (amount * rate) / 100;
      
      subTotal += amount;
      taxAmount += tax;
    });

    return {
      subTotal,
      taxAmount,
      finalAmount: subTotal + taxAmount
    };
  }, [items]);

  const searchComplaint = async () => {
    try {
      setLoading(true);
      const complaints = await dbService.getComplaints();
      const searchKey = complaintId.trim().toUpperCase();
      
      const comp = complaints.find(c => 
        c && (
          (c.id && c.id.toUpperCase() === searchKey) || 
          (c.bikeNumber && c.bikeNumber.toUpperCase() === searchKey)
        )
      );

      if (comp) {
        setFoundComplaint(comp);
        // Initialize with one item based on complaint estimate
        setItems([{ id: 'init-1', description: 'General Service', amount: comp.estimatedCost, gstRate: 0 }]);
      } else {
        alert('Complaint or Job Card not found. Please verify the ID or Bike Number.');
      }
    } catch (err) {
      console.error(err);
      alert('Error searching for complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '', amount: 0, gstRate: 0 }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const calculateNextServiceDate = (interval: string) => {
    const now = new Date();
    switch (interval) {
      case '1 Month': now.setMonth(now.getMonth() + 1); break;
      case '3 Months': now.setMonth(now.getMonth() + 3); break;
      case '6 Months': now.setMonth(now.getMonth() + 6); break;
      case '1 Year': now.setFullYear(now.getFullYear() + 1); break;
      default: now.setMonth(now.getMonth() + 3);
    }
    return now.toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundComplaint) return;

    try {
      setLoading(true);
      const invoice = await dbService.generateInvoice({
        complaintId: foundComplaint.id,
        bikeNumber: foundComplaint.bikeNumber,
        customerName: foundComplaint.customerName,
        details: foundComplaint.details,
        items: items,
        estimatedCost: foundComplaint.estimatedCost,
        finalAmount: totals.finalAmount,
        subTotal: totals.subTotal,
        taxAmount: totals.taxAmount,
        paymentMode,
        paymentStatus
      });

      if (paymentStatus === 'Paid') {
        await dbService.updateComplaintStatus(foundComplaint.id, ComplaintStatus.COMPLETED);
        
        // Auto-schedule next service reminder if enabled
        if (settings?.reminders.enabled && settings?.reminders.autoSchedule) {
          const nextDate = calculateNextServiceDate(settings.reminders.defaultInterval);
          await dbService.addReminder({
            bikeNumber: foundComplaint.bikeNumber,
            customerName: foundComplaint.customerName,
            phone: foundComplaint.customerPhone,
            reminderDate: nextDate,
            serviceType: 'Regular Maintenance'
          });
        }
      }

      setGeneratedInvoice(invoice);
    } catch (err) {
      console.error(err);
      alert('Failed to generate invoice.');
    } finally {
      setLoading(false);
    }
  };

  const deleteGeneratedInvoice = async () => {
    if (!generatedInvoice) return;
    if (window.confirm("Are you sure you want to delete this invoice? This cannot be undone.")) {
      setLoading(true);
      await dbService.deleteInvoice(generatedInvoice.id);
      setGeneratedInvoice(null);
      setFoundComplaint(null);
      setComplaintId('');
      setLoading(false);
    }
  };

  const printInvoice = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 no-print animate-in fade-in duration-500">
      <header className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Checkout & Billing</h2>
        <p className="text-slate-500">Itemize services and parts to generate invoice</p>
      </header>

      {/* Lookup */}
      {!generatedInvoice && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Enter Job Card ID or Bike Number..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono"
                value={complaintId}
                onChange={e => setComplaintId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchComplaint()}
              />
            </div>
            <button 
              onClick={searchComplaint}
              disabled={loading}
              className="bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Fetch Details
            </button>
          </div>
        </div>
      )}

      {foundComplaint && !generatedInvoice && (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in slide-in-from-bottom-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Service & Item Details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Receipt className="text-blue-600 w-5 h-5" />
                    Bill Items
                  </h3>
                  <button type="button" onClick={addItem} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-blue-100 transition-colors">
                    <Plus className="w-3 h-3" /> Add Item / Part
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item, idx) => (
                    <div key={item.id} className="flex gap-4 items-end animate-in fade-in slide-in-from-left-2 duration-200">
                      <div className="flex-[2]">
                        {idx === 0 && <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Description</label>}
                        <input 
                          required
                          type="text"
                          placeholder="Part name or Service..."
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                          value={item.description}
                          onChange={e => updateItem(item.id, 'description', e.target.value)}
                        />
                      </div>
                      <div className="w-24">
                        {idx === 0 && <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Tax %</label>}
                        <select
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                          value={item.gstRate || 0}
                          onChange={e => updateItem(item.id, 'gstRate', parseFloat(e.target.value) || 0)}
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </div>
                      <div className="w-32">
                         {idx === 0 && <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Amount</label>}
                         <div className="relative">
                           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                           <input 
                             required
                             type="number"
                             className="w-full pl-6 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                             value={item.amount || ''}
                             onChange={e => updateItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                           />
                         </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                        className="p-3 text-slate-300 hover:text-red-500 disabled:opacity-30 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Job Card Notes</h4>
                 <p className="text-sm text-slate-600 italic">"{foundComplaint.details}"</p>
              </div>
            </div>

            {/* Checkout Actions */}
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg space-y-6 sticky top-8">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Customer Details</p>
                  <h4 className="font-bold text-slate-900">{foundComplaint.customerName}</h4>
                  <p className="font-mono text-sm bg-slate-100 px-2 py-0.5 rounded inline-block uppercase">{foundComplaint.bikeNumber}</p>
                </div>

                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <div className="space-y-2 text-sm">
                     <div className="flex justify-between">
                        <span className="text-slate-500">Sub Total</span>
                        <span className="font-bold">₹{totals.subTotal.toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between text-blue-600">
                        <span className="text-blue-500">Total Tax</span>
                        <span className="font-bold">+ ₹{totals.taxAmount.toLocaleString()}</span>
                     </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Payment Mode</label>
                    <div className="grid grid-cols-3 gap-3">
                      <PaymentModeBtn label="Cash" icon={<Wallet className="w-4 h-4" />} active={paymentMode === 'Cash'} onClick={() => setPaymentMode('Cash')} />
                      <PaymentModeBtn label="UPI" icon={<Smartphone className="w-4 h-4" />} active={paymentMode === 'UPI'} onClick={() => setPaymentMode('UPI')} />
                      <PaymentModeBtn label="Card" icon={<CreditCard className="w-4 h-4" />} active={paymentMode === 'Card'} onClick={() => setPaymentMode('Card')} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Payment Status</label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" checked={paymentStatus === 'Paid'} onChange={() => setPaymentStatus('Paid')} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                        <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">Paid Fully</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" checked={paymentStatus === 'Unpaid'} onChange={() => setPaymentStatus('Unpaid')} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                        <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">Pending</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t-2 border-slate-900 flex justify-between items-center">
                  <span className="font-bold text-slate-500 text-sm">Grand Total</span>
                  <span className="text-3xl font-black text-slate-900 tracking-tighter">₹{totals.finalAmount.toLocaleString()}</span>
                </div>

                <button 
                  type="submit" 
                  disabled={loading || totals.finalAmount <= 0}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-6 h-6 animate-spin" />}
                  GENERATE BILL
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {generatedInvoice && (
        <div className="animate-in zoom-in-95 duration-300">
          <div className="bg-white border border-slate-200 rounded-[40px] shadow-2xl p-16 max-w-3xl mx-auto overflow-hidden">
            <div className="flex justify-between items-start mb-12">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-blue-600 rounded-2xl shadow-lg"><Receipt className="w-7 h-7 text-white" /></div>
                  <h1 className="text-3xl font-black tracking-tighter">BIKESERVICE PRO</h1>
                </div>
                <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black pl-1">Official Tax Invoice</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-slate-900">#{generatedInvoice.id}</p>
                <p className="text-slate-500 text-xs font-bold">{new Date(generatedInvoice.date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12 mb-12 py-10 border-y border-slate-100">
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Bill To</h4>
                <p className="font-black text-slate-900 text-2xl mb-1">{generatedInvoice.customerName}</p>
                <p className="text-sm font-black bg-slate-900 text-white px-3 py-1 rounded inline-block uppercase tracking-wider">{generatedInvoice.bikeNumber}</p>
              </div>
              <div className="text-right">
                <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Payment Info</h4>
                <p className="text-lg font-black text-slate-900 flex items-center justify-end gap-2">
                  <CreditCard className="w-5 h-5 text-blue-500" /> {generatedInvoice.paymentMode}
                </p>
                <p className={`text-xs font-black uppercase tracking-widest mt-2 px-3 py-1 inline-block rounded-full ${generatedInvoice.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{generatedInvoice.paymentStatus}</p>
              </div>
            </div>

            <table className="w-full mb-8">
              <thead className="border-b-2 border-slate-900">
                <tr>
                  <th className="text-left py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Description / Service / Part</th>
                  <th className="text-right py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Rate (₹)</th>
                  <th className="text-right py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Tax</th>
                  <th className="text-right py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {generatedInvoice.items && generatedInvoice.items.length > 0 ? (
                  generatedInvoice.items.map((item, idx) => {
                     const amt = item.amount || 0;
                     const tax = (amt * (item.gstRate || 0)) / 100;
                     return (
                        <tr key={idx}>
                          <td className="py-6 pr-4 font-bold text-slate-800 text-sm">{item.description}</td>
                          <td className="py-6 text-right font-bold text-slate-600">₹{amt.toLocaleString()}</td>
                          <td className="py-6 text-right font-bold text-slate-600 text-xs">{item.gstRate}% (₹{tax.toFixed(2)})</td>
                          <td className="py-6 text-right font-black text-slate-900">₹{(amt + tax).toLocaleString()}</td>
                        </tr>
                     );
                  })
                ) : (
                  <tr>
                    <td className="py-6 pr-4 font-bold text-slate-800 text-sm">Full Bike Service & Repair</td>
                    <td colSpan={3} className="py-6 text-right font-black text-slate-900">₹{generatedInvoice.finalAmount.toLocaleString()}</td>
                  </tr>
                )}
              </tbody>
            </table>
            
            <div className="flex justify-end mb-12">
               <div className="w-1/2 space-y-3">
                  <div className="flex justify-between text-sm">
                     <span className="font-bold text-slate-500">Sub Total</span>
                     <span className="font-bold text-slate-800">₹{generatedInvoice.subTotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span className="font-bold text-slate-500">Total Tax</span>
                     <span className="font-bold text-slate-800">₹{generatedInvoice.taxAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-4 border-t-2 border-slate-900">
                     <span className="font-black text-slate-900 uppercase text-xs tracking-widest pt-2">Amount Payable</span>
                     <span className="text-3xl font-black text-slate-900 tracking-tighter">₹{generatedInvoice.finalAmount.toLocaleString()}</span>
                  </div>
               </div>
            </div>

            <div className="text-center pt-4">
              <div className="inline-flex items-center gap-2 text-emerald-600 bg-emerald-50 px-8 py-3 rounded-2xl mb-8 border border-emerald-100">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-black uppercase tracking-widest">Transaction Successful</span>
              </div>
              <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.3em]">Thank you for riding with BikeService Pro</p>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-12 no-print">
            <button 
              onClick={() => { setGeneratedInvoice(null); setFoundComplaint(null); setComplaintId(''); }}
              className="px-8 py-4 bg-white border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
            >
              Close & New Bill
            </button>
            <button 
              onClick={deleteGeneratedInvoice}
              disabled={loading}
              className="px-8 py-4 bg-red-50 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete Bill
            </button>
            <button 
              onClick={printInvoice}
              className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/30"
            >
              <Printer className="w-5 h-5" />
              Print Invoice
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const PaymentModeBtn: React.FC<{ label: string, icon: React.ReactNode, active: boolean, onClick: () => void }> = ({ label, icon, active, onClick }) => (
  <button type="button" onClick={onClick} className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
      active ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-blue-100'
    }`}>
    {icon}
    <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
  </button>
);

export default BillingPage;