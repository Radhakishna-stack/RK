
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  LayoutDashboard, Users, ClipboardList, Receipt, Package, 
  CreditCard, Settings, Wifi, WifiOff, Bell, Home, Menu as MenuIcon, Sparkles, Plus
} from 'lucide-react';
import DashboardPage from './pages/Dashboard';
import CustomersPage from './pages/Customers';
import ComplaintsPage from './pages/Complaints';
import BillingPage from './pages/Billing';
import InventoryPage from './pages/Inventory';
import ExpensesPage from './pages/Expenses';
import RemindersPage from './pages/Reminders';
import SettingsPage from './pages/Settings';
import ReportsPage from './pages/Reports';
import SaleReportPage from './pages/SaleReport';
import PartyStatementPage from './pages/PartyStatement';
import AdsManagerPage from './pages/AdsManager';
import MenuPage from './pages/Menu';
import UtilitiesPage from './pages/Utilities';
import { dbService } from './db';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'preview'>('preview');

  useEffect(() => {
    setConnectionStatus(dbService.getConnectionStatus());
  }, []);

  const renderContent = () => {
    if (activeTab.startsWith('settings')) {
      const section = activeTab.split('/')[1] || 'general';
      return <SettingsPage initialSection={section} />;
    }

    switch (activeTab) {
      case 'home': return <DashboardPage onNavigate={setActiveTab} />;
      case 'dashboard': return <ReportsPage />;
      case 'sale_report': return <SaleReportPage onNavigate={setActiveTab} />;
      case 'party_statement': return <PartyStatementPage onNavigate={setActiveTab} />;
      case 'items': return <InventoryPage onNavigate={setActiveTab} />;
      case 'billing': return <BillingPage />;
      case 'customers': return <CustomersPage />;
      case 'complaints': return <ComplaintsPage />;
      case 'expenses': return <ExpensesPage />;
      case 'reminders': return <RemindersPage />;
      // case 'settings' is handled by if block above
      case 'ads': return <AdsManagerPage />;
      case 'menu': return <MenuPage onNavigate={setActiveTab} />;
      case 'utilities': return <UtilitiesPage />;
      default: return <DashboardPage onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 overflow-hidden text-slate-900">
      {/* Top Header - Mobile UX */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 no-print">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight uppercase">SRK BIKE SERVICE</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative text-slate-400 hover:text-blue-600 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button onClick={() => setActiveTab('settings')} className="text-slate-400 hover:text-blue-600 transition-colors">
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 relative">
        <div className="max-w-screen-xl mx-auto px-4 pt-4">
          {renderContent()}
        </div>
      </main>

      {/* Bottom Navigation - Mobile UX */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50 no-print safe-area-bottom shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <div className="max-w-screen-md mx-auto flex items-center justify-around py-2 px-2">
          <BottomNavItem icon={<Home className="w-6 h-6" />} label="HOME" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <BottomNavItem icon={<LayoutDashboard className="w-6 h-6" />} label="REPORTS" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <BottomNavItem icon={<Package className="w-6 h-6" />} label="ITEMS" active={activeTab === 'items'} onClick={() => setActiveTab('items')} />
          <BottomNavItem icon={<MenuIcon className="w-6 h-6" />} label="MENU" active={activeTab === 'menu'} onClick={() => setActiveTab('menu')} />
          <div className="flex flex-col items-center gap-1 min-w-[64px] group opacity-70">
             <div className="p-1 bg-amber-100 rounded-lg text-amber-600">
               <Sparkles className="w-5 h-5" />
             </div>
             <span className="text-[10px] font-bold">PREMIUM</span>
          </div>
        </div>
      </nav>
    </div>
  );
};

const BottomNavItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 min-w-[64px] transition-all ${
      active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
    }`}
  >
    <div className={`p-1 rounded-xl transition-all ${active ? 'bg-blue-50' : 'bg-transparent'}`}>
      {icon}
    </div>
    <span className="text-[10px] font-bold tracking-tight uppercase">{label}</span>
  </button>
);

export default App;
