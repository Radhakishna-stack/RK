

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Package, Search, TriangleAlert, TrendingDown, Trash2, Loader2, 
  Share2, ChevronRight, Store, LayoutGrid, Settings, MoreVertical, 
  ArrowLeft, Edit3, ExternalLink, Box, Activity
} from 'lucide-react';
import { dbService } from '../db';
import { InventoryItem } from '../types';

interface InventoryPageProps {
  onNavigate: (tab: string) => void;
}

const InventoryPage: React.FC<InventoryPageProps> = ({ onNavigate }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
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
    await dbService.updateStock(selectedItem.id, delta);
    const updatedItems = items.map(item => 
      item.id === selectedItem.id 
        ? { ...item, stock: item.stock + delta, lastUpdated: new Date().toISOString() } 
        : item
    );
    setItems(updatedItems);
    setSelectedItem(updatedItems.find(i => i.id === selectedItem.id) || null);
    setLoading(false);
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

  if (loading && items.length === 0) return (
    <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>
  );

  // --- ITEM DETAIL VIEW ---
  if (selectedItem) {
    return (
      <div className="space-y-4 pb-20 animate-in slide-in-from-right-5 duration-300 max-w-lg mx-auto">
        <header className="flex items-center justify-between py-2 no-print">
          <button onClick={() => setSelectedItem(null)} className="p-2 -ml-2 text-slate-800"><ArrowLeft className="w-6 h-6" /></button>
          <h2 className="text-lg font-black tracking-tight text-slate-900">Item Details</h2>
          <button className="p-2 text-blue-600"><Edit3 className="w-6 h-6" /></button>
        </header>

        {/* Info Banner */}
        <div className="bg-blue-50 p-4 border-b border-blue-100 flex items-center justify-between -mx-4">
           <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold text-blue-600">Restock this item at the best price on <span className="font-black">indiamart</span></p>
           </div>
           <ExternalLink className="w-4 h-4 text-blue-500" />
        </div>

        <div className="bg-white p-6 -mx-4 space-y-6">
           <div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{selectedItem.name}</h3>
           </div>
           
           <div className="grid grid-cols-3 gap-6">
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sale Price</p>
                 <p className="text-sm font-black text-slate-900">₹ {selectedItem.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Purchase Price</p>
                 <p className="text-sm font-black text-slate-900">₹ {(selectedItem.purchasePrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">In Stock</p>
                 <p className="text-sm font-black text-emerald-500">{selectedItem.stock.toFixed(1)}</p>
              </div>
           </div>

           <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-50">
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Stock Value</p>
                 <p className="text-sm font-black text-slate-900">₹ {(selectedItem.stock * (selectedItem.purchasePrice || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">GST Rate</p>
                 <p className="text-sm font-black text-slate-900">{selectedItem.gstRate || 0}%</p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Item Code</p>
                 <p className="text-sm font-black text-slate-900">{selectedItem.itemCode || selectedItem.id.slice(-8)}</p>
              </div>
           </div>
        </div>

        {/* Transactions Section */}
        <div className="space-y-4">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest px-1">Stock Transactions</h4>
          <div className="bg-white p-12 -mx-4 border-t border-slate-100 flex flex-col items-center justify-center space-y-4 min-h-[300px]">
             <div className="relative w-24 h-16 bg-slate-50 rounded-lg flex flex-col gap-1 p-2">
                <div className="w-full h-2 bg-emerald-200 rounded flex items-center px-1"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-sm"></div></div>
                <div className="w-3/4 h-2 bg-slate-100 rounded"></div>
                <div className="w-full h-2 bg-amber-100 rounded flex items-center px-1"><div className="w-1.5 h-1.5 bg-amber-300 rounded-full"></div></div>
                <div className="w-1/2 h-2 bg-slate-100 rounded"></div>
             </div>
             <p className="text-[11px] font-bold text-slate-400">You have not made any stock transactions yet.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 no-print">
          <button 
            onClick={() => {
              const qty = prompt("Enter quantity to add (+) or subtract (-):", "0");
              if (qty && !isNaN(parseFloat(qty))) handleAdjustStock(parseFloat(qty));
            }}
            className="w-full bg-blue-600 text-white py-4 rounded-full font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
            Adjust Stock
          </button>
        </div>
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="space-y-4 pb-10 animate-in fade-in duration-500 max-w-lg mx-auto">
      {/* Quick Links */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Quick Links</h4>
        <div className="flex justify-between px-2">
          <QuickLink icon={<Store className="w-6 h-6 text-blue-500" />} label="Online Store" onClick={() => {}} />
          <QuickLink icon={<Box className="w-6 h-6 text-blue-600" />} label="Stock Summary" onClick={() => {}} />
          <QuickLink icon={<Settings className="w-6 h-6 text-slate-400" />} label="Item Settings" onClick={() => onNavigate('settings')} />
          <QuickLink icon={<ChevronRight className="w-6 h-6 text-slate-400" />} label="Show All" onClick={() => {}} />
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search for an item or code"
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium shadow-sm uppercase"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm flex items-center justify-center text-blue-500">
           <LayoutGrid className="w-5 h-5" />
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm flex items-center justify-center text-slate-400">
           <MoreVertical className="w-5 h-5" />
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.map(item => (
          <div 
            key={item.id} 
            onClick={() => setSelectedItem(item)}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 relative cursor-pointer active:scale-[0.98] transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase max-w-[80%]">{item.name}</h3>
              <div className="flex items-center gap-3">
                 <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100 uppercase">{item.category}</span>
                 <Share2 className="w-4 h-4 text-slate-300" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 py-1">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Sale Price</p>
                <p className="text-sm font-black text-slate-900 tracking-tight">₹ {item.unitPrice.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Purchase Price</p>
                <p className="text-sm font-black text-slate-900 tracking-tight">₹ {(item.purchasePrice || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">In Stock</p>
                <p className={`text-sm font-black tracking-tight ${item.stock > 0 ? 'text-emerald-500' : 'text-red-400'}`}>{item.stock.toFixed(1)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 bg-pink-600 text-white px-6 py-4 rounded-full font-black flex items-center gap-3 shadow-2xl shadow-pink-500/40 z-30 active:scale-95 transition-all"
      >
        <div className="bg-white/20 p-1 rounded-lg"><Package className="w-5 h-5" /></div>
        <span className="text-sm">Add New Item</span>
      </button>

      {/* Modal - Add Item */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black tracking-tighter uppercase">New Inventory Item</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Item Name</label>
                  <input 
                    required 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold uppercase"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Category / Brand</label>
                  <input 
                    required 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold uppercase"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    placeholder="e.g. TVS, Honda, Engine"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Item Code</label>
                  <input 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold uppercase"
                    value={formData.itemCode}
                    onChange={e => setFormData({...formData, itemCode: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Initial Stock</label>
                    <input 
                      required 
                      type="number"
                      step="0.1"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-black"
                      value={formData.stock}
                      onChange={e => setFormData({...formData, stock: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Sale Price (₹)</label>
                    <input 
                      required 
                      type="number"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-black"
                      value={formData.unitPrice}
                      onChange={e => setFormData({...formData, unitPrice: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Purchase Price (₹)</label>
                    <input 
                      required 
                      type="number"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-black"
                      value={formData.purchasePrice}
                      onChange={e => setFormData({...formData, purchasePrice: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                   <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">GST Rate (%)</label>
                    <select
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-black"
                      value={formData.gstRate}
                      onChange={e => setFormData({...formData, gstRate: parseFloat(e.target.value) || 0})}
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </div>
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">HSN Code</label>
                   <input 
                     type="text"
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold uppercase"
                     value={formData.hsn}
                     onChange={e => setFormData({...formData, hsn: e.target.value})}
                   />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] px-4 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 shadow-xl shadow-blue-500/20"
                >
                  Save Item
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
    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center transition-all active:scale-95 group-hover:bg-blue-100">
      {icon}
    </div>
    <span className="text-[9px] font-bold text-slate-500 tracking-tight leading-none text-center max-w-[56px]">{label}</span>
  </button>
);

export default InventoryPage;