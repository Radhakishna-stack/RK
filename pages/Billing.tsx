
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Receipt, CreditCard, Wallet, Smartphone, Printer, CheckCircle, Loader2, Plus, Trash2, IndianRupee, ChevronRight, Bike, User, Share2, Eye, EyeOff, MessageCircle, X, BellRing, Calendar, Download } from 'lucide-react';
import { dbService } from '../db';
import { Complaint, Invoice, ComplaintStatus, AppSettings, InvoiceItem, InventoryItem, Customer } from '../types';

const BillingPage: React.FC = () => {
  const [complaintId, setComplaintId] = useState('');
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [foundComplaint, setFoundComplaint] = useState<Complaint | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card'>('Cash');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid'>('Paid');
  const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null);
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
    const [sData, cData, iData] = await Promise.all([
      dbService.getSettings(),
      dbService.getComplaints(),
      dbService.getInventory()
    ]);
    setSettings(sData);
    setAllComplaints(cData.filter(c => c.status !== ComplaintStatus.COMPLETED));
    setInventory(iData);
    
    // Set default reminder toggle based on settings
    if (sData?.reminders?.autoSchedule) {
      setScheduleReminder(true);
      setReminderInterval(sData.reminders.defaultInterval || '3 Months');
    }
  };

  const jobSuggestions = useMemo(() => {
    if (!complaintId || foundComplaint) return [];
    const searchKey = complaintId.trim().toUpperCase();
    return allComplaints.filter(c => 
      (c.id && c.id.toUpperCase().includes(searchKey)) || 
      (c.bikeNumber && c.bikeNumber.toUpperCase().includes(searchKey)) ||
      (c.customerName && c.customerName.toUpperCase().includes(searchKey))
    ).slice(0, 5);
  }, [allComplaints, complaintId, foundComplaint]);

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

    return {
      subTotal,
      taxAmount,
      finalAmount: subTotal + taxAmount
    };
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
    
    // Refresh interval from settings whenever a new complaint is selected
    if (settings?.reminders?.defaultInterval) {
      setReminderInterval(settings.reminders.defaultInterval);
    }
  };

  const searchComplaint = async () => {
    try {
      setLoading(true);
      const searchKey = complaintId.trim().toUpperCase();
      const comp = allComplaints.find(c => 
        c && (
          (c.id && c.id.toUpperCase() === searchKey) || 
          (c.bikeNumber && c.bikeNumber.toUpperCase() === searchKey)
        )
      );

      if (comp) {
        selectComplaint(comp);
      } else {
        alert('Active Job Card not found. Please verify the Bike Number.');
      }
    } catch (err) {
      console.error(err);
      alert('Error searching for job card.');
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

  const selectInventoryItem = (index: number, invItem: InventoryItem) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      description: invItem.name.toUpperCase(),
      amount: invItem.unitPrice,
      gstRate: invItem.gstRate || 0,
      inventoryItemId: invItem.id // Link to SKU for stock tracking
    };
    setItems(newItems);
    setItemSearchIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundComplaint) return;
    if (totals.finalAmount <= 0) {
      alert("Grand Total must be greater than zero.");
      return;
    }

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
        paymentStatus,
        customerPhone: foundComplaint.customerPhone
      });

      if (paymentStatus === 'Paid') {
        await dbService.updateComplaintStatus(foundComplaint.id, ComplaintStatus.COMPLETED);
        
        // Handle Reminder Creation
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

      setGeneratedInvoice(invoice);
    } catch (err) {
      console.error(err);
      alert('Failed to generate invoice.');
    } finally {
      setLoading(false);
    }
  };

  const shareWhatsApp = () => {
    if (!generatedInvoice) return;
    const msg = `Dear ${generatedInvoice.customerName}, your bill for bike ${generatedInvoice.bikeNumber} at Moto Gear SRK is ready. Total Amount: ₹${generatedInvoice.finalAmount.toLocaleString()}. Thank you!`;
    const phone = foundComplaint?.customerPhone || '';
    dbService.sendWhatsApp(phone, msg);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 no-print animate-in fade-in duration-500 pb-20 px-4">
      <header className="text-center pt-4">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Billing Module</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-80 mt-1">Moto Gear SRK - Professional Center</p>
      </header>

      {!generatedInvoice && (
        <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm relative z-40">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5" />
              <input 
                type="text" 
                placeholder="TYPE BIKE NO. TO FETCH JOB CARD..."
                className="w-full pl-12 pr-4 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none uppercase font-black text-[11px] tracking-widest placeholder:text-slate-300 transition-all"
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
                  {jobSuggestions.map(comp => (
                    <button key={comp.id} type="button" onClick={() => selectComplaint(comp)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0 group">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-50 p-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                           <Bike className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{comp.bikeNumber}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{comp.customerName}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={searchComplaint} disabled={loading || !complaintId} className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-[11px] tracking-widest uppercase hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Receipt className="w-5 h-5" />}
              Fetch Card
            </button>
          </div>
        </div>
      )}

      {foundComplaint && !generatedInvoice && (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-bottom-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-slate-800">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div> Bill Items
                  </h3>
                  <button type="button" onClick={addItem} className="text-[10px] bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                    <Plus className="w-4 h-4" /> New Item
                  </button>
                </div>

                <div className="space-y-6">
                  {items.map((item, idx) => (
                    <div key={item.id} className="relative space-y-3 border-b border-slate-50 pb-6 last:border-0 last:pb-0">
                      <div className="flex gap-4">
                        <div className="flex-1 relative">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Description / Part Name</label>
                          <input 
                            required
                            type="text"
                            placeholder="SEARCH FROM INVENTORY..."
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-xs font-black uppercase tracking-tight focus:ring-4 focus:ring-blue-500/5 transition-all"
                            value={item.description}
                            onFocus={() => setItemSearchIndex(idx)}
                            onBlur={() => setTimeout(() => setItemSearchIndex(null), 250)}
                            onChange={e => updateItem(item.id, 'description', e.target.value)}
                          />
                          {itemSearchIndex === idx && item.description.length >= 1 && (
                            <div className="absolute top-[100%] left-0 right-0 mt-2 bg-white border border-slate-100 rounded-[24px] shadow-2xl z-50 max-h-60 overflow-y-auto animate-in slide-in-from-top-2">
                              {inventory.filter(i => i.name.toLowerCase().includes(item.description.toLowerCase())).slice(0, 8).map(inv => (
                                <button key={inv.id} type="button" onMouseDown={() => selectInventoryItem(idx, inv)} className="w-full px-5 py-4 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0 flex justify-between items-center group">
                                  <div>
                                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{inv.name}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">STOCK: {inv.stock} | ₹{inv.unitPrice}</p>
                                  </div>
                                  <div className="bg-blue-50 p-1.5 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <Plus className="w-4 h-4" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="w-24">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">GST %</label>
                          <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-xs font-black appearance-none cursor-pointer" value={item.gstRate || 0} onChange={e => updateItem(item.id, 'gstRate', parseFloat(e.target.value) || 0)}>
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </div>
                        <div className="w-32">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Price (₹)</label>
                           <input required type="number" placeholder="0.00" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-xs font-black tracking-tight" value={item.amount || ''} onChange={e => updateItem(item.id, 'amount', parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="self-end pb-1.5">
                          <button type="button" onClick={() => removeItem(item.id)} disabled={items.length === 1} className="p-3 text-slate-300 hover:text-red-500 disabled:opacity-30 transition-colors"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                <div className="bg-slate-50/80 p-5 rounded-[24px] border border-slate-100/50">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer Details</p>
                  <h4 className="font-black text-slate-900 text-xs uppercase mb-1 tracking-tight">{foundComplaint.customerName}</h4>
                  <div className="flex items-center gap-2">
                    <p className="font-black text-[10px] text-blue-500 uppercase tracking-widest">{foundComplaint.bikeNumber}</p>
                    <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                    <p className="text-[10px] font-bold text-slate-400">{foundComplaint.customerPhone}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <span>Sub Total</span>
                    <span className="text-slate-900">₹{totals.subTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-blue-500 tracking-widest">
                    <span>GST (Estimated)</span>
                    <span>+ ₹{totals.taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="pt-5 border-t border-slate-100 flex justify-between items-center">
                    <span className="font-black text-slate-800 uppercase text-xs tracking-tighter">Net Payable</span>
                    <span className="text-4xl font-black text-slate-900 tracking-tighter">₹{totals.finalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Service Retention Card */}
                <div className="p-5 bg-blue-50/50 rounded-[28px] border border-blue-100/50 space-y-4">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <BellRing className="w-4 h-4 text-blue-600" />
                        <span className="text-[10px] font-black uppercase text-blue-800 tracking-widest">Service Retention</span>
                     </div>
                     <button 
                       type="button" 
                       onClick={() => setScheduleReminder(!scheduleReminder)}
                       className={`w-10 h-5 rounded-full relative transition-all duration-300 ${scheduleReminder ? 'bg-blue-600' : 'bg-slate-200'}`}
                     >
                       <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${scheduleReminder ? 'left-5.5' : 'left-0.5'}`} />
                     </button>
                  </div>
                  
                  {scheduleReminder && (
                    <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Schedule Next Visit</p>
                       
                       {settings?.reminders?.manualDateSelection ? (
                          <div className="relative">
                             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                             <input 
                               type="date"
                               className="w-full pl-9 pr-4 py-3 bg-white border border-blue-100 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-blue-500"
                               value={reminderDate || calculateReminderDate(reminderInterval)}
                               onChange={(e) => setReminderDate(e.target.value)}
                             />
                          </div>
                       ) : (
                          <div className="grid grid-cols-2 gap-2">
                             {['15 Days', '1 Month', '3 Months', '6 Months'].map(opt => (
                               <button
                                 key={opt}
                                 type="button"
                                 onClick={() => { setReminderInterval(opt); setReminderDate(''); }}
                                 className={`py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-tight border transition-all ${reminderInterval === opt ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-blue-100 text-blue-400'}`}
                               >
                                 {opt}
                               </button>
                             ))}
                          </div>
                       )}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Choose Payment Mode</p>
                  <div className="grid grid-cols-3 gap-3">
                    <PayBtn active={paymentMode === 'Cash'} onClick={() => setPaymentMode('Cash')} label="Cash" />
                    <PayBtn active={paymentMode === 'UPI'} onClick={() => setPaymentMode('UPI')} label="UPI" />
                    <PayBtn active={paymentMode === 'Card'} onClick={() => setPaymentMode('Card')} label="Card" />
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                   <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => setPaymentStatus('Paid')}
                        className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${paymentStatus === 'Paid' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-white border-slate-200 text-slate-400'}`}
                      >
                         Mark as Paid
                      </button>
                      <button 
                        type="button"
                        onClick={() => setPaymentStatus('Unpaid')}
                        className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${paymentStatus === 'Unpaid' ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-white border-slate-200 text-slate-400'}`}
                      >
                         Keep Unpaid
                      </button>
                   </div>
                   
                   <button type="submit" disabled={loading || totals.finalAmount <= 0} className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all disabled:opacity-50">
                      {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Finalize & Generate'}
                   </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {generatedInvoice && (
        <div className="space-y-8 animate-in zoom-in-95 duration-300 pb-20">
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => setIsPreviewMode(!isPreviewMode)} 
              className={`flex items-center gap-3 px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all shadow-sm ${isPreviewMode ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
            >
              {isPreviewMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              {isPreviewMode ? 'Desktop Layout' : 'Mobile Preview'}
            </button>
          </div>

          <div className={`bg-white border border-slate-100 shadow-2xl mx-auto overflow-hidden transition-all duration-500 ${isPreviewMode ? 'max-w-[400px] rounded-[56px] ring-12 ring-slate-900/5' : 'max-w-4xl rounded-[40px]'}`}>
             {isPreviewMode ? (
               <div className="p-10 space-y-10 text-slate-800">
                 <div className="text-center">
                    <div className="w-20 h-20 bg-blue-600 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-white shadow-xl shadow-blue-500/20">
                       <Receipt className="w-10 h-10" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tighter uppercase mb-1">SRK BIKE SERVICE</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Official Receipt</p>
                 </div>
                 
                 <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100/50 space-y-4">
                    <div className="flex justify-between items-center text-xs">
                       <span className="font-bold text-slate-400 uppercase tracking-widest">Customer</span>
                       <span className="font-black uppercase text-slate-900">{generatedInvoice.customerName}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className="font-bold text-slate-400 uppercase tracking-widest">Bike No</span>
                       <span className="font-black uppercase bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] tracking-widest">{generatedInvoice.bikeNumber}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className="font-bold text-slate-400 uppercase tracking-widest">Bill Date</span>
                       <span className="font-black text-slate-900">{new Date(generatedInvoice.date).toLocaleDateString('en-GB')}</span>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Line Items</p>
                    {generatedInvoice.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-start text-xs border-b border-dashed border-slate-100 pb-3 last:border-0 last:pb-0">
                        <div className="flex-1 pr-4">
                          <p className="font-black uppercase text-slate-900 leading-tight">{item.description}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">GST: {item.gstRate}%</p>
                        </div>
                        <p className="font-black text-slate-900">₹{item.amount.toLocaleString()}</p>
                      </div>
                    ))}
                 </div>

                 <div className="pt-6 space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       <span>Tax Component</span>
                       <span className="text-blue-600">₹{generatedInvoice.taxAmount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-2">
                       <span className="text-xs font-black uppercase tracking-widest">Total Paid</span>
                       <span className="text-5xl font-black tracking-tighter text-slate-900">₹{generatedInvoice.finalAmount.toLocaleString()}</span>
                    </div>
                 </div>

                 <div className="bg-emerald-50 p-6 rounded-[32px] flex items-center gap-5 border border-emerald-100 shadow-sm shadow-emerald-500/5">
                    <div className="bg-emerald-600 text-white p-3 rounded-2xl shadow-lg">
                      <CheckCircle className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                       <p className="text-[11px] font-black text-emerald-800 uppercase tracking-widest">Payment Confirmed</p>
                       <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-tight">Reference Verified</p>
                    </div>
                 </div>
               </div>
             ) : (
               <div className="p-16">
                 <div className="flex justify-between items-start mb-16">
                    <div className="space-y-2">
                       <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">SRK BIKE SERVICE</h1>
                       <div className="flex items-center gap-3">
                          <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em]">Tax Invoice</p>
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                          <p className="text-[11px] text-blue-600 font-black uppercase tracking-[0.2em]">Moto Gear SRK</p>
                       </div>
                    </div>
                    <div className="text-right space-y-1">
                       <p className="text-xl font-black text-slate-900">INV-#{generatedInvoice.id.slice(-6).toUpperCase()}</p>
                       <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{new Date(generatedInvoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-12 mb-12 border-y border-slate-100 py-10">
                    <div className="space-y-4">
                       <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Customer Data</p>
                       <div>
                          <p className="text-2xl font-black uppercase text-slate-900">{generatedInvoice.customerName}</p>
                          <div className="flex items-center gap-2 mt-1">
                             <p className="text-sm font-black text-blue-600 tracking-widest uppercase">{generatedInvoice.bikeNumber}</p>
                             <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                             <p className="text-sm font-bold text-slate-400">{foundComplaint?.customerPhone}</p>
                          </div>
                       </div>
                    </div>
                    <div className="text-right space-y-4">
                       <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Txn Profile</p>
                       <div className="space-y-1">
                          <p className="text-sm font-black uppercase text-slate-900">Payment: {generatedInvoice.paymentMode}</p>
                          <p className={`text-[11px] font-black uppercase tracking-widest ${generatedInvoice.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-red-500'}`}>{generatedInvoice.paymentStatus}</p>
                       </div>
                    </div>
                 </div>

                 <table className="w-full text-left mb-12">
                    <thead className="border-b-4 border-slate-900">
                       <tr>
                          <th className="py-6 font-black uppercase tracking-widest text-[11px] text-slate-400">Description</th>
                          <th className="py-6 text-right font-black uppercase tracking-widest text-[11px] text-slate-400">GST Slab</th>
                          <th className="py-6 text-right font-black uppercase tracking-widest text-[11px] text-slate-400">Amount</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {generatedInvoice.items.map((it, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                             <td className="py-6 font-black uppercase text-sm tracking-tight text-slate-800">{it.description}</td>
                             <td className="py-6 text-right font-bold text-slate-500">{it.gstRate}%</td>
                             <td className="py-6 text-right font-black text-slate-900">₹{it.amount.toLocaleString()}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>

                 <div className="flex justify-end pt-8 border-t-4 border-slate-900">
                    <div className="w-72 space-y-4">
                       <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                          <span>Sub Total</span>
                          <span className="text-slate-900">₹{generatedInvoice.subTotal?.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                          <span>Consolidated GST</span>
                          <span className="text-blue-600">₹{generatedInvoice.taxAmount?.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between pt-6 border-t border-slate-100">
                          <span className="uppercase text-xs font-black self-center tracking-[0.2em] text-slate-400">Final Total</span>
                          <span className="text-4xl font-black text-slate-900 tracking-tighter">₹{generatedInvoice.finalAmount.toLocaleString()}</span>
                       </div>
                    </div>
                 </div>
                 
                 <div className="mt-20 pt-10 border-t border-slate-100 text-center">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Ride Safe • Wear Helmet • Moto Gear SRK</p>
                 </div>
               </div>
             )}
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-12 pb-12">
            <button onClick={() => { setGeneratedInvoice(null); setFoundComplaint(null); setComplaintId(''); }} className="px-8 py-5 bg-white border border-slate-100 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-50 shadow-sm active:scale-95 transition-all">Generate Next</button>
            <button onClick={shareWhatsApp} className="px-8 py-5 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"><MessageCircle className="w-5 h-5" /> WhatsApp</button>
            <button onClick={() => window.print()} className="px-8 py-5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3 shadow-2xl active:scale-95 transition-all"><Printer className="w-5 h-5" /> Print</button>
            <button onClick={() => window.print()} className="px-8 py-5 bg-red-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3 shadow-xl shadow-red-500/20 active:scale-95 transition-all"><Download className="w-5 h-5" /> Save as PDF</button>
          </div>
        </div>
      )}
    </div>
  );
};

const PayBtn: React.FC<{ label: string, active: boolean, onClick: () => void }> = ({ label, active, onClick }) => (
  <button type="button" onClick={onClick} className={`py-4 rounded-2xl text-[10px] font-black uppercase border-2 transition-all tracking-widest ${active ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/10' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
    {label}
  </button>
);

export default BillingPage;
