
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Search, Navigation, MapPin, ExternalLink, 
  Loader2, Sparkles, Store, Building2, ChevronRight, Info, Star,
  Map as MapIcon, Compass
} from 'lucide-react';
import { dbService } from '../db';

interface MarketExplorerPageProps {
  onNavigate: (tab: string) => void;
  initialQuery?: string;
}

const MarketExplorerPage: React.FC<MarketExplorerPageProps> = ({ onNavigate, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<{ text: string, grounding: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [locError, setLocError] = useState<string | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          if (initialQuery) {
            handleSearch(undefined, { lat: pos.coords.latitude, lng: pos.coords.longitude });
          }
        },
        (err) => {
          console.error(err);
          setLocError("Location access denied. Using general area.");
          const fallback = { lat: 18.5204, lng: 73.8567 }; // Pune default
          setLocation(fallback);
          if (initialQuery) handleSearch(undefined, fallback);
        }
      );
    }
  }, [initialQuery]);

  const handleSearch = async (e?: React.FormEvent, overrideLoc?: {lat: number, lng: number}) => {
    e?.preventDefault();
    const activeLoc = overrideLoc || location;
    const activeQuery = query || initialQuery;
    if (!activeQuery || !activeLoc) return;
    
    setLoading(true);
    try {
      const res = await dbService.searchLocalMarket(activeQuery, activeLoc.lat, activeLoc.lng);
      setResults(res);
    } catch (err) {
      console.error(err);
      alert("Failed to explore local market. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const quickSearches = [
    "Bike part suppliers",
    "Tyre wholesale shops",
    "Bike engine oil distributors",
    "Competing bike garages",
    "Authorized service centers"
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col animate-in fade-in duration-700">
      {/* Black Header */}
      <header className="p-4 flex items-center justify-between sticky top-0 bg-[#0F172A]/90 backdrop-blur-md z-40 border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('utilities')} className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-black tracking-tight uppercase">Market Explorer</h2>
            <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Maps Grounding Active</p>
          </div>
        </div>
        <div className="p-2 bg-blue-600/20 rounded-xl border border-blue-500/30">
          <Navigation className="w-5 h-5 text-blue-400" />
        </div>
      </header>

      <div className="flex-1 p-6 space-y-8 max-w-lg mx-auto w-full">
        {/* Search Bar */}
        <form onSubmit={(e) => handleSearch(e)} className="relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400">
             <Search className="w-5 h-5" />
          </div>
          <input 
            type="text"
            placeholder="Search local market..."
            className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-3xl outline-none focus:ring-4 focus:ring-blue-500/20 font-bold text-sm transition-all"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button 
            type="submit"
            disabled={loading || !query}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 px-4 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Explore"}
          </button>
        </form>

        {/* Quick Suggestions */}
        {!results && !loading && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 ml-1">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Quick Local Search</h3>
            </div>
            <div className="flex flex-wrap gap-2">
               {quickSearches.map(s => (
                 <button 
                   key={s}
                   onClick={() => { setQuery(s); setTimeout(() => handleSearch(), 0); }}
                   className="px-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-tight hover:bg-white/10 hover:border-white/20 transition-all active:scale-95"
                 >
                   {s}
                 </button>
               ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-32 flex flex-col items-center gap-6 text-center">
             <div className="relative">
                <div className="w-24 h-24 bg-blue-500/20 rounded-full blur-[40px] absolute inset-0"></div>
                <Loader2 className="w-12 h-12 animate-spin text-blue-500 relative" />
             </div>
             <div className="space-y-2">
                <p className="text-lg font-black uppercase tracking-tighter">Analyzing Market...</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Grounding details with Google Maps data</p>
             </div>
          </div>
        )}

        {/* Results */}
        {results && !loading && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-6">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center">
                     <Compass className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">Insights found</h3>
               </div>
               
               <div className="prose prose-invert prose-sm">
                  <p className="text-slate-300 text-sm leading-relaxed font-medium italic">
                    "{results.text}"
                  </p>
               </div>

               {results.grounding && results.grounding.length > 0 && (
                 <div className="space-y-6 pt-6 border-t border-white/5">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] ml-1">Verified Place Entities</p>
                    <div className="space-y-4">
                       {results.grounding.map((chunk, idx) => {
                         const maps = chunk.maps;
                         if (!maps || !maps.uri) return null;
                         
                         return (
                           <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 hover:bg-white/[0.08] transition-colors group">
                             <div className="flex items-start justify-between">
                               <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                                     <MapPin className="w-4 h-4" />
                                  </div>
                                  <div className="flex flex-col overflow-hidden">
                                    <span className="text-xs font-bold uppercase tracking-tight truncate">{maps.title || `Place ${idx + 1}`}</span>
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest truncate">Verified Location</span>
                                  </div>
                               </div>
                               <a 
                                 href={maps.uri}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                               >
                                 <ExternalLink className="w-3.5 h-3.5" />
                               </a>
                             </div>

                             {maps.placeAnswerSources?.reviewSnippets && (
                               <div className="space-y-2 pt-2 border-t border-white/5">
                                 {maps.placeAnswerSources.reviewSnippets.map((snippet: any, sIdx: number) => (
                                   <div key={sIdx} className="flex gap-2 items-start bg-black/20 p-2 rounded-xl">
                                      <Star className="w-2.5 h-2.5 text-yellow-500 shrink-0 mt-0.5 fill-yellow-500" />
                                      <p className="text-[10px] text-slate-400 italic leading-normal">"{snippet.text}"</p>
                                   </div>
                                 ))}
                               </div>
                             )}
                           </div>
                         );
                       })}
                    </div>
                 </div>
               )}
            </div>

            <button 
              onClick={() => { setResults(null); setQuery(''); }}
              className="w-full py-4 bg-white/5 border border-white/10 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all text-slate-400"
            >
               Clear & Search Again
            </button>
          </div>
        )}

        {/* Info Card */}
        {!results && !loading && (
          <div className="bg-gradient-to-br from-blue-600/10 to-indigo-600/10 p-6 rounded-[32px] border border-blue-500/20 space-y-4">
             <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-200">AI Intelligence</h4>
             </div>
             <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                Market Explorer leverages **Gemini 2.5 Flash** with **Maps Grounding** to provide real-time, verified business information. Our system analyzes your local neighborhood to identify key suppliers, distributors, and market trends directly from Google's live databases.
             </p>
          </div>
        )}
      </div>

      {locError && (
        <div className="fixed bottom-32 left-6 right-6 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl backdrop-blur-md flex items-center gap-3 animate-in slide-in-from-bottom-2">
           <MapPin className="w-5 h-5 text-red-400" />
           <p className="text-[10px] font-bold text-red-200 uppercase">{locError}</p>
        </div>
      )}
    </div>
  );
};

export default MarketExplorerPage;
