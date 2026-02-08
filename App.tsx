
import React, { useState, useEffect } from 'react';
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate
} from 'react-router-dom';
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
import PurchaseEntryPage from './pages/PurchaseEntry';
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
import PickupSchedulingPage from './pages/PickupScheduling';

import FieldJobs from './pages/FieldJobs';
import FieldServiceManagerPage from './pages/FieldServiceManager';
import MorePage from './pages/More';
import LoginPage from './pages/Login';
import PaymentVoucherPage from './pages/PaymentVoucher';
import { AuthSession, User } from './types';
import { getSession, login, logout, validateCredentials } from './auth';
import { canAccessRoute } from './permissions';
import { dbService } from './db';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [loginError, setLoginError] = useState('');

  // Determine active tab for UI highlighting based on current path
  const getActiveTab = (path: string) => {
    if (path === '/' || path === '/dashboard') return 'home';
    if (path === '/business') return 'business';
    if (path.startsWith('/money') || path === '/bank-accounts') return 'money';
    if (path === '/more') return 'more';
    return path.substring(1); // Default to path name (e.g. 'inventory')
  };

  const activeTab = getActiveTab(location.pathname);

  // Check for existing session on mount and initialize users
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Initialize default users if needed
        await dbService.initializeDefaultUsers();

        // Check for existing session
        const session = getSession();
        setAuthSession(session);
      } catch (err) {
        console.error('Initialization failed:', err);
      } finally {
        setIsAuthChecking(false);
      }
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
    navigate('/');
  };

  const handleNavigate = (path: string) => {
    if (!authSession) return;

    // Map internal tab names to paths if necessary, otherwise assume path is valid
    // This allows legacy components calling onNavigate('inventory') to work
    let targetPath = path;
    if (!path.startsWith('/')) {
      // Mapping legacy tab names to routes
      const routeMap: Record<string, string> = {
        'home': '/',
        'dashboard': '/',
        'business': '/business',
        'money': '/money',
        'more': '/more',
        'items': '/inventory',
        'staff_control': '/staff-control',
        'market_explorer': '/market-explorer',
        'marketing_tools': '/marketing-tools',
        'whatsapp_marketing': '/whatsapp-marketing',
        'tech_agent': '/tech-agent',
        'pickup_scheduling': '/pickup-scheduling',
        'google_profile': '/google-profile',
        'smart_ads': '/smart-ads',
        'sale_report': '/sale-report',
        'party_statement': '/party-statement',
        'new_estimate': '/estimate/new',
        'bank_accounts': '/money',
        'cash_in_hand': '/cash-in-hand',
        'payment_receipt': '/payment-receipt',
        'employee_panel': '/employee-panel',
        'stock_wanting': '/stock-wanting',
        'new_sale': '/billing',
        'recycle_bin': '/recycle-bin',
        'field_jobs': '/field-jobs',
        'field_service_manager': '/field-service-manager'
      };
      targetPath = routeMap[path] || `/${path}`;
    }

    const userRole = authSession.user.role;
    // Simple permission check based on target path key (simplified)
    // Ideally we keep checking permissions based on the feature name not just path
    navigate(targetPath);
  };

  // Wrapper for protected route
  const ProtectedRoute = ({ children, feature }: { children: React.ReactElement, feature?: string }) => {
    if (!authSession) return <Navigate to="/login" replace />;
    if (feature && !canAccessRoute(authSession.user.role, feature)) {
      return <div className="p-8 text-center text-red-600">You do not have permission to access this page.</div>;
    }
    return children;
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
    // If we are at root, show login. If deep linking, we might want to preserve path, 
    // but for now simple login is fine.
    return <LoginPage onLogin={handleLogin} error={loginError} />;
  }

  const userRole = authSession.user.role;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden text-slate-900">
      {location.pathname !== '/market-explorer' && location.pathname !== '/horoscope' && location.pathname !== '/tech-agent' && (
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

            <button onClick={() => navigate('/tech-agent')} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
              <Bot className="w-5 h-5" />
            </button>
            {canAccessRoute(userRole, 'staff_control') && (
              <button onClick={() => navigate('/staff-control')} className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors rounded-xl">
                <Shield className="w-5 h-5" />
              </button>
            )}
            <button onClick={() => navigate('/settings')} className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors rounded-xl">
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

      <main className={`flex-1 overflow-y-auto relative no-scrollbar ${location.pathname.includes('billing') || location.pathname.includes('estimate/new') || location.pathname.includes('sales') || location.pathname.includes('complaints') || location.pathname.includes('field-service-manager') || location.pathname.includes('field-jobs') ? 'pb-0' : ''}`}>
        <div className={`max-w-screen-xl mx-auto px-4 pt-4`}>
          <Routes>
            {/* Core Tabs */}
            <Route path="/" element={(userRole === 'employee' || userRole === 'mechanic') ? <Navigate to="/employee-panel" /> : <DashboardPage onNavigate={handleNavigate} />} />
            <Route path="/dashboard" element={<Navigate to="/" />} />
            <Route path="/business" element={<DashboardV2 onNavigate={handleNavigate} />} />
            <Route path="/money" element={<BankAccountsPage onNavigate={handleNavigate} />} />
            <Route path="/more" element={<MorePage onNavigate={handleNavigate} />} />

            {/* Features */}
            <Route path="/employee-panel" element={<EmployeePanel onNavigate={handleNavigate} userRole={userRole} />} />
            <Route path="/staff-control" element={<ProtectedRoute feature="staff_control"><StaffControlCenter onNavigate={handleNavigate} /></ProtectedRoute>} />
            <Route path="/inventory" element={<InventoryPage onNavigate={(tab, query) => {
              if (tab === 'market_explorer') navigate(`/market-explorer${query ? `?q=${query}` : ''}`); // Simplified query handling or just pass state
              else handleNavigate(tab);
            }} />} />
            <Route path="/horoscope" element={<BusinessHoroscope onNavigate={handleNavigate} />} />
            <Route path="/marketing-tools" element={<MarketingTools onNavigate={handleNavigate} />} />
            <Route path="/whatsapp-marketing" element={<WhatsAppMarketingPage onNavigate={handleNavigate} />} />
            <Route path="/tech-agent" element={<TechAgentPage onNavigate={handleNavigate} />} />
            <Route path="/google-profile" element={<GoogleProfilePage onNavigate={handleNavigate} />} />
            <Route path="/ads" element={<AdsManagerPage />} />
            <Route path="/smart-ads" element={<SmartAdsPage onNavigate={handleNavigate} />} />
            <Route path="/market-explorer" element={<MarketExplorerPage onNavigate={handleNavigate} />} />

            <Route path="/sale-report" element={<ProtectedRoute feature="sale_report"><SaleReportPage onNavigate={handleNavigate} /></ProtectedRoute>} />
            <Route path="/party-statement" element={<PartyStatementPage onNavigate={handleNavigate} />} />
            <Route path="/sales" element={<SalesListPage onNavigate={handleNavigate} />} />
            <Route path="/billing" element={<ProtectedRoute feature="billing"><BillingPage onNavigate={handleNavigate} /></ProtectedRoute>} />
            <Route path="/estimate/new" element={<BillingPage onNavigate={handleNavigate} defaultDocType="Estimate" />} />
            <Route path="/estimate" element={<EstimatePage onNavigate={handleNavigate} />} />
            <Route path="/purchase" element={<ProtectedRoute feature="purchase"><PurchasePage onNavigate={handleNavigate} /></ProtectedRoute>} />
            <Route path="/purchase/new" element={<ProtectedRoute feature="purchase"><PurchaseEntryPage onNavigate={handleNavigate} /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute feature="customers"><CustomersPage onNavigate={handleNavigate} /></ProtectedRoute>} />
            <Route path="/visitors" element={<VisitorsPage onNavigate={handleNavigate} />} />
            <Route path="/stock-wanting" element={<StockWantingPage onNavigate={handleNavigate} />} />
            <Route path="/complaints" element={<ComplaintsPage onNavigate={handleNavigate} />} />
            <Route path="/expenses" element={<ProtectedRoute feature="expenses"><ExpensesPage onNavigate={handleNavigate} /></ProtectedRoute>} />
            <Route path="/reminders" element={<RemindersPage onNavigate={handleNavigate} />} />
            <Route path="/utilities" element={<UtilitiesPage onNavigate={handleNavigate} />} />
            <Route path="/recycle-bin" element={<RecycleBinPage onNavigate={handleNavigate} />} />
            <Route path="/salesmen" element={<SalesmanTrackingPage onNavigate={handleNavigate} />} />
            <Route path="/pickup-scheduling" element={<PickupSchedulingPage onNavigate={handleNavigate} />} />
            <Route path="/field-jobs" element={<FieldJobs onNavigate={handleNavigate} employeeId={authSession?.user.id || ''} employeeName={authSession?.user.name || ''} />} />
            <Route path="/field-service-manager" element={<FieldServiceManagerPage onNavigate={handleNavigate} />} />

            <Route path="/bank-accounts" element={<BankAccountsPage onNavigate={handleNavigate} />} />
            <Route path="/cash-in-hand" element={<CashInHandPage onNavigate={handleNavigate} />} />

            <Route path="/payment-voucher" element={<PaymentVoucherPage onNavigate={handleNavigate} />} />
            <Route path="/payment-receipt" element={<Navigate to="/payment-voucher" replace />} />

            <Route path="/settings/permissions" element={<SettingsPage onNavigate={handleNavigate} initialSection="permissions" />} />
            <Route path="/settings/*" element={<SettingsPage onNavigate={handleNavigate} />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </main>

      {(!location.pathname.includes('billing') && !location.pathname.includes('estimate/new') && !location.pathname.includes('sales') && !location.pathname.includes('complaints') && !location.pathname.includes('field-service-manager') && !location.pathname.includes('field-jobs')) && (
        <nav className="bg-white border-t border-slate-200 flex items-center justify-around py-3 px-2 z-50 no-print shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <BottomNavItem icon={<Home />} label="Home" active={activeTab === 'home'} onClick={() => navigate('/')} />
          <BottomNavItem icon={<BarChart3 />} label="Business" active={activeTab === 'business'} onClick={() => navigate('/business')} />
          <BottomNavItem icon={<DollarSign />} label="Money" active={activeTab === 'money'} onClick={() => navigate('/money')} />
          <BottomNavItem icon={<LayoutGrid />} label="More" active={activeTab === 'more'} onClick={() => navigate('/more')} />
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
