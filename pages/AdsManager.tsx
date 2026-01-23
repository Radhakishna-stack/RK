
import React, { useState } from 'react';
import { Sparkles, Megaphone, Share2, Target, TrendingUp, Loader2, RefreshCw, Image as ImageIcon, Download, Copy, Check, Bike, Gauge, Wrench } from 'lucide-react';
import { dbService } from '../db';
import { AdSuggestion } from '../types';

const AdsManagerPage: React.FC = () => {
  const [suggestions, setSuggestions] = useState<AdSuggestion[]>([]);
  const [adImages, setAdImages] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingImages, setLoadingImages] = useState<Record<number, boolean>>({});

  const generateAds = async () => {
    setLoading(true);
    setSuggestions([]);
    setAdImages({});
    try {
      const ads = await dbService.getAdSuggestions("MOTO GEAR SRK");
      setSuggestions(ads);
      
      // Auto-generate images for each suggestion
      ads.forEach((ad, idx) => {
        generateImageForAd(idx, ad.headline);
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateImageForAd = async (index: number, prompt: string) => {
    setLoadingImages(prev => ({ ...prev, [index]: true }));
    try {
      const imageUrl = await dbService.generateAdImage(prompt);
      setAdImages(prev => ({ ...prev, [index]: imageUrl }));
    } catch (err) {
      console.error("Image generation failed:", err);
    } finally {
      setLoadingImages(prev => ({ ...prev, [index]: false }));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24 px-1 max-w-lg mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tighter uppercase leading-none">
            Rider Ads <Megaphone className="w-8 h-8 text-blue-600" />
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-80">Motorcycle Marketing Hub</p>
        </div>
        <button 
          onClick={generateAds}
          disabled={loading}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-slate-800 shadow-2xl active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          Refresh Campaigns
        </button>
      </header>

      {suggestions.length > 0 ? (
        <div className="space-y-10">
          {suggestions.map((ad, idx) => (
            <div key={idx} className="bg-white rounded-[48px] border border-slate-100 shadow-xl overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-500">
              {/* Image Preview */}
              <div className="aspect-[4/3] relative bg-slate-100 overflow-hidden">
                 {loadingImages[idx] ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-50">
                       <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Forging Visual...</p>
                    </div>
                 ) : adImages[idx] ? (
                    <>
                       <img src={adImages[idx]} alt="Motorbike Ad" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-8">
                          <button onClick={() => window.open(adImages[idx])} className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl border border-white/20 flex items-center gap-2 text-[10px] font-black uppercase">
                             <Download className="w-4 h-4" /> Save Creative
                          </button>
                       </div>
                    </>
                 ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-300">
                       <ImageIcon className="w-12 h-12" />
                       <button onClick={() => generateImageForAd(idx, ad.headline)} className="text-[9px] font-black uppercase underline tracking-widest">Retry Render</button>
                    </div>
                 )}
                 <div className="absolute top-6 right-6 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl border border-blue-400">
                    <Target className="w-3.5 h-3.5 fill-white" /> {ad.platform}
                 </div>
              </div>

              <div className="p-8 flex-1 space-y-6">
                 <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Technical Proposal</span>
                 </div>
                 
                 <div>
                   <h4 className="text-2xl font-black text-slate-900 mb-2 leading-tight uppercase tracking-tight">{ad.headline}</h4>
                   <p className="text-slate-600 text-sm font-medium leading-relaxed italic border-l-4 border-blue-500 pl-4 bg-slate-50 py-3 rounded-r-xl">"{ad.copy}"</p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100/50">
                       <p className="text-[9px] font-black uppercase text-blue-400 mb-1">Audience</p>
                       <p className="text-[10px] font-bold text-blue-900 leading-tight">{ad.targetAudience}</p>
                    </div>
                    <div className="bg-amber-50/50 p-4 rounded-3xl border border-amber-100/50">
                       <p className="text-[9px] font-black uppercase text-amber-500 mb-1">AI Score</p>
                       <p className="text-[10px] font-bold text-amber-900 leading-tight">High Engagement</p>
                    </div>
                 </div>

                 <div className="p-5 bg-slate-900 rounded-[32px] text-white space-y-2">
                    <div className="flex items-center gap-2 opacity-60">
                       <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                       <p className="text-[9px] font-black uppercase tracking-widest">System Reasoning</p>
                    </div>
                    <p className="text-[11px] text-slate-300 font-medium leading-relaxed">{ad.estimatedPerformance}</p>
                 </div>
              </div>

              <div className="p-8 pt-0 flex gap-3">
                 <button className="flex-1 bg-slate-50 text-slate-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-100 active:scale-95">
                    <Copy className="w-4 h-4" /> Copy Text
                 </button>
                 <button className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 active:scale-95">
                    <Share2 className="w-4 h-4" /> Launch Campaign
                 </button>
              </div>
            </div>
          ))}
        </div>
      ) : !loading && (
        <div className="bg-white p-12 py-24 rounded-[56px] border border-slate-100 shadow-sm text-center space-y-8">
           <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[40px] flex items-center justify-center mx-auto shadow-inner relative">
              <Sparkles className="w-12 h-12 fill-blue-600" />
              <div className="absolute -top-2 -right-2 bg-slate-900 p-2 rounded-xl text-white shadow-lg">
                 <Bike className="w-4 h-4" />
              </div>
           </div>
           <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Automated Ad Lab</h3>
              <p className="text-slate-400 font-medium text-sm px-6">Generate high-octane marketing campaigns for your bike service business in seconds.</p>
           </div>
           <button onClick={generateAds} className="bg-slate-900 text-white px-10 py-5 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">Start Ad Engine</button>
        </div>
      )}

      {loading && (
        <div className="py-40 flex flex-col items-center justify-center gap-10 text-center">
           <div className="relative">
              <div className="w-32 h-32 bg-blue-600/10 rounded-full blur-[60px] absolute inset-0 animate-pulse"></div>
              <Loader2 className="w-16 h-16 animate-spin text-blue-600 relative" />
           </div>
           <div className="space-y-3">
              <p className="text-xl font-black tracking-tight text-slate-900 uppercase">Consulting AI Strategists...</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] animate-pulse">Analyzing regional rider trends</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdsManagerPage;
