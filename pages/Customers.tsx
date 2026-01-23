
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Search, MapPin, Phone, Bike, Award, Loader2, Trash2, 
  ArrowLeft, Settings, Share2, ChevronRight, Mail, Home, Filter,
  MessageCircle, ExternalLink, User, MoreVertical, X,
  Users, CheckCircle2, Navigation, SortAsc, Hash, Edit3
} from 'lucide-react';
import { dbService } from '../db';
import { Customer } from '../types';

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [sortBy, setSortBy] = useState<'name' | 'loyalty' | 'newest'>('newest');
  
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '', 
    bikeNumber: '', 
    city: '', 
    gstin: '', 
    email: '', 
    address: '' 
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await dbService.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cities = useMemo(() => {
    const uniqueCities = Array.from(new Set(customers.map(c => c.city).filter(Boolean)));
    return ['All Cities', ...uniqueCities.sort()];
  }, [customers]);

  const filteredAndSortedCustomers = useMemo(() => {
    let result = customers
      .filter(c => c && c.name) 
      .filter(c => {
        const query = searchTerm.toLowerCase();
        const matchesSearch = 
          c.name.toLowerCase().includes(query) ||
          c.phone.includes(query) ||
          c.bikeNumber.toLowerCase().includes(query) ||
          (c.city && c.city.toLowerCase().includes(query)) ||
          (c.email && c.email.toLowerCase().includes(query));
        
        const matchesCity = selectedCity === 'All Cities' || c.city === selectedCity;
        
        return matchesSearch && matchesCity;
      });

    // Sorting Logic
    if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'loyalty') {
      result.sort((a, b) => b.loyaltyPoints - a.loyaltyPoints);
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [customers, searchTerm, selectedCity, sortBy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const newCustomer = await dbService.addCustomer(formData);
      setCustomers(prev => [...prev, newCustomer]);
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', bikeNumber: '', city: '', gstin: '', email: '', address: '' });
    } catch (err: any) {
      setError(err.message || "Failed to create customer");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("CRITICAL: Permanent removal of this customer record? This cannot be undone.")) {
      setLoading(true);
      await dbService.deleteCustomer(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
      setLoading(false);
    }
  };

  const handleMaintainPoints = async (id: string, currentPoints: number) => {
     const input = prompt("Update Loyalty Points balance:", currentPoints.toString());
     if (input !== null) {
        const newPoints = parseInt(input);
        if (!isNaN(newPoints)) {
           await dbService.updateCustomerLoyalty(id, newPoints);
           loadData();
        } else {
           alert("Invalid input. Please enter a valid number.");
        }
     }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto px-1 pb-24">
      {/* Header HUD */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 px-1">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900 uppercase leading-none">Registry</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
            <Users className="w-3 h-3 text-blue-500" /> Authorized Party Database
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 shadow-2xl active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" /> Enroll New Party
        </button>
      </header>

      {/* Advanced Command Bar */}
      <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch">
          {/* Smart Search */}
          <div className="relative flex-[2] group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
            <input 
              type="text" 
              placeholder="SEARCH NAME, BIKE, PHONE..."
              className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[22px] focus:ring-8 focus:ring-blue-500/5 outline-none font-black text-[11px] uppercase tracking-widest transition-all placeholder:text-slate-300"
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-1 gap-3">
            {/* City Filter */}
            <div className="relative flex-1 min-w-[140px]">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 z-10 pointer-events-none">
                 <MapPin className="w-4 h-4" />
              </div>
              <select 
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full pl-10 pr-10 py-5 bg-slate-50 border border-slate-100 rounded-[22px] outline-none appearance-none cursor-pointer font-black text-[10px] uppercase tracking-widest text-slate-600 transition-all focus:ring-8 focus:ring-blue-500/5"
              >
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronRight className="w-4 h-4 text-slate-300 transform rotate-90" />
              </div>
            </div>

            {/* Sort Filter */}
            <div className="relative flex-1 min-w-[140px]">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 z-10 pointer-events-none">
                 <SortAsc className="w-4 h-4" />
              </div>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full pl-10 pr-10 py-5 bg-slate-50 border border-slate-100 rounded-[22px] outline-none appearance-none cursor-pointer font-black text-[10px] uppercase tracking-widest text-slate-600 transition-all focus:ring-8 focus:ring-blue-500/5"
              >
                <option value="newest">Recent</option>
                <option value="name">Alphabetical</option>
                <option value="loyalty">High Loyalty</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronRight className="w-4 h-4 text-slate-300 transform rotate-90" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-40 flex flex-col items-center justify-center gap-6 text-slate-300">
           <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-100 rounded-full"></div>
              <Loader2 className="w-16 h-16 animate-spin text-blue-600 absolute top-0 left-0" />
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.4em]">Decrypting Registry...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedCustomers.map(customer => (
            <div key={customer.id} className="bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-blue-100 hover:-translate-y-1 transition-all duration-300 group overflow-hidden flex flex-col">
              {/* Profile HUD */}
              <div className="p-8 pb-4 flex justify-between items-start">
                 <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-slate-50 rounded-[24px] flex items-center justify-center text-slate-900 font-black text-2xl shadow-inner border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 uppercase">
                      {customer.name?.charAt(0) || '?'}
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-2">{customer.name}</h3>
                       <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Verified Member</span>
                       </div>
                    </div>
                 </div>
                 <button 
                   onClick={() => handleMaintainPoints(customer.id, customer.loyaltyPoints)}
                   className="bg-amber-50 text-amber-600 px-4 py-2 rounded-2xl flex flex-col items-center gap-0.5 border border-amber-100 shadow-sm transition-transform group-hover:scale-110 active:scale-90"
                 >
                    <Award className="w-4 h-4 fill-amber-600" />
                    <span className="text-xs font-black tracking-tighter">{customer.loyaltyPoints}</span>
                 </button>
              </div>

              {/* Core Details Segment */}
              <div className="px-8 py-4 space-y-6 flex-1">
                 {/* License Plate Visual */}
                 <div className="flex flex-wrap gap-3">
                    <div className="bg-slate-900 text-white px-5 py-2.5 rounded-xl flex items-center gap-3 shadow-lg border border-slate-800">
                       <Bike className="w-4 h-4 text-blue-400" />
                       <span className="text-[12px] font-mono font-black uppercase tracking-[0.2em]">{customer.bikeNumber}</span>
                    </div>
                    <div className="bg-blue-50 text-blue-600 px-4 py-2.5 rounded-xl flex items-center gap-2 border border-blue-100">
                       <Navigation className="w-3.5 h-3.5" />
                       <span className="text-[10px] font-black uppercase tracking-tight">{customer.city}</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 gap-4 bg-slate-50/50 p-5 rounded-[32px] border border-slate-100">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100 group-hover:text-blue-600 transition-colors">
                          <Phone className="w-4 h-4" />
                       </div>
                       <div className="flex-1 overflow-hidden">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Mobile Link</p>
                          <p className="text-sm font-bold text-slate-700 tracking-tight">{customer.phone}</p>
                       </div>
                    </div>

                    {customer.email && (
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100 group-hover:text-indigo-600 transition-colors">
                            <Mail className="w-4 h-4" />
                         </div>
                         <div className="flex-1 overflow-hidden">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Digital ID</p>
                            <p className="text-sm font-bold text-slate-700 truncate">{customer.email}</p>
                         </div>
                      </div>
                    )}
                 </div>

                 {customer.address && (
                    <div className="bg-blue-50/30 p-4 rounded-[24px] border border-blue-100/30 flex gap-3">
                       <Home className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />
                       <p className="text-[11px] font-medium text-slate-500 leading-relaxed line-clamp-2 italic">"{customer.address}"</p>
                    </div>
                 )}
              </div>

              {/* Action HUD Segment */}
              <div className="p-8 pt-0 flex gap-2">
                 <a 
                   href={`tel:${customer.phone}`}
                   className="flex-1 bg-slate-50 text-slate-600 py-4 rounded-[20px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-100 hover:bg-white hover:border-blue-200 hover:text-blue-600 transition-all active:scale-95"
                 >
                    <Phone className="w-4 h-4" /> Call
                 </a>
                 <button 
                   onClick={() => dbService.sendWhatsApp(customer.phone, `Hi ${customer.name}, greeting from Moto Gear SRK! We're here to help with your bike ${customer.bikeNumber}.`)}
                   className="flex-1 bg-emerald-50 text-emerald-600 py-4 rounded-[20px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all active:scale-95"
                 >
                    <MessageCircle className="w-4 h-4" /> Chat
                 </button>
                 <button 
                   onClick={() => handleDelete(customer.id)}
                   className="bg-red-50 text-red-400 p-4 rounded-[20px] border border-red-100 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                 >
                    <Trash2 className="w-5 h-5" />
                 </button>
              </div>
            </div>
          ))}
          
          {filteredAndSortedCustomers.length === 0 && !loading && (
            <div className="col-span-full py-40 text-center bg-white rounded-[64px] border-2 border-dashed border-slate-100 space-y-8">
              <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                 <Users className="w-12 h-12 text-slate-200" />
              </div>
              <div className="space-y-3">
                <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">No Registry Hits</h4>
                <p className="text-slate-400 font-medium max-w-xs mx-auto text-sm">We couldn't find any parties matching your current filter criteria.</p>
              </div>
              <button 
                onClick={() => { setSearchTerm(''); setSelectedCity('All Cities'); setSortBy('newest'); }}
                className="bg-slate-900 text-white px-10 py-4 rounded-[22px] font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-xl"
              >
                Reset System Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Enrollment Panel */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-t-[48px] sm:rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[96vh] relative">
            
            <div className="flex justify-between items-center p-8 border-b border-slate-50 bg-white sticky top-0 z-10">
               <div>
                 <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Party Intake</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Registry Enrollment</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-[22px] transition-all active:scale-90"><X className="w-7 h-7" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar pb-32">
               {error && <div className="p-5 bg-red-50 text-red-600 rounded-[24px] text-xs font-black uppercase tracking-widest border border-red-100 flex items-center gap-3">
                  <X className="w-5 h-5" /> {error}
               </div>}

               <div className="bg-blue-50/50 rounded-[32px] p-6 flex items-center justify-between border border-blue-100/50 relative overflow-hidden group">
                  <div className="relative z-10 flex items-center gap-5">
                     <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-blue-50 transition-transform group-hover:scale-110">
                        <Share2 className="w-6 h-6 text-blue-600" />
                     </div>
                     <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Bulk Identity Invite</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Self-onboarding link</p>
                     </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-blue-300 relative z-10" />
                  <div className="absolute right-[-20px] bottom-[-20px] opacity-5">
                     <Share2 className="w-32 h-32" />
                  </div>
               </div>

               <form onSubmit={handleSubmit} className="space-y-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Party Full Name*</label>
                    <div className="relative group">
                       <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                       <input 
                         required
                         type="text"
                         className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[24px] outline-none text-sm font-black uppercase tracking-tight focus:ring-8 focus:ring-blue-500/5 transition-all"
                         placeholder="e.g. Rahul Sharma"
                         value={formData.name}
                         onChange={e => setFormData({...formData, name: e.target.value})}
                       />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact No*</label>
                      <div className="relative group">
                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                           required
                           type="tel"
                           placeholder="91 00000 00000"
                           className="w-full pl-12 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[24px] outline-none text-sm font-bold focus:ring-8 focus:ring-emerald-500/5 transition-all"
                           value={formData.phone}
                           onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bike Number*</label>
                      <div className="relative group">
                        <Bike className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 transition-colors" />
                        <input 
                          required
                          type="text"
                          placeholder="MH12 AB 1234"
                          className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[24px] outline-none text-sm font-black uppercase tracking-[0.2em] focus:ring-8 focus:ring-blue-500/5 transition-all"
                          value={formData.bikeNumber}
                          onChange={e => setFormData({...formData, bikeNumber: e.target.value.toUpperCase()})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                     <div className="flex items-center gap-4">
                        <div className="h-px bg-slate-100 flex-1"></div>
                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Extended Metadata</h4>
                        <div className="h-px bg-slate-100 flex-1"></div>
                     </div>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base City*</label>
                           <input 
                             required
                             type="text"
                             placeholder="PUNE / DELHI..."
                             className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[24px] outline-none text-sm font-black uppercase transition-all focus:ring-8 focus:ring-blue-500/5"
                             value={formData.city}
                             onChange={e => setFormData({...formData, city: e.target.value.toUpperCase()})}
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GSTIN Link</label>
                           <input 
                             type="text"
                             placeholder="BUSINESS TAX ID"
                             className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[24px] outline-none text-sm font-black uppercase transition-all focus:ring-8 focus:ring-blue-500/5"
                             value={formData.gstin}
                             onChange={e => setFormData({...formData, gstin: e.target.value.toUpperCase()})}
                           />
                        </div>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Communication Email</label>
                        <input 
                           type="email"
                           placeholder="NAME@PROVIDER.COM"
                           className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[24px] outline-none text-sm font-black uppercase transition-all focus:ring-8 focus:ring-blue-500/5"
                           value={formData.email}
                           onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base Logistics Address</label>
                        <textarea 
                           rows={3}
                           placeholder="FULL RESIDENTIAL OR BUSINESS ADDRESS..."
                           className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[32px] outline-none text-xs font-bold transition-all focus:ring-8 focus:ring-blue-500/5 resize-none uppercase"
                           value={formData.address}
                           onChange={e => setFormData({...formData, address: e.target.value})}
                        />
                     </div>
                  </div>
                  
                  {/* Modal Action HUD */}
                  <div className="fixed bottom-0 left-0 right-0 p-8 bg-white/90 backdrop-blur-xl border-t border-slate-50 flex gap-4 z-20">
                     <button 
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 py-5 border border-slate-200 rounded-[24px] font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all active:scale-95"
                     >
                       Abort
                     </button>
                     <button 
                        type="submit"
                        className="flex-[2] py-5 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                     >
                        <CheckCircle2 className="w-5 h-5" /> Authorize Entry
                     </button>
                  </div>
               </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
