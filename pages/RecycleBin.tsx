
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trash2, RefreshCw, Filter, Calendar, 
  Search, Loader2, X, Archive, ChevronRight, 
  RotateCcw, Info, Settings, ShieldAlert,
  ArrowLeft, Clock, History, Users
} from 'lucide-react';
import { dbService } from '../db';
import { RecycleBinItem, RecycleBinCategory, AppSettings } from '../types';

interface RecycleBinPageProps {
  onNavigate: (tab: string) => void;
}

const RecycleBinPage: React.FC<RecycleBinPageProps> = ({ onNavigate }) => {
  const [items, setItems] = useState<RecycleBinItem[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<RecycleBinCategory | 'All'>('All');
  const [dateFilter, setDateFilter] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [binData, settingsData] = await Promise.all([
        dbService.getRecycleBin(),
        dbService.getSettings()
      ]);
      setItems(binData);
      setSettings(settingsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = JSON.stringify(item.data).toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || item.type === categoryFilter;
      const matchesDate = !dateFilter || item.deletedAt.startsWith(dateFilter);
      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [items, searchTerm, categoryFilter, dateFilter]);

  const handleRestore = async (binId: string) => {
    if (window.confirm("Restore this item to its original location?")) {
      await dbService.restoreFromBin(binId);
      setItems(items.filter(i => i.binId !== binId));
    }
  };

  const handlePurge = async (binId: string) => {
    if (window.confirm("CRITICAL: Permanently delete this item? This action cannot be reversed.")) {
      await dbService.purgeFromBin(binId);
      setItems(items.filter(i => i.binId !== binId));
    }
  };

  const handleEmptyBin = async () => {
    if (window.confirm("DANGER: Permanently delete ALL items in the recycle bin?")) {
      await dbService.emptyRecycleBin();
      setItems([]);
    }
  };

  const updatePurgeDays = async (days: number) => {
    if (!settings) return;
    const newSettings = {
      ...settings,
      general: { ...settings.general, recycleBinDays: days }
    };
    setSettings(newSettings);
    await dbService.updateSettings(newSettings);
  };

  const categories: (RecycleBinCategory | 'All')[] = ['All', 'Customer', 'Invoice', 'Complaint', 'Inventory', 'Expense', 'Visitor'];

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500 max-w-lg mx-auto">
      <header className="px-1 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('utilities')} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 hover:bg-slate-50 active:scale-90 transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-800" />
          </button>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Recycle Bin</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Soft-Delete Storage</p>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setShowSettings(!showSettings)} className={`p-3 rounded-2xl shadow-xl active:scale-95 transition-all ${showSettings ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
              <Settings className="w-5 h-5" />
           </button>
           <button onClick={handleEmptyBin} disabled={items.length === 0} className="bg-red-50 text-red-600 p-3 rounded-2xl shadow-sm border border-red-100 active:scale-95 transition-all disabled:opacity-30">
              <Trash2 className="w-5 h-5" />
           </button>
        </div>
      </header>

      {showSettings && (
        <div className="bg-slate-900 p-6 rounded-[32px] text-white shadow-2xl space-y-4 animate-in slide-in-from-top-4 duration-300">
           <div className="flex items-center gap-3 mb-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <h4 className="text-sm font-black uppercase tracking-widest">Purge Protocol</h4>
           </div>
           <p className="text-xs text-slate-400 leading-relaxed">Set how many days deleted items stay in the bin before permanent removal.</p>
           <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
              <History className="w-5 h-5 text-blue-400" />
              <div className="flex-1">
                 <input 
                   type="range" 
                   min="1" 
                   max="90" 
                   step="1"
                   className="w-full"
                   value={settings?.general.recycleBinDays || 30}
                   onChange={(e) => updatePurgeDays(parseInt(e.target.value))}
                 />
                 <div className="flex justify-between mt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">1 Day</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">90 Days</span>
                 </div>
              </div>
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg">
                 {settings?.general.recycleBinDays}
              </div>
           </div>
        </div>
      )}

      {/* Advanced Command Bar */}
      <div className="space-y-4 bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
          <input 
            type="text" 
            placeholder="SEARCH BIN ITEMS..."
            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] focus:ring-4 focus:ring-blue-500/5 outline-none font-black text-[11px] uppercase tracking-widest transition-all"
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 pointer-events-none" />
             <select 
               className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer"
               value={categoryFilter}
               onChange={(e) => setCategoryFilter(e.target.value as any)}
             >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
             </select>
          </div>
          <div className="relative">
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none" />
             <input 
               type="date"
               className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none"
               value={dateFilter}
               onChange={(e) => setDateFilter(e.target.value)}
             />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-40 flex flex-col items-center justify-center gap-6 text-slate-300">
           <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
           <p className="text-[10px] font-black uppercase tracking-[0.4em]">Accessing Vault...</p>
        </div>
      ) : (
        <div className="space-y-4">
           {filteredItems.length === 0 ? (
             <div className="py-24 text-center space-y-4 bg-white rounded-[48px] border-2 border-dashed border-slate-100 mx-1">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                   <Archive className="w-10 h-10 text-slate-200" />
                </div>
                <div className="space-y-1">
                   <h4 className="text-lg font-black text-slate-900 uppercase">Bin is Empty</h4>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No items matching current filters</p>
                </div>
             </div>
           ) : (
             filteredItems.map(item => (
               <div key={item.binId} className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 space-y-4 group transition-all hover:border-blue-100">
                  <div className="flex justify-between items-start">
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${
                          item.type === 'Invoice' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          item.type === 'Complaint' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          item.type === 'Inventory' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          'bg-slate-50 text-slate-400 border-slate-200'
                        }`}>
                           <GetCategoryIcon type={item.type} />
                        </div>
                        <div>
                           <div className="flex items-center gap-2">
                              <h3 className="font-black text-slate-900 uppercase text-sm">
                                {item.data.name || item.data.customerName || item.data.bikeNumber || item.data.title || 'Untitled Item'}
                              </h3>
                              <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                 {item.type}
                              </span>
                           </div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3" /> Deleted {new Date(item.deletedAt).toLocaleDateString()} at {new Date(item.deletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </p>
                        </div>
                     </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50 space-y-1">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">System Record ID</p>
                     <p className="text-[11px] font-mono text-slate-600 truncate">{item.originalId}</p>
                  </div>

                  <div className="flex gap-2">
                     <button 
                       onClick={() => handleRestore(item.binId)}
                       className="flex-1 bg-blue-50 text-blue-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-blue-100 active:scale-95 transition-all hover:bg-blue-600 hover:text-white"
                     >
                        <RotateCcw className="w-4 h-4" /> Restore
                     </button>
                     <button 
                       onClick={() => handlePurge(item.binId)}
                       className="p-3 bg-red-50 text-red-400 rounded-xl border border-red-100 active:scale-95 transition-all hover:bg-red-500 hover:text-white"
                     >
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
               </div>
             ))
           )}
        </div>
      )}

      {/* Info Badge */}
      {!loading && items.length > 0 && (
         <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100 flex items-center gap-3 mx-1">
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <p className="text-[9px] font-medium text-blue-600 leading-relaxed uppercase">
               Items are kept for **{settings?.general.recycleBinDays} days** before being permanently purged from the local database.
            </p>
         </div>
      )}
    </div>
  );
};

const GetCategoryIcon: React.FC<{ type: RecycleBinCategory }> = ({ type }) => {
  switch (type) {
    // Fix: Using imported Users icon for Customer category (Fixes line 262 error)
    case 'Customer': return <Users className="w-6 h-6" />;
    case 'Invoice': return <Archive className="w-6 h-6" />;
    case 'Complaint': return <ClipboardList className="w-6 h-6" />;
    case 'Inventory': return <Package className="w-6 h-6" />;
    case 'Expense': return <History className="w-6 h-6" />;
    // Fix: Using imported Users icon for Visitor category (Fixes line 267 error)
    case 'Visitor': return <Users className="w-6 h-6" />;
    default: return <Archive className="w-6 h-6" />;
  }
};

const ClipboardList = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const Package = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

export default RecycleBinPage;
