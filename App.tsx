
import React, { useState, useEffect } from 'react';
import {
  Home,
  BarChart3,
  DollarSign,
  LayoutGrid,
  Bot,
  Shield,
  Settings
} from 'lucide-react';
import DashboardPage from './pages/Dashboard';
import DashboardV2 from './pages/DashboardV2';
import CustomersPage from './pages/Customers';
import VisitorsPage from './pages/Visitors';
import StockWantingPage from './pages/StockWanting';
import ComplaintsPage from './pages/Complaints';
import BillingPage from './pages/Billing';
import EstimatePage from './pages/Estimate';
import PaymentInPage from './pages/PaymentIn';
import PurchasePage from './pages/Purchase';
import InventoryPage from './pages/Inventory';
import ExpensesPage from './pages/Expenses';
import RemindersPage from './pages/Reminders';
import SettingsPage from './pages/Settings';
import SaleReportPage from './pages/SaleReport';
import PartyStatementPage from './pages/PartyStatement';
import AdsManagerPage from './pages/AdsManager';
import UtilitiesPage from './pages/Utilities';
import BusinessHoroscope from './pages/BusinessHoroscope';
import MarketingTools from './pages/MarketingTools';
import ConnectPage from './pages/Connect';
import SalesmanTrackingPage from './pages/SalesmanTracking';
import MarketExplorerPage from './pages/MarketExplorer';
import EmployeePanel from './pages/EmployeePanel';
import StaffControlCenter from './pages/StaffControlCenter';
import SmartAdsPage from './pages/SmartAds';
import WhatsAppMarketingPage from './pages/WhatsAppMarketing';
import TechAgentPage from './pages/TechAgent';
import RecycleBinPage from './pages/RecycleBin';
import GoogleProfilePage from './pages/GoogleProfile';
import BankAccountsPage from './pages/BankAccounts';
import CashInHandPage from './pages/CashInHand';
import ChequesPage from './pages/Cheques';
import MorePage from './pages/More';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [userRole, setUserRole] = useState<'admin' | 'employee'>('admin');
  const [initialSearchQuery, setInitialSearchQuery] = useState('');

  const navigateToMarketExplorer = (query: string = '') => {
    setInitialSearchQuery(query);
    setActiveTab('market_explorer');
  };

  const renderContent = () => {
    if (userRole === 'employee' && activeTab === 'home') {
      return <EmployeePanel onNavigate={setActiveTab} userRole={userRole} />;
    }

    if (activeTab.startsWith('settings')) {
      const section = activeTab.split('/')[1] || 'general';
      return <SettingsPage initialSection={section} onNavigate={setActiveTab} />;
    }

    switch (activeTab) {
      case 'home': return <DashboardPage onNavigate={setActiveTab} />;
      case 'dashboard': return <DashboardV2 onNavigate={setActiveTab} />;
      case 'business': return <DashboardV2 onNavigate={setActiveTab} />;
      case 'money': return <BankAccountsPage onNavigate={setActiveTab} />;
      case 'more': return <MorePage onNavigate={setActiveTab} />;
      case 'staff_control': return <StaffControlCenter />;
      case 'items': return <InventoryPage onNavigate={(tab, query) => {
        if (tab === 'market_explorer') navigateToMarketExplorer(query);
        else setActiveTab(tab);
      }} />;
      case 'connect': return <ConnectPage />;
      case 'horoscope': return <BusinessHoroscope onNavigate={setActiveTab} />;
      case 'marketing_tools': return <MarketingTools onNavigate={setActiveTab} />;
      case 'whatsapp_marketing': return <WhatsAppMarketingPage onNavigate={setActiveTab} />;
      case 'tech_agent': return <TechAgentPage onNavigate={setActiveTab} />;
      case 'google_profile': return <GoogleProfilePage onNavigate={setActiveTab} />;
      case 'ads': return <AdsManagerPage />;
      case 'smart_ads': return <SmartAdsPage onNavigate={setActiveTab} />;
      case 'market_explorer': return <MarketExplorerPage onNavigate={setActiveTab} initialQuery={initialSearchQuery} />;
      case 'sale_report': return <SaleReportPage onNavigate={setActiveTab} />;
      case 'party_statement': return <PartyStatementPage onNavigate={setActiveTab} />;
      case 'billing': return <BillingPage />;
      case 'estimate': return <EstimatePage />;
      case 'payment_in': return <PaymentInPage />;
      case 'purchase': return <PurchasePage />;
      case 'customers': return <CustomersPage />;
      case 'visitors': return <VisitorsPage />;
      case 'stock_wanting': return <StockWantingPage />;
      case 'complaints': return <ComplaintsPage />;
      case 'expenses': return <ExpensesPage />;
      case 'reminders': return <RemindersPage />;
      case 'utilities': return <UtilitiesPage onNavigate={(tab, query) => {
        if (tab === 'market_explorer') navigateToMarketExplorer(query);
        else setActiveTab(tab);
      }} />;
      case 'recycle_bin': return <RecycleBinPage onNavigate={setActiveTab} />;
      case 'salesmen': return <SalesmanTrackingPage onNavigate={setActiveTab} />;
      case 'employee_panel': return <EmployeePanel onNavigate={setActiveTab} userRole={userRole} />;
      case 'bank_accounts': return <BankAccountsPage onNavigate={setActiveTab} />;
      case 'cash_in_hand': return <CashInHandPage onNavigate={setActiveTab} />;
      case 'cheques': return <ChequesPage onNavigate={setActiveTab} />;
      default: return <DashboardPage onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 overflow-hidden text-slate-900">
      {activeTab !== 'dashboard' && activeTab !== 'business' && activeTab !== 'horoscope' && activeTab !== 'market_explorer' && activeTab !== 'tech_agent' && (
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40 no-print shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">Moto Gear SRK</h1>
              <span className="text-xs text-slate-500">Service Management</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveTab('tech_agent')} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
              <Bot className="w-5 h-5" />
            </button>
            {userRole === 'admin' && (
              <button onClick={() => setActiveTab('staff_control')} className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors rounded-xl">
                <Shield className="w-5 h-5" />
              </button>
            )}
            <button onClick={() => setActiveTab('settings')} className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors rounded-xl">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>
      )}

      <main className={`flex-1 overflow-y-auto relative ${activeTab === 'billing' ? 'pb-0' :
          (activeTab === 'dashboard' || activeTab === 'business' || activeTab === 'market_explorer' || activeTab === 'tech_agent' ? 'pb-28' : 'pb-32')
        }`}>
        <div className={`max-w-screen-xl mx-auto ${activeTab === 'dashboard' || activeTab === 'business' || activeTab === 'horoscope' || activeTab === 'market_explorer' || activeTab === 'tech_agent' ? 'px-0 pt-0' : 'px-4 pt-4'}`}>
          {renderContent()}
        </div>
      </main>

      {activeTab !== 'billing' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-around py-3 px-2 z-50 no-print shadow-lg">
          <BottomNavItem icon={<Home />} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <BottomNavItem icon={<BarChart3 />} label="Business" active={activeTab === 'business' || activeTab === 'dashboard'} onClick={() => setActiveTab('business')} />
          <BottomNavItem icon={<DollarSign />} label="Money" active={activeTab === 'money' || activeTab === 'bank_accounts'} onClick={() => setActiveTab('money')} />
          <BottomNavItem icon={<LayoutGrid />} label="More" active={activeTab === 'more'} onClick={() => setActiveTab('more')} />
        </nav>
      )}
    </div>
  );
};

const BottomNavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 min-w-[70px] transition-all ${active ? 'text-blue-600' : 'text-slate-400'
      }`}
  >
    <div className={`p-2.5 rounded-2xl transition-all ${active ? 'bg-blue-50' : 'bg-transparent'}`}>
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
    </div>
    <span className="text-xs font-semibold">{label}</span>
  </button>
);

export default App;
