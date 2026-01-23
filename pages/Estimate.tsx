
import React, { useState, useEffect, useMemo } from 'react';
import { Search, FileText, Printer, CheckCircle, Loader2, Plus, Trash2, IndianRupee, ChevronRight, Bike, User, Share2, Eye, EyeOff, MessageCircle, X, Download, Activity, Sparkles, Tag, MapPin, Phone, Clock } from 'lucide-react';
import { dbService } from '../db';
import { Complaint, Invoice, ComplaintStatus, AppSettings, InvoiceItem, InventoryItem, Customer } from '../types';

const EstimatePage: React.FC = () => {
  const [complaintId, setComplaintId] = useState('');
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [foundComplaint, setFoundComplaint] = useState<Complaint | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [generatedEstimate, setGeneratedEstimate] = useState<Invoice | null>(null);
  const [draftEstimate, setDraftEstimate] = useState<Invoice | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [showJobSuggestions, setShowJobSuggestions] = useState(false);
  const [itemSearchIndex, setItemSearchIndex] = useState<number | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [sData, cData, iData, custData] = await Promise.all([
      dbService.getSettings(),
      dbService.getComplaints(),
      dbService.getInventory(),
      dbService.getCustomers()
    ]);
    setSettings(sData);
    setAllComplaints(cData.filter(c => c.status !== ComplaintStatus.COMPLETED));
    setInventory(iData);
    setCustomers(custData);
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

  const selectComplaint = (comp: Complaint) => {
    setFoundComplaint(comp);
    setComplaintId(comp.bikeNumber);
    setItems([{ id: 'init-1', description: 'General Service Estimate', amount: comp.estimatedCost, gstRate: 0 }]);
    setShowJobSuggestions(false);
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
      else alert('Job Card not found.');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    if (!foundComplaint) return;
    setDraftEstimate({
      id: (settings?.transaction.prefixes.estimate || 'EST-') + Date.now(),
      complaintId: foundComplaint.id,
      bikeNumber: foundComplaint.bikeNumber,
      customerName: foundComplaint.customerName,
      details: foundComplaint.details,
      items,
      estimatedCost: foundComplaint.estimatedCost,
      finalAmount: totals.finalAmount,
      subTotal: totals.subTotal,
      taxAmount: totals.taxAmount,
      accountId: 'CASH-01', // Added to fix Invoice type mismatch
      paymentMode: 'Cash',
      paymentStatus: 'Unpaid',
      date: new Date().toISOString(),
      docType: 'Estimate'
    });
  };

  const handleSubmit = async () => {
    if (!foundComplaint) return;
    try {
      setLoading(true);
      const estimate = await dbService.generateInvoice({
        complaintId: foundComplaint.id,
        bikeNumber: foundComplaint.bikeNumber,
        customerName: foundComplaint.customerName,
        details: foundComplaint.details,
        items,
        estimatedCost: foundComplaint.estimatedCost,
        finalAmount: totals.finalAmount,
        subTotal: totals.subTotal,
        taxAmount: totals.taxAmount,
        accountId: 'CASH-01', // Added for consistency with Invoice type
        paymentMode: 'Cash',
        paymentStatus: 'Unpaid',
        customerPhone: foundComplaint.customerPhone,
        docType: 'Estimate'
      });
      setDraftEstimate(null);
      setGeneratedEstimate(estimate);
    } catch (err) {
      console.error(err);
      alert('Estimate generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const shareWhatsApp = () => {
    const est = generatedEstimate || draftEstimate;
    if (!est) return;
    const msg = `Hi ${est.customerName}, here is the Estimated Quote for bike ${est.bikeNumber} at Moto Gear SRK. Est. Total: ₹${est.finalAmount.toLocaleString()}. Please confirm!`;
    dbService.sendWhatsApp(foundComplaint?.customerPhone || '', msg);
  };

  const estimateToRender = generatedEstimate || draftEstimate;

  return (
    <div className="max-w-5xl mx-auto space-y-8 no-print animate-in fade-in duration-500 pb-20 px-4">
      <header className="flex flex-col items-center pt-4">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Quotation Studio</h2>
        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Pre-Service Pricing</p>
      </header>

      {!estimateToRender && (
        <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm relative z-40">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 w-5 h-5" />
              <input 
                type="text" 
                placeholder="SEARCH FOR QUOTE (PHONE, BIKE, NAME)..."
                className="w-full pl-12 pr-4 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 outline-none font-black text-[11px] tracking-widest placeholder:text-slate-300 transition-all uppercase"
                value={complaintId}
                onChange={e => { setComplaintId(e.target.value); setFoundComplaint(null); setShowJobSuggestions(true); }}
                onFocus={() => setShowJobSuggestions(true)}
                onBlur={() => setTimeout(() => setShowJobSuggestions(false), 200)}
              />
              {showJobSuggestions && jobSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-100 rounded-[32px] shadow-2xl overflow-hidden z-[60] animate-in slide-in-from-top-2">
                  {jobSuggestions.map(comp => (
                    <button key={comp.id} type="button" onClick={() => selectComplaint(comp)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-indigo-50 transition-colors border-b border-slate-50 last:border-0 group text-left">
                       <div className="flex items-center gap-4">
                          <div className="bg-indigo-50 p-2 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors"><FileText className="w-5 h-5" /></div>
                          <div>
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
               {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />} Start Quote
            </button>
          </div>
        </div>
      )}

      {foundComplaint && !estimateToRender && (
        <form className="space-y-6 animate-in slide-in-from-bottom-5">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                 <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                       <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-slate-800"><Sparkles className="w-4 h-4 text-indigo-500" /> Estimated Breakdown</h3>
                       <button type="button" onClick={() => setItems([...items, { id: Date.now().toString(), description: '', amount: 0, gstRate: 0 }])} className="text-[10px] bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-[0.2em] flex items-center gap-2 active:scale-95 shadow-lg"><Plus className="w-4 h-4" /> Add Line</button>
                    </div>
                    <div className="space-y-6">
                       {items.map((item, idx) => (
                          <div key={item.id} className="relative space-y-3 border-b border-slate-50 pb-6 last:border-0 last:pb-0">
                             <div className="flex gap-4">
                                <div className="flex-1 relative">
                                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Part / Service</label>
                                   <input required type="text" placeholder="DESC..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-xs font-black uppercase tracking-tight focus:ring-4 focus:ring-indigo-500/5 transition-all" value={item.description} onChange={e => setItems(items.map(it => it.id === item.id ? { ...it, description: e.target.value } : it))} />
                                </div>
                                <div className="w-32">
                                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Price (₹)</label>
                                   <input required type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-xs font-black" value={item.amount || ''} onChange={e => setItems(items.map(it => it.id === item.id ? { ...it, amount: parseFloat(e.target.value) || 0 } : it))} />
                                </div>
                                <div className="self-end pb-1.5"><button type="button" onClick={() => setItems(items.filter(it => it.id !== item.id))} disabled={items.length === 1} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button></div>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8 sticky top-20">
                    <div className="bg-indigo-50/80 p-5 rounded-[24px]">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Entity</p>
                       <h4 className="font-black text-slate-900 text-xs uppercase mb-1 tracking-tight">{foundComplaint.customerName}</h4>
                       <p className="font-black text-[10px] text-indigo-500 uppercase tracking-widest">{foundComplaint.bikeNumber}</p>
                    </div>
                    <div className="space-y-4">
                       <div className="pt-5 border-t border-slate-100 flex justify-between items-center"><span className="font-black text-slate-800 uppercase text-xs tracking-tighter">Quote Total</span><span className="text-4xl font-black tracking-tighter text-indigo-600">₹{totals.finalAmount.toLocaleString()}</span></div>
                    </div>
                    <div className="space-y-3 pt-2">
                       <button type="button" onClick={handlePreview} className="w-full bg-slate-50 text-slate-600 py-5 rounded-[24px] font-black text-[11px] uppercase tracking-[0.3em] border border-slate-200 active:scale-95 transition-all">Review Quote</button>
                       <button type="button" onClick={handleSubmit} disabled={loading || totals.finalAmount <= 0} className="w-full bg-indigo-600 text-white py-5 rounded-[24px] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all disabled:opacity-50">{loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Confirm Estimate'}</button>
                    </div>
                 </div>
              </div>
           </div>
        </form>
      )}

      {estimateToRender && (
        <div className="space-y-8 animate-in zoom-in-95 duration-300 pb-20">
          <div className="flex justify-center gap-4">
             <button onClick={() => setIsPreviewMode(!isPreviewMode)} className={`flex items-center gap-3 px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${isPreviewMode ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{isPreviewMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />} View Mode</button>
          </div>
          <div className={`bg-white border border-indigo-100 shadow-2xl mx-auto overflow-hidden transition-all duration-500 relative ${isPreviewMode ? 'max-w-[400px] rounded-[56px]' : 'max-w-4xl rounded-[40px]'}`}>
             <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden opacity-[0.03] -rotate-45"><h1 className="text-[120px] font-black uppercase">QUOTATION</h1></div>
             <div className="p-16 relative z-10">
                <div className="flex justify-between items-start mb-16"><div className="space-y-2"><h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">MOTO GEAR SRK</h1><p className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-600">Price Quotation</p></div><div className="text-right"><p className="text-xl font-black text-slate-900">EST-#{estimateToRender.id.slice(-6).toUpperCase()}</p><p className="text-xs text-slate-400 font-bold uppercase">{new Date(estimateToRender.date).toLocaleDateString('en-GB')}</p></div></div>
                <div className="mb-12 border-y border-slate-100 py-10"><p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Estimated For</p><p className="text-2xl font-black uppercase text-slate-900">{estimateToRender.customerName}</p><p className="text-sm font-black text-blue-600 tracking-widest uppercase">{estimateToRender.bikeNumber}</p></div>
                <table className="w-full text-left mb-12"><thead className="border-b-4 border-indigo-900"><tr><th className="py-6 font-black uppercase tracking-widest text-[11px] text-slate-400">Inventory Part / Service</th><th className="py-6 text-right font-black uppercase tracking-widest text-[11px] text-slate-400">Est. Price</th></tr></thead><tbody className="divide-y divide-slate-50">{estimateToRender.items.map((it, i) => (<tr key={i}><td className="py-6 font-black uppercase text-sm text-slate-800">{it.description}</td><td className="py-6 text-right font-black text-slate-900">₹{it.amount.toLocaleString()}</td></tr>))}</tbody></table>
                <div className="flex justify-end pt-8 border-t-4 border-indigo-900"><div className="w-72 space-y-4"><div className="flex justify-between items-center pt-6"><span className="uppercase text-xs font-black text-slate-400">Total Estimate</span><span className="text-4xl font-black tracking-tighter text-indigo-600">₹{estimateToRender.finalAmount.toLocaleString()}</span></div></div></div>
                <div className="mt-20 pt-10 border-t border-slate-100 text-center"><p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">This is a Price Quote only • Valid for 7 Days</p></div>
             </div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-12 pb-12">
             <button onClick={() => { setGeneratedEstimate(null); setFoundComplaint(null); setComplaintId(''); }} className="px-8 py-5 bg-white border border-slate-100 rounded-2xl font-black text-[11px] uppercase text-slate-500">New Quote</button>
             <button onClick={shareWhatsApp} className="px-8 py-5 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase flex items-center gap-3 shadow-xl"><MessageCircle className="w-5 h-5" /> Share WA</button>
             <button onClick={() => window.print()} className="px-8 py-5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase flex items-center gap-3 shadow-2xl"><Printer className="w-5 h-5" /> Print</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstimatePage;
