
import React from 'react';
import { 
  IndianRupee, ShoppingCart, Wallet, Store, Barcode, Award, 
  Landmark, Banknote, CreditCard, Percent, RefreshCw, Briefcase, 
  Settings2, Database, Crown, Monitor, TrendingUp, Settings, 
  Headphones, Star, ChevronRight, ChevronDown, CheckCircle
} from 'lucide-react';

interface MenuPageProps {
  onNavigate: (tab: string) => void;
}

const MenuPage: React.FC<MenuPageProps> = ({ onNavigate }) => {
  return (
    <div className="pb-10 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* Horoscope Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-lg p-5 text-white">
        <div className="relative z-10">
          <h3 className="font-bold text-lg mb-1">Daily Business Horoscope</h3>
          <p className="text-blue-100 text-xs mb-4 max-w-[70%]">Find about your business performance, new opportunities, and more!</p>
          <button className="bg-white text-blue-700 px-4 py-2 rounded-full text-xs font-bold hover:bg-blue-50 transition-colors">
            See Today's Horoscope
          </button>
        </div>
        {/* Decorative Circle overlay */}
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full border-4 border-white/10 opacity-50 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-4 border-white/10"></div>
        </div>
        <div className="absolute right-2 top-2 opacity-20">
            <Star className="w-24 h-24 text-white" />
        </div>
      </div>

      {/* My Business Section */}
      <MenuSection title="My Business">
        <MenuItem 
          icon={<IndianRupee />} 
          label="Sale" 
          onClick={() => onNavigate('billing')} 
        />
        <MenuItem 
          icon={<ShoppingCart />} 
          label="Purchase" 
          onClick={() => onNavigate('items')} 
        />
        <MenuItem 
          icon={<Wallet />} 
          label="Expenses" 
          onClick={() => onNavigate('expenses')} 
        />
        <MenuItem 
          icon={<Store />} 
          label="My Online Store" 
          onClick={() => onNavigate('items')} 
        />
        <MenuItem 
          icon={<Barcode />} 
          label="Reports" 
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
        />
        <MenuItem 
          icon={<Percent />} 
          label="Loan Accounts" 
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
                <span className="text-[10px] text-slate-400">9182110128</span>
              </div>
           </div>
           <div className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
             ON
           </div>
        </div>
        
        <MenuItem 
          icon={<Percent />} 
          label="Bulk Update Tax Slab" 
          onClick={() => onNavigate('utilities')} 
          badge="New"
        />
        <MenuItem 
          icon={<Settings2 />} 
          label="Manage Companies" 
          onClick={() => {}} 
        />
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
          icon={<Crown />} 
          label="Plans & Pricing" 
          onClick={() => {}} 
          iconColor="text-pink-400"
        />
        <MenuItem 
          icon={<Monitor />} 
          label="Get Desktop Billing Software" 
          onClick={() => {}} 
          iconColor="text-blue-500"
          dot
        />
        <MenuItem 
          icon={<TrendingUp />} 
          label="Grow Your Business" 
          onClick={() => onNavigate('ads')} 
        />
        <MenuItem 
          icon={<Settings />} 
          label="Settings" 
          onClick={() => onNavigate('settings')} 
          badge="New"
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
           <p className="text-xs text-slate-400">21.7.0</p>
         </div>
         <button className="text-slate-400 text-xs underline pl-4">Privacy Policy</button>
      </div>
    </div>
  );
};

const MenuSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-2">
    <h4 className="text-sm font-bold text-slate-700 ml-1">{title}</h4>
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      {children}
    </div>
  </div>
);

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: string;
  dot?: boolean;
  noBorder?: boolean;
  iconColor?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onClick, badge, dot, noBorder, iconColor }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors active:bg-slate-100 ${!noBorder ? 'border-b border-slate-50' : ''}`}
  >
    <div className="flex items-center gap-4">
      <div className={`${iconColor || 'text-slate-500'} [&>svg]:w-5 [&>svg]:h-5 [&>svg]:stroke-[1.5]`}>
        {icon}
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium text-slate-700 text-sm">{label}</span>
        {dot && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
      </div>
    </div>
    <div className="flex items-center gap-3">
      {badge && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      <ChevronRight className="w-4 h-4 text-blue-500" />
    </div>
  </button>
);

export default MenuPage;
