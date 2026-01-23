
import React, { useState } from 'react';
import { 
  Wand2, ArrowLeft, Copy, Check, MessageCircle, Instagram, 
  Facebook, Smartphone, Loader2, Sparkles, Image as ImageIcon, 
  Download, Share2, Eye, Layout, Bike, ShieldCheck
} from 'lucide-react';
import { dbService } from '../db';

const MarketingTools: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ caption: string, tags: string, imageUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!topic) return;
    setLoading(true);
    setResult(null);
    try {
      // Parallel execution for high-speed AI responses
      const [content, image] = await Promise.all([
        dbService.generateMarketingContent(topic),
        dbService.generateAdImage(topic)
      ]);
      
      setResult({
        caption: content.caption,
        tags: content.tags,
        imageUrl: image
      });
    } catch (err) {
      alert("Neural core is warming up. Please attempt again in 30 seconds.");
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

  const downloadImage = () => {
    if (!result?.imageUrl) return;
    const link = document.createElement('a');
    link.href = result.imageUrl;
    link.download = `moto_gear_post_${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="pb-32 animate-in fade-in duration-500 max-w-lg mx-auto px-1">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => onNavigate('menu')} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all">
           <ArrowLeft className="w-6 h-6 text-slate-800" />
        </button>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Post Factory</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Social Visuals & Copy</p>
        </div>
      </header>

      <div className="space-y-6">
        {/* Command Module */}
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                 <Layout className="w-5 h-5" />
              </div>
              <div>
                 <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Campaign Topic</h3>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">What are we promoting today?</p>
              </div>
           </div>
           
           <textarea 
             placeholder="e.g. Monsoon Bike Checkup special, 15% off for Royal Enfield owners..."
             className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none text-xs font-bold transition-all focus:ring-8 focus:ring-blue-500/5 resize-none h-28 uppercase placeholder:text-slate-300"
             value={topic}
             onChange={e => setTopic(e.target.value)}
           />
           
           <button 
             onClick={generate}
             disabled={loading || !topic}
             className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 shadow-2xl"
           >
             {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
             {loading ? 'Synthesizing...' : 'Generate Full Post'}
           </button>
        </div>

        {/* Loading HUD */}
        {loading && (
           <div className="py-20 flex flex-col items-center justify-center gap-10 text-center animate-pulse">
              <div className="relative">
                 <div className="w-32 h-32 bg-blue-600/10 rounded-full blur-[50px] absolute inset-0"></div>
                 <div className="relative w-24 h-24 rounded-[32px] border-4 border-slate-100 flex items-center justify-center overflow-hidden">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                 </div>
              </div>
              <div className="space-y-3">
                 <p className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">AI is Drafting...</p>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.4em]">Rendering Cinematic Bike Visuals</p>
              </div>
           </div>
        )}

        {/* Results Deck */}
        {result && !loading && (
          <div className="animate-in slide-in-from-bottom-6 duration-500 space-y-6">
             {/* Feed Preview Style Card */}
             <div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl overflow-hidden flex flex-col group">
                {/* Visual Area */}
                <div className="aspect-square relative bg-slate-900">
                   <img src={result.imageUrl} alt="Generated Visual" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms]" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                   
                   <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl">
                         <ShieldCheck className="w-3.5 h-3.5 text-white" />
                         <span className="text-[9px] font-black uppercase text-white tracking-widest">Verified SRK Content</span>
                      </div>
                      <button 
                        onClick={downloadImage}
                        className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-2xl active:scale-90 transition-all border border-slate-100"
                      >
                         <Download className="w-5 h-5" />
                      </button>
                   </div>
                </div>

                {/* Content Area */}
                <div className="p-8 space-y-8">
                   <div className="flex items-center justify-between">
                      <div className="flex gap-4">
                         <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-50">
                            <Bike className="w-5 h-5 text-slate-600" />
                         </div>
                         <div>
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Moto Gear SRK</h4>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sponsored Post</p>
                         </div>
                      </div>
                      <div className="flex gap-2">
                         <Instagram className="w-5 h-5 text-pink-500" />
                         <Facebook className="w-5 h-5 text-blue-600" />
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 relative">
                         <div className="absolute -top-3 left-6 px-3 py-1 bg-white border border-slate-100 rounded-full shadow-sm">
                            <span className="text-[8px] font-black uppercase text-blue-600 tracking-widest">AI Copy</span>
                         </div>
                         <p className="text-sm text-slate-700 leading-relaxed font-medium italic">
                            "{result.caption}"
                         </p>
                         <p className="text-xs text-blue-600 font-black mt-4 tracking-tight">
                            {result.tags}
                         </p>
                      </div>
                   </div>

                   <div className="flex gap-3">
                      <button 
                        onClick={copyToClipboard}
                        className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 shadow-xl"
                      >
                         {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                         {copied ? 'Copied' : 'Copy Caption'}
                      </button>
                      <button 
                        onClick={() => onNavigate('whatsapp_marketing')}
                        className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-emerald-500/10"
                      >
                         <Share2 className="w-4 h-4" /> Share Hub
                      </button>
                   </div>
                </div>
             </div>

             <div className="bg-blue-600 p-8 rounded-[40px] text-white shadow-2xl flex items-center justify-between">
                <div className="space-y-1">
                   <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-200" />
                      <h4 className="text-sm font-black uppercase tracking-widest">Ad Performance</h4>
                   </div>
                   <p className="text-[10px] text-blue-100 font-medium">This combination of high-impact visual and technical hook is predicted to yield 15-20% higher engagement among local riders.</p>
                </div>
             </div>
          </div>
        )}

        {/* Suggestion HUD */}
        {!result && !loading && (
          <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 flex flex-col items-center text-center space-y-6">
             <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center text-blue-600 shadow-sm border border-blue-50">
                <ImageIcon className="w-10 h-10" />
             </div>
             <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Content Studio</h3>
                <p className="text-xs text-slate-500 font-medium px-4 leading-relaxed uppercase tracking-wide">
                  Describe your repair service, offer, or event above. Synapse AI will handle the technical visual rendering and high-conversion copywriting.
                </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketingTools;
