
import React, { useState } from 'react';
import { 
  MapPin, Download, Trash2, Database, Users, Bike, Map as MapIcon, 
  Settings, RefreshCcw, FileJson, LogOut, CheckCircle
} from 'lucide-react';

const UtilitiesPage: React.FC = () => {
  const [trackingActive, setTrackingActive] = useState(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  const handleBackup = () => {
    setBackupStatus('processing');
    setTimeout(() => {
      const data = { 
        customers: localStorage.getItem('bp_customers'),
        invoices: localStorage.getItem('bp_invoices'),
        timestamp: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bikeservice-backup-${new Date().toISOString()}.json`;
      a.click();
      setBackupStatus('complete');
    }, 1500);
  };

  const toggleTracking = () => {
    if (!trackingActive) {
      navigator.geolocation.getCurrentPosition((pos) => {
        alert(`Location shared: ${pos.coords.latitude}, ${pos.coords.longitude}`);
        setTrackingActive(true);
      });
    } else {
      setTrackingActive(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">System Utilities</h2>
        <p className="text-slate-500">Admin tools and data maintenance</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Backup & Data */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Database className="w-6 h-6" /></div>
            <h3 className="text-xl font-bold">Data Control</h3>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">Secure your business data with encrypted local backups or export to Tally ERP format.</p>
          <div className="space-y-3 pt-4">
            <UtilButton label="Full Backup (JSON)" icon={<Download className="w-4 h-4" />} onClick={handleBackup} loading={backupStatus === 'processing'} />
            <UtilButton label="Export to Tally XML" icon={<FileJson className="w-4 h-4" />} onClick={() => {}} />
          </div>
          {backupStatus === 'complete' && (
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold bg-emerald-50 p-2 rounded-lg">
               <CheckCircle className="w-3 h-3" /> Backup saved successfully
            </div>
          )}
        </div>

        {/* Location Tracking */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><MapPin className="w-6 h-6" /></div>
            <h3 className="text-xl font-bold">Geo Tracking</h3>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">Real-time tracking of field employees and customer pick-up locations for better logistics.</p>
          <div className="space-y-3 pt-4">
            <button 
              onClick={toggleTracking}
              className={`w-full p-4 rounded-2xl font-bold flex items-center justify-between transition-all ${
                trackingActive ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <MapIcon className="w-4 h-4" />
                {trackingActive ? 'Tracking Active' : 'Start Employee Tracking'}
              </div>
              <div className={`w-2 h-2 rounded-full ${trackingActive ? 'bg-white animate-pulse' : 'bg-slate-300'}`}></div>
            </button>
            <UtilButton label="View Tracking Map" icon={<MapPin className="w-4 h-4" />} onClick={() => {}} />
          </div>
        </div>

        {/* Maintenance */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><RefreshCcw className="w-6 h-6" /></div>
            <h3 className="text-xl font-bold">Maintenance</h3>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">Recycle bin for soft-deleted job cards and bulk update tools for items and parties.</p>
          <div className="space-y-3 pt-4">
            <UtilButton label="Recycle Bin (12 Items)" icon={<Trash2 className="w-4 h-4" />} onClick={() => {}} />
            <UtilButton label="Bulk Party Update" icon={<Users className="w-4 h-4" />} onClick={() => {}} />
            <UtilButton label="Bulk Stock Price Update" icon={<Bike className="w-4 h-4" />} onClick={() => {}} />
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-3xl p-12 text-center text-white relative overflow-hidden">
         <div className="relative z-10">
           <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">Ready for Mobile Integration?</h3>
           <p className="text-slate-400 max-w-lg mx-auto mb-8 font-medium">Your current setup is fully modular and scalable. Connect our upcoming Android/iOS app to this same spreadsheet anytime.</p>
           <button className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-400 hover:text-white transition-all">
             Contact for Mobile App
           </button>
         </div>
         <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="grid grid-cols-12 gap-1 h-full">
               {Array.from({length: 144}).map((_, i) => <div key={i} className="border border-white/10"></div>)}
            </div>
         </div>
      </div>
    </div>
  );
};

const UtilButton: React.FC<{ label: string, icon: React.ReactNode, onClick: () => void, loading?: boolean }> = ({ label, icon, onClick, loading }) => (
  <button 
    onClick={onClick}
    disabled={loading}
    className="w-full p-4 bg-slate-50 text-slate-600 rounded-2xl font-bold text-sm flex items-center gap-3 border border-slate-200 hover:bg-slate-100 transition-all disabled:opacity-50"
  >
    {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : icon}
    {label}
  </button>
);

export default UtilitiesPage;
