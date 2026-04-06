
import React, { useState, useEffect, Suspense } from 'react';
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
  Shield,
  Settings,
  LogOut,
  User as UserIcon,
  Wrench,
  Plus,
  Truck
} from 'lucide-react';
import { AuthSession, User } from './types';
import { getSession, login, logout, validateCredentials } from './auth';
import { canAccessRoute } from './permissions';
import { dbService } from './db';
import { NotificationSystem } from './components/NotificationSystem';
import { ErrorBoundary } from './components/ErrorBoundary';

// ── Lazy-load all page components (web-perf + mobile-design skill) ──
// Each page loads only when navigated to, dramatically reducing initial bundle.
const DashboardPage = React.lazy(() => import('./pages/Dashboard'));
const DashboardV2 = React.lazy(() => import('./pages/DashboardV2'));
const CustomersPage = React.lazy(() => import('./pages/Customers'));
const VisitorsPage = React.lazy(() => import('./pages/Visitors'));
const StockWantingPage = React.lazy(() => import('./pages/StockWanting'));
const ComplaintsPage = React.lazy(() => import('./pages/Complaints'));
const BillingPage = React.lazy(() => import('./pages/Billing'));
const SalesListPage = React.lazy(() => import('./pages/SalesList'));
const EstimatePage = React.lazy(() => import('./pages/Estimate'));
const PurchasePage = React.lazy(() => import('./pages/Purchase'));
const PurchaseEntryPage = React.lazy(() => import('./pages/PurchaseEntry'));
const InventoryPage = React.lazy(() => import('./pages/Inventory'));
const ExpensesPage = React.lazy(() => import('./pages/Expenses'));
const RemindersPage = React.lazy(() => import('./pages/Reminders'));
const SettingsPage = React.lazy(() => import('./pages/Settings'));
const SaleReportPage = React.lazy(() => import('./pages/SaleReport'));
const PartyStatementPage = React.lazy(() => import('./pages/PartyStatement'));
const UtilitiesPage = React.lazy(() => import('./pages/Utilities'));
const SalesmanTrackingPage = React.lazy(() => import('./pages/SalesmanTracking'));
const EmployeePanel = React.lazy(() => import('./pages/EmployeePanel'));
const StaffControlCenter = React.lazy(() => import('./pages/StaffControlCenter'));
const RecycleBinPage = React.lazy(() => import('./pages/RecycleBin'));
const BankAccountsPage = React.lazy(() => import('./pages/BankAccounts'));
const CashInHandPage = React.lazy(() => import('./pages/CashInHand'));
const FieldJobs = React.lazy(() => import('./pages/FieldJobs'));
const FieldServiceManagerPage = React.lazy(() => import('./pages/FieldServiceManager'));
const MorePage = React.lazy(() => import('./pages/More'));
const LoginPage = React.lazy(() => import('./pages/Login'));
const PaymentVoucherPage = React.lazy(() => import('./pages/PaymentVoucher'));
const CloudSyncPage = React.lazy(() => import('./pages/CloudSync'));
const CustomerBooking = React.lazy(() => import('./pages/CustomerBooking'));
const PickupManagerPage = React.lazy(() => import('./pages/PickupManager'));
const PickupBoyPanel = React.lazy(() => import('./pages/PickupBoyPanel'));
const AuditLogsPage = React.lazy(() => import('./pages/AuditLogs'));

// ── Suspense fallback spinner (skill: always show loading state) ──
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]" aria-label="Loading page">
    <div className="text-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-sm text-slate-500">Loading...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
      console.log(`[Auth] Attempting login for user: ${credentials.username}`);
      const users = await dbService.getUsers();
      console.log(`[Auth] Found ${users.length} users in database.`);
      
      const user = await validateCredentials(credentials.username, credentials.password, users);

      if (!user) {
        console.warn(`[Auth] Login failed for user: ${credentials.username}`);
        throw new Error('Invalid username or password');
      }

      console.log(`[Auth] Login successful for user: ${user.username} (${user.role})`);
      const session = login(user);
      setAuthSession(session);
    } catch (error: any) {
      console.error(`[Auth] Login error:`, error);
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
        'tech_agent': '/tech-agent',
        'sale_report': '/sale-report',
        'party_statement': '/party-statement',
        'new_estimate': '/estimate/new',
        'bank_accounts': '/money',
        'cash_in_hand': '/cash-in-hand',
        'payment_voucher': '/payment-voucher', // Keep for backward compatibility
        'payment_receipt': '/payment-voucher',
        'payment_in': '/payment-voucher',
        'payment_out': '/payment-out',
        'employee_panel': '/employee-panel',
        'stock_wanting': '/stock-wanting',
        'new_sale': '/billing',
        'recycle_bin': '/recycle-bin',
        'field_jobs': '/field-jobs',
        'field_service_manager': '/field-service-manager',
        'cloud_sync': '/cloud-sync',
        'pickup_manager': '/pickup-manager',
        'audit_logs': '/audit-logs'
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

  // Public route: Customer Booking page (no auth required)
  if (location.pathname === '/booking') {
    return <CustomerBooking />;
  }

  // Show login page if not authenticated
  if (!authSession) {
    return <LoginPage onLogin={handleLogin} error={loginError} />;
  }

  const userRole = authSession.user.role;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden text-slate-900">
      {location.pathname !== '/market-explorer' && location.pathname !== '/horoscope' && location.pathname !== '/tech-agent' && (
        <header
          className="bg-white px-6 py-3 flex items-center justify-between sticky top-0 z-40 no-print"
          style={{ 
            borderBottom: '1px solid #E2E8F0',
            boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 4px 20px rgba(3,105,161,0.04)'
          }}
        >
          <div className="flex items-center gap-3">
            <div style={{
              width: 38, height: 38,
              background: 'var(--gradient-cta)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(3,105,161,0.3)',
              position: 'relative',
            }} className="animate-pulse-slow">
              <Wrench size={20} color="white" />
            </div>
            <div className="flex flex-col">
              <h1 style={{ fontFamily: "'Fira Code', monospace", fontWeight: 700, fontSize: '1.1rem', color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1 }}>
                MOTO GEAR <span style={{ color: '#0369A1' }}>SRK</span>
              </h1>
              <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '0.6rem', color: '#64748B', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 2 }}>
                // PRO TERMINAL
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isOffline && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-md" title="Data saved locally. Will sync when reconnected.">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '0.7rem', fontWeight: 600, color: '#B45309', textTransform: 'uppercase' }}>
                  Offline Mode
                </span>
              </div>
            )}

            {/* User Role Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6 }}>
              <UserIcon className="w-3.5 h-3.5 text-slate-500" />
              <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '0.7rem', fontWeight: 600, color: '#0F172A', textTransform: 'uppercase' }}>
                {authSession.user.name}
              </span>
              <span style={{ fontFamily: "'Fira Sans', sans-serif", fontSize: '0.7rem', color: '#94A3B8' }}>({userRole})</span>
            </div>

            {canAccessRoute(userRole, 'staff_control') && (
              <button
                onClick={() => navigate('/staff-control')}
                aria-label="Staff Control Center"
                className="p-2 text-slate-500 hover:text-[#0369A1] hover:bg-slate-100 transition-colors rounded-md"
              >
                <Shield className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => navigate('/settings')}
              aria-label="Settings"
              className="p-2 text-slate-500 hover:text-[#0369A1] hover:bg-slate-100 transition-colors rounded-md"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              aria-label="Logout"
              className="p-2 text-red-500 hover:text-white hover:bg-red-600 transition-all rounded-md"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>
      )}

      <main className={`flex-1 overflow-y-auto relative no-scrollbar ${location.pathname.includes('billing') || location.pathname.includes('estimate/new') || location.pathname.includes('sales') || location.pathname.includes('complaints') || location.pathname.includes('field-service-manager') || location.pathname.includes('field-jobs') ? 'pb-0' : ''}`}>
        <div className={location.pathname === '/business' ? '' : `max-w-screen-xl mx-auto px-4 pt-4`}>
          <Suspense fallback={<PageLoader />}>
          <ErrorBoundary>
            <Routes>
              {/* Core Tabs */}
              <Route path="/" element={
                userRole === 'pickup_boy' ? <Navigate to="/pickup-panel" /> :
                (userRole === 'employee' || userRole === 'mechanic') ? <Navigate to="/employee-panel" /> :
                <DashboardPage onNavigate={handleNavigate} />
              } />
              <Route path="/dashboard" element={<Navigate to="/" />} />
              <Route path="/business" element={<DashboardV2 onNavigate={handleNavigate} />} />
              <Route path="/money" element={<BankAccountsPage onNavigate={handleNavigate} />} />
              <Route path="/more" element={<MorePage onNavigate={handleNavigate} userRole={userRole} />} />

              {/* Features */}
              <Route path="/employee-panel" element={<EmployeePanel onNavigate={handleNavigate} userRole={userRole} />} />
              <Route path="/pickup-panel" element={<PickupBoyPanel onNavigate={handleNavigate} />} />
              <Route path="/staff-control" element={<ProtectedRoute feature="staff_control"><StaffControlCenter onNavigate={handleNavigate} /></ProtectedRoute>} />
              <Route path="/inventory" element={<InventoryPage onNavigate={(tab, query) => {
                if (tab === 'market_explorer') navigate(`/market-explorer${query ? `?q=${query}` : ''}`); // Simplified query handling or just pass state
                else handleNavigate(tab);
              }} />} />
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
              <Route path="/field-jobs" element={<FieldJobs onNavigate={handleNavigate} employeeId={authSession?.user.id || ''} employeeName={authSession?.user.name || ''} />} />
              <Route path="/field-service-manager" element={<FieldServiceManagerPage onNavigate={handleNavigate} />} />

              <Route path="/bank-accounts" element={<BankAccountsPage onNavigate={handleNavigate} />} />
              <Route path="/cash-in-hand" element={<CashInHandPage onNavigate={handleNavigate} />} />

              <Route path="/payment-voucher" element={<PaymentVoucherPage onNavigate={handleNavigate} initialMode="receipt" />} />
              <Route path="/payment-receipt" element={<Navigate to="/payment-voucher" replace />} />
              <Route path="/payment-out" element={<PaymentVoucherPage onNavigate={handleNavigate} initialMode="payment" />} />

              <Route path="/settings/permissions" element={<SettingsPage onNavigate={handleNavigate} initialSection="permissions" />} />
              <Route path="/settings/*" element={<SettingsPage onNavigate={handleNavigate} />} />
              <Route path="/cloud-sync" element={<CloudSyncPage onNavigate={handleNavigate} />} />

              <Route path="/pickup-manager" element={<PickupManagerPage onNavigate={handleNavigate} />} />
              <Route path="/audit-logs" element={<ProtectedRoute feature="staff_control"><AuditLogsPage onNavigate={handleNavigate} /></ProtectedRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </ErrorBoundary>
          </Suspense>
        </div>
      </main>

      {(!location.pathname.includes('billing') && !location.pathname.includes('estimate/new') && !location.pathname.includes('sales') && !location.pathname.includes('complaints') && !location.pathname.includes('field-service-manager') && !location.pathname.includes('field-jobs')) && (
        <div className="relative">
          {/* Central FAB */}
          <div className="absolute left-1/2 -top-6 -translate-x-1/2 z-[60] no-print">
            <button
              onClick={() => navigate('/complaints')}
              className="flex items-center justify-center w-14 h-14 rounded-full text-white shadow-[0_8px_30px_rgba(3,105,161,0.4)] hover:-translate-y-1 transition-all active:scale-95 btn-shimmer"
              style={{ background: 'var(--gradient-cta)', border: '4px solid white' }}
              aria-label="New Job"
            >
              <Plus className="w-8 h-8" strokeWidth={2.5} />
            </button>
          </div>
          
          <nav
            className="bg-white flex items-center justify-between py-2 px-2 z-50 no-print safe-area-bottom relative"
            style={{ 
              borderTop: '1px solid #E2E8F0',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.03)'
            }}
          >
            {userRole === 'pickup_boy' ? (
              /* Pickup Boy: simplified nav */
              <div className="flex justify-around w-full">
                <BottomNavItem icon={<Truck />} label="Pickups" active={activeTab === 'pickup-panel'} onClick={() => navigate('/pickup-panel')} />
                <BottomNavItem icon={<Settings />} label="Profile" active={activeTab === 'settings'} onClick={() => navigate('/settings')} />
              </div>
            ) : userRole === 'mechanic' ? (
              /* Mechanic: focused nav */
              <div className="flex justify-around w-full">
                <BottomNavItem icon={<Home />} label="My Jobs" active={activeTab === 'employee-panel'} onClick={() => navigate('/employee-panel')} />
                <BottomNavItem icon={<Settings />} label="Profile" active={activeTab === 'settings'} onClick={() => navigate('/settings')} />
              </div>
            ) : (
              /* Admin / Manager / Employee: full nav */
              <>
                <div className="flex justify-around w-full max-w-[45%]">
                  <BottomNavItem icon={<Home />} label="Home" active={activeTab === 'home'} onClick={() => navigate('/')} />
                  <BottomNavItem icon={<BarChart3 />} label="Business" active={activeTab === 'business'} onClick={() => navigate('/business')} />
                </div>
                
                {/* Empty space for the FAB */}
                <div className="w-[10%] min-w-[60px]" aria-hidden="true" />
                
                <div className="flex justify-around w-full max-w-[45%]">
                  <BottomNavItem icon={<DollarSign />} label="Money" active={activeTab === 'money'} onClick={() => navigate('/money')} />
                  <BottomNavItem icon={<LayoutGrid />} label="More" active={activeTab === 'more'} onClick={() => navigate('/more')} />
                </div>
              </>
            )}
          </nav>
        </div>
      )}

      {/* Global Notifications Overlay */}
      <NotificationSystem />
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
    aria-label={label}
    aria-current={active ? 'page' : undefined}
    className="flex flex-col items-center gap-1 min-w-[70px] relative transition-all duration-200"
    style={{ padding: '0.5rem 0' }}
  >
    <div style={{
      color: active ? '#0369A1' : '#94A3B8',
      background: active ? 'rgba(3, 105, 161, 0.08)' : 'transparent',
      padding: '6px 16px',
      borderRadius: '12px',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {React.cloneElement(icon as React.ReactElement<any>, { 
        className: `w-[22px] h-[22px] transition-transform duration-200 ${active ? 'scale-110' : ''}` 
      })}
    </div>
    <span style={{
      fontFamily: "'Fira Code', monospace",
      fontSize: '0.6rem',
      fontWeight: active ? 700 : 500,
      color: active ? '#0F172A' : '#64748B',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginTop: '2px'
    }}>
      {label}
    </span>
  </button>
);

export default App;
