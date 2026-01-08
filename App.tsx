
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, ClipboardList, Receipt, Package, 
  Settings, Wifi, WifiOff, Bell, Home, Menu as MenuIcon, Sparkles, Plus, BarChart3, MessageCircle, Hammer
} from 'lucide-react';
import DashboardPage from './pages/Dashboard';
import DashboardV2 from './pages/DashboardV2';
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
import BusinessHoroscope from './pages/BusinessHoroscope';
import MarketingTools from './pages/MarketingTools';
import ConnectPage from './pages/Connect';
import SalesmanTrackingPage from './pages/SalesmanTracking';
import MarketExplorerPage from './pages/MarketExplorer';
import EmployeePanel from './pages/EmployeePanel';
import { dbService } from './db';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [userRole, setUserRole] = useState<'admin' | 'employee'>('admin');
  const [initialSearchQuery, setInitialSearchQuery] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'preview'>('preview');

  useEffect(() => {
    setConnectionStatus(dbService.getConnectionStatus());
  }, []);

  const navigateToMarketExplorer = (query: string = '') => {
    setInitialSearchQuery(query);
    setActiveTab('market_explorer');
  };

  const renderContent = () => {
    // Role override for Employee Panel
    if (userRole === 'employee' && activeTab === 'home') {
      return <EmployeePanel onNavigate={setActiveTab} />;
    }

    if (activeTab.startsWith('settings')) {
      const section = activeTab.split('/')[1] || 'general';
      return <SettingsPage initialSection={section} onNavigate={setActiveTab} />;
    }

    switch (activeTab) {
      case 'home': return <DashboardPage onNavigate={setActiveTab} />;
      case 'dashboard': return <DashboardV2 onNavigate={setActiveTab} />;
      case 'items': return <InventoryPage onNavigate={(tab) => {
        if (tab === 'market_explorer') navigateToMarketExplorer();
        else setActiveTab(tab);
      }} />;
      case 'menu': return <MenuPage onNavigate={setActiveTab} userRole={userRole} setUserRole={setUserRole} />;
      case 'connect': return <ConnectPage />;
      
      // Growth Features
      case 'horoscope': return <BusinessHoroscope onNavigate={setActiveTab} />;
      case 'marketing_tools': return <MarketingTools onNavigate={setActiveTab} />;
      case 'ads': return <AdsManagerPage />;
      case 'market_explorer': return <MarketExplorerPage onNavigate={setActiveTab} initialQuery={initialSearchQuery} />;
      
      // Secondary/Nested Pages
      case 'sale_report': return <SaleReportPage onNavigate={setActiveTab} />;
      case 'party_statement': return <PartyStatementPage onNavigate={setActiveTab} />;
      case 'billing': return <BillingPage />;
      case 'customers': return <CustomersPage />;
      case 'complaints': return <ComplaintsPage />;
      case 'expenses': return <ExpensesPage />;
      case 'reminders': return <RemindersPage />;
      case 'utilities': return <UtilitiesPage onNavigate={setActiveTab} />;
      case 'salesmen': return <SalesmanTrackingPage onNavigate={setActiveTab} />;
      case 'employee_panel': return <EmployeePanel onNavigate={setActiveTab} />;
      default: return <DashboardPage onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 overflow-hidden text-slate-900">
      {/* Top Header */}
      {activeTab !== 'dashboard' && activeTab !== 'horoscope' && activeTab !== 'market_explorer' && (
        <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-40 no-print">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 ${userRole === 'admin' ? 'bg-blue-600' : 'bg-orange-600'} rounded-lg flex items-center justify-center transition-colors`}>
              {userRole === 'admin' ? <BarChart3 className="w-5 h-5 text-white" /> : <Hammer className="w-5 h-5 text-white" />}
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-bold tracking-tight uppercase leading-none">SRK BIKE SERVICE</h1>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{userRole} Terminal</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {userRole === 'admin' && (
              <button onClick={() => setActiveTab('connect')} className="relative text-slate-400 hover:text-emerald-600 transition-colors">
                <MessageCircle className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white"></span>
              </button>
            )}
            <button onClick={() => setActiveTab('settings')} className="text-slate-400 hover:text-blue-600 transition-colors">
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 overflow-y-auto relative ${activeTab === 'dashboard' || activeTab === 'market_explorer' ? 'pb-28' : 'pb-24'}`}>
        <div className={`max-w-screen-xl mx-auto ${activeTab === 'dashboard' || activeTab === 'horoscope' || activeTab === 'market_explorer' ? 'px-0 pt-0' : 'px-4 pt-4'}`}>
          {renderContent()}
        </div>
      </main>

      {/* Bottom Navigation - Mobile UX */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex items-center justify-around py-2 px-2 z-50 no-print safe-area-bottom shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <BottomNavItem icon={<Home className="w-6 h-6" />} label="HOME" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
        
        {userRole === 'admin' ? (
          <>
            <BottomNavItem icon={<BarChart3 className="w-6 h-6" />} label="INSIGHTS" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <BottomNavItem icon={<MessageCircle className="w-6 h-6" />} label="CONNECT" active={activeTab === 'connect'} onClick={() => setActiveTab('connect')} />
          </>
        ) : (
          <BottomNavItem icon={<Hammer className="w-6 h-6" />} label="WORKSHOP" active={activeTab === 'employee_panel'} onClick={() => setActiveTab('employee_panel')} />
        )}
        
        <BottomNavItem icon={<Package className="w-6 h-6" />} label="ITEMS" active={activeTab === 'items'} onClick={() => setActiveTab('items')} />
        <BottomNavItem icon={<MenuIcon className="w-6 h-6" />} label="MORE" active={activeTab === 'menu'} onClick={() => setActiveTab('menu')} />
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
