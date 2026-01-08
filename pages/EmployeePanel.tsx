
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Loader2, Hammer, CheckCircle2, Bike, User, 
  Clock, ChevronRight, Play, CheckCircle, AlertCircle,
  Wrench, ClipboardList, Package, MessageSquare, Search,
  Zap, Settings2, MoreHorizontal, History
} from 'lucide-react';
import { dbService } from '../db';
import { Complaint, ComplaintStatus, Salesman } from '../types';

interface EmployeePanelProps {
  onNavigate: (tab: string) => void;
}

const EmployeePanel: React.FC<EmployeePanelProps> = ({ onNavigate }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [mechanics, setMechanics] = useState<Salesman[]>([]);
  const [selectedMechanic, setSelectedMechanic] = useState<Salesman | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pool' | 'mine'>('pool');
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const savedMech = localStorage.getItem('sbs_active_mechanic');
    if (savedMech) {
      dbService.getSalesmen().then(list => {
        const found = list.find(m => m.id === savedMech);
        if (found) setSelectedMechanic(found);
      });
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [compData, mechData] = await Promise.all([
        dbService.getComplaints(),
        dbService.getSalesmen()
      ]);
      setComplaints(compData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setMechanics(mechData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePickMechanic = (mech: Salesman) => {
    setSelectedMechanic(mech);
    localStorage.setItem('sbs_active_mechanic', mech.id);
  };

  const handlePickJob = async (jobId: string) => {
    if (!selectedMechanic) return;
    try {
      setLoading(true);
      await dbService.assignComplaintMechanic(jobId, selectedMechanic.id, selectedMechanic.name);
      await loadData();
      setActiveTab('mine');
    } catch (err) {
      alert("Failed to pick job.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteJob = async (jobId: string) => {
    try {
      setLoading(true);
      await dbService.updateComplaintStatus(jobId, ComplaintStatus.COMPLETED);
      await loadData();
    } catch (err) {
      alert("Failed to complete job.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusUpdate = async (jobId: string, status: ComplaintStatus) => {
    try {
      setLoading(true);
      await dbService.updateComplaintStatus(jobId, status);
      await loadData();
      setUpdatingJobId(null);
    } catch (err) {
      alert("Failed to update status.");
    } finally {
      setLoading(false);
    }
  };

  const poolJobs = useMemo(() => 
    complaints.filter(c => c.status === ComplaintStatus.PENDING && !c.mechanicId),
    [complaints]
  );

  const myJobs = useMemo(() => 
    complaints.filter(c => c.mechanicId === selectedMechanic?.id && c.status !== ComplaintStatus.COMPLETED),
    [complaints, selectedMechanic]
  );

  if (!selectedMechanic) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 space-y-10 animate-in fade-in duration-500">
         <div className="w-24 h-24 bg-orange-100 rounded-[32px] flex items-center justify-center text-orange-600 shadow-xl shadow-orange-500/10">
            <User className="w-12 h-12" />
         </div>
         <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Who are you?</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Select your mechanic profile to start</p>
         </div>
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
            {mechanics.map(mech => (
              <button 
                key={mech.id} 
                onClick={() => handlePickMechanic(mech)}
                className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-orange-500 transition-all group active:scale-95"
              >
                 <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                    <Wrench className="w-6 h-6" />
                 </div>
                 <div className="text-left">
                    <p className="text-sm font-black text-slate-800 uppercase">{mech.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available</p>
                 </div>
              </button>
            ))}
            {mechanics.length === 0 && (
               <div className="col-span-full text-center p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <p className="text-xs font-bold text-slate-400 uppercase">No mechanics found. Admin must add staff records first.</p>
               </div>
            )}
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500 max-w-lg mx-auto">
      <header className="px-1 flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Workshop Board</h2>
           <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logged in as <span className="text-slate-900">{selectedMechanic.name}</span></p>
           </div>
        </div>
        <button onClick={() => { setSelectedMechanic(null); localStorage.removeItem('sbs_active_mechanic'); }} className="p-2 bg-slate-100 rounded-xl text-slate-400 active:scale-90 transition-transform">
           <User className="w-5 h-5" />
        </button>
      </header>

      {/* NEW: Quick Action Buttons Grid */}
      <div className="grid grid-cols-3 gap-3 px-1">
        <QuickActionButton 
          icon={<Package className="w-5 h-5" />} 
          label="Check Parts" 
          onClick={() => onNavigate('items')} 
          color="bg-blue-600"
        />
        <QuickActionButton 
          icon={<Plus className="w-5 h-5" />} 
          label="Start Job" 
          onClick={() => { setActiveTab('pool'); window.scrollTo({ top: 300, behavior: 'smooth' }); }} 
          color="bg-orange-600"
        />
        <QuickActionButton 
          icon={<Settings2 className="w-5 h-5" />} 
          label="Update Status" 
          onClick={() => { if (myJobs.length > 0) setUpdatingJobId(myJobs[0].id); else alert("No active tasks to update."); }} 
          color="bg-slate-900"
        />
      </div>

      {/* Segmented Controller */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 mx-1 border border-slate-200">
        <button 
          onClick={() => setActiveTab('pool')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            activeTab === 'pool' ? 'bg-white text-orange-600 shadow-sm border border-orange-100' : 'text-slate-400'
          }`}
        >
          <ClipboardList className="w-4 h-4" /> Open Pool ({poolJobs.length})
        </button>
        <button 
          onClick={() => setActiveTab('mine')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            activeTab === 'mine' ? 'bg-white text-blue-600 shadow-sm border border-blue-100' : 'text-slate-400'
          }`}
        >
          <Play className="w-4 h-4" /> My Tasks ({myJobs.length})
        </button>
      </div>

      <div className="space-y-4 px-1">
         {loading && !updatingJobId ? (
            <div className="py-20 flex flex-col items-center gap-4">
               <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Updating board...</p>
            </div>
         ) : activeTab === 'pool' ? (
            poolJobs.length > 0 ? poolJobs.map(job => (
               <JobCard key={job.id} job={job} actionLabel="Pick & Start" onAction={() => handlePickJob(job.id)} />
            )) : <NoTasks message="No new jobs in the open pool" icon={<CheckCircle2 />} />
         ) : (
            myJobs.length > 0 ? myJobs.map(job => (
               <JobCard 
                 key={job.id} 
                 job={job} 
                 isActive 
                 actionLabel="Finish Work" 
                 onAction={() => handleCompleteJob(job.id)} 
                 onUpdateStatus={() => setUpdatingJobId(job.id)}
               />
            )) : <NoTasks message="You have no active tasks" icon={<Hammer />} />
         )}
      </div>

      {/* Status Update Modal */}
      {updatingJobId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
           <div className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Update Progress</h3>
                 <button onClick={() => setUpdatingJobId(null)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 space-y-4">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-4">Select current stage for {(complaints.find(c => c.id === updatingJobId) as any)?.bikeNumber}</p>
                 <div className="grid grid-cols-1 gap-3">
                    <StatusOption label="Cleaning & Wash" icon={<Zap className="w-4 h-4" />} onClick={() => handleQuickStatusUpdate(updatingJobId, ComplaintStatus.IN_PROGRESS)} />
                    <StatusOption label="Engine / Mechanical" icon={<Wrench className="w-4 h-4" />} onClick={() => handleQuickStatusUpdate(updatingJobId, ComplaintStatus.IN_PROGRESS)} />
                    <StatusOption label="Electricals Check" icon={<History className="w-4 h-4" />} onClick={() => handleQuickStatusUpdate(updatingJobId, ComplaintStatus.IN_PROGRESS)} />
                    <StatusOption label="Waiting for Parts" icon={<AlertCircle className="w-4 h-4 text-amber-500" />} onClick={() => handleQuickStatusUpdate(updatingJobId, ComplaintStatus.PENDING)} />
                    <StatusOption label="Ready for QC" icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />} onClick={() => handleQuickStatusUpdate(updatingJobId, ComplaintStatus.IN_PROGRESS)} />
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Quick Links Fixed Footer */}
      <div className="fixed bottom-24 left-0 right-0 flex justify-center pointer-events-none z-10 px-6">
        <div className="pointer-events-auto bg-slate-900 p-2 rounded-2xl flex gap-2 shadow-2xl border border-white/10">
           <QuickWorkshopBtn icon={<Package />} label="Parts" onClick={() => onNavigate('items')} />
           <QuickWorkshopBtn icon={<MessageSquare />} label="Chat" onClick={() => onNavigate('connect')} />
        </div>
      </div>
    </div>
  );
};

const QuickActionButton: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void, color: string }> = ({ icon, label, onClick, color }) => (
  <button 
    onClick={onClick}
    className={`${color} text-white p-4 rounded-[28px] shadow-lg flex flex-col items-center justify-center gap-2 group active:scale-95 transition-all`}
  >
    <div className="p-2 bg-white/20 rounded-xl group-hover:scale-110 transition-transform">{icon}</div>
    <span className="text-[9px] font-black uppercase tracking-widest leading-none text-center">{label}</span>
  </button>
);

const StatusOption: React.FC<{ label: string, icon: React.ReactNode, onClick: () => void }> = ({ label, icon, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between hover:border-blue-500 hover:bg-blue-50 transition-all group"
  >
     <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm">{icon}</div>
        <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{label}</span>
     </div>
     <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
  </button>
);

const JobCard: React.FC<{ 
  job: Complaint, 
  actionLabel: string, 
  onAction: () => void, 
  isActive?: boolean,
  onUpdateStatus?: () => void
}> = ({ job, actionLabel, onAction, isActive, onUpdateStatus }) => (
  <div className={`bg-white rounded-[32px] border ${isActive ? 'border-blue-200 ring-4 ring-blue-500/5' : 'border-slate-100'} shadow-sm overflow-hidden animate-in slide-in-from-bottom-2`}>
     <div className="p-6">
        <div className="flex justify-between items-start mb-4">
           <div>
              <div className="flex items-center gap-2 mb-1">
                 <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase">{job.bikeNumber}</span>
                 <span className="text-[8px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded"># {job.id.slice(-4)}</span>
              </div>
              <h3 className="text-sm font-black text-slate-800 uppercase">{job.customerName}</h3>
           </div>
           {isActive && (
              <button 
                onClick={onUpdateStatus}
                className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
              >
                 <Settings2 className="w-5 h-5" />
              </button>
           )}
           {!isActive && (
              <div className="text-right">
                 <p className="text-xs font-black text-orange-600 tracking-tight">₹{job.estimatedCost.toLocaleString()}</p>
                 <p className="text-[8px] font-bold text-slate-300 uppercase">Budget</p>
              </div>
           )}
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
           <p className="text-xs font-bold text-slate-600 italic leading-relaxed">"{job.details}"</p>
        </div>

        <div className="flex items-center justify-between mb-4">
           <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {job.photoUrls.slice(0,3).map((url, i) => (
                 <img key={i} src={url} className="w-12 h-12 rounded-xl object-cover border border-slate-200" alt="bike" />
              ))}
              {job.photoUrls.length > 3 && (
                 <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                    +{job.photoUrls.length - 3}
                 </div>
              )}
           </div>
           {isActive && (
             <div className="text-right">
                 <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">In Progress</p>
                 <p className="text-lg font-black text-slate-900 tracking-tight">₹{job.estimatedCost.toLocaleString()}</p>
             </div>
           )}
        </div>

        <button 
          onClick={onAction}
          className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-3 active:scale-95 ${
            isActive ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-orange-600 text-white shadow-orange-500/20'
          }`}
        >
          {isActive ? <CheckCircle className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {actionLabel}
        </button>
     </div>
  </div>
);

const NoTasks: React.FC<{ message: string, icon: React.ReactNode }> = ({ message, icon }) => (
  <div className="py-32 text-center space-y-4">
     <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
        {React.cloneElement(icon as React.ReactElement, { className: "w-8 h-8" })}
     </div>
     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{message}</p>
  </div>
);

const QuickWorkshopBtn: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center p-3 gap-1 hover:bg-white/10 rounded-xl transition-colors group">
     <div className="text-white opacity-80 group-hover:opacity-100">
        {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
     </div>
     <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight">{label}</span>
  </button>
);

export default EmployeePanel;
