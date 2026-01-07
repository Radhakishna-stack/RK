
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Plus, Users, Search, Phone, Target, TrendingUp, 
  Trash2, Loader2, Award, ChevronRight, X, UserPlus, Star,
  IndianRupee, Calendar, CheckCircle2, MoreVertical
} from 'lucide-react';
import { dbService } from '../db';
import { Salesman } from '../types';

interface SalesmanTrackingPageProps {
  onNavigate: (tab: string) => void;
}

const SalesmanTrackingPage: React.FC<SalesmanTrackingPageProps> = ({ onNavigate }) => {
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSalesman, setSelectedSalesman] = useState<Salesman | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    target: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await dbService.getSalesmen();
    setSalesmen(data);
    setLoading(false);
  };

  const filteredSalesmen = useMemo(() => {
    return salesmen.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm)
    );
  }, [salesmen, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await dbService.addSalesman(formData);
    setSalesmen([...salesmen, result]);
    setIsModalOpen(false);
    setFormData({ name: '', phone: '', target: 0 });
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this salesman record?")) {
      setLoading(true);
      await dbService.deleteSalesman(id);
      setSalesmen(salesmen.filter(s => s.id !== id));
      if (selectedSalesman?.id === id) setSelectedSalesman(null);
      setLoading(false);
    }
  };

  const topPerformer = useMemo(() => {
    if (salesmen.length === 0) return null;
    return [...salesmen].sort((a, b) => b.totalSalesValue - a.totalSalesValue)[0];
  }, [salesmen]);

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-500 max-w-lg mx-auto px-1">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
           <button onClick={() => onNavigate('utilities')} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 hover:bg-slate-50">
              <ArrowLeft className="w-5 h-5 text-slate-800" />
           </button>
           <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Track Staff</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Performance & Rewards</p>
           </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 text-white p-3 rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
        >
          <UserPlus className="w-6 h-6" />
        </button>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
         <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
               <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                  <Users className="w-4 h-4" />
               </div>
               <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Staff</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{salesmen.length}</p>
         </div>
         <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-5 rounded-[28px] text-white shadow-lg shadow-indigo-500/20">
            <div className="flex items-center gap-2 mb-2">
               <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
                  <Award className="w-4 h-4" />
               </div>
               <span className="text-[10px] font-black uppercase text-blue-100 tracking-widest">Top Performer</span>
            </div>
            <p className="text-sm font-black truncate">{topPerformer?.name || 'No Data'}</p>
         </div>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
        <input 
          type="text" 
          placeholder="SEARCH SALESMEN BY NAME..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none font-bold text-[10px] tracking-widest uppercase shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Salesman List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-300">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest">Fetching staff records...</p>
          </div>
        ) : filteredSalesmen.length > 0 ? (
          filteredSalesmen.map(s => (
            <div 
              key={s.id} 
              onClick={() => setSelectedSalesman(s)}
              className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm relative group cursor-pointer active:scale-[0.98] transition-all hover:border-emerald-100"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                      <Users className="w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">{s.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                         <Phone className="w-3 h-3" /> {s.phone}
                      </p>
                   </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="p-2 text-slate-200 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-slate-50 pt-4 mt-2">
                 <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Sales</p>
                    <p className="text-xs font-black text-slate-800">{s.salesCount}</p>
                 </div>
                 <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Revenue</p>
                    <p className="text-xs font-black text-emerald-600">₹{s.totalSalesValue.toLocaleString()}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Target</p>
                    <p className="text-xs font-black text-slate-800">₹{s.target.toLocaleString()}</p>
                 </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-[8px] font-black text-slate-300 uppercase">Target Achievement</span>
                    <span className="text-[8px] font-black text-emerald-500 uppercase">{Math.min(100, Math.round((s.totalSalesValue / (s.target || 1)) * 100))}%</span>
                 </div>
                 <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.min(100, (s.totalSalesValue / (s.target || 1)) * 100)}%` }}
                    />
                 </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center space-y-4 bg-white rounded-[40px] border border-dashed border-slate-200">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-slate-200" />
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No staff records found</p>
          </div>
        )}
      </div>

      {/* Details View Modal */}
      {selectedSalesman && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-sm rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Staff Insight</h3>
                 <button onClick={() => setSelectedSalesman(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-10">
                 <div className="text-center">
                    <div className="w-20 h-20 bg-blue-600 rounded-[28px] flex items-center justify-center mx-auto mb-6 text-white shadow-xl shadow-blue-500/20">
                       <Users className="w-10 h-10" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tighter uppercase mb-1">{selectedSalesman.name}</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-80">Joined {new Date(selectedSalesman.joinDate).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-5 rounded-[28px] space-y-1">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Sales</p>
                       <p className="text-xl font-black text-slate-900">{selectedSalesman.salesCount}</p>
                    </div>
                    <div className="bg-emerald-50 p-5 rounded-[28px] space-y-1 border border-emerald-100">
                       <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Revenue Generated</p>
                       <p className="text-xl font-black text-emerald-700">₹{selectedSalesman.totalSalesValue.toLocaleString()}</p>
                    </div>
                 </div>

                 <div className="bg-indigo-50 p-6 rounded-[32px] border border-indigo-100 space-y-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-indigo-600" />
                          <span className="text-[10px] font-black uppercase text-indigo-800 tracking-widest">Sales Target</span>
                       </div>
                       <span className="text-xs font-black text-indigo-900">₹{selectedSalesman.target.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-3 bg-white/50 rounded-full overflow-hidden p-0.5">
                       <div 
                         className="h-full bg-indigo-600 rounded-full transition-all duration-1000" 
                         style={{ width: `${Math.min(100, (selectedSalesman.totalSalesValue / (selectedSalesman.target || 1)) * 100)}%` }}
                       />
                    </div>
                 </div>

                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Recent Achievement</p>
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                       <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <TrendingUp className="w-5 h-5 text-blue-500" />
                       </div>
                       <div>
                          <p className="text-xs font-black text-slate-800 uppercase">Growth Star</p>
                          <p className="text-[9px] font-bold text-slate-400">Maintained > 80% target for 2 months</p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-white flex flex-col gap-3">
                 <button 
                   onClick={() => setSelectedSalesman(null)}
                   className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg"
                 >
                    Close Profile
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
           <div className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300">
             <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Add Staff Member</h3>
               <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X className="w-6 h-6" /></button>
             </div>
             
             <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff Name</label>
                  <input 
                    required 
                    type="text"
                    placeholder="Full Name"
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none font-bold text-sm text-slate-700 uppercase" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <input 
                    required 
                    type="tel"
                    placeholder="Contact No"
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none font-bold text-sm text-slate-700" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monthly Sales Target (₹)</label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black">₹</div>
                    <input 
                      required 
                      type="number" 
                      placeholder="0.00" 
                      className="w-full p-4 pl-10 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none font-black text-lg text-slate-900" 
                      value={formData.target || ''} 
                      onChange={e => setFormData({...formData, target: parseFloat(e.target.value) || 0})} 
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-5 border border-slate-200 rounded-3xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Cancel</button>
                  <button 
                    type="submit" 
                    className="flex-[2] p-5 bg-emerald-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-2xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    Add Record
                  </button>
                </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default SalesmanTrackingPage;
