
import React, { useState } from 'react';
import { Wand2, ArrowLeft, Copy, Check, MessageCircle, Instagram, Facebook, Smartphone, Loader2, Sparkles } from 'lucide-react';
import { dbService } from '../db';

const MarketingTools: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ caption: string, tags: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const res = await dbService.generateMarketingContent(topic);
      setResult(res);
    } catch (err) {
      alert("AI is busy cleaning a carburettor. Try again later!");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(`${result.caption}\n\n${result.tags}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pb-24 animate-in fade-in duration-500">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => onNavigate('menu')} className="p-2 hover:bg-slate-100 rounded-full">
           <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Marketing Tools</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Social Media Command Center</p>
        </div>
      </header>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
           <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" /> What's the promotion?
           </h3>
           <textarea 
             placeholder="e.g. Free oil checkup this sunday, 20% off on chain sprockets..."
             className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-medium focus:ring-4 focus:ring-blue-500/5 transition-all resize-none h-24"
             value={topic}
             onChange={e => setTopic(e.target.value)}
           />
           <button 
             onClick={generate}
             disabled={loading || !topic}
             className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
           >
             {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
             Generate Smart Content
           </button>
        </div>

        {result && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
             <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex gap-2">
                      <Instagram className="w-5 h-5 text-pink-500" />
                      <Facebook className="w-5 h-5 text-blue-600" />
                   </div>
                   <button 
                     onClick={copyToClipboard}
                     className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full"
                   >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied' : 'Copy All'}
                   </button>
                </div>

                <div className="space-y-4">
                   <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      {result.caption}
                   </p>
                   <p className="text-xs text-blue-500 font-bold">
                      {result.tags}
                   </p>
                </div>

                <div className="pt-6 border-t border-slate-50 flex gap-4">
                   <button className="flex-1 bg-slate-50 py-3 rounded-xl flex flex-col items-center gap-1 group hover:bg-emerald-50 transition-colors">
                      <MessageCircle className="w-5 h-5 text-emerald-500" />
                      <span className="text-[8px] font-black uppercase text-slate-400 group-hover:text-emerald-600">Share SMS</span>
                   </button>
                   <button className="flex-1 bg-slate-50 py-3 rounded-xl flex flex-col items-center gap-1 group hover:bg-blue-50 transition-colors">
                      <Smartphone className="w-5 h-5 text-blue-500" />
                      <span className="text-[8px] font-black uppercase text-slate-400 group-hover:text-blue-600">WhatsApp</span>
                   </button>
                </div>
             </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[40px] text-white shadow-2xl shadow-indigo-500/20">
           <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Smart Ad Engine</h3>
           <p className="text-indigo-100 text-xs font-medium mb-6 opacity-80">Our AI analyzed your top inventory: <span className="font-black">ENGINE OIL</span>. Ready to run a discount ad?</p>
           <button onClick={() => onNavigate('ads')} className="bg-white text-indigo-700 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">Launch Smart Ad</button>
        </div>
      </div>
    </div>
  );
};

export default MarketingTools;
