
import React, { useState } from 'react';
import {
  IndianRupee, ShoppingCart, Wallet, Store, Barcode, Award,
  Landmark, Banknote, CreditCard, Percent, RefreshCw, Briefcase,
  Crown, Monitor, TrendingUp, Settings,
  Headphones, Star, ChevronRight, ClipboardCheck, ChevronDown, ChevronUp,
  MapPin, Megaphone, Smartphone, Zap, Sparkles, Wand2, User, ShieldCheck,
  UserCheck, Bot, FileText, ArrowDownCircle, BadgeCheck, Globe,
  ClipboardList, ShoppingBag, ListChecks, History, Users, BarChart3, Bell
} from 'lucide-react';

interface MenuPageProps {
  onNavigate: (tab: string) => void;
  userRole: 'admin' | 'employee';
  setUserRole: (role: 'admin' | 'employee') => void;
}

const MenuPage: React.FC<MenuPageProps> = ({ onNavigate, userRole, setUserRole }) => {
  const [isGrowthOpen, setIsGrowthOpen] = useState(true);

  const toggleRole = () => {
    const newRole = userRole === 'admin' ? 'employee' : 'admin';
    setUserRole(newRole);
  };

  return (
    <div className="pb-10 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 px-1">

      {/* Workspace Role Switcher */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${userRole === 'admin' ? 'bg-slate-900 text-white' : 'bg-orange-600 text-white shadow-orange-200 shadow-lg'}`}>
            {userRole === 'admin' ? <ShieldCheck className="w-6 h-6" /> : <User className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active Identity</p>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">{userRole === 'admin' ? 'Master Admin' : 'Technician Hub'}</h3>
          </div>
        </div>
        <button
          onClick={toggleRole}
          className="bg-blue-50 text-blue-600 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 active:scale-95 transition-all"
        >
          Switch Mode
        </button>
      </div>

      {/* AI TECH AGENT PROMO */}
      <div
        onClick={() => onNavigate('tech_agent')}
        className="bg-blue-600 rounded-[32px] p-6 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
      >
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-md">
            <Bot className="w-3.5 h-3.5" />
            <span className="text-[9px] font-black uppercase tracking-widest">New Feature</span>
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight leading-none">AI Tech Agent</h3>
          <p className="text-blue-100 text-xs font-medium">Ask AI to query inventory, check jobs, or analyze your bike service sales in natural language.</p>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest pt-2">
            Start Conversation <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
        <Bot className="absolute right-[-10px] bottom-[-20px] w-32 h-32 text-white/10 -rotate-12" />
      </div>

      {/* Grow Your Business - Refined for Bike Service */}
      <div className="bg-[#0F172A] rounded-[32px] border border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
              <TrendingUp className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white uppercase leading-none">Grow Your Business</h3>
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mt-1">Revenue Booster Pack</p>
            </div>
          </div>
          <button onClick={() => setIsGrowthOpen(!isGrowthOpen)} className="p-2 text-slate-500">
            {isGrowthOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {isGrowthOpen && (
          <div className="pb-4 animate-in slide-in-from-top-4 duration-300">
            <GrowthItem
              icon={<MapPin className="text-blue-400" />}
              label="Google Profile Manager"
              desc="Local SEO & Review AI"
              onClick={() => onNavigate('google_profile')}
              hasCrown
            />
            <GrowthItem
              icon={<Smartphone className="text-emerald-400" />}
              label="WhatsApp Marketing"
              desc="Broadcast Service Alerts"
              onClick={() => onNavigate('whatsapp_marketing')}
              hasCrown
            />
            <GrowthItem
              icon={<Globe className="text-indigo-400" />}
              label="Online Spare Store"
              desc="Digital Catalog for Riders"
              onClick={() => onNavigate('items')}
              hasCrown
            />
            <GrowthItem
              icon={<Megaphone className="text-red-400" />}
              label="AI Ad Generator"
              desc="High-Impact Repair Ads"
              onClick={() => onNavigate('ads')}
              hasCrown
            />
            <GrowthItem
              icon={<Wand2 className="text-purple-400" />}
              label="Marketing Design"
              desc="Posters & Social Creative"
              onClick={() => onNavigate('marketing_tools')}
            />
            <GrowthItem
              icon={<Sparkles className="text-pink-400" />}
              label="Daily Insights"
              desc="Business Horoscope"
              onClick={() => onNavigate('horoscope')}
              noBorder
            />
          </div>
        )}
      </div>

      {/* My Business Section - RESTORED & EXPANDED */}
      <MenuSection title="Operational Control">
        <MenuItem
          icon={<IndianRupee />}
          label="Sale / Billing"
          desc="Generate Tax Invoices"
          onClick={() => onNavigate('billing')}
        />
        <MenuItem
          icon={<ArrowDownCircle />}
          label="Payment In (Receipt)"
          desc="Record Customer Payments"
          onClick={() => onNavigate('payment_in')}
        />
        <MenuItem
          icon={<FileText />}
          label="Service Estimates"
          desc="Generate Pre-Service Quotes"
          onClick={() => onNavigate('estimate')}
        />
        <MenuItem
          icon={<ClipboardCheck />}
          label="Complaints / Job Cards"
          desc="Active Bike Service Log"
          onClick={() => onNavigate('complaints')}
          badge="Live"
        />
        <MenuItem
          icon={<Bell />}
          label="Service Reminders"
          desc="Bulk WA Retention Alerts"
          onClick={() => onNavigate('reminders')}
        />
        <MenuItem
          icon={<UserCheck />}
          label="Walk-in Logs"
          desc="Visitor Identity Record"
          onClick={() => onNavigate('visitors')}
        />
        <MenuItem
          icon={<ShoppingBag />}
          label="Purchase Entry"
          desc="Inward Stock Supply"
          onClick={() => onNavigate('purchase')}
        />
        <MenuItem
          icon={<ListChecks />}
          label="Stock Wanting"
          desc="Procurement Wishlist"
          onClick={() => onNavigate('stock_wanting')}
        />
        <MenuItem
          icon={<ShoppingCart />}
          label="Inventory & Spares"
          desc="Manage SKU & Pricing"
          onClick={() => onNavigate('items')}
        />
        <MenuItem
          icon={<Wallet />}
          label="Expense Tracker"
          desc="Miscellaneous Outflows"
          onClick={() => onNavigate('expenses')}
        />
        <MenuItem
          icon={<BarChart3 />}
          label="Master Reports"
          desc="P&L, Daybook, GSTR-1"
          onClick={() => onNavigate('dashboard')}
        />
        <MenuItem
          icon={<Award />}
          label="Customer Loyalty"
          desc="Manage Reward Points"
          onClick={() => onNavigate('customers')}
          noBorder
        />
      </MenuSection>

      {/* Cash & Bank Section */}
      <MenuSection title="Cash & Bank">
        <MenuItem
          icon={<Landmark />}
          label="Bank Accounts"
          desc="Manage Digital Wallets"
          onClick={() => onNavigate('bank_accounts')}
        />
        <MenuItem
          icon={<Banknote />}
          label="Cash In-Hand"
          desc="Store Counter Cash Flow"
          onClick={() => onNavigate('cash_in_hand')}
          noBorder
        />

      </MenuSection>

      {/* Sync Status Overlay */}
      <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cloud Database</p>
            <p className="text-xs font-bold text-slate-800">Synchronized (Live)</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase border border-emerald-100">
          Secure
        </div>
      </div>

      {/* Utilities */}
      <MenuSection title="System Tools">
        <MenuItem
          icon={<Briefcase />}
          label="Utilities Hub"
          desc="Import/Export & Maintenance"
          onClick={() => onNavigate('utilities')}
          noBorder
        />
      </MenuSection>

      {/* Footer */}
      <div className="py-6 space-y-4">
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center justify-between">
          <div>
            <p className="font-black text-slate-900 text-sm uppercase tracking-tight">Moto Gear SRK</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Version 3.5.0 Pro Terminal</p>
          </div>
          <BadgeCheck className="w-6 h-6 text-blue-500" />
        </div>
      </div>
    </div>
  );
};

const MenuSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-2">
    <h4 className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-[0.2em]">{title}</h4>
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
      {children}
    </div>
  </div>
);

const MenuItem: React.FC<any> = ({ icon, label, desc, onClick, badge, dot, noBorder, iconColor }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors active:bg-slate-100 ${!noBorder ? 'border-b border-slate-50' : ''}`}
  >
    <div className="flex items-center gap-4">
      <div className={`${iconColor || 'text-slate-500'} [&>svg]:w-5 [&>svg]:h-5 [&>svg]:stroke-[1.5]`}>
        {icon}
      </div>
      <div className="flex flex-col items-start gap-0.5">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 text-sm tracking-tight uppercase leading-none">{label}</span>
          {dot && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
        </div>
        {desc && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{desc}</span>}
      </div>
    </div>
    <div className="flex items-center gap-3">
      {badge && (
        <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
          {badge}
        </span>
      )}
      <ChevronRight className="w-4 h-4 text-slate-300" />
    </div>
  </button>
);

const GrowthItem: React.FC<{ icon: React.ReactNode, label: string, desc: string, onClick: () => void, hasCrown?: boolean, noBorder?: boolean }> = ({ icon, label, desc, onClick, hasCrown, noBorder }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between py-5 px-6 hover:bg-white/5 transition-all active:scale-[0.99] group ${!noBorder ? 'border-b border-white/5' : ''}`}
  >
    <div className="flex items-center gap-5">
      <div className="[&>svg]:w-6 [&>svg]:h-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="text-left">
        <span className="text-sm font-black text-slate-200 tracking-tight uppercase block">{label}</span>
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{desc}</span>
      </div>
    </div>
    {hasCrown && (
      <div className="w-7 h-7 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30 group-hover:bg-blue-500/40 group-hover:border-blue-500 transition-all">
        <Crown className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
      </div>
    )}
  </button>
);

export default MenuPage;
