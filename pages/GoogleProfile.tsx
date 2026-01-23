
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Globe, Star, MessageSquare, TrendingUp, RefreshCw, 
  MapPin, Clock, Search, MoreVertical, Sparkles, Wand2, Loader2,
  CheckCircle2, Share2, Info, ArrowUpRight, Camera, BellRing,
  ExternalLink, MousePointer2, Users, Map as MapIcon, X, Send,
  Briefcase, ShieldCheck, Store
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { dbService } from '../db';

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  reply?: string;
  isReplying?: boolean;
}

const GoogleProfilePage: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'hours'>('overview');
  
  // Mock Stats
  const [stats] = useState({
    searches: 2450,
    views: 1890,
    actions: 312,
    searchesTrend: 12.4,
    viewsTrend: 8.1,
    actionsTrend: 15.2
  });

  // Mock Reviews
  const [reviews, setReviews] = useState<Review[]>([
    { id: '1', author: 'Rahul Deshmukh', rating: 5, text: "Excellent service! They fixed my Pulsar's ABS issue in just 2 hours. Very professional staff and fair pricing.", date: '2 days ago' },
    { id: '2', author: 'Amit Kumar', rating: 4, text: "Good experience, but the waiting area was a bit crowded. The work quality on the engine oil change was top notch.", date: '1 week ago' },
    { id: '3', author: 'Sneha Patil', rating: 5, text: "Only place in the area that has genuine spares for high-end bikes. Highly recommended!", date: '2 weeks ago' }
  ]);

  const [businessHours, setBusinessHours] = useState([
    { day: 'Monday', open: '09:00 AM', close: '08:00 PM', isOpen: true },
    { day: 'Tuesday', open: '09:00 AM', close: '08:00 PM', isOpen: true },
    { day: 'Wednesday', open: '09:00 AM', close: '08:00 PM', isOpen: true },
    { day: 'Thursday', open: '09:00 AM', close: '08:00 PM', isOpen: true },
    { day: 'Friday', open: '09:00 AM', close: '08:00 PM', isOpen: true },
    { day: 'Saturday', open: '09:00 AM', close: '07:00 PM', isOpen: true },
    { day: 'Sunday', open: '10:00 AM', close: '02:00 PM', isOpen: false },
  ]);

  useEffect(() => {
    // Simulate initial loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      alert("Business profile synchronized with Google Search & Maps! ✅");
    }, 2500);
  };

  const generateAIReply = async (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;

    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, isReplying: true } : r));

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a professional, polite, and SEO-friendly response for a Google review of "Moto Gear SRK" bike service center. 
        Reviewer: ${review.author}
        Review: "${review.text}"
        Rating: ${review.rating} stars.
        Keep it concise (max 40 words) and mention that we care about rider safety.`
      });

      const reply = response.text || "Thank you for your feedback! We look forward to serving you again.";
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reply, isReplying: false } : r));
    } catch (err) {
      console.error(err);
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, isReplying: false } : r));
    }
  };

  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
       <div className="relative">
          <div className="w-20 h-20 border-4 border-slate-100 rounded-full"></div>
          <Loader2 className="w-20 h-20 animate-spin text-blue-600 absolute top-0 left-0" />
       </div>
       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Authenticating Google APIs...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-500 max-w-lg mx-auto px-1">
      {/* Header HUD */}
      <header className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
           <button onClick={() => onNavigate('menu')} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all">
              <ArrowLeft className="w-5 h-5 text-slate-800" />
           </button>
           <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase leading-none">Google Profile</h2>
              <div className="flex items-center gap-2 mt-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Profile: Verified</span>
              </div>
           </div>
        </div>
        <button 
          onClick={handleSync}
          disabled={syncing}
          className="bg-blue-600 text-white p-3 rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {syncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
        </button>
      </header>

      {/* Main Stats Card */}
      <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden">
         <div className="relative z-10 space-y-8">
            <div className="flex justify-between items-start">
               <div className="space-y-1">
                  <div className="flex items-center gap-2 bg-blue-500/20 w-fit px-3 py-1 rounded-full border border-blue-500/30">
                     <TrendingUp className="w-3 h-3 text-blue-400" />
                     <span className="text-[8px] font-black uppercase tracking-widest text-blue-300">Last 30 Days</span>
                  </div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter">Visibility</h3>
               </div>
               <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                  <Globe className="w-6 h-6 text-blue-400" />
               </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
               <StatBox label="Searches" value={stats.searches} trend={stats.searchesTrend} />
               <StatBox label="Views" value={stats.views} trend={stats.viewsTrend} />
               <StatBox label="Clicks" value={stats.actions} trend={stats.actionsTrend} />
            </div>

            <button className="w-full bg-white/10 border border-white/10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center gap-2">
               View Full Insight Dashboard <ArrowUpRight className="w-4 h-4" />
            </button>
         </div>
         <Globe className="absolute right-[-20px] bottom-[-20px] w-48 h-48 text-white/5 -rotate-12" />
      </div>

      {/* Tab Controller */}
      <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 border border-slate-200">
         <button 
           onClick={() => setActiveTab('overview')}
           className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}
         >Overview</button>
         <button 
           onClick={() => setActiveTab('reviews')}
           className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'reviews' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}
         >Reviews</button>
         <button 
           onClick={() => setActiveTab('hours')}
           className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'hours' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}
         >Hours</button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-300">
           {/* AI Recommendations */}
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                    <Sparkles className="w-5 h-5 fill-indigo-600" />
                 </div>
                 <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase">Growth Insights</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gemini Engine Analysis</p>
                 </div>
              </div>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
                 "Your profile views increased by 12% on weekends. Consider posting a 10:00 AM update on Saturdays about 'Express Chain Lube' to capture morning riders."
              </p>
              <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">Create Suggested Post</button>
           </div>

           {/* Quick Actions Grid */}
           <div className="grid grid-cols-2 gap-4">
              <ProfileActionButton icon={<Camera />} label="Post New Photo" />
              <ProfileActionButton icon={<Users />} label="Update Service" />
              <ProfileActionButton icon={<MapIcon />} label="Edit Location" />
              <ProfileActionButton icon={<Share2 />} label="Share Profile" />
           </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-4 animate-in fade-in duration-300">
           <div className="flex justify-between items-center px-1">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Feedback</h4>
              <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-lg">
                 <Star className="w-3 h-3 text-blue-600 fill-blue-600" />
                 <span className="text-[10px] font-black text-blue-600">4.8 Avg</span>
              </div>
           </div>
           
           <div className="space-y-4">
              {reviews.map(review => (
                 <div key={review.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4 group">
                    <div className="flex justify-between items-start">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-sm">
                             {review.author.charAt(0)}
                          </div>
                          <div>
                             <h5 className="text-xs font-black text-slate-800 uppercase tracking-tight">{review.author}</h5>
                             <div className="flex gap-0.5 mt-0.5">
                                {[...Array(5)].map((_, i) => (
                                   <Star key={i} className={`w-2.5 h-2.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                                ))}
                             </div>
                          </div>
                       </div>
                       <span className="text-[9px] font-bold text-slate-300 uppercase">{review.date}</span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium italic">"{review.text}"</p>

                    {review.reply ? (
                       <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 animate-in zoom-in-95">
                          <div className="flex items-center gap-2 mb-2">
                             <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                             <span className="text-[9px] font-black text-blue-600 uppercase">Drafted Response</span>
                          </div>
                          <p className="text-[11px] text-blue-800 font-bold leading-relaxed">{review.reply}</p>
                          <div className="flex gap-2 mt-4">
                             <button className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95">Publish to Google</button>
                             <button onClick={() => setReviews(prev => prev.map(r => r.id === review.id ? { ...r, reply: undefined } : r))} className="px-3 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg text-[9px] font-black uppercase">Edit</button>
                          </div>
                       </div>
                    ) : (
                       <button 
                         onClick={() => generateAIReply(review.id)}
                         disabled={review.isReplying}
                         className="w-full py-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center gap-3 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all active:scale-95 disabled:opacity-50"
                       >
                          {review.isReplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                          <span className="text-[10px] font-black uppercase tracking-widest">{review.isReplying ? 'Drafting...' : 'AI Smart Reply'}</span>
                       </button>
                    )}
                 </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'hours' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                       <Clock className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-black text-slate-800 uppercase">Operational Hours</h4>
                 </div>
                 <span className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg border border-emerald-100">Currently Open</span>
              </div>

              <div className="space-y-4">
                 {businessHours.map((h, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 group">
                       <div className="flex items-center gap-3">
                          <button 
                            onClick={() => {
                               const newHours = [...businessHours];
                               newHours[i].isOpen = !newHours[i].isOpen;
                               setBusinessHours(newHours);
                            }}
                            className={`w-10 h-5 rounded-full relative transition-all ${h.isOpen ? 'bg-blue-600' : 'bg-slate-200'}`}
                          >
                             <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${h.isOpen ? 'left-6' : 'left-0.5'}`} />
                          </button>
                          <span className={`text-xs font-black uppercase ${h.isOpen ? 'text-slate-800' : 'text-slate-300'}`}>{h.day}</span>
                       </div>
                       {h.isOpen ? (
                          <div className="flex items-center gap-2">
                             <input type="text" className="w-20 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black text-center py-1.5 focus:ring-2 focus:ring-blue-500 outline-none" value={h.open} onChange={() => {}} />
                             <span className="text-slate-300">-</span>
                             <input type="text" className="w-20 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black text-center py-1.5 focus:ring-2 focus:ring-blue-500 outline-none" value={h.close} onChange={() => {}} />
                          </div>
                       ) : (
                          <span className="text-[10px] font-black text-slate-300 uppercase italic">Closed for Business</span>
                       )}
                    </div>
                 ))}
              </div>

              <div className="pt-4 border-t border-slate-50 flex gap-3">
                 <button className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Revert</button>
                 <button onClick={handleSync} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                    Save & Update Google
                 </button>
              </div>
           </div>

           <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100 flex items-start gap-4">
              <BellRing className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
              <div>
                 <p className="text-[11px] font-black text-amber-900 uppercase">Holiday Alert</p>
                 <p className="text-[10px] text-amber-700 font-medium leading-relaxed">Next Sunday is a public holiday. Should we automatically mark "Moto Gear SRK" as closed for that day?</p>
                 <div className="flex gap-4 mt-3">
                    <button className="text-[9px] font-black uppercase text-amber-900 underline">Confirm Close</button>
                    <button className="text-[9px] font-black uppercase text-amber-500">Dismiss</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Info Promo */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-start gap-5">
         <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 shadow-sm">
            <Info className="w-5 h-5" />
         </div>
         <div>
            <p className="text-[11px] font-black text-slate-900 uppercase mb-1">Local SEO Guard</p>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
               Maintaining an active Google profile increases your ranking in "Bike Service Near Me" searches. Use AI replies to boost engagement metrics.
            </p>
         </div>
      </div>
    </div>
  );
};

const StatBox: React.FC<{ label: string, value: number, trend: number }> = ({ label, value, trend }) => (
  <div className="bg-white/5 p-4 rounded-3xl border border-white/10 text-center">
     <p className="text-[8px] font-black uppercase text-blue-300 mb-1 tracking-widest">{label}</p>
     <p className="text-xl font-black tracking-tight">{value.toLocaleString()}</p>
     <p className="text-[8px] font-black text-emerald-400 mt-1">+{trend}%</p>
  </div>
);

const ProfileActionButton: React.FC<{ icon: React.ReactNode, label: string }> = ({ icon, label }) => (
  <button className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center gap-4 group active:scale-95 transition-all hover:border-blue-200">
     <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
        {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6 stroke-[1.5]' })}
     </div>
     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none group-hover:text-slate-900 transition-colors">{label}</span>
  </button>
);

export default GoogleProfilePage;
