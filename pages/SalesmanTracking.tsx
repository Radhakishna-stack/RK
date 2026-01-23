
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ArrowLeft, Plus, Users, Search, Phone, Target, TrendingUp, 
  Trash2, Loader2, Award, ChevronRight, X, UserPlus, Star,
  IndianRupee, Calendar, CheckCircle2, MoreVertical, MapPin, 
  Navigation, Globe, Zap, Clock, Signal, ExternalLink, Map as MapIcon,
  Activity, ShieldCheck, Radio
} from 'lucide-react';
import { dbService } from '../db';
import { Salesman, StaffLocation, PickupBooking } from '../types';

interface SalesmanTrackingPageProps {
  onNavigate: (tab: string) => void;
}

const SalesmanTrackingPage: React.FC<SalesmanTrackingPageProps> = ({ onNavigate }) => {
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'performance' | 'gps'>('performance');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSalesman, setSelectedSalesman] = useState<Salesman | null>(null);
  const [liveLocations, setLiveLocations] = useState<Record<string, StaffLocation>>({});
  const [activeBookings, setActiveBookings] = useState<PickupBooking[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    target: 0
  });

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [staffData, bookingData] = await Promise.all([
        dbService.getSalesmen(),
        dbService.getPickupBookings()
      ]);
      
      setSalesmen(staffData);
      setActiveBookings(bookingData.filter(b => b.staffId));

      // Fetch live locations for all staff
      const locs: Record<string, StaffLocation> = {};
      const lsLocs: Record<string, StaffLocation> = JSON.parse(localStorage.getItem('mg_staff_locs') || '{}');
      
      // Map locations by staff ID instead of booking ID for this view
      Object.values(lsLocs).forEach(loc => {
        if (loc.staffId) {
          // Keep the most recent location if multiple bookings exist (rare)
          if (!locs[loc.staffId] || new Date(loc.lastUpdated) > new Date(locs[loc.staffId].lastUpdated)) {
            locs[loc.staffId] = loc;
          }
        }
      });
      
      setLiveLocations(locs);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const filteredSalesmen = useMemo(() => {
    return salesmen.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm)
    );
  }, [salesmen, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await dbService.addSalesman(formData);
      setSalesmen([...salesmen, result]);
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', target: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("CRITICAL: Remove this staff record? All tracking history will be purged.")) {
      setLoading(true);
      await dbService.deleteSalesman(id);
      setSalesmen(salesmen.filter(s => s.id !== id));
      if (selectedSalesman?.id === id) setSelectedSalesman(null);
      setLoading(false);
    }
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-500 max-w-lg mx-auto px-1">
      {/* Header HUD */}
      <header className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
           <button onClick={() => onNavigate('utilities')} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 hover:bg-slate-50 active:scale-90 transition-all">
              <ArrowLeft className="w-5 h-5 text-slate-800" />
           </button>
           <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Team Control</h2>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Master Terminal</p>
              </div>
           </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl active:scale-95 transition-all"
        >
          <UserPlus className="w-6 h-6" />
        </button>
      </header>

      {/* Mode Switcher */}
      <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 border border-slate-200">
         <button 
           onClick={() => setActiveView('performance')}
           className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeView === 'performance' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}
         >
            <Award className="w-4 h-4" /> Performance
         </button>
         <button 
           onClick={() => setActiveView('gps')}
           className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeView === 'gps' ? 'bg-white text-emerald-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}
         >
            <Radio className="w-4 h-4" /> GPS Monitor
         </button>
      </div>

      {activeView === 'performance' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                      <Users className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Staff</span>
                </div>
                <p className="text-2xl font-black text-slate-900">{salesmen.length}</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-5 rounded-[28px] text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
                        <Award className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-blue-100 tracking-widest">Top Performer</span>
                  </div>
                  <p className="text-sm font-black truncate">{salesmen.sort((a,b) => b.totalSalesValue - a.totalSalesValue)[0]?.name || 'N/A'}</p>
                </div>
                <Star className="absolute right-[-10px] bottom-[-10px] w-20 h-20 text-white/10 -rotate-12" />
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="SEARCH STAFF BY NAME..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-[10px] tracking-widest uppercase shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            {filteredSalesmen.map(s => (
              <div key={s.id} onClick={() => setSelectedSalesman(s)} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group active:scale-[0.98] transition-all hover:border-blue-100">
                <div className="flex justify-between items-start mb-5">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors border border-slate-100 shadow-inner">
                         <Users className="w-7 h-7" />
                      </div>
                      <div>
                         <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight leading-none mb-2">{s.name}</h3>
                         <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-slate-300" />
                            <span className="text-[10px] font-bold text-slate-400">{s.phone}</span>
                         </div>
                      </div>
                   </div>
                   <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="p-2 text-slate-200 hover:text-red-500 transition-colors active:scale-90">
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>
                <div className="grid grid-cols-3 gap-4 border-t border-slate-50 pt-4">
                   <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Orders</p>
                      <p className="text-xs font-black text-slate-800">{s.salesCount}</p>
                   </div>
                   <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Revenue</p>
                      <p className="text-xs font-black text-emerald-600">₹{s.totalSalesValue.toLocaleString()}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                      <div className="flex items-center justify-end gap-1.5">
                         <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'On Task' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                         <span className="text-[9px] font-black uppercase text-slate-700">{s.status || 'Available'}</span>
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeView === 'gps' && (
        <div className="space-y-6 animate-in fade-in duration-300">
           <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-between">
                 <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-emerald-500/20 w-fit px-3 py-1 rounded-full border border-emerald-500/30">
                       <Signal className="w-3.5 h-3.5 text-emerald-400" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300">GPS Live Polling</span>
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">Staff Locator</h3>
                 </div>
                 <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <Navigation className="w-7 h-7 text-blue-400 fill-blue-400" />
                 </div>
              </div>
              <Activity className="absolute right-[-20px] bottom-[-20px] w-32 h-32 text-white/5 -rotate-12" />
           </div>

           <div className="space-y-4">
              {salesmen.map(staff => {
                 const loc = liveLocations[staff.id];
                 const booking = activeBookings.find(b => b.staffId === staff.id);
                 const hasGPS = loc && loc.lat && loc.lng;
                 const lastSeen = loc ? new Date(loc.lastUpdated) : null;
                 const isFresh = lastSeen && (new Date().getTime() - lastSeen.getTime() < 60000);

                 return (
                    <div key={staff.id} className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden group">
                       <div className="p-6 space-y-6">
                          <div className="flex justify-between items-start">
                             <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner border border-slate-50 transition-colors ${isFresh ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                                   {staff.name.charAt(0)}
                                </div>
                                <div>
                                   <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">{staff.name}</h4>
                                   <div className="flex items-center gap-2">
                                      <div className={`w-1.5 h-1.5 rounded-full ${isFresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{isFresh ? 'Live Signal' : staff.status === 'Offline' ? 'Offline' : 'Inactive'}</span>
                                   </div>
                                </div>
                             </div>
                             {booking && (
                                <div className="bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 flex flex-col items-end">
                                   <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Active Duty</p>
                                   <span className="text-[10px] font-black text-blue-700 uppercase">{booking.bikeNumber}</span>
                                </div>
                             )}
                          </div>

                          {hasGPS ? (
                             <div className="space-y-4">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                   <div className="flex items-center gap-3 overflow-hidden">
                                      <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                                         <MapPin className="w-4 h-4 text-red-500" />
                                      </div>
                                      <div className="overflow-hidden">
                                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Last Precise Fix</p>
                                         <p className="text-[10px] font-bold text-slate-600 truncate">{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</p>
                                      </div>
                                   </div>
                                   <div className="text-right shrink-0">
                                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Last Seen</p>
                                      <div className="flex items-center gap-1.5 justify-end">
                                         <Clock className="w-3 h-3 text-slate-300" />
                                         <span className="text-[10px] font-black text-slate-900">{lastSeen?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                   </div>
                                </div>

                                <button 
                                  onClick={() => openGoogleMaps(loc.lat, loc.lng)}
                                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                                >
                                   <MapIcon className="w-4 h-4" /> View in Google Maps
                                </button>
                             </div>
                          ) : (
                             <div className="bg-slate-50 p-8 rounded-[32px] border border-dashed border-slate-200 text-center space-y-3">
                                <MapPinOff className="w-10 h-10 text-slate-200 mx-auto" />
                                <div className="space-y-1">
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Signal Detected</p>
                                   <p className="text-[9px] text-slate-300 font-bold uppercase leading-tight max-w-[160px] mx-auto">GPS tracking initiates once staff starts a task in the tech terminal.</p>
                                </div>
                             </div>
                          )}
                       </div>
                    </div>
                 );
              })}
           </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
           <div className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300">
             <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Onboard Personnel</h3>
               <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X className="w-6 h-6" /></button>
             </div>
             
             <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff Name</label>
                  <input 
                    required 
                    type="text"
                    placeholder="FULL NAME"
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm text-slate-700 uppercase" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Link</label>
                  <input 
                    required 
                    type="tel"
                    placeholder="910000000000"
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-sm text-slate-700" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sales Target (₹)</label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black">₹</div>
                    <input 
                      required 
                      type="number" 
                      placeholder="0.00" 
                      className="w-full p-4 pl-10 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-black text-lg text-slate-900" 
                      value={formData.target || ''} 
                      onChange={e => setFormData({...formData, target: parseFloat(e.target.value) || 0})} 
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-5 border border-slate-200 rounded-3xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Abort</button>
                  <button 
                    type="submit" 
                    className="flex-[2] p-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-2"
                  >
                    Authorize Entry
                  </button>
                </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
};

const MapPinOff = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export default SalesmanTrackingPage;
