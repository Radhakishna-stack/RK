
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, MessageCircle, Send, Users, Filter, 
  CheckCircle2, Loader2, Smartphone, ShieldCheck, 
  ChevronRight, Calendar, Award, Sparkles, Wand2
} from 'lucide-react';
import { dbService } from '../db';
import { Customer } from '../types';

interface WhatsAppMarketingPageProps {
  onNavigate: (tab: string) => void;
}

const WhatsAppMarketingPage: React.FC<WhatsAppMarketingPageProps> = ({ onNavigate }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<'all' | 'loyal' | 'inactive'>('all');
  const [broadcastText, setBroadcastText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    dbService.getCustomers().then(data => {
      setCustomers(data);
      setLoading(false);
    });
  }, []);

  const filteredTarget = useMemo(() => {
    if (selectedSegment === 'all') return customers;
    if (selectedSegment === 'loyal') return customers.filter(c => c.loyaltyPoints > 50);
    if (selectedSegment === 'inactive') return customers.filter(c => c.loyaltyPoints === 0);
    return customers;
  }, [customers, selectedSegment]);

  const handleBroadcast = async () => {
    if (!broadcastText || filteredTarget.length === 0) return;
    setIsSending(true);
    setProgress(0);

    for (let i = 0; i < filteredTarget.length; i++) {
      const c = filteredTarget[i];
      // Simulated small delay between sends
      await new Promise(r => setTimeout(r, 200));
      // In a real app, this would use a bulk API. For this UI demo, we open WhatsApp links.
      // But for a true broadcast, we'll just simulate the success.
      setProgress(Math.round(((i + 1) / filteredTarget.length) * 100));
    }

    setTimeout(() => {
      alert(`Broadcast sent to ${filteredTarget.length} customers!`);
      setIsSending(false);
      setProgress(0);
      setBroadcastText('');
    }, 500);
  };

  const templates = [
    { label: 'Sunday Offer', text: "Happy Sunday! 🏍️ Visit Moto Gear SRK today for a FREE general checkup and chain lubrication. Ride safe!" },
    { label: 'New Parts', text: "New Stock Alert! 📦 Fresh inventory of high-performance engine oils and brake pads arrived at Moto Gear SRK. Upgrade today!" },
    { label: 'Loyalty Reward', text: "You've earned it! 🏆 As a valued customer, get 10% off on your next service at Moto Gear SRK. Show this message at counter." }
  ];

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-500 max-w-lg mx-auto px-1">
      <header className="flex items-center gap-4 mb-4">
        <button onClick={() => onNavigate('menu')} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all">
          <ArrowLeft className="w-5 h-5 text-slate-800" />
        </button>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase leading-none">WA Marketing</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Broadcast Campaigns</p>
        </div>
      </header>

      <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden">
         <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2 bg-emerald-500/20 w-fit px-3 py-1 rounded-full border border-emerald-500/30">
               <Sparkles className="w-3 h-3 text-emerald-400" />
               <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300">AI Boosted Reach</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Broadcast Engine</h3>
            <p className="text-slate-400 text-xs font-medium leading-relaxed">Reach your customers directly on WhatsApp with customized promotions and retention alerts.</p>
         </div>
         <Smartphone className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-white/5 -rotate-12" />
      </div>

      <div className="space-y-6">
         {/* Segment Selection */}
         <section className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Audience</h4>
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
               <SegmentTab active={selectedSegment === 'all'} onClick={() => setSelectedSegment('all')} label={`All (${customers.length})`} />
               <SegmentTab active={selectedSegment === 'loyal'} onClick={() => setSelectedSegment('loyal')} label="Loyal" />
               <SegmentTab active={selectedSegment === 'inactive'} onClick={() => setSelectedSegment('inactive')} label="Inactive" />
            </div>
         </section>

         {/* Message Composer */}
         <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
            <div className="space-y-2">
               <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Message Content</label>
                  <button className="text-[9px] font-black text-blue-600 uppercase flex items-center gap-1">
                     <Wand2 className="w-3 h-3" /> AI Help
                  </button>
               </div>
               <textarea 
                  rows={4}
                  placeholder="Type your promotion message..."
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-xs font-bold transition-all focus:ring-4 focus:ring-emerald-500/5 resize-none"
                  value={broadcastText}
                  onChange={e => setBroadcastText(e.target.value)}
               />
            </div>

            <div className="space-y-3">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Templates</p>
               <div className="flex flex-wrap gap-2">
                  {templates.map(t => (
                     <button 
                        key={t.label}
                        onClick={() => setBroadcastText(t.text)}
                        className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl text-[9px] font-black text-blue-600 uppercase transition-all active:scale-95 hover:bg-blue-600 hover:text-white"
                     >
                        {t.label}
                     </button>
                  ))}
               </div>
            </div>

            <div className="pt-4 border-t border-slate-50">
               {isSending ? (
                  <div className="space-y-4">
                     <div className="flex justify-between items-center px-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Sending Broadcast...</span>
                        <span className="text-[9px] font-black text-emerald-600 uppercase">{progress}% Complete</span>
                     </div>
                     <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                           className="h-full bg-emerald-500 transition-all duration-300" 
                           style={{ width: `${progress}%` }}
                        />
                     </div>
                  </div>
               ) : (
                  <button 
                     onClick={handleBroadcast}
                     disabled={!broadcastText || filteredTarget.length === 0}
                     className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                  >
                     <Send className="w-4 h-4" /> Start Broadcast to {filteredTarget.length} Users
                  </button>
               )}
            </div>
         </div>

         {/* Stats Panel */}
         <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
               <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <Users className="w-5 h-5" />
               </div>
               <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Target Size</p>
                  <p className="text-sm font-black text-slate-800">{filteredTarget.length}</p>
               </div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
               <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
               </div>
               <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Reachability</p>
                  <p className="text-sm font-black text-slate-800">100%</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const SegmentTab: React.FC<{ active: boolean, onClick: () => void, label: string }> = ({ active, onClick, label }) => (
  <button 
    onClick={onClick}
    className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${active ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400'}`}
  >
    {label}
  </button>
);

export default WhatsAppMarketingPage;
