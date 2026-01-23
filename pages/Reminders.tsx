
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Bell, Search, Calendar, MessageSquare, Plus, Loader2, Trash2, 
  CheckCircle2, AlertCircle, Clock, Filter, ChevronRight, X, 
  Smartphone, Zap, ShieldCheck, Share2, Users, IndianRupee,
  MoveRight, MoveLeft, ListChecks, Check, MessageCircle, Send
} from 'lucide-react';
import { dbService } from '../db';
import { ServiceReminder, AppSettings } from '../types';

const RemindersPage: React.FC = () => {
  const [reminders, setReminders] = useState<ServiceReminder[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSegment, setActiveSegment] = useState<'overdue' | 'today' | 'upcoming'>('today');
  
  // Selection System
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Sequence System
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastIndex, setBroadcastIndex] = useState(0);
  const [broadcastQueue, setBroadcastQueue] = useState<ServiceReminder[]>([]);

  const [newReminder, setNewReminder] = useState({
    bikeNumber: '',
    customerName: '',
    phone: '',
    reminderDate: new Date().toISOString().split('T')[0],
    serviceType: 'Regular Service'
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [data, sett] = await Promise.all([
        dbService.getReminders(),
        dbService.getSettings()
      ]);
      setReminders(data);
      setSettings(sett);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const segmentedReminders = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayStr = now.toISOString().split('T')[0];

    const sorted = [...reminders].sort((a, b) => new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime());

    return {
      overdue: sorted.filter(r => r.reminderDate < todayStr && r.status !== 'Sent'),
      today: sorted.filter(r => r.reminderDate === todayStr),
      upcoming: sorted.filter(r => r.reminderDate > todayStr)
    };
  }, [reminders]);

  const activeList = useMemo(() => {
    const list = segmentedReminders[activeSegment];
    if (!searchTerm) return list;
    const key = searchTerm.toLowerCase();
    return list.filter(r => 
      r.bikeNumber.toLowerCase().includes(key) || 
      r.customerName.toLowerCase().includes(key) ||
      r.phone.includes(key)
    );
  }, [segmentedReminders, activeSegment, searchTerm]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await dbService.addReminder(newReminder);
      setReminders([...reminders, res]);
      setIsModalOpen(false);
    } catch (err) {
      alert("Failed to schedule.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("CRITICAL: Remove this reminder from the queue?")) {
      setLoading(true);
      await dbService.deleteReminder(id);
      setReminders(prev => prev.filter(r => r.id !== id));
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === activeList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activeList.map(r => r.id)));
    }
  };

  const getMessage = (rem: ServiceReminder) => {
    let template = settings?.reminders.reminderTemplate || "Hello {{CustomerName}}, your bike {{BikeNumber}} is due for service.";
    return template
      .replace(/{{CustomerName}}/g, rem.customerName)
      .replace(/{{BikeNumber}}/g, rem.bikeNumber)
      .replace(/{{ReminderDate}}/g, new Date(rem.reminderDate).toLocaleDateString())
      .replace(/{{ServiceType}}/g, rem.serviceType);
  };

  const startBroadcast = () => {
    const queue = activeList.filter(r => selectedIds.has(r.id));
    if (queue.length === 0) return;
    setBroadcastQueue(queue);
    setBroadcastIndex(0);
    setIsBroadcasting(true);
  };

  const fireNextInQueue = async () => {
    const target = broadcastQueue[broadcastIndex];
    if (!target) {
      setIsBroadcasting(false);
      return;
    }

    const msg = getMessage(target);
    dbService.sendWhatsApp(target.phone, msg);
    
    // Update local and DB status
    await dbService.updateReminderStatus(target.id, 'Sent');
    setReminders(prev => prev.map(r => r.id === target.id ? { ...r, status: 'Sent', lastNotified: new Date().toISOString() } : r));

    if (broadcastIndex + 1 < broadcastQueue.length) {
      setBroadcastIndex(prev => prev + 1);
    } else {
      setTimeout(() => {
        setIsBroadcasting(false);
        setBroadcastQueue([]);
        setSelectedIds(new Set());
        alert("Broadcast Sequence Complete! 🏁");
      }, 500);
    }
  };

  return (
    <div className="space-y-6 pb-32 animate-in fade-in duration-500 max-w-lg mx-auto px-1">
      <header className="px-1 flex justify-between items-end mb-2">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Retention Terminal</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-1">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
             Active Service Reminders
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 text-white p-4 rounded-[22px] shadow-2xl active:scale-95 transition-all group"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
        </button>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4">
         <div className="bg-slate-900 p-6 rounded-[32px] text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
               <p className="text-[9px] font-black uppercase text-blue-400 tracking-[0.3em] mb-2">Pending Alerts</p>
               <h3 className="text-3xl font-black">{segmentedReminders.today.length + segmentedReminders.overdue.length}</h3>
            </div>
            <Bell className="absolute right-[-10px] bottom-[-10px] w-20 h-20 text-white/5 -rotate-12" />
         </div>
         <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em] mb-2">Sent (MTD)</p>
            <h3 className="text-3xl font-black text-slate-900">{reminders.filter(r => r.status === 'Sent').length}</h3>
         </div>
      </div>

      {/* Control Module */}
      <div className="space-y-4">
         <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
            <input 
               type="text" 
               placeholder="SEARCH BIKE OR NAME..."
               className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none font-black text-[11px] tracking-widest uppercase shadow-sm"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>

         {/* Segmented Controller */}
         <div className="bg-slate-100 p-1 rounded-[22px] flex gap-1 border border-slate-200">
            <SegmentTab active={activeSegment === 'overdue'} onClick={() => setActiveSegment('overdue')} label="Overdue" badge={segmentedReminders.overdue.length} color="text-red-500" />
            <SegmentTab active={activeSegment === 'today'} onClick={() => setActiveSegment('today')} label="Today" badge={segmentedReminders.today.length} />
            <SegmentTab active={activeSegment === 'upcoming'} onClick={() => setActiveSegment('upcoming')} label="Upcoming" />
         </div>
      </div>

      {/* Reminder Feed */}
      <div className="space-y-4">
         <div className="flex justify-between items-center px-2">
            <button onClick={selectAll} className="text-[10px] font-black uppercase text-blue-600 tracking-widest flex items-center gap-2">
               {selectedIds.size === activeList.length && activeList.length > 0 ? <CheckCircle2 className="w-3 h-3" /> : <ListChecks className="w-4 h-4" />}
               {selectedIds.size === activeList.length && activeList.length > 0 ? 'Deselect All' : 'Select Segment'}
            </button>
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{activeList.length} REMINDERS FOUND</span>
         </div>

         {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
               <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
               <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Polling Database...</p>
            </div>
         ) : activeList.length > 0 ? (
            activeList.map(rem => (
               <div key={rem.id} onClick={() => toggleSelect(rem.id)} className={`bg-white rounded-[32px] border transition-all p-6 space-y-4 relative cursor-pointer active:scale-[0.98] ${selectedIds.has(rem.id) ? 'border-blue-500 ring-4 ring-blue-500/5 shadow-xl' : 'border-slate-50 shadow-sm'}`}>
                  <div className="flex justify-between items-start">
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-colors ${selectedIds.has(rem.id) ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-900 border border-slate-100'}`}>
                           {selectedIds.has(rem.id) ? <Check className="w-6 h-6" /> : rem.bikeNumber.charAt(0)}
                        </div>
                        <div>
                           <div className="flex items-center gap-2">
                              <h4 className="font-black text-slate-900 uppercase text-sm tracking-tight">{rem.bikeNumber}</h4>
                              {rem.status === 'Sent' && <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded-full border border-emerald-100">SENT</span>}
                           </div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{rem.customerName}</p>
                        </div>
                     </div>
                     <button onClick={(e) => { e.stopPropagation(); handleDelete(rem.id); }} className="p-2 text-slate-200 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                     <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                           <Calendar className="w-3.5 h-3.5 text-blue-500" />
                           <span className="text-[9px] font-black text-slate-500 uppercase">{new Date(rem.reminderDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <Zap className="w-3.5 h-3.5 text-amber-500" />
                           <span className="text-[9px] font-black text-slate-500 uppercase">{rem.serviceType}</span>
                        </div>
                     </div>
                     <ChevronRight className="w-4 h-4 text-slate-200" />
                  </div>
               </div>
            ))
         ) : (
            <div className="bg-white border-2 border-dashed border-slate-100 rounded-[40px] p-20 text-center space-y-4">
               <Bell className="w-12 h-12 text-slate-100 mx-auto" />
               <div className="space-y-1">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No Alerts Pending</p>
                  <p className="text-[9px] font-bold text-slate-300 uppercase">This segment is fully cleared</p>
               </div>
            </div>
         )}
      </div>

      {/* Action HUD */}
      {selectedIds.size > 0 && !isBroadcasting && (
         <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 z-[60] animate-in slide-in-from-bottom-6">
            <div className="bg-slate-900 rounded-[32px] p-4 flex items-center justify-between shadow-2xl border border-white/5">
               <div className="flex items-center gap-4 pl-2">
                  <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                     <Send className="w-5 h-5" />
                  </div>
                  <div>
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Selection Terminal</p>
                     <p className="text-xs font-black text-white">{selectedIds.size} Reminders Armed</p>
                  </div>
               </div>
               <button 
                 onClick={startBroadcast}
                 className="bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
               >
                  Bulk Send
               </button>
            </div>
         </div>
      )}

      {/* Broadcaster Overlay */}
      {isBroadcasting && (
         <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[200] flex flex-col items-center justify-center p-8 animate-in fade-in duration-300 text-white">
            <div className="w-full max-w-sm space-y-12">
               <div className="text-center space-y-4">
                  <div className="relative w-24 h-24 mx-auto">
                     <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                     <div className="relative w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/10">
                        <MessageCircle className="w-10 h-10 text-white animate-bounce" />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <h3 className="text-2xl font-black uppercase tracking-tight">WhatsApp Broadcast</h3>
                     <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Sequencing Alert {broadcastIndex + 1} of {broadcastQueue.length}</p>
                  </div>
               </div>

               <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] space-y-4">
                  <div className="flex justify-between items-center px-1">
                     <span className="text-[10px] font-black text-blue-400 uppercase">Queue Progress</span>
                     <span className="text-[10px] font-black text-blue-400 uppercase">{Math.round(((broadcastIndex + 1) / broadcastQueue.length) * 100)}%</span>
                  </div>
                  <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                     <div 
                        className="h-full bg-blue-600 transition-all duration-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                        style={{ width: `${((broadcastIndex + 1) / broadcastQueue.length) * 100}%` }}
                     />
                  </div>
               </div>

               <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] space-y-3">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><Users className="w-4 h-4 text-slate-400" /></div>
                     <p className="text-[10px] font-black text-white uppercase tracking-widest">{broadcastQueue[broadcastIndex]?.customerName}</p>
                  </div>
                  <div className="h-px bg-white/5"></div>
                  <p className="text-[11px] text-slate-400 leading-relaxed italic">"{getMessage(broadcastQueue[broadcastIndex])}"</p>
               </div>

               <div className="flex gap-4">
                  <button onClick={() => setIsBroadcasting(false)} className="flex-1 py-5 bg-white/5 border border-white/10 rounded-3xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all text-slate-400">Abort</button>
                  <button onClick={fireNextInQueue} className="flex-[2] py-5 bg-emerald-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 border border-emerald-400">
                     <Smartphone className="w-5 h-5" /> Fire WhatsApp Link
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
           <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">New Reminder</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Post-Service Retention</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleAdd} className="p-8 space-y-6">
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bike Number</label>
                          <input 
                            required 
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-sm uppercase" 
                            placeholder="MH12..."
                            value={newReminder.bikeNumber}
                            onChange={e => setNewReminder({...newReminder, bikeNumber: e.target.value.toUpperCase()})}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Date</label>
                          <input 
                            required 
                            type="date"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm"
                            value={newReminder.reminderDate}
                            onChange={e => setNewReminder({...newReminder, reminderDate: e.target.value})}
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer Name</label>
                       <input 
                         required 
                         className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-sm uppercase" 
                         placeholder="FULL NAME"
                         value={newReminder.customerName}
                         onChange={e => setNewReminder({...newReminder, customerName: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                       <input 
                         required 
                         className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" 
                         placeholder="91..."
                         value={newReminder.phone}
                         onChange={e => setNewReminder({...newReminder, phone: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Service Type</label>
                       <select 
                         className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-xs uppercase"
                         value={newReminder.serviceType}
                         onChange={e => setNewReminder({...newReminder, serviceType: e.target.value})}
                       >
                          <option>Regular Service</option>
                          <option>Oil Change</option>
                          <option>Brake Inspection</option>
                          <option>Chain Lubrication</option>
                       </select>
                    </div>
                    <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
                       <CheckCircle2 className="w-5 h-5 text-blue-400" /> Commit to Queue
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

const SegmentTab: React.FC<{ active: boolean; onClick: () => void; label: string; badge?: number; color?: string }> = ({ active, onClick, label, badge, color }) => (
  <button 
    onClick={onClick}
    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 relative ${active ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400'}`}
  >
    <span className={color}>{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black ${active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{badge}</span>
    )}
  </button>
);

export default RemindersPage;
