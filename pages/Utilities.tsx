
import React, { useState, useMemo } from 'react';
import { 
  MapPin, Download, Trash2, Database, Users, Bike, Map as MapIcon, 
  Settings, RefreshCcw, FileJson, LogOut, CheckCircle, Store, 
  UserCheck, Barcode, ArrowDownToLine, ExternalLink, ChevronRight, 
  Zap, Info, Search, AlertCircle, FileSpreadsheet, Sparkles, Navigation, Globe
} from 'lucide-react';
import { dbService } from '../db';

interface UtilitiesPageProps {
  onNavigate: (tab: string) => void;
}

const UtilitiesPage: React.FC<UtilitiesPageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'data' | 'ops'>('all');
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  const handleBackup = () => {
    setBackupStatus('processing');
    setTimeout(() => {
      setBackupStatus('complete');
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500 max-w-lg mx-auto">
      {/* Header with Data Health Status */}
      <header className="px-1">
        <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">System Utilities</h2>
        <div className="mt-3 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                 <Zap className="w-5 h-5 fill-emerald-600" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database Health</p>
                 <p className="text-xs font-bold text-slate-700">All Systems Optimized</p>
              </div>
           </div>
           <button className="text-blue-600 text-[10px] font-black uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-full">
             Verify
           </button>
        </div>
      </header>

      {/* Segmented Controller */}
      <div className="bg-slate-100/50 p-1.5 rounded-2xl flex gap-1 border border-slate-100 mx-1">
        <button 
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'
          }`}
        >
          All Tools
        </button>
        <button 
          onClick={() => setActiveTab('data')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'data' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'
          }`}
        >
          Data Migration
        </button>
        <button 
          onClick={() => setActiveTab('ops')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'ops' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'
          }`}
        >
          Operations
        </button>
      </div>

      <div className="space-y-8">
        {/* Business Setup Group */}
        {(activeTab === 'all' || activeTab === 'ops') && (
          <section className="space-y-4">
             <SectionTitle title="Business Setup & Access" />
             <div className="grid grid-cols-3 gap-6">
                <UtilGridItem icon={<Store />} label="Set Up My Business" onClick={() => {}} color="blue" />
                <UtilGridItem icon={<UserCheck />} label="Accountant Access" onClick={() => {}} color="indigo" />
                <UtilGridItem icon={<MapPin />} label="Track Salesmen" onClick={() => onNavigate('salesmen')} color="emerald" hasActivity />
             </div>
          </section>
        )}

        {/* Market Analysis Group - Enhanced with Google Maps Grounding */}
        {(activeTab === 'all' || activeTab === 'ops') && (
          <section className="space-y-4">
             <SectionTitle title="Market Intelligence (AI Maps)" />
             <div className="grid grid-cols-3 gap-6">
                <UtilGridItem 
                  icon={<Navigation />} 
                  label="Market Explorer" 
                  onClick={() => onNavigate('market_explorer')} 
                  color="blue" 
                  isAIPowered 
                />
                <UtilGridItem 
                   icon={<Globe />} 
                   label="Nearby Suppliers" 
                   onClick={() => onNavigate('market_explorer')} 
                   color="indigo" 
                   isAIPowered
                />
                <UtilGridItem 
                   icon={<Search />} 
                   label="Competitor Watch" 
                   onClick={() => onNavigate('market_explorer')} 
                   color="red" 
                   isAIPowered
                />
             </div>
          </section>
        )}

        {/* Data Migration Group */}
        {(activeTab === 'all' || activeTab === 'data') && (
          <section className="space-y-4">
             <SectionTitle title="Data Migration" />
             <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                <div className="grid grid-cols-3 gap-6">
                   <UtilGridItem icon={<ArrowDownToLine />} label="Import Items" onClick={() => {}} color="blue" />
                   <UtilGridItem icon={<Users />} label="Import Parties" onClick={() => {}} color="blue" />
                   <UtilGridItem icon={<FileJson />} label="Import From Tally" onClick={() => {}} color="indigo" isAIPowered />
                </div>
                <div className="h-px bg-slate-50"></div>
                <div className="grid grid-cols-3 gap-6">
                   <UtilGridItem icon={<ExternalLink />} label="Exports to Tally" onClick={() => {}} color="indigo" />
                   <UtilGridItem icon={<FileSpreadsheet />} label="Bulk Export" onClick={() => {}} color="slate" />
                   <UtilGridItem icon={<RefreshCcw />} label="Update Bulk" onClick={() => {}} color="amber" />
                </div>
             </div>
          </section>
        )}

        {/* Operations Power Tools */}
        {(activeTab === 'all' || activeTab === 'ops') && (
          <section className="space-y-4">
             <SectionTitle title="Inventory Power Tools" />
             <div className="grid grid-cols-3 gap-6">
                <UtilGridItem icon={<Barcode />} label="Barcode Generator" onClick={() => {}} color="slate" />
                <UtilGridItem icon={<RefreshCcw />} label="Sync Data" onClick={() => {}} color="blue" />
                <UtilGridItem icon={<Trash2 />} label="Recycle Bin" onClick={() => {}} color="red" />
             </div>
          </section>
        )}
      </div>

      {/* AI Assistance Promo Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-[32px] p-6 text-white shadow-xl shadow-slate-900/10">
         <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
               <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-black uppercase tracking-widest">Market Maps</h3>
               </div>
               <p className="text-[10px] text-slate-400 max-w-[180px]">New: Explore local suppliers and competitors with Maps Grounding.</p>
            </div>
            <button onClick={() => onNavigate('market_explorer')} className="bg-white text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
               Explore
            </button>
         </div>
         <div className="absolute right-[-20px] top-[-20px] opacity-10">
            <Database className="w-32 h-32" />
         </div>
      </div>

      {/* Footer System Info */}
      <div className="text-center py-6">
         <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Session ID: SBS-UT-88219 • Build v3.5</p>
      </div>
    </div>
  );
};

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center justify-between px-1">
    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</h4>
    <div className="h-px bg-slate-100 flex-1 ml-4"></div>
  </div>
);

const UtilGridItem: React.FC<{ 
  icon: React.ReactNode, 
  label: string, 
  onClick: () => void, 
  color?: string, 
  isAIPowered?: boolean,
  hasActivity?: boolean
}> = ({ icon, label, onClick, color = 'blue', isAIPowered, hasActivity }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    red: 'bg-red-50 text-red-600 border-red-100',
  };

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-3 group active:scale-95 transition-all">
      <div className={`relative w-16 h-16 rounded-[22px] border ${colorMap[color]} flex items-center justify-center transition-all group-hover:shadow-md group-hover:bg-opacity-80`}>
        {React.cloneElement(icon as React.ReactElement<any>, { className: "w-7 h-7 stroke-[1.5]" })}
        
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-white rounded-full border border-slate-100"></div>
        
        {isAIPowered && (
          <div className="absolute -top-1 -right-1 bg-blue-600 p-1 rounded-full text-white shadow-lg border border-white">
            <Sparkles className="w-2.5 h-2.5 fill-white" />
          </div>
        )}
        {hasActivity && (
          <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
        )}
      </div>
      <span className="text-[9px] font-black text-slate-600 uppercase tracking-tight text-center leading-tight max-w-[64px]">
        {label}
      </span>
    </button>
  );
};

export default UtilitiesPage;
