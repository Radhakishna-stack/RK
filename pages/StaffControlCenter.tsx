
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, ShieldAlert, UserCheck, Key, Clock, Loader2, ChevronRight, X, 
  UserPlus, Phone, Target, IndianRupee, CheckCircle2, User 
} from 'lucide-react';
import { dbService } from '../db';
import { Salesman } from '../types';

const StaffControlCenter: React.FC = () => {
  const [staff, setStaff] = useState<Salesman[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    target: 0
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dbService.getSalesmen();
      setStaff(data);
    } catch (err) {
      console.error("Failed to load staff:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await dbService.addSalesman(formData);
      await loadData();
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', target: 0 });
    } catch (err) {
      alert("Failed to onboard staff. Please check connectivity.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-28 animate-in px-1 max-w-lg mx-auto">
      <header>
        <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Staff Control</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workspace Governance</p>
      </header>

      <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden">
         <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3 bg-blue-500/20 w-fit px-3 py-1 rounded-full border border-blue-500/30">
               <Shield className="w-4 h-4 text-blue-400" />
               <span className="text-[9px] font-black uppercase tracking-widest">Secure Terminal</span>
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight">Access Management</h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">Manage workspace permissions, track live shifts, and secure the billing terminal.</p>
         </div>
         <ShieldAlert className="absolute right-[-20px] bottom-[-20px] w-48 h-48 text-white/5 -rotate-12" />
      </div>

      <div className="space-y-4">
         <div className="flex items-center justify-between px-1">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Personnel ({staff.length})</h4>
            <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
               <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-[8px] font-black text-emerald-600 uppercase">System Live</span>
            </div>
         </div>

         {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-300">
               <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
               <p className="text-[9px] font-black uppercase tracking-widest">Polling Staff Registry...</p>
            </div>
         ) : staff.length > 0 ? (
            staff.map(s => (
               <div key={s.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all hover:border-blue-100">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 font-black text-xl shadow-inner uppercase border border-slate-100">
                        {s.name.charAt(0)}
                     </div>
                     <div>
                        <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">{s.name}</h4>
                        <div className="flex items-center gap-2">
                           <span className={`text-[9px] font-black uppercase tracking-widest ${s.status === 'On Task' ? 'text-amber-500' : 'text-emerald-500'}`}>
                              {s.status || 'Active Shift'}
                           </span>
                           <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                           <span className="text-[9px] font-bold text-slate-400 uppercase">{s.phone}</span>
                        </div>
                     </div>
                  </div>
                  <button className="p-3 bg-slate-50 text-slate-300 rounded-2xl hover:bg-slate-900 hover:text-white transition-all active:scale-90">
                     <Key className="w-5 h-5" />
                  </button>
               </div>
            ))
         ) : (
            <div className="bg-white border-2 border-dashed border-slate-100 rounded-[40px] p-16 text-center space-y-4">
               <User className="w-12 h-12 text-slate-200 mx-auto" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No staff registered in governance</p>
            </div>
         )}
      </div>

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-sm px-6">
         <button 
           onClick={() => setIsModalOpen(true)}
           className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/5"
         >
            <UserPlus className="w-5 h-5" /> Onboard New Staff
         </button>
      </div>

      {/* Onboarding Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
           <div className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300">
             <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
               <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">New Staff Entry</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Governance Registration</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X className="w-6 h-6" /></button>
             </div>
             
             <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto no-scrollbar">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Technician Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      required 
                      type="text"
                      placeholder="ENTER NAME..."
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none font-bold text-sm text-slate-700 uppercase" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Link (WhatsApp Preferred)</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                      required 
                      type="tel"
                      placeholder="PHONE NUMBER..."
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 outline-none font-bold text-sm text-slate-700" 
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Performance Target (₹/Month)</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                       <IndianRupee className="w-5 h-5 text-amber-500" />
                    </div>
                    <input 
                      required 
                      type="number" 
                      placeholder="0.00" 
                      className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/5 outline-none font-black text-lg text-slate-900" 
                      value={formData.target || ''} 
                      onChange={e => setFormData({...formData, target: parseFloat(e.target.value) || 0})} 
                    />
                  </div>
                </div>

                <div className="bg-blue-50 p-5 rounded-3xl border border-blue-100 flex items-start gap-4">
                   <Shield className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
                   <div>
                      <p className="text-[11px] font-black text-blue-900 uppercase">Compliance Verification</p>
                      <p className="text-[10px] text-blue-700 font-medium leading-relaxed">Registering a new staff member creates a secure profile in the Master Terminal. They will be eligible for job card assignments immediately.</p>
                   </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-5 border border-slate-200 rounded-3xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Cancel</button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-[2] p-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-black shadow-2xl shadow-slate-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                    Register Staff
                  </button>
                </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default StaffControlCenter;
