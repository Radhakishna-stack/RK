
import React, { useState } from 'react';
import { Sparkles, Megaphone, Share2, Target, TrendingUp, Loader2, RefreshCw } from 'lucide-react';
import { dbService } from '../db';
import { AdSuggestion } from '../types';

const AdsManagerPage: React.FC = () => {
  const [suggestions, setSuggestions] = useState<AdSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const generateAds = async () => {
    setLoading(true);
    const ads = await dbService.getAdSuggestions("BikeService Pro");
    setSuggestions(ads);
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            AI Ads Manager <Sparkles className="w-8 h-8 text-indigo-500" />
          </h2>
          <p className="text-slate-500">Intelligent marketing suggestions to grow your business</p>
        </div>
        <button 
          onClick={generateAds}
          disabled={loading}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          Generate Ad Ideas
        </button>
      </header>

      {suggestions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {suggestions.map((ad, idx) => (
            <div key={idx} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">{ad.platform}</span>
                 </div>
                 <Target className="w-4 h-4 text-slate-300" />
              </div>
              <div className="p-8 flex-1 space-y-6">
                 <div>
                   <h4 className="text-xl font-bold text-slate-900 mb-2">{ad.headline}</h4>
                   <p className="text-slate-600 text-sm leading-relaxed">{ad.copy}</p>
                 </div>
                 <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase mb-2 tracking-widest flex items-center gap-1">
                       <TrendingUp className="w-3 h-3" /> Performance Reasoning
                    </p>
                    <p className="text-xs text-indigo-900 font-medium italic">"{ad.estimatedPerformance}"</p>
                 </div>
              </div>
              <div className="p-6 pt-0">
                 <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                    <Share2 className="w-4 h-4" /> Share to Platform
                 </button>
              </div>
            </div>
          ))}
        </div>
      ) : !loading && (
        <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-4">
           <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8" />
           </div>
           <h3 className="text-xl font-bold text-slate-900">Let AI Write Your Ads</h3>
           <p className="text-slate-500 max-w-sm mx-auto">Our AI analyzes local bike service trends to generate high-converting ads for your shop.</p>
           <button onClick={generateAds} className="text-indigo-600 font-bold hover:underline">Get started now</button>
        </div>
      )}

      {loading && (
        <div className="py-40 flex flex-col items-center justify-center gap-4 text-slate-400">
           <Loader2 className="w-12 h-12 animate-spin" />
           <p className="font-bold text-lg">AI is thinking about your business growth...</p>
        </div>
      )}
    </div>
  );
};

export default AdsManagerPage;
