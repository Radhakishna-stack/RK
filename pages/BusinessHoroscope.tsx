
import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowLeft, RefreshCw, Loader2, Star, Moon, Sun, Wand2 } from 'lucide-react';
import { dbService } from '../db';

const BusinessHoroscope: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchHoroscope = async () => {
    setLoading(true);
    try {
      const res = await dbService.getBusinessHoroscope("SRK BIKE SERVICE");
      setInsight(res);
    } catch (err) {
      setInsight("Your business gears are perfectly aligned. Great customer reviews are heading your way!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoroscope();
  }, []);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col animate-in fade-in duration-700">
      <header className="p-4 flex items-center justify-between sticky top-0 bg-[#0F172A]/80 backdrop-blur-md z-10 border-b border-white/5">
         <button onClick={() => onNavigate('menu')} className="p-2 bg-white/5 rounded-full">
            <ArrowLeft className="w-6 h-6" />
         </button>
         <h1 className="text-sm font-black uppercase tracking-[0.3em]">Smart Insights</h1>
         <div className="w-10 h-10"></div>
      </header>

      <div className="flex-1 p-8 flex flex-col items-center justify-center space-y-12">
         {/* Mystic UI Elements */}
         <div className="relative">
            <div className="w-32 h-32 bg-blue-600/20 rounded-full blur-[60px] absolute inset-0"></div>
            <div className="relative w-48 h-48 rounded-full border-2 border-white/10 flex items-center justify-center p-6 bg-white/5 backdrop-blur-3xl shadow-2xl shadow-blue-500/20">
               <div className="w-full h-full rounded-full border border-dashed border-white/20 flex items-center justify-center animate-[spin_20s_linear_infinite]">
                  <Star className="w-4 h-4 text-yellow-400 absolute top-0" />
                  <Moon className="w-4 h-4 text-blue-400 absolute right-0" />
                  <Sun className="w-4 h-4 text-orange-400 absolute bottom-0" />
                  <Sparkles className="w-4 h-4 text-indigo-400 absolute left-0" />
               </div>
               <div className="absolute inset-0 flex items-center justify-center">
                  <Wand2 className="w-16 h-16 text-white stroke-[1.5] drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
               </div>
            </div>
         </div>

         <div className="text-center space-y-6 max-w-sm">
            <h2 className="text-3xl font-black tracking-tight text-white uppercase">Daily Wisdom</h2>
            <div className="min-h-[120px] flex items-center justify-center">
               {loading ? (
                 <div className="flex flex-col items-center gap-4 text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Consulting the business stars...</p>
                 </div>
               ) : (
                 <p className="text-lg font-medium text-slate-300 leading-relaxed italic animate-in fade-in slide-in-from-bottom-2">
                   "{insight}"
                 </p>
               )}
            </div>
         </div>

         <button 
           onClick={fetchHoroscope}
           disabled={loading}
           className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
         >
           <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
           Recalibrate Insights
         </button>
      </div>

      <div className="p-8 text-center">
         <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest opacity-50">Powered by Gemini AI Engine</p>
      </div>
    </div>
  );
};

export default BusinessHoroscope;
