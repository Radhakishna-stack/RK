
import React, { useState, useEffect } from 'react';
import {
  Home,
  BarChart3,
  DollarSign,
  LayoutGrid,
  Bot,
  Shield,
  Settings,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import DashboardPage from './pages/Dashboard';
import DashboardV2 from './pages/DashboardV2';
import CustomersPage from './pages/Customers';
import VisitorsPage from './pages/Visitors';
import StockWantingPage from './pages/StockWanting';
import ComplaintsPage from './pages/Complaints';
import BillingPage from './pages/Billing';
import SalesListPage from './pages/SalesList';
import EstimatePage from './pages/Estimate';
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
import LoginPage from './pages/Login';
import PaymentReceiptPage from './pages/PaymentReceipt';
import { AuthSession, User } from './types';
import { getSession, login, logout, validateCredentials } from './auth';
import { canAccessRoute } from './permissions';
import { dbService } from './db';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [initialSearchQuery, setInitialSearchQuery] = useState('');
  const [loginError, setLoginError] = useState('');

  // Check for existing session on mount and initialize users
  useEffect(() => {
    const checkAuth = async () => {
      // Initialize default users if needed
      await dbService.initializeDefaultUsers();

      // Check for existing session
      const session = getSession();
      setAuthSession(session);
      setIsAuthChecking(false);
    };

    checkAuth();
  }, []);

  // Handle login
  const handleLogin = async (credentials: { username: string; password: string }) => {
    try {
      setLoginError('');
      const users = await dbService.getUsers();
      const user = await validateCredentials(credentials.username, credentials.password, users);

      if (!user) {
        throw new Error('Invalid username or password');
      }

      const session = login(user);
      setAuthSession(session);
    } catch (error: any) {
      setLoginError(error.message);
      throw error;
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setAuthSession(null);
    setActiveTab('home');
  };


  const navigateToMarketExplorer = (query: string = '') => {
    setInitialSearchQuery(query);
    setActiveTab('market_explorer');
  };

  // Protected navigation - check if user can access route
  const handleNavigate = (tab: string) => {
    if (!authSession) return;

    const userRole = authSession.user.role;
    if (canAccessRoute(userRole, tab)) {
      setActiveTab(tab);
    } else {
      // Show error or redirect to home
      alert('You do not have permission to access this feature');
    }
  };

  // Show loading screen while checking auth
  if (isAuthChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!authSession) {
    return <LoginPage onLogin={handleLogin} error={loginError} />;
  }

  const userRole = authSession.user.role;

  const renderContent = () => {
    if (userRole === 'employee' && activeTab === 'home') {
      return <EmployeePanel onNavigate={handleNavigate} userRole={userRole} />;
    }

    if (activeTab.startsWith('settings')) {
      const section = activeTab.split('/')[1] || 'general';
      return <SettingsPage initialSection={section} onNavigate={handleNavigate} />;
    }

    switch (activeTab) {
      case 'home': return <DashboardPage onNavigate={handleNavigate} />;
      case 'dashboard': return <DashboardV2 onNavigate={handleNavigate} />;
      case 'business': return <DashboardV2 onNavigate={handleNavigate} />;
      case 'money': return <BankAccountsPage onNavigate={handleNavigate} />;
      case 'more': return <MorePage onNavigate={handleNavigate} />;
      case 'staff_control': return canAccessRoute(userRole, 'staff_control') ? <StaffControlCenter onNavigate={handleNavigate} /> : <DashboardPage onNavigate={handleNavigate} />;
      case 'items': return <InventoryPage onNavigate={(tab, query) => {
        if (tab === 'market_explorer') navigateToMarketExplorer(query);
        else handleNavigate(tab);
      }} />;
      case 'connect': return <ConnectPage />;
      case 'horoscope': return <BusinessHoroscope onNavigate={handleNavigate} />;
      case 'marketing_tools': return <MarketingTools onNavigate={handleNavigate} />;
      case 'whatsapp_marketing': return <WhatsAppMarketingPage onNavigate={handleNavigate} />;
      case 'tech_agent': return <TechAgentPage onNavigate={handleNavigate} />;
      case 'google_profile': return <GoogleProfilePage onNavigate={handleNavigate} />;
      case 'ads': return <AdsManagerPage />;
      case 'smart_ads': return <SmartAdsPage onNavigate={handleNavigate} />;
      case 'market_explorer': return <MarketExplorerPage onNavigate={handleNavigate} initialQuery={initialSearchQuery} />;
      case 'sale_report': return canAccessRoute(userRole, 'sale_report') ? <SaleReportPage onNavigate={handleNavigate} /> : <DashboardPage onNavigate={handleNavigate} />;
      case 'party_statement': return <PartyStatementPage onNavigate={handleNavigate} />;
      case 'sales': return <SalesListPage onNavigate={handleNavigate} />;
      case 'billing': return canAccessRoute(userRole, 'billing') ? <BillingPage onNavigate={handleNavigate} /> : <DashboardPage onNavigate={handleNavigate} />;
      case 'estimate': return <EstimatePage />;
      case 'purchase': return canAccessRoute(userRole, 'purchase') ? <PurchasePage onNavigate={handleNavigate} /> : <DashboardPage onNavigate={handleNavigate} />;
      case 'customers': return canAccessRoute(userRole, 'customers') ? <CustomersPage onNavigate={handleNavigate} /> : <DashboardPage onNavigate={handleNavigate} />;
      case 'visitors': return <VisitorsPage onNavigate={handleNavigate} />;
      case 'stock_wanting': return <StockWantingPage onNavigate={handleNavigate} />;
      case 'complaints': return <ComplaintsPage onNavigate={handleNavigate} />;
      case 'expenses': return canAccessRoute(userRole, 'expenses') ? <ExpensesPage onNavigate={handleNavigate} /> : <DashboardPage onNavigate={handleNavigate} />;
      case 'reminders': return <RemindersPage onNavigate={handleNavigate} />;
      case 'utilities': return <UtilitiesPage onNavigate={(tab, query) => {
        if (tab === 'market_explorer') navigateToMarketExplorer(query);
        else handleNavigate(tab);
      }} />;
      case 'recycle_bin': return <RecycleBinPage onNavigate={handleNavigate} />;
      case 'salesmen': return <SalesmanTrackingPage onNavigate={handleNavigate} />;
      case 'employee_panel': return <EmployeePanel onNavigate={handleNavigate} userRole={userRole} />;
      case 'bank_accounts': return <BankAccountsPage onNavigate={handleNavigate} />;
      case 'cash_in_hand': return <CashInHandPage onNavigate={handleNavigate} />;
      case 'cheques': return <ChequesPage onNavigate={handleNavigate} />;
      case 'payment_receipt': return <PaymentReceiptPage onNavigate={handleNavigate} />;
      default: return <DashboardPage onNavigate={handleNavigate} />;
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
            {/* User Role Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
              <UserIcon className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-semibold text-slate-700 capitalize">
                {authSession.user.name}
              </span>
              <span className="text-xs text-slate-500">({userRole})</span>
            </div>

            <button onClick={() => handleNavigate('tech_agent')} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
              <Bot className="w-5 h-5" />
            </button>
            {canAccessRoute(userRole, 'staff_control') && (
              <button onClick={() => handleNavigate('staff_control')} className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors rounded-xl">
                <Shield className="w-5 h-5" />
              </button>
            )}
            <button onClick={() => handleNavigate('settings')} className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors rounded-xl">
              <Settings className="w-5 h-5" />
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2.5 text-red-600 hover:text-white hover:bg-red-600 transition-all rounded-xl"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
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
