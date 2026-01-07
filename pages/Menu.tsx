
import React, { useState } from 'react';
import { 
  IndianRupee, ShoppingCart, Wallet, Store, Barcode, Award, 
  Landmark, Banknote, CreditCard, Percent, RefreshCw, Briefcase, 
  Settings2, Database, Crown, Monitor, TrendingUp, Settings, 
  Headphones, Star, ChevronRight, ClipboardCheck, ChevronDown, ChevronUp,
  MapPin, Megaphone, Smartphone, Zap, Sparkles, Wand2
} from 'lucide-react';

interface MenuPageProps {
  onNavigate: (tab: string) => void;
}

const MenuPage: React.FC<MenuPageProps> = ({ onNavigate }) => {
  const [isGrowthOpen, setIsGrowthOpen] = useState(true);

  return (
    <div className="pb-10 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* Top Horoscope Banner (Quick Preview) */}
      <div 
        onClick={() => onNavigate('horoscope')}
        className="relative overflow-hidden bg-gradient-to-r from-[#0F172A] to-[#1E293B] rounded-2xl shadow-lg p-5 text-white cursor-pointer active:scale-[0.98] transition-all"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
             <Sparkles className="w-4 h-4 text-blue-400" />
             <h3 className="font-bold text-lg">Business Horoscope</h3>
          </div>
          <p className="text-slate-400 text-xs mb-4 max-w-[70%] italic">"Your business gears are perfectly aligned today. Keep riding!"</p>
          <button className="bg-white/10 hover:bg-white/20 text-blue-100 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors backdrop-blur-md border border-white/10">
            Read Insights
          </button>
        </div>
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full border-4 border-white/5 opacity-50 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-4 border-white/5"></div>
        </div>
        <div className="absolute right-2 top-2 opacity-10">
            <Star className="w-24 h-24 text-white" />
        </div>
      </div>

      {/* NEW: Grow Your Business (High Fidelity Integration) */}
      <div className="bg-[#0F172A] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        <button 
          onClick={() => setIsGrowthOpen(!isGrowthOpen)}
          className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-4">
             <div className="text-white">
                <TrendingUp className="w-6 h-6 stroke-[2.5]" />
             </div>
             <span className="text-lg font-black tracking-tight text-white uppercase">Grow Your Business</span>
          </div>
          {isGrowthOpen ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
        </button>

        {isGrowthOpen && (
          <div className="bg-[#0F172A] pb-4 animate-in slide-in-from-top-4 duration-300">
             <GrowthItem icon={<MapPin className="text-blue-400" />} label="Google Profile Manager" onClick={() => onNavigate('google_profile')} hasCrown />
             <GrowthItem icon={<Wand2 className="text-indigo-400" />} label="Marketing Tools" onClick={() => onNavigate('marketing_tools')} hasCrown />
             <GrowthItem icon={<Smartphone className="text-emerald-400" />} label="WhatsApp Marketing" onClick={() => onNavigate('whatsapp_marketing')} hasCrown />
             <GrowthItem icon={<Store className="text-amber-400" />} label="Online Store" onClick={() => onNavigate('items')} hasCrown />
             <GrowthItem icon={<Megaphone className="text-red-400" />} label="Ads Manager" onClick={() => onNavigate('ads')} hasCrown />
             <GrowthItem icon={<Zap className="text-purple-400" />} label="Smart Ads" onClick={() => onNavigate('smart_ads')} hasCrown />
             <GrowthItem icon={<Sparkles className="text-pink-400" />} label="Business Horoscope" onClick={() => onNavigate('horoscope')} noBorder />
          </div>
        )}
      </div>

      {/* My Business Section */}
      <MenuSection title="My Business">
        <MenuItem 
          icon={<IndianRupee />} 
          label="Sale / Billing" 
          onClick={() => onNavigate('billing')} 
        />
        <MenuItem 
          icon={<ClipboardCheck />} 
          label="Complaints / Job Cards" 
          onClick={() => onNavigate('complaints')} 
          badge="Active"
        />
        <MenuItem 
          icon={<ShoppingCart />} 
          label="Inventory Items" 
          onClick={() => onNavigate('items')} 
        />
        <MenuItem 
          icon={<Wallet />} 
          label="Expenses" 
          onClick={() => onNavigate('expenses')} 
        />
        <MenuItem 
          icon={<Barcode />} 
          label="Business Reports" 
          onClick={() => onNavigate('dashboard')} 
        />
        <MenuItem 
          icon={<Award />} 
          label="Loyalty Points" 
          onClick={() => onNavigate('customers')} 
          noBorder
        />
      </MenuSection>

      {/* Cash & Bank Section */}
      <MenuSection title="Cash & Bank">
        <MenuItem 
          icon={<Landmark />} 
          label="Bank Accounts" 
          onClick={() => onNavigate('dashboard')} 
        />
        <MenuItem 
          icon={<Banknote />} 
          label="Cash In-Hand" 
          onClick={() => onNavigate('dashboard')} 
        />
        <MenuItem 
          icon={<CreditCard />} 
          label="Cheques" 
          onClick={() => {}} 
          noBorder
        />
      </MenuSection>

      {/* Important Utilities Section */}
      <MenuSection title="Important Utilities">
        <div className="flex items-center justify-between p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer active:bg-slate-100">
           <div className="flex items-center gap-4">
              <RefreshCw className="w-5 h-5 text-slate-500 stroke-[1.5]" />
              <div className="flex flex-col">
                <span className="font-medium text-slate-700 text-sm">Sync & Share</span>
                <span className="text-[10px] text-slate-400">Connected to Cloud</span>
              </div>
           </div>
           <div className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
             ON
           </div>
        </div>
        
        <MenuItem 
          icon={<Database />} 
          label="Backup/Restore" 
          onClick={() => onNavigate('utilities')} 
        />
        <MenuItem 
          icon={<Briefcase />} 
          label="Utilities" 
          onClick={() => onNavigate('utilities')} 
          badge="New"
          noBorder
        />
      </MenuSection>

      {/* Others Section */}
      <MenuSection title="Others">
        <MenuItem 
          icon={<Monitor />} 
          label="Desktop Billing Software" 
          onClick={() => {}} 
          iconColor="text-blue-500"
          dot
        />
        <MenuItem 
          icon={<Settings />} 
          label="System Settings" 
          onClick={() => onNavigate('settings')} 
        />
        <MenuItem 
          icon={<Headphones />} 
          label="Help & Support" 
          onClick={() => {}} 
        />
        <MenuItem 
          icon={<Star />} 
          label="Rate this app" 
          onClick={() => {}} 
          noBorder
        />
      </MenuSection>

      {/* Footer */}
      <div className="py-6 space-y-2">
         <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
           <p className="font-bold text-slate-700 text-sm mb-1">App Version</p>
           <p className="text-xs text-slate-400">3.1.2-flash-premium</p>
         </div>
         <button className="text-slate-400 text-xs underline pl-4">Privacy Policy</button>
      </div>
    </div>
  );
};

const MenuSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-2">
    <h4 className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">{title}</h4>
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      {children}
    </div>
  </div>
);

const MenuItem: React.FC<any> = ({ icon, label, onClick, badge, dot, noBorder, iconColor }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors active:bg-slate-100 ${!noBorder ? 'border-b border-slate-50' : ''}`}
  >
    <div className="flex items-center gap-4">
      <div className={`${iconColor || 'text-slate-500'} [&>svg]:w-5 [&>svg]:h-5 [&>svg]:stroke-[1.5]`}>
        {icon}
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium text-slate-700 text-sm tracking-tight">{label}</span>
        {dot && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
      </div>
    </div>
    <div className="flex items-center gap-3">
      {badge && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      <ChevronRight className="w-4 h-4 text-slate-300" />
    </div>
  </button>
);

const GrowthItem: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void, hasCrown?: boolean, noBorder?: boolean }> = ({ icon, label, onClick, hasCrown, noBorder }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between py-4 px-6 hover:bg-white/5 transition-all active:scale-[0.99] ${!noBorder ? 'border-b border-white/5' : ''}`}
  >
    <div className="flex items-center gap-5">
       <div className="[&>svg]:w-5 [&>svg]:h-5">
          {icon}
       </div>
       <span className="text-sm font-medium text-slate-200 tracking-tight">{label}</span>
    </div>
    {hasCrown && (
       <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
          <div className="w-3 h-3 bg-blue-400 rounded-full flex items-center justify-center">
             <Crown className="w-2 h-2 text-white fill-white" />
          </div>
       </div>
    )}
  </button>
);

export default MenuPage;
