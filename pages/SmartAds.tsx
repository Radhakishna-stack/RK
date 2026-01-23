
import React, { useState, useMemo } from 'react';
import { Sparkles, ArrowLeft, Target, Rocket, Zap, MessageCircle, Share2, Loader2, Image, Plus, CheckCircle2, Wand2, Star, Megaphone, ChevronRight, Bike, ShieldCheck, Gauge } from 'lucide-react';
import { dbService } from '../db';

interface SmartAdsPageProps {
  onNavigate: (tab: string) => void;
}

const SmartAdsPage: React.FC<SmartAdsPageProps> = ({ onNavigate }) => {
  const [goal, setGoal] = useState<'service' | 'performance' | 'loyalty' | 'restoration' | null>(null);
  const [loading, setLoading] = useState(false);
  const [adResult, setAdResult] = useState<{ headline: string, copy: string, image: string } | null>(null);

  const goals = [
    { id: 'service', label: 'Periodic Service Ads', icon: <Bike />, desc: 'Attract riders for regular maintenance & oil changes' },
    { id: 'performance', label: 'Tuning & Performance', icon: <Zap />, desc: 'Promote ECU remapping and computerized tuning' },
    { id: 'restoration', label: 'Bike Restoration', icon: <ShieldCheck />, desc: 'Target old bike owners for ceramic coating & parts refresh' },
    { id: 'loyalty', label: 'Retain High-End Riders', icon: <Star />, desc: 'Exclusive offers for premium motorbike owners' }
  ];

  const generateSmartAd = async (selectedGoal: any) => {
    setGoal(selectedGoal);
    setLoading(true);
    setAdResult(null);
    try {
      const topic = goals.find(g => g.id === selectedGoal)?.label || "Premium Bike Service";
      const marketing = await dbService.generateMarketingContent(topic);
      const image = await dbService.generateAdImage(topic);
      
      setAdResult({
        headline: topic.toUpperCase(),
        copy: marketing.caption,
        image: image
      });
    } catch (err) {
      alert("AI Engine is overheating. Please wait 60 seconds.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 animate-in fade-in duration-500 max-w-lg mx-auto px-1">
      <header className="flex items-center gap-4 mb-8 px-1">
        <button onClick={() => onNavigate('menu')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
           <ArrowLeft className="w-6 h-6 text-slate-800" />
        </button>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase leading-tight">Bike Ad Studio</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Performance Marketing</p>
        </div>
      </header>

      {!adResult && !loading && (
        <div className="space-y-6">
           <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden mb-8">
              <div className="relative z-10 space-y-4">
                 <div className="flex items-center gap-2 bg-blue-500/20 w-fit px-3 py-1 rounded-full border border-blue-500/30">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-300">Rider Targeted</span>
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-tight leading-none">Pick your mission</h3>
                 <p className="text-slate-400 text-sm font-medium">AI will generate a cinematic bike visual and technical sales copy.</p>
              </div>
              <Wand2 className="absolute right-[-20px] bottom-[-20px] w-48 h-48 text-white/5 -rotate-12" />
           </div>

           <div className="grid grid-cols-1 gap-4">
              {goals.map(g => (
                 <button 
                   key={g.id} 
                   onClick={() => generateSmartAd(g.id)}
                   className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group active:scale-95 transition-all hover:border-blue-200"
                 >
                    <div className="flex items-center gap-5 text-left">
                       <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          {React.cloneElement(g.icon as React.ReactElement<any>, { className: 'w-6 h-6 stroke-[2.5]' })}
                       </div>
                       <div>
                          <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">{g.label}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{g.desc}</p>
                       </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                 </button>
              ))}
           </div>
        </div>
      )}

      {loading && (
         <div className="py-40 flex flex-col items-center justify-center gap-10 text-center">
            <div className="relative">
               <div className="w-40 h-40 bg-blue-500/10 rounded-full blur-[80px] absolute inset-0 animate-pulse"></div>
               <div className="relative w-32 h-32 rounded-full border-4 border-slate-100 flex items-center justify-center">
                  <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
               </div>
               <Bike className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-600 animate-bounce" />
            </div>
            <div className="space-y-3">
               <h3 className="text-xl font-black uppercase tracking-widest text-slate-900">Rendering Pro Ads...</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] animate-pulse">Synthesizing Technical Visuals</p>
            </div>
         </div>
      )}

      {adResult && !loading && (
        <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500 pb-20">
           <div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl overflow-hidden flex flex-col">
              <div className="aspect-[4/5] relative bg-slate-900">
                 <img src={adResult.image} alt="Bike Ad Visual" className="w-full h-full object-cover opacity-90" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                 
                 <div className="absolute bottom-8 left-8 right-8 text-white space-y-4">
                    <div className="flex items-center gap-2 bg-blue-600 w-fit px-3 py-1 rounded-full">
                       <Gauge className="w-3 h-3 text-white fill-white" />
                       <span className="text-[8px] font-black uppercase tracking-widest">Performance Ready</span>
                    </div>
                    <h3 className="text-4xl font-black tracking-tighter uppercase leading-none drop-shadow-2xl">
                       {adResult.headline}
                    </h3>
                 </div>
              </div>

              <div className="p-8 space-y-8">
                 <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-3">Rider Hook Copy</p>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed italic">"{adResult.copy}"</p>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 p-5 rounded-[28px] border border-emerald-100">
                       <p className="text-[9px] font-black uppercase text-emerald-600 mb-1">Audience</p>
                       <p className="text-[11px] font-bold text-emerald-900 leading-tight">Local Bike Enthusiasts</p>
                    </div>
                    <div className="bg-blue-50 p-5 rounded-[28px] border border-blue-100">
                       <p className="text-[9px] font-black uppercase text-blue-600 mb-1">Network</p>
                       <p className="text-[11px] font-bold text-blue-900 leading-tight">Instagram Reels / FB</p>
                    </div>
                 </div>

                 <div className="flex gap-4">
                    <button 
                      onClick={() => setAdResult(null)}
                      className="flex-1 py-5 border border-slate-200 rounded-3xl font-black text-xs uppercase tracking-widest text-slate-400 active:scale-95 transition-all"
                    >
                       Back
                    </button>
                    <button className="flex-[2] py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
                       <Share2 className="w-5 h-5" /> Push to Ads
                    </button>
                 </div>
              </div>
           </div>

           <div className="bg-blue-600 p-8 rounded-[40px] text-white shadow-xl flex items-center justify-between">
              <div className="space-y-1">
                 <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-200" />
                    <h4 className="text-sm font-black uppercase tracking-widest">Mechanical Precision</h4>
                 </div>
                 <p className="text-[10px] text-blue-100 font-medium italic">"Every bolt tightened, every ad optimized."</p>
              </div>
              <button className="p-3 bg-white/20 rounded-2xl border border-white/20">
                 <Bike className="w-6 h-6 text-white" />
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default SmartAdsPage;
