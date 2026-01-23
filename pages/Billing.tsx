
import React, { useState, useEffect, useMemo } from 'react';
// Added Landmark to resolve "Cannot find name 'Landmark'" error on line 403
import { Search, Receipt, CreditCard, Wallet, Smartphone, Printer, CheckCircle, Loader2, Plus, Trash2, IndianRupee, ChevronRight, Bike, User, Share2, Eye, EyeOff, MessageCircle, X, BellRing, Calendar, Download, Activity, Sparkles, Tag, Clock, MapPin, Phone, Building2, Landmark } from 'lucide-react';
import { dbService } from '../db';
import { Complaint, Invoice, ComplaintStatus, AppSettings, InvoiceItem, InventoryItem, Customer, BankAccount } from '../types';

const BillingPage: React.FC = () => {
  const [complaintId, setComplaintId] = useState('');
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [foundComplaint, setFoundComplaint] = useState<Complaint | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('CASH-01');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid'>('Paid');
  const [odometerReading, setOdometerReading] = useState<string>('');
  const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null);
  const [draftInvoice, setDraftInvoice] = useState<Invoice | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [showJobSuggestions, setShowJobSuggestions] = useState(false);
  const [itemSearchIndex, setItemSearchIndex] = useState<number | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Reminder Logic State
  const [scheduleReminder, setScheduleReminder] = useState(false);
  const [reminderInterval, setReminderInterval] = useState('3 Months');
  const [reminderDate, setReminderDate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [sData, cData, iData, custData, accData] = await Promise.all([
      dbService.getSettings(),
      dbService.getComplaints(),
      dbService.getInventory(),
      dbService.getCustomers(),
      dbService.getBankAccounts()
    ]);
    setSettings(sData);
    setAllComplaints(cData.filter(c => c.status !== ComplaintStatus.COMPLETED));
    setInventory(iData);
    setCustomers(custData);
    setAccounts(accData);
    
    if (sData?.reminders?.autoSchedule) {
      setScheduleReminder(true);
      setReminderInterval(sData.reminders.defaultInterval || '3 Months');
    }
  };

  const jobSuggestions = useMemo(() => {
    if (!complaintId || foundComplaint) return [];
    const searchKey = complaintId.trim().toLowerCase();
    
    return allComplaints.filter(c => {
      const customer = customers.find(cust => cust.bikeNumber === c.bikeNumber || cust.phone === c.customerPhone);
      return (
        c.id.toLowerCase().includes(searchKey) ||
        c.bikeNumber.toLowerCase().includes(searchKey) ||
        c.customerName.toLowerCase().includes(searchKey) ||
        c.customerPhone.includes(searchKey) ||
        (customer?.city && customer.city.toLowerCase().includes(searchKey))
      );
    }).slice(0, 5);
  }, [allComplaints, complaintId, foundComplaint, customers]);

  const totals = useMemo(() => {
    let subTotal = 0;
    let taxAmount = 0;
    items.forEach(item => {
      const amount = Number(item.amount) || 0;
      const rate = Number(item.gstRate) || 0;
      const tax = (amount * rate) / 100;
      subTotal += amount;
      taxAmount += tax;
    });
    return { subTotal, taxAmount, finalAmount: subTotal + taxAmount };
  }, [items]);

  const calculateReminderDate = (interval: string) => {
    const now = new Date();
    if (interval === '15 Days') now.setDate(now.getDate() + 15);
    else if (interval === '1 Month') now.setMonth(now.getMonth() + 1);
    else if (interval === '3 Months') now.setMonth(now.getMonth() + 3);
    else if (interval === '6 Months') now.setMonth(now.getMonth() + 6);
    return now.toISOString().split('T')[0];
  };

  const selectComplaint = (comp: Complaint) => {
    setFoundComplaint(comp);
    setComplaintId(comp.bikeNumber);
    setItems([{ id: 'init-1', description: 'General Service Charge', amount: comp.estimatedCost, gstRate: 0 }]);
    setShowJobSuggestions(false);
    if (settings?.reminders?.defaultInterval) {
      setReminderInterval(settings.reminders.defaultInterval);
    }
  };

  const searchComplaint = async () => {
    try {
      setLoading(true);
      const searchKey = complaintId.trim().toLowerCase();
      const comp = allComplaints.find(c => {
         const customer = customers.find(cust => cust.bikeNumber === c.bikeNumber || cust.phone === c.customerPhone);
         return (
            c.id.toLowerCase() === searchKey ||
            c.bikeNumber.toLowerCase() === searchKey ||
            c.customerPhone === searchKey ||
            c.customerName.toLowerCase() === searchKey ||
            (customer?.city && customer.city.toLowerCase() === searchKey)
         );
      });
      if (comp) selectComplaint(comp);
      else alert('No active record found matching: ' + complaintId);
    } catch (err) {
      console.error(err);
      alert('Search failed.');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => setItems([...items, { id: Date.now().toString(), description: '', amount: 0, gstRate: 0 }]);
  const removeItem = (id: string) => setItems(items.filter(item => item.id !== id));
  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));

  const selectInventoryItem = (index: number, invItem: InventoryItem) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      description: invItem.name.toUpperCase(),
      amount: invItem.unitPrice,
      gstRate: invItem.gstRate || 0,
      inventoryItemId: invItem.id 
    };
    setItems(newItems);
    setItemSearchIndex(null);
  };

  const handlePreview = () => {
    if (!foundComplaint) return;
    if (totals.finalAmount <= 0) { alert("Invalid Total."); return; }
    const accName = accounts.find(a => a.id === selectedAccountId)?.name || 'Generic';
    setDraftInvoice({
      id: (settings?.transaction.prefixes.sale || 'INV-') + Date.now(),
      complaintId: foundComplaint.id,
      bikeNumber: foundComplaint.bikeNumber,
      customerName: foundComplaint.customerName,
      details: foundComplaint.details,
      items,
      estimatedCost: foundComplaint.estimatedCost,
      finalAmount: totals.finalAmount,
      subTotal: totals.subTotal,
      taxAmount: totals.taxAmount,
      paymentMode: accName,
      accountId: selectedAccountId,
      paymentStatus,
      date: new Date().toISOString(),
      odometerReading: odometerReading ? parseFloat(odometerReading) : undefined,
      docType: 'Sale'
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!foundComplaint) return;
    if (totals.finalAmount <= 0) return;
    try {
      setLoading(true);
      const accName = accounts.find(a => a.id === selectedAccountId)?.name || 'Generic';
      
      const invoice = await dbService.generateInvoice({
        complaintId: foundComplaint.id,
        bikeNumber: foundComplaint.bikeNumber,
        customerName: foundComplaint.customerName,
        details: foundComplaint.details,
        items,
        estimatedCost: foundComplaint.estimatedCost,
        finalAmount: totals.finalAmount,
        subTotal: totals.subTotal,
        taxAmount: totals.taxAmount,
        accountId: selectedAccountId,
        paymentMode: accName,
        paymentStatus,
        customerPhone: foundComplaint.customerPhone,
        odometerReading: odometerReading ? parseFloat(odometerReading) : undefined,
        docType: 'Sale'
      });

      // Log financial transaction turn
      if (paymentStatus === 'Paid') {
        await dbService.addTransaction({
          entityId: foundComplaint.bikeNumber,
          accountId: selectedAccountId,
          type: 'IN',
          amount: totals.finalAmount,
          paymentMode: accName,
          description: `Sale Settlement #${invoice.id.slice(-6)}`
        });
        
        await dbService.updateComplaintStatus(foundComplaint.id, ComplaintStatus.COMPLETED);
        if (scheduleReminder) {
          const rDate = reminderDate || calculateReminderDate(reminderInterval);
          await dbService.addReminder({
            bikeNumber: foundComplaint.bikeNumber,
            customerName: foundComplaint.customerName,
            phone: foundComplaint.customerPhone,
            reminderDate: rDate,
            serviceType: 'Next Periodic Service',
          });
        }
      }
      setDraftInvoice(null);
      setGeneratedInvoice(invoice);
    } catch (err) {
      console.error(err);
      alert('Invoice generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const shareWhatsApp = () => {
    const inv = generatedInvoice || draftInvoice;
    if (!inv) return;
    const msg = `Dear ${inv.customerName}, your Tax Invoice for bike ${inv.bikeNumber} at Moto Gear SRK is ready. Final Total: ₹${inv.finalAmount.toLocaleString()}. Thank you!`;
    dbService.sendWhatsApp(foundComplaint?.customerPhone || '', msg);
  };

  const invoiceToRender = generatedInvoice || draftInvoice;

  return (
    <div className="max-w-5xl mx-auto space-y-8 no-print animate-in fade-in duration-500 pb-20 px-4">
      <header className="flex flex-col items-center pt-4">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Sale Invoice</h2>
        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.4em] mt-2">Revenue Settle Terminal</p>
      </header>

      {!invoiceToRender && (
        <div className="bg-white p-5 rounded-[40px] border border-slate-100 shadow-sm relative z-40">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2 text-blue-400">
                <Search className="w-5 h-5" />
              </div>
              <input 
                type="text" 
                placeholder="SEARCH BY NAME, BIKE, PHONE, OR CITY..."
                className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-8 focus:ring-blue-500/5 outline-none font-black text-[11px] tracking-widest placeholder:text-slate-300 transition-all uppercase"
                value={complaintId}
                onChange={e => {
                  setComplaintId(e.target.value);
                  setFoundComplaint(null);
                  setShowJobSuggestions(true);
                }}
                onFocus={() => setShowJobSuggestions(true)}
                onBlur={() => setTimeout(() => setShowJobSuggestions(false), 200)}
              />
              {showJobSuggestions && jobSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-100 rounded-[32px] shadow-2xl overflow-hidden z-[60] animate-in slide-in-from-top-2">
                  {jobSuggestions.map(comp => {
                    const cust = customers.find(c => c.bikeNumber === comp.bikeNumber || c.phone === comp.customerPhone);
                    return (
                      <button key={comp.id} type="button" onClick={() => selectComplaint(comp)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0 group text-left">
                        <div className="flex items-center gap-4">
                          <div className="bg-blue-50 p-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors"><Bike className="w-5 h-5" /></div>
                          <div>
                            <div className="flex items-center gap-2">
                               <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{comp.bikeNumber}</p>
                               <span className="text-[8px] font-black uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">Active Job</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{comp.customerName}</p>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                               <div className="flex items-center gap-1.5">
                                  <Phone className="w-3 h-3 text-emerald-500" />
                                  <span className="text-[9px] font-black text-slate-500">{comp.customerPhone}</span>
                               </div>
                               {cust?.city && (
                                  <div className="flex items-center gap-1.5">
                                     <MapPin className="w-3 h-3 text-red-400" />
                                     <span className="text-[9px] font-black text-slate-500 uppercase">{cust.city}</span>
                                  </div>
                               )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <button onClick={searchComplaint} disabled={loading || !complaintId} className="bg-slate-900 text-white px-10 py-5 rounded-3xl font-black text-[11px] tracking-widest uppercase hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />} Fetch Details
            </button>
          </div>
        </div>
      )}

      {foundComplaint && !invoiceToRender && (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-bottom-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-slate-800"><Tag className="w-4 h-4 text-blue-500" /> Professional Billing</h3>
                  <button type="button" onClick={addItem} className="text-[10px] bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-lg active:scale-95 transition-all"><Plus className="w-4 h-4" /> Add Row</button>
                </div>
                <div className="space-y-6">
                  {items.map((item, idx) => (
                    <div key={item.id} className="relative space-y-3 border-b border-slate-50 pb-6 last:border-0 last:pb-0">
                      <div className="flex gap-4">
                        <div className="flex-1 relative">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Inventory / Task Item</label>
                          <input required type="text" placeholder="DESC..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-xs font-black uppercase tracking-tight focus:ring-4 focus:ring-blue-500/5 transition-all" value={item.description} onFocus={() => setItemSearchIndex(idx)} onBlur={() => setTimeout(() => setItemSearchIndex(null), 250)} onChange={e => updateItem(item.id, 'description', e.target.value)} />
                          {itemSearchIndex === idx && item.description.length >= 1 && (
                            <div className="absolute top-[100%] left-0 right-0 mt-2 bg-white border border-slate-100 rounded-[24px] shadow-2xl z-50 max-h-60 overflow-y-auto animate-in slide-in-from-top-2">
                              {inventory.filter(i => i.name.toLowerCase().includes(item.description.toLowerCase())).slice(0, 8).map(inv => (
                                <button key={inv.id} type="button" onMouseDown={() => selectInventoryItem(idx, inv)} className="w-full px-5 py-4 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0 flex justify-between items-center group">
                                  <div><p className="text-xs font-black text-slate-900 uppercase tracking-tight">{inv.name}</p><p className="text-[9px] text-slate-400 font-bold uppercase">STOCK: {inv.stock} | ₹{inv.unitPrice}</p></div>
                                  <div className="bg-blue-50 p-1.5 rounded-lg group-hover:bg-blue-600 group-hover:text-white"><Plus className="w-4 h-4" /></div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="w-24">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">GST %</label>
                          <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-xs font-black" value={item.gstRate || 0} onChange={e => updateItem(item.id, 'gstRate', parseFloat(e.target.value) || 0)}>
                            {[0,5,12,18,28].map(r => <option key={r} value={r}>{r}%</option>)}
                          </select>
                        </div>
                        <div className="w-32">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Line Total (₹)</label>
                           <input required type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-xs font-black" value={item.amount || ''} onChange={e => updateItem(item.id, 'amount', parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="self-end pb-1.5"><button type="button" onClick={() => removeItem(item.id)} disabled={items.length === 1} className="p-3 text-slate-300 hover:text-red-500 disabled:opacity-30 transition-colors"><Trash2 className="w-5 h-5" /></button></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-slate-800"><Activity className="w-4 h-4 text-amber-500" /> Log Telemetry</h3>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Final Odometer Reading (KM)</label>
                  <input type="number" placeholder="0" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm text-slate-700" value={odometerReading} onChange={e => setOdometerReading(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8 sticky top-20">
                <div className="bg-slate-50/80 p-5 rounded-[24px]">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Entity Details</p>
                  <h4 className="font-black text-slate-900 text-xs uppercase mb-1 tracking-tight">{foundComplaint.customerName}</h4>
                  <div className="flex items-center justify-between">
                     <p className="font-black text-[10px] text-blue-500 uppercase tracking-widest">{foundComplaint.bikeNumber}</p>
                     {customers.find(c => c.bikeNumber === foundComplaint.bikeNumber)?.city && (
                        <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1">
                           <MapPin className="w-3 h-3" /> {customers.find(c => c.bikeNumber === foundComplaint.bikeNumber)?.city}
                        </span>
                     )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest"><span>Net Base</span><span>₹{totals.subTotal.toLocaleString()}</span></div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-blue-500 tracking-widest"><span>Tax Component</span><span>+ ₹{totals.taxAmount.toLocaleString()}</span></div>
                  <div className="pt-5 border-t border-slate-100 flex justify-between items-center"><span className="font-black text-slate-800 uppercase text-xs tracking-tighter">Settlement Total</span><span className="text-4xl font-black tracking-tighter text-slate-900">₹{totals.finalAmount.toLocaleString()}</span></div>
                </div>

                <div className="p-5 bg-blue-50/50 rounded-[28px] border border-blue-100/50 space-y-4">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2"><BellRing className="w-4 h-4 text-blue-600" /><span className="text-[10px] font-black uppercase text-blue-800 tracking-widest">Post-Service Alert</span></div>
                     <button type="button" onClick={() => setScheduleReminder(!scheduleReminder)} className={`w-10 h-5 rounded-full relative transition-all ${scheduleReminder ? 'bg-blue-600' : 'bg-slate-200'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${scheduleReminder ? 'left-5.5' : 'left-0.5'}`} /></button>
                  </div>
                  {scheduleReminder && (
                    <div className="space-y-3 animate-in fade-in zoom-in-95">
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Retention Date</p>
                       <input type="date" className="w-full px-4 py-3 bg-white border border-blue-100 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-blue-500" value={reminderDate || calculateReminderDate(reminderInterval)} onChange={(e) => setReminderDate(e.target.value)} />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Account Settle Mode</p>
                  <div className="grid grid-cols-1 gap-2">
                    {accounts.map(acc => (
                      <button 
                        key={acc.id} 
                        type="button" 
                        onClick={() => setSelectedAccountId(acc.id)} 
                        className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase border-2 transition-all flex items-center justify-between ${selectedAccountId === acc.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                      >
                         <div className="flex items-center gap-2">
                           {acc.type === 'Cash' ? <Wallet className="w-4 h-4" /> : <Landmark className="w-4 h-4" />}
                           {acc.name}
                         </div>
                         {selectedAccountId === acc.id && <CheckCircle className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setPaymentStatus('Paid')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${paymentStatus === 'Paid' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-white border-slate-200 text-slate-400'}`}>Full Pay</button>
                    <button type="button" onClick={() => setPaymentStatus('Unpaid')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${paymentStatus === 'Unpaid' ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-white border-slate-200 text-slate-400'}`}>On Credit</button>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                   <button type="button" onClick={handlePreview} className="w-full bg-slate-50 text-slate-600 py-5 rounded-[24px] font-black text-[11px] uppercase tracking-[0.3em] border border-slate-200 active:scale-95 transition-all">Preview Document</button>
                   <button type="submit" disabled={loading || totals.finalAmount <= 0} className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all disabled:opacity-50">{loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Settle Invoice'}</button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {invoiceToRender && (
        <div className="space-y-8 animate-in zoom-in-95 duration-300 pb-20">
          <div className="flex justify-center gap-4">
            <button onClick={() => setIsPreviewMode(!isPreviewMode)} className={`flex items-center gap-3 px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${isPreviewMode ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{isPreviewMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />} {isPreviewMode ? 'Wide View' : 'Phone View'}</button>
            {draftInvoice && <button onClick={() => setDraftInvoice(null)} className="flex items-center gap-3 px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest bg-white border border-slate-200 text-slate-600 active:scale-95 transition-all"><X className="w-5 h-5" /> Edit</button>}
          </div>
          <div className={`bg-white border border-slate-100 shadow-2xl mx-auto overflow-hidden transition-all duration-500 relative ${isPreviewMode ? 'max-w-[400px] rounded-[56px] ring-12 ring-slate-900/5' : 'max-w-4xl rounded-[40px]'}`}>
             {isPreviewMode ? (
               <div className="p-10 space-y-10 text-slate-800">
                 <div className="text-center"><div className="w-20 h-20 rounded-[32px] bg-blue-600 flex items-center justify-center mx-auto mb-6 text-white shadow-xl"><Receipt className="w-10 h-10" /></div><h1 className="text-2xl font-black tracking-tighter uppercase mb-1">MOTO GEAR SRK</h1><p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Official Tax Invoice</p></div>
                 <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100/50 space-y-4">
                    <div className="flex justify-between items-center text-xs"><span className="font-bold text-slate-400 uppercase tracking-widest">Recipient</span><span className="font-black uppercase text-slate-900">{invoiceToRender.customerName}</span></div>
                    <div className="flex justify-between items-center text-xs"><span className="font-bold text-slate-400 uppercase tracking-widest">Bike Identity</span><span className="font-black uppercase bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] tracking-widest">{invoiceToRender.bikeNumber}</span></div>
                    <div className="flex justify-between items-center text-xs"><span className="font-bold text-slate-400 uppercase tracking-widest">Dated</span><span className="font-black text-slate-900">{new Date(invoiceToRender.date).toLocaleDateString('en-GB')}</span></div>
                 </div>
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Settlement Log</p>
                    {invoiceToRender.items.map((item, i) => (<div key={i} className="flex justify-between items-start text-xs border-b border-dashed border-slate-100 pb-3 last:border-0 last:pb-0"><div className="flex-1 pr-4"><p className="font-black uppercase text-slate-900 leading-tight">{item.description}</p></div><p className="font-black text-slate-900">₹{item.amount.toLocaleString()}</p></div>))}
                 </div>
                 <div className="pt-6 space-y-3"><div className="flex justify-between items-baseline pt-2"><span className="text-xs font-black uppercase tracking-widest">Net Final</span><span className="text-5xl font-black tracking-tighter text-slate-900">₹{invoiceToRender.finalAmount.toLocaleString()}</span></div></div>
                 <div className="p-6 rounded-[32px] flex items-center gap-5 border shadow-sm bg-emerald-50 border-emerald-100"><div className="p-3 rounded-2xl shadow-lg text-white bg-emerald-600"><CheckCircle className="w-7 h-7" /></div><div className="flex-1"><p className="text-[11px] font-black uppercase tracking-widest text-emerald-800">Confirmed Payment</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Mode: {invoiceToRender.paymentMode}</p></div></div>
               </div>
             ) : (
               <div className="p-16 relative z-10">
                 <div className="flex justify-between items-start mb-16"><div className="space-y-2"><h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">MOTO GEAR SRK</h1><div className="flex items-center gap-3"><p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500">Tax Invoice Document</p><div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div><p className="text-[11px] text-blue-600 font-black uppercase tracking-[0.2em]">Authorized Center</p></div></div><div className="text-right space-y-1"><p className="text-xl font-black text-slate-900">{draftInvoice ? 'DRAFT' : `INV-#${invoiceToRender.id.slice(-6).toUpperCase()}`}</p><p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{new Date(invoiceToRender.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p></div></div>
                 <div className="grid grid-cols-2 gap-12 mb-12 border-y border-slate-100 py-10"><div className="space-y-4"><p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Client Entity</p><div><p className="text-2xl font-black uppercase text-slate-900">{invoiceToRender.customerName}</p><p className="text-sm font-black text-blue-600 tracking-widest uppercase">{invoiceToRender.bikeNumber}</p></div></div><div className="text-right space-y-4"><p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Payment Status</p><div className="space-y-1"><p className="text-sm font-black uppercase text-slate-900">{invoiceToRender.paymentStatus}</p><p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Method: {invoiceToRender.paymentMode}</p></div></div></div>
                 <table className="w-full text-left mb-12"><thead className="border-b-4 border-slate-900"><tr><th className="py-6 font-black uppercase tracking-widest text-[11px] text-slate-400">Inventory Part / Service</th><th className="py-6 text-right font-black uppercase tracking-widest text-[11px] text-slate-400">GST %</th><th className="py-6 text-right font-black uppercase tracking-widest text-[11px] text-slate-400">Line Total</th></tr></thead><tbody className="divide-y divide-slate-50">{invoiceToRender.items.map((it, i) => (<tr key={i} className="hover:bg-slate-50 transition-colors"><td className="py-6 font-black uppercase text-sm tracking-tight text-slate-800">{it.description}</td><td className="py-6 text-right font-bold text-slate-500">{it.gstRate}%</td><td className="py-6 text-right font-black text-slate-900">₹{it.amount.toLocaleString()}</td></tr>))}</tbody></table>
                 <div className="flex justify-end pt-8 border-t-4 border-slate-900"><div className="w-72 space-y-4"><div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest"><span>Consolidated Tax</span><span className="text-blue-600">₹{invoiceToRender.taxAmount?.toLocaleString()}</span></div><div className="flex justify-between pt-6 border-t border-slate-100"><span className="uppercase text-xs font-black self-center tracking-[0.2em] text-slate-400">Net Payable</span><span className="text-4xl font-black tracking-tighter text-slate-900">₹{invoiceToRender.finalAmount.toLocaleString()}</span></div></div></div>
               </div>
             )}
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-12 pb-12">
            {generatedInvoice ? (
              <><button onClick={() => { setGeneratedInvoice(null); setFoundComplaint(null); setComplaintId(''); setOdometerReading(''); }} className="px-8 py-5 bg-white border border-slate-100 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 shadow-sm active:scale-95 transition-all">New Invoice</button><button onClick={shareWhatsApp} className="px-8 py-5 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 shadow-xl active:scale-95 transition-all"><MessageCircle className="w-5 h-5" /> Share WA</button><button onClick={() => window.print()} className="px-8 py-5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase flex items-center gap-3 shadow-2xl active:scale-95 transition-all"><Printer className="w-5 h-5" /> Print Bill</button><button onClick={() => window.print()} className="px-8 py-5 bg-red-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 shadow-xl active:scale-95 transition-all"><Download className="w-5 h-5" /> PDF</button></>
            ) : (
              <><button onClick={() => setDraftInvoice(null)} className="px-8 py-5 bg-white border border-slate-100 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 active:scale-95 transition-all">Abort Draft</button><button onClick={() => handleSubmit()} className="px-8 py-5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 shadow-2xl active:scale-95 transition-all">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />} Commit Settlement</button></>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;
