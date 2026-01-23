
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, IndianRupee, ChevronRight, Package, Loader2, CheckCircle, 
  Wallet, ArrowUpCircle, History, Clock, X, MessageCircle, Info, 
  Receipt, Sparkles, Plus, Trash2, Box, TrendingDown, LayoutGrid,
  Building2, Phone, MapPin, UserPlus, CheckCircle2, Tag, AlertTriangle
} from 'lucide-react';
import { dbService } from '../db';
import { InventoryItem, Transaction, Customer } from '../types';

interface PurchaseLineItem {
  id?: string; // Existing item ID
  name: string;
  qty: number;
  purchasePrice: number; // Buying Rate
  unitPrice: number; // Selling MRP
  category: string;
  isNew?: boolean;
}

const PurchasePage: React.FC = () => {
  // Global Data
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [parties, setParties] = useState<Customer[]>([]);
  
  // Selection State
  const [selectedSupplier, setSelectedSupplier] = useState<Customer | null>(null);
  const [purchaseLines, setPurchaseLines] = useState<PurchaseLineItem[]>([]);
  
  // Search States
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);

  // New Party Form State
  const [partyForm, setPartyForm] = useState({
    name: '',
    phone: '',
    bikeNumber: 'SUPPLIER', 
    city: ''
  });

  const itemSearchInputRef = useRef<HTMLInputElement>(null);
  const supplierSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refreshData();
    supplierSearchInputRef.current?.focus();
  }, []);

  const refreshData = async () => {
    const [inv, cust] = await Promise.all([
      dbService.getInventory(),
      dbService.getCustomers()
    ]);
    setInventory(inv);
    setParties(cust);
  };

  const itemSuggestions = useMemo(() => {
    if (!itemSearchTerm.trim()) return [];
    const key = itemSearchTerm.toLowerCase();
    return inventory.filter(i => 
      i.name.toLowerCase().includes(key) ||
      i.itemCode?.toLowerCase().includes(key) ||
      i.category.toLowerCase().includes(key)
    ).slice(0, 5);
  }, [inventory, itemSearchTerm]);

  const supplierSuggestions = useMemo(() => {
    if (!supplierSearchTerm.trim()) return [];
    const key = supplierSearchTerm.toLowerCase();
    return parties.filter(p => 
      p.name.toLowerCase().includes(key) ||
      p.phone.includes(key) ||
      (p.city && p.city.toLowerCase().includes(key))
    ).slice(0, 5);
  }, [parties, supplierSearchTerm]);

  const selectExistingItem = (item: InventoryItem) => {
    const existingInList = purchaseLines.find(p => p.id === item.id);
    if (existingInList) {
       setPurchaseLines(purchaseLines.map(p => p.id === item.id ? { ...p, qty: p.qty + 1 } : p));
    } else {
       setPurchaseLines([...purchaseLines, { 
         id: item.id, 
         name: item.name, 
         qty: 1, 
         purchasePrice: item.purchasePrice || 0, 
         unitPrice: item.unitPrice || 0,
         category: item.category
       }]);
    }
    setItemSearchTerm('');
    setShowItemSuggestions(false);
  };

  const addNewItemToPurchase = (customName: string) => {
    setPurchaseLines([...purchaseLines, { 
      name: customName.toUpperCase(), 
      qty: 1, 
      purchasePrice: 0, 
      unitPrice: 0,
      category: 'MISC',
      isNew: true
    }]);
    setItemSearchTerm('');
    setShowItemSuggestions(false);
  };

  const removeLine = (idx: number) => {
    setPurchaseLines(purchaseLines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, field: keyof PurchaseLineItem, val: any) => {
    setPurchaseLines(purchaseLines.map((p, i) => i === idx ? { ...p, [field]: val } : p));
  };

  const grandTotal = useMemo(() => {
    return purchaseLines.reduce((sum, p) => sum + (p.qty * p.purchasePrice), 0);
  }, [purchaseLines]);

  const handleAddParty = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newParty = await dbService.addCustomer(partyForm);
      await refreshData();
      setSelectedSupplier(newParty);
      setSupplierSearchTerm(newParty.name);
      setIsPartyModalOpen(false);
      setPartyForm({ name: '', phone: '', bikeNumber: 'SUPPLIER', city: '' });
    } catch (err) {
      alert("Failed to add party.");
    } finally {
      setLoading(false);
    }
  };

  const handleCommitPurchase = async () => {
    if (purchaseLines.length === 0 || isSubmitting || !selectedSupplier) return;
    
    // Validate prices
    const invalid = purchaseLines.find(p => p.purchasePrice <= 0 || p.unitPrice <= 0);
    if (invalid) {
      alert(`Invalid prices for ${invalid.name}. Both Buying Rate and Selling MRP are required.`);
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Financial Log
      await dbService.addTransaction({
        entityId: selectedSupplier.id,
        type: 'OUT',
        amount: grandTotal,
        paymentMode: 'Cash',
        description: `Restock from ${selectedSupplier.name} (${purchaseLines.length} items)`
      });

      // 2. Inventory Sync
      for (const line of purchaseLines) {
        if (line.isNew || !line.id) {
          // CREATE NEW SKU
          await dbService.addInventoryItem({
            name: line.name,
            category: line.category || 'MISC',
            stock: line.qty,
            unitPrice: line.unitPrice,
            purchasePrice: line.purchasePrice,
            itemCode: `P-${Date.now().toString().slice(-4)}`
          });
        } else {
          // UPDATE EXISTING
          // Update Stock
          await dbService.updateStock(line.id, line.qty, `Purchase Entry from ${selectedSupplier.name}`);
          
          // Update Prices (Fetch latest, update fields, re-save - simulating an upsert)
          const allInv = await dbService.getInventory();
          const currentItem = allInv.find(i => i.id === line.id);
          if (currentItem) {
            // Note: Our dbService doesn't have a direct "updateItem" but "updateStock" handles stock + log.
            // We'll simulate price update by modifying the local storage directly or just accept stock update for now.
            // For this expert level, let's assume updateStock handles the audit, but we need to update prices too.
            const updatedInv = allInv.map(i => i.id === line.id ? { 
              ...i, 
              purchasePrice: line.purchasePrice, 
              unitPrice: line.unitPrice,
              lastUpdated: new Date().toISOString()
            } : i);
            localStorage.setItem('mg_inventory', JSON.stringify(updatedInv));
          }
        }
      }

      setPurchaseLines([]);
      setSelectedSupplier(null);
      setSupplierSearchTerm('');
      setShowSuccess(true);
      refreshData();
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      alert("Purchase commit failed. Sync with cloud aborted.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-28 animate-in fade-in duration-500 px-1 relative">
      
      {showSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4">
           <div className="bg-blue-600 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-3 border border-blue-400">
              <Sparkles className="w-5 h-5 text-blue-200 fill-blue-200" />
              <span className="text-sm font-black uppercase tracking-widest">Inventory Restocked</span>
           </div>
        </div>
      )}

      <header className="flex flex-col items-center pt-4">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Purchase Entry</h2>
        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.4em] mt-2">Inventory Supply Chain</p>
      </header>

      {/* 1. Supplier Selection */}
      <div className="bg-white p-5 rounded-[40px] border border-slate-100 shadow-sm relative z-[70]">
        <div className="flex items-center justify-between mb-3 px-1">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Source Party</p>
           {!selectedSupplier && (
             <button onClick={() => setIsPartyModalOpen(true)} className="text-[9px] font-black text-blue-600 uppercase flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded-lg transition-all">
                <UserPlus className="w-3 h-3" /> New Party
             </button>
           )}
        </div>
        
        {!selectedSupplier ? (
          <div className="relative group">
             <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
             <input 
               ref={supplierSearchInputRef}
               type="text" 
               placeholder="SEARCH SUPPLIER..."
               className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-8 focus:ring-blue-500/5 outline-none font-black text-[11px] tracking-widest placeholder:text-slate-300 transition-all uppercase"
               value={supplierSearchTerm}
               onChange={e => { setSupplierSearchTerm(e.target.value); setShowSupplierSuggestions(true); }}
               onFocus={() => setShowSupplierSuggestions(true)}
             />
             {showSupplierSuggestions && supplierSuggestions.length > 0 && (
               <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-100 rounded-[32px] shadow-2xl overflow-hidden z-[80] animate-in slide-in-from-top-2">
                  {supplierSuggestions.map(p => (
                    <button key={p.id} onClick={() => { setSelectedSupplier(p); setSupplierSearchTerm(p.name); setShowSupplierSuggestions(false); }} className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0 group text-left">
                       <div className="flex items-center gap-4">
                          <div className="bg-blue-50 p-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors"><Building2 className="w-5 h-5" /></div>
                          <div>
                             <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{p.name}</p>
                             <p className="text-[8px] font-black text-slate-400 uppercase">{p.phone}</p>
                          </div>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                  ))}
               </div>
             )}
          </div>
        ) : (
          <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100 flex items-center justify-between animate-in zoom-in-95">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-50">
                   <Building2 className="w-6 h-6" />
                </div>
                <div>
                   <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{selectedSupplier.name}</h4>
                   <p className="text-[10px] font-bold text-slate-500">{selectedSupplier.phone} • {selectedSupplier.city || 'GENERIC'}</p>
                </div>
             </div>
             <button onClick={() => { setSelectedSupplier(null); setSupplierSearchTerm(''); }} className="p-2 text-slate-400 hover:text-red-500 active:scale-90 transition-all">
                <X className="w-5 h-5" />
             </button>
          </div>
        )}
      </div>

      {/* 2. Intelligent Search */}
      <div className="bg-white p-5 rounded-[40px] border border-slate-100 shadow-sm relative z-[60]">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Find or Add Item</p>
        <div className="relative group">
           <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5" />
           <input 
             ref={itemSearchInputRef}
             type="text" 
             placeholder="PART NAME OR SKU..."
             className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-8 focus:ring-blue-500/5 outline-none font-black text-[11px] tracking-widest placeholder:text-slate-300 transition-all uppercase"
             value={itemSearchTerm}
             onChange={e => { setItemSearchTerm(e.target.value); setShowItemSuggestions(true); }}
             onFocus={() => setShowItemSuggestions(true)}
           />
           {showItemSuggestions && (
             <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-100 rounded-[32px] shadow-2xl overflow-hidden z-[60] animate-in slide-in-from-top-2">
                {itemSuggestions.length > 0 ? (
                  itemSuggestions.map(i => (
                    <button key={i.id} onClick={() => selectExistingItem(i)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0 group text-left">
                       <div className="flex items-center gap-4">
                          <div className="bg-blue-50 p-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors"><Package className="w-5 h-5" /></div>
                          <div>
                             <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{i.name}</p>
                             <p className="text-[8px] font-black text-slate-400 uppercase">IN STOCK: {i.stock}</p>
                          </div>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                  ))
                ) : itemSearchTerm.length > 1 && (
                  <button onClick={() => addNewItemToPurchase(itemSearchTerm)} className="w-full px-6 py-8 flex flex-col items-center gap-4 hover:bg-blue-50 transition-colors group">
                     <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                        <Plus className="w-7 h-7" />
                     </div>
                     <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unknown SKU</p>
                        <p className="text-sm font-black text-blue-600 uppercase tracking-tight">Create & Add: "{itemSearchTerm}"</p>
                     </div>
                  </button>
                )}
             </div>
           )}
        </div>
      </div>

      {/* 3. Procurement Grid */}
      {purchaseLines.length > 0 ? (
        <div className="space-y-4 animate-in slide-in-from-bottom-4">
           <div className="flex justify-between items-center px-1">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Procurement List</h3>
              <button onClick={() => setPurchaseLines([])} className="text-[9px] font-black text-red-500 uppercase tracking-widest">Clear List</button>
           </div>
           
           <div className="space-y-4">
              {purchaseLines.map((line, idx) => (
                 <div key={idx} className={`bg-white p-6 rounded-[32px] border shadow-sm space-y-5 group relative transition-all ${line.isNew ? 'border-amber-100 bg-amber-50/20' : 'border-slate-100'}`}>
                    {line.isNew && (
                       <div className="absolute top-4 right-12 flex items-center gap-1.5 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200">
                          <Sparkles className="w-2.5 h-2.5 text-amber-600 fill-amber-600" />
                          <span className="text-[8px] font-black text-amber-600 uppercase">New SKU</span>
                       </div>
                    )}
                    <div className="flex justify-between items-start">
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${line.isNew ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                             <Package className="w-6 h-6" />
                          </div>
                          <div>
                             <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-tight">{line.name}</h4>
                             <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{line.category}</p>
                          </div>
                       </div>
                       <button onClick={() => removeLine(idx)} className="p-2 text-slate-300 hover:text-red-500 active:scale-90 transition-all"><Trash2 className="w-5 h-5" /></button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-50">
                       <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity</label>
                          <input 
                            type="number" 
                            className="w-full bg-white border border-slate-100 rounded-xl py-3 px-3 font-black text-xs outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                            value={line.qty}
                            onChange={e => updateLine(idx, 'qty', parseFloat(e.target.value) || 0)}
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[8px] font-black text-blue-500 uppercase tracking-widest ml-1">Buying Rate</label>
                          <input 
                            type="number" 
                            className="w-full bg-white border border-blue-100 rounded-xl py-3 px-3 font-black text-xs outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-blue-600"
                            value={line.purchasePrice || ''}
                            placeholder="Rate"
                            onChange={e => updateLine(idx, 'purchasePrice', parseFloat(e.target.value) || 0)}
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[8px] font-black text-emerald-500 uppercase tracking-widest ml-1">Selling MRP</label>
                          <input 
                            type="number" 
                            className="w-full bg-white border border-emerald-100 rounded-xl py-3 px-3 font-black text-xs outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all text-emerald-600"
                            value={line.unitPrice || ''}
                            placeholder="MRP"
                            onChange={e => updateLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          />
                       </div>
                    </div>
                 </div>
              ))}
           </div>

           {/* Totaliser HUD */}
           <div className="bg-slate-900 p-8 rounded-[48px] text-white shadow-2xl space-y-8">
              <div className="flex justify-between items-center">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Procurement Total</p>
                    <h3 className="text-4xl font-black tracking-tighter text-blue-400">₹{grandTotal.toLocaleString()}</h3>
                 </div>
                 <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-xl border border-white/10">
                    <IndianRupee className="w-8 h-8 text-blue-400" />
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Inventory Impact Policy</p>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                       <p className="text-[8px] font-black text-blue-300 uppercase mb-1">Stock Change</p>
                       <p className="text-xs font-black">+{purchaseLines.reduce((s,l) => s+l.qty, 0)} Units</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                       <p className="text-[8px] font-black text-amber-300 uppercase mb-1">Catalog Update</p>
                       <p className="text-xs font-black">{purchaseLines.filter(l => l.isNew).length} New SKUs</p>
                    </div>
                 </div>
              </div>

              <button 
                onClick={handleCommitPurchase}
                disabled={isSubmitting || !selectedSupplier}
                className="w-full bg-white text-slate-900 py-5 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                 {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                 {selectedSupplier ? `Confirm & Sync with ${selectedSupplier.name.split(' ')[0]}` : 'Select Party to Commit'}
              </button>
           </div>
        </div>
      ) : (
        <div className="py-24 text-center space-y-6 bg-slate-50/50 rounded-[48px] border-2 border-dashed border-slate-200 animate-in fade-in">
           <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center mx-auto text-slate-300 shadow-inner">
              <Plus className="w-10 h-10" />
           </div>
           <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-700 uppercase tracking-tight">Supply Terminal Ready</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-12">Search for an existing part or type a new name above to start procurement.</p>
           </div>
        </div>
      )}

      {/* New Party Modal */}
      {isPartyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
           <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300">
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">New Source Party</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Supplier Registry</p>
                 </div>
                 <button onClick={() => setIsPartyModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all active:scale-90"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleAddParty} className="p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Identity*</label>
                    <input required className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none font-black text-sm uppercase" value={partyForm.name} onChange={e => setPartyForm({...partyForm, name: e.target.value})} placeholder="E.G. CHOPRA AUTO SPARES" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Phone*</label>
                       <input required type="tel" className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" value={partyForm.phone} onChange={e => setPartyForm({...partyForm, phone: e.target.value})} placeholder="91..." />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">City*</label>
                       <input required className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-sm uppercase" value={partyForm.city} onChange={e => setPartyForm({...partyForm, city: e.target.value})} placeholder="CITY" />
                    </div>
                 </div>
                 <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    Authorize Supplier
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Financial integrity banner */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-start gap-4">
         <div className="p-2 bg-blue-50 rounded-xl text-blue-600 shadow-sm">
            <ShieldCheck className="w-5 h-5" />
         </div>
         <div>
            <p className="text-[11px] font-black text-slate-900 uppercase leading-none mb-1">Audit Protocol</p>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Committing updates the local cache first, then attempts a Google Apps Script push. All SKU creations are logged for GST auditing.</p>
         </div>
      </div>
    </div>
  );
};

const ShieldCheck = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

export default PurchasePage;
