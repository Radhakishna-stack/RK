
// @google/genai Coding Guidelines followed.
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Package, Search, TriangleAlert, TrendingDown, Trash2, Loader2, 
  Share2, ChevronRight, Store, LayoutGrid, Settings, MoreVertical, 
  ArrowLeft, Edit3, ExternalLink, Box, Activity, ArrowUpCircle, ArrowDownCircle, History, MapPin,
  Navigation, List, Grid2X2, TrendingUp, IndianRupee, Globe,
  Clock, X, CheckCircle2, ShieldCheck, Zap, BellRing, Smartphone, Copy, Check
} from 'lucide-react';
import { dbService } from '../db';
import { InventoryItem, StockTransaction } from '../types';

interface InventoryPageProps {
  onNavigate: (tab: string, query?: string) => void;
}

const InventoryPage: React.FC<InventoryPageProps> = ({ onNavigate }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [itemTransactions, setItemTransactions] = useState<StockTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayMode, setDisplayMode] = useState<'list' | 'grid'>('list');
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    stock: 0,
    unitPrice: 0,
    purchasePrice: 0,
    itemCode: '',
    gstRate: 0,
    hsn: ''
  });

  // Fetch data on mount
  useEffect(() => {
    dbService.getInventory().then(data => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  // Fetch transactions when item is selected
  useEffect(() => {
    if (selectedItem) {
        dbService.getStockTransactions(selectedItem.id).then(setItemTransactions);
    } else {
        setItemTransactions([]);
    }
  }, [selectedItem]);

  const filteredItems = useMemo(() => {
    return items.filter(i => 
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.itemCode && i.itemCode.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [items, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const newItem = await dbService.addInventoryItem(formData);
    setItems([...items, newItem]);
    setIsModalOpen(false);
    setFormData({ name: '', category: '', stock: 0, unitPrice: 0, purchasePrice: 0, itemCode: '', gstRate: 0, hsn: '' });
    setLoading(false);
  };

  const handleAdjustStock = async (delta: number) => {
    if (!selectedItem) return;
    setLoading(true);
    const note = prompt("Enter a note for this adjustment (optional):", "Manual Adjustment") || "Manual Adjustment";
    await dbService.updateStock(selectedItem.id, delta, note);
    const updatedItems = await dbService.getInventory();
    setItems(updatedItems);
    const refreshedItem = updatedItems.find(i => i.id === selectedItem.id) || null;
    setSelectedItem(refreshedItem);
    if (refreshedItem) {
        const txns = await dbService.getStockTransactions(refreshedItem.id);
        setItemTransactions(txns);
    }
    setLoading(false);
  };

  const toggleOnlineStatus = async (id: string) => {
    const updated = items.map(i => {
      if (i.id === id) {
        return { ...i, isOnline: !(i as any).isOnline };
      }
      return i;
    });
    setItems(updated);
    localStorage.setItem('mg_inventory', JSON.stringify(updated));
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this inventory item?")) {
      setLoading(true);
      await dbService.deleteInventoryItem(id);
      setItems(items.filter(i => i.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
      setLoading(false);
    }
  };

  const findNearbySuppliers = () => {
    if (!selectedItem) return;
    const query = `${selectedItem.name} ${selectedItem.category} suppliers`;
    onNavigate('market_explorer', query);
  };

  const copyStoreLink = () => {
    const onlineItems = items.filter(i => (i as any).isOnline);
    const text = `*Moto Gear SRK - Digital Catalog* 🏍️\n\nCheck out our latest spares and accessories:\n\n${onlineItems.map(i => `• ${i.name}: ₹${i.unitPrice}`).join('\n')}\n\n📍 Visit us to purchase!`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading && items.length === 0) return (
    <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>
  );

  // --- ITEM DETAIL VIEW ---
  if (selectedItem) {
    return (
      <div className="space-y-4 pb-20 animate-in slide-in-from-right-5 duration-300 max-w-lg mx-auto">
        <header className="flex items-center justify-between py-2 no-print">
          <button onClick={() => setSelectedItem(null)} className="p-2 -ml-2 text-slate-800"><ArrowLeft className="w-6 h-6" /></button>
          <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">Item Intelligence</h2>
          <button className="p-2 text-blue-600"><Edit3 className="w-6 h-6" /></button>
        </header>

        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
           <div className="flex justify-between items-start">
              <div className="space-y-2">
                 <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{selectedItem.name}</h3>
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{selectedItem.category} • SKU: {selectedItem.itemCode || 'N/A'}</span>
                 </div>
              </div>
              <button 
                onClick={() => toggleOnlineStatus(selectedItem.id)}
                className={`p-3 rounded-2xl border transition-all ${ (selectedItem as any).isOnline ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-300'}`}
              >
                <Globe className="w-5 h-5" />
              </button>
           </div>
           
           <div className="grid grid-cols-3 gap-6">
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sale (MRP)</p>
                 <p className="text-lg font-black text-slate-900 tracking-tighter">₹{selectedItem.unitPrice.toLocaleString('en-IN')}</p>
              </div>
              <div className="space-y-1 border-x border-slate-50 px-4">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchase</p>
                 <p className="text-lg font-black text-slate-500 tracking-tighter">₹{(selectedItem.purchasePrice || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right space-y-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Qty</p>
                 <p className={`text-2xl font-black tracking-tighter ${selectedItem.stock > 2 ? 'text-emerald-500' : selectedItem.stock > 0 ? 'text-amber-500' : 'text-red-500'}`}>{selectedItem.stock.toFixed(1)}</p>
              </div>
           </div>

           <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-white rounded-xl shadow-sm">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Projected Profit</p>
                    <p className="text-xs font-black text-slate-700">₹{(selectedItem.unitPrice - (selectedItem.purchasePrice || 0)).toLocaleString()} per unit</p>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Value</p>
                 <p className="text-sm font-black text-blue-600 tracking-tighter">₹{(selectedItem.stock * selectedItem.unitPrice).toLocaleString()}</p>
              </div>
           </div>
        </div>

        <div className="space-y-4 px-1 pb-24">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <History className="w-4 h-4 text-blue-500" /> Audit Log
            </h4>
          </div>

          <div className="space-y-3">
            {itemTransactions.length > 0 ? (
                itemTransactions.map(txn => (
                    <div key={txn.id} className="bg-white p-5 rounded-[28px] border border-slate-100 flex items-center justify-between shadow-sm animate-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${txn.type === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {txn.type === 'IN' ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight leading-tight">{txn.note}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Clock className="w-3 h-3 text-slate-300" />
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                        {new Date(txn.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`text-base font-black tracking-tight ${txn.type === 'IN' ? 'text-emerald-500' : 'text-red-500'}`}>
                                {txn.type === 'IN' ? '+' : '-'}{txn.quantity.toFixed(1)}
                            </p>
                        </div>
                    </div>
                ))
            ) : (
                <div className="bg-white p-12 rounded-[40px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center space-y-4">
                    <History className="w-12 h-12 text-slate-200" />
                    <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">No audit trail found</p>
                </div>
            )}
          </div>
        </div>

        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 no-print flex gap-3">
          <button 
            onClick={findNearbySuppliers}
            className="flex-1 bg-blue-600 text-white py-5 rounded-[22px] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <Navigation className="w-5 h-5 fill-white" /> Maps AI
          </button>
          <button 
            onClick={() => {
              const qty = prompt("Enter quantity to adjust (e.g., 5 to add, -5 to subtract):", "0");
              if (qty && !isNaN(parseFloat(qty)) && parseFloat(qty) !== 0) handleAdjustStock(parseFloat(qty));
            }}
            className="flex-1 bg-slate-900 text-white py-5 rounded-[22px] font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Activity className="w-5 h-5" /> Stock Fix
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 max-w-lg mx-auto px-1">
      {/* Quick Access Toolbar */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Procurement Console</h4>
           <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              <button onClick={() => setDisplayMode('list')} className={`p-2 rounded-lg transition-all ${displayMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}><List className="w-4 h-4" /></button>
              <button onClick={() => setDisplayMode('grid')} className={`p-2 rounded-lg transition-all ${displayMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}><Grid2X2 className="w-4 h-4" /></button>
           </div>
        </div>
        <div className="flex justify-between px-2">
          <QuickLink icon={<Store className="w-6 h-6 text-blue-500" />} label="Digital Store" onClick={() => setIsStoreModalOpen(true)} />
          <QuickLink icon={<Navigation className="w-6 h-6 text-emerald-500" />} label="Market Map" onClick={() => onNavigate('market_explorer')} />
          <QuickLink icon={<TrendingUp className="w-6 h-6 text-amber-500" />} label="Analysis" onClick={() => onNavigate('dashboard')} />
          <QuickLink icon={<Settings className="w-6 h-6 text-slate-400" />} label="Stock Setup" onClick={() => setIsSetupModalOpen(true)} />
        </div>
      </div>

      {/* Primary Search Terminal */}
      <div className="flex gap-2">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5 transition-transform group-focus-within:scale-110" />
          <input 
            type="text" 
            placeholder="FILTER STOCK BY NAME OR SKU..."
            className="w-full pl-12 pr-4 py-5 bg-white border border-slate-100 rounded-3xl focus:ring-8 focus:ring-blue-500/5 outline-none font-black text-[11px] tracking-widest placeholder:text-slate-200 transition-all uppercase"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-5 rounded-[22px] shadow-xl active:scale-95 transition-all">
           <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Results Grid */}
      <div className={displayMode === 'list' ? "space-y-3 pb-24" : "grid grid-cols-2 gap-4 pb-24"}>
          {filteredItems.map(item => (
            <div key={item.id} onClick={() => setSelectedItem(item)} className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 relative cursor-pointer active:scale-[0.99] transition-all hover:border-blue-100 group">
              <div className="flex justify-between items-start mb-6">
                <div>
                   <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{item.name}</h3>
                      {(item as any).isOnline && (
                        <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                           <Globe className="w-2.5 h-2.5" />
                        </div>
                      )}
                   </div>
                   <div className="flex items-center gap-2 mt-1">
                      <span className="text-[8px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase tracking-widest">{item.category}</span>
                   </div>
                </div>
                <div className={`p-3 rounded-2xl ${item.stock > 2 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'} border border-black/5`}>
                   <Package className="w-5 h-5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 py-1 border-t border-slate-50 pt-5">
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sale Price</p>
                  <p className="text-sm font-black text-slate-800 tracking-tighter">₹{item.unitPrice.toLocaleString()}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Available</p>
                  <p className={`text-sm font-black tracking-tighter ${item.stock > 2 ? 'text-emerald-500' : item.stock > 0 ? 'text-amber-500' : 'text-red-400'}`}>{item.stock.toFixed(0)} <span className="text-[10px]">Qty</span></p>
                </div>
              </div>
            </div>
          ))}
      </div>

      <div className="fixed bottom-24 left-0 right-0 flex justify-center pointer-events-none z-30">
        <button 
          onClick={() => onNavigate('purchase')}
          className="pointer-events-auto bg-blue-600 text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transform active:scale-95 transition-all shadow-blue-500/40"
        >
          <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
             <IndianRupee className="w-4 h-4" />
          </div>
          Restock Inventory
        </button>
      </div>

      {/* DIGITAL STORE MODAL */}
      {isStoreModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                       <Store className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 uppercase">Public Store</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase">Visible to Customers</p>
                    </div>
                 </div>
                 <button onClick={() => setIsStoreModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl"><X className="w-6 h-6" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                 <div className="bg-blue-50 p-6 rounded-[32px] border border-blue-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 border border-blue-50">
                          <Smartphone className="w-5 h-5" />
                       </div>
                       <div>
                          <p className="text-xs font-black text-blue-900 uppercase">WhatsApp Store</p>
                          <p className="text-[10px] text-blue-600 font-bold">{items.filter(i => (i as any).isOnline).length} Items Online</p>
                       </div>
                    </div>
                    <button 
                      onClick={copyStoreLink}
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                    >
                       {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'COPIED' : 'SHARE'}
                    </button>
                 </div>

                 <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Manage Visibility</p>
                    {items.map(item => (
                       <div key={item.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400"><Package className="w-4 h-4" /></div>
                             <p className="text-xs font-black text-slate-800 uppercase">{item.name}</p>
                          </div>
                          <button 
                            onClick={() => toggleOnlineStatus(item.id)}
                            className={`w-10 h-5 rounded-full relative transition-all ${ (item as any).isOnline ? 'bg-blue-600' : 'bg-slate-200'}`}
                          >
                             <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${ (item as any).isOnline ? 'left-5.5' : 'left-0.5'}`} />
                          </button>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* STOCK SETUP MODAL */}
      {isSetupModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
           <div className="bg-white w-full max-w-lg rounded-t-[48px] sm:rounded-[48px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300">
              <div className="px-8 py-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                       <Settings className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 uppercase">Stock Setup</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Preferences</p>
                    </div>
                 </div>
                 <button onClick={() => setIsSetupModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl"><X className="w-7 h-7" /></button>
              </div>

              <div className="p-8 space-y-8">
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <div>
                          <p className="text-sm font-black text-slate-800 uppercase">Low Stock Alerts</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Notify when quantity is below threshold</p>
                       </div>
                       <button className="w-12 h-6 bg-blue-600 rounded-full relative"><div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-6.5" /></button>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Default Threshold Units</label>
                       <div className="flex items-center gap-4">
                          <input type="range" className="flex-1" defaultValue={5} />
                          <span className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center font-black text-slate-800">5</span>
                       </div>
                    </div>

                    <div className="h-px bg-slate-100"></div>

                    <div className="flex items-center justify-between">
                       <div>
                          <p className="text-sm font-black text-slate-800 uppercase">Auto-Generate SKU</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Auto-assign codes for new entries</p>
                       </div>
                       <button className="w-12 h-6 bg-slate-200 rounded-full relative"><div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5" /></button>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Default GST Rate for New Items</label>
                       <div className="grid grid-cols-4 gap-2">
                          {[0, 5, 12, 18, 28].slice(0,4).map(r => (
                             <button key={r} className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${r === 18 ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-white border-slate-100 text-slate-400'}`}>
                                {r}%
                             </button>
                          ))}
                       </div>
                    </div>
                 </div>

                 <button onClick={() => setIsSetupModalOpen(false)} className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Save Preferences</button>
              </div>
           </div>
        </div>
      )}

      {/* Modal - Add Item */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-[48px] sm:rounded-[48px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300 max-h-[96vh] flex flex-col">
            <div className="px-8 py-8 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                 <h3 className="text-2xl font-black tracking-tighter uppercase leading-none">Define SKU</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">New Inventory Cataloging</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all active:scale-90"><X className="w-7 h-7" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto no-scrollbar pb-16">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Part / Service Name*</label>
                  <input required className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-8 focus:ring-blue-500/5 outline-none font-bold uppercase transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="E.G. MOTUL 20W40 ENGINE OIL" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category*</label>
                    <input required className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-8 focus:ring-blue-500/5 outline-none font-bold uppercase transition-all" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="E.G. CONSUMABLES" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Serial / SKU Code</label>
                    <input className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-8 focus:ring-blue-500/5 outline-none font-mono font-bold uppercase transition-all" value={formData.itemCode} onChange={e => setFormData({...formData, itemCode: e.target.value})} placeholder="M-OIL-01" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Open Stock</label>
                    <input required type="number" step="0.1" className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-center" value={formData.stock} onChange={e => setFormData({...formData, stock: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Purchase Cost</label>
                    <input required type="number" className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-center text-red-500" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selling MRP</label>
                    <input required type="number" className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-center text-emerald-600" value={formData.unitPrice} onChange={e => setFormData({...formData, unitPrice: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GST Surcharge</label>
                    <select className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black" value={formData.gstRate} onChange={e => setFormData({...formData, gstRate: parseFloat(e.target.value) || 0})}>
                      {[0,5,12,18,28].map(r => <option key={r} value={r}>{r}% GST</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">HSN Global Code</label>
                     <input type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold uppercase" value={formData.hsn} onChange={e => setFormData({...formData, hsn: e.target.value})} placeholder="3403" />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 border border-slate-200 rounded-[22px] font-black text-xs uppercase tracking-widest text-slate-400 active:scale-95 transition-all">Abort</button>
                <button type="submit" className="flex-[2] py-5 bg-slate-900 text-white rounded-[22px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
                  <CheckCircle2 className="w-5 h-5" /> Commit SKU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const QuickLink: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-2 group">
    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center transition-all active:scale-95 group-hover:bg-blue-600 group-hover:text-white border border-slate-100 group-hover:border-blue-600 shadow-sm">
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6 stroke-[1.5]' })}
    </div>
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none text-center max-w-[56px] group-hover:text-slate-900 transition-colors">{label}</span>
  </button>
);

export default InventoryPage;
