import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import OfflineBanner from './components/Common/OfflineBanner';
import { ShieldAlert, Loader2 } from 'lucide-react';

// Lazy-loaded Page Routes for Code Splitting & Performance
const Landing = lazy(() => import('./pages/Landing'));
const Advisor = lazy(() => import('./pages/Advisor'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const POS = lazy(() => import('./pages/POS'));
const Products = lazy(() => import('./pages/Products'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Customers = lazy(() => import('./pages/Customers'));
const Reports = lazy(() => import('./pages/Reports'));
const Users = lazy(() => import('./pages/Users'));
const Branches = lazy(() => import('./pages/Branches'));
const Billing = lazy(() => import('./pages/Billing'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Login = lazy(() => import('./pages/Login'));
const PriceChecker = lazy(() => import('./pages/PriceChecker'));
const CashierShift = lazy(() => import('./pages/CashierShift'));
const TransferLogs = lazy(() => import('./pages/TransferLogs'));
const Returns = lazy(() => import('./pages/Returns'));
const PurchaseOrders = lazy(() => import('./pages/PurchaseOrders'));

// Accounting & Ledger Pages (Phase 15.2)
const JournalEntries = lazy(() => import('./pages/JournalEntries'));
const Ledger = lazy(() => import('./pages/Ledger'));
const TrialBalance = lazy(() => import('./pages/TrialBalance'));
const ChartOfAccounts = lazy(() => import('./pages/ChartOfAccounts'));

// Loading Fallback Component
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', flexDirection: 'column', gap: '12px', color: 'var(--primary)', fontFamily: 'var(--font-ar)' }}>
    <Loader2 size={36} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>جاري تحميل الصفحة...</span>
  </div>
);

// Route Access Wrapper Guard
const AuthWrapper = ({ role, allowedRoles, children }) => {
  if (!allowedRoles.includes(role)) {
    return (
      <div style={{
        padding: '48px',
        textAlign: 'center',
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        maxWidth: '500px',
        margin: '60px auto',
        fontFamily: 'var(--font-ar)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '50%', marginBottom: '20px' }}>
          <ShieldAlert size={48} />
        </div>
        <h2 style={{ fontSize: '20px', color: 'var(--text-main)', marginBottom: '8px', fontWeight: 'bold' }}>صلاحية الوصول غير كافية 🔒</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
          هذه الصفحة مخصصة لمدراء النظام والمحاسبين فقط. يرجى مراجعة إدارة الفرع للحصول على صلاحيات الترقية.
        </p>
      </div>
    );
  }
  return children;
};

function App() {
  const [user, setUser] = useState(() => {
    return JSON.parse(localStorage.getItem('mizan_user')) || null;
  });

  React.useEffect(() => {
    document.title = 'Orbion ERP';
    let themeKey = 'mizan_theme';
    if (user) {
      themeKey = `mizan_theme_${user.email || user.role}`;
    }
    const theme = localStorage.getItem(themeKey) || 'light';
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('mizan_token');
    localStorage.removeItem('mizan_user');
    setUser(null);
  };

  // Define Home Redirect based on specific role
  const getHomeElement = () => {
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'staff') return <Navigate to="/price-checker" replace />;
    if (user.role === 'cashier') return <Navigate to="/pos" replace />;
    return <Dashboard />;
  };

  return (
    <Router>
      <OfflineBanner />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Marketing Routes (Always Accessible, Default Entry Point '/' = Landing) */}
          <Route path="/" element={<Landing user={user} />} />
          <Route path="/landing" element={<Landing user={user} />} />
          <Route path="/pricing" element={<Landing user={user} />} />
          <Route path="/advisor" element={<Advisor />} />

          {/* Auth & Registration Routes */}
          <Route path="/login" element={
            user ? (user.role === 'admin' || user.role === 'SUPER_ADMIN' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />)
                 : <Login onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />
          } />
          
          <Route path="/register" element={
            user ? <Navigate to="/dashboard" replace /> : <Advisor />
          } />

          <Route path="/demo" element={
            user ? <Navigate to="/dashboard" replace /> : <Login onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />
          } />

          {/* Protected Super Admin Route */}
          <Route path="/admin" element={
            !user ? <Navigate to="/login" replace /> : (
              (user.role === 'admin' || user.role === 'SUPER_ADMIN') ? (
                <AdminPanel user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            )
          } />

          {/* Protected ERP Internal Routes Wrapped inside Layout */}
          <Route path="*" element={
            !user ? <Navigate to="/login" replace /> : (
              <Layout onLogout={handleLogout}>
                <Routes>
                  <Route path="/dashboard" element={getHomeElement()} />
                  <Route path="/price-checker" element={
                    <AuthWrapper role={user.role} allowedRoles={['owner', 'manager', 'cashier', 'staff', 'accountant']}>
                      <PriceChecker />
                    </AuthWrapper>
                  } />
                  <Route path="/pos" element={
                    <AuthWrapper role={user.role} allowedRoles={['owner', 'manager', 'cashier']}>
                      <POS />
                    </AuthWrapper>
                  } />
                  <Route path="/products" element={
                    <AuthWrapper role={user.role} allowedRoles={['owner', 'manager', 'accountant']}>
                      <Products />
                    </AuthWrapper>
                  } />
                  <Route path="/inventory" element={
                    <AuthWrapper role={user.role} allowedRoles={['owner', 'manager', 'staff', 'accountant']}>
                      <Inventory />
                    </AuthWrapper>
                  } />
                  <Route path="/suppliers" element={
                    <AuthWrapper role={user.role} allowedRoles={['owner', 'manager', 'accountant']}>
                      <Suppliers />
                    </AuthWrapper>
                  } />
                  <Route path="/purchase-orders" element={
                    <AuthWrapper role={user.role} allowedRoles={['owner', 'manager', 'accountant']}>
                      <PurchaseOrders />
                    </AuthWrapper>
                  } />
                  <Route path="/customers" element={
                    <AuthWrapper role={user.role} allowedRoles={['owner', 'manager', 'accountant']}>
                      <Customers />
                    </AuthWrapper>
                  } />

                  {/* Accountant & Double-Entry Accounting Routes */}
                  <Route path="/accounting/journal-entries" element={
                    <AuthWrapper role={user.role} allowedRoles={['owner', 'manager', 'accountant']}>
                      <JournalEntries />
                    </AuthWrapper>
                  } />
                  <Route path="/accounting/ledger" element={
                    <AuthWrapper role={user.role} allowedRoles={['owner', 'manager', 'accountant']}>
                      <Ledger />
                    </AuthWrapper>
                  } />
                  <Route path="/accounting/trial-balance" element={
                    <AuthWrapper role={user.role} allowedRoles={['owner', 'manager', 'accountant']}>
                      <TrialBalance />
                    </AuthWrapper>
                  } />
                  <Route path="/accounting/chart-of-accounts" element={
                    <AuthWrapper role={user.role} allowedRoles={['owner', 'manager', 'accountant']}>
                      <ChartOfAccounts />
                    </AuthWrapper>
                  } />

                  <Route path="/reports" element={
                    <AuthWrapper role={user.role} allowedRoles={['owner', 'manager', 'accountant']}>
                      <Reports />
                    </AuthWrapper>
                  } />
                  <Route path="/users" element={
                    <AuthWrapper role={user.role} allowedRoles={['owner']}>
                      <Users />
                    </AuthWrapper>
                  } />
                  <Route path="/branches" element={
                    <AuthWrapper role={user.role} allowedRoles={['owner', 'manager']}>
                      <Branches />
                    </AuthWrapper>
                  } />
                  <Route path="/cashier-shift" element={
                    <AuthWrapper role={user.role} allowedRoles={['owner', 'manager', 'cashier', 'accountant']}>
                      <CashierShift />
                    </AuthWrapper>
                  } />
                  <Route path="/returns" element={
                    <AuthWrapper role={user.role} allowedRoles={['owner', 'manager', 'cashier', 'accountant']}>
                      <Returns />
                    </AuthWrapper>
                  } />
                  <Route path="/billing" element={
                    <AuthWrapper role={user.role} allowedRoles={['owner']}>
                      <Billing />
                    </AuthWrapper>
                  } />
                  <Route path="/settings" element={
                    <AuthWrapper role={user.role} allowedRoles={['owner', 'manager']}>
                      <Settings />
                    </AuthWrapper>
                  } />
                  <Route path="/expenses" element={
                    <AuthWrapper role={user.role} allowedRoles={['owner', 'manager', 'accountant']}>
                      <Expenses />
                    </AuthWrapper>
                  } />
                  <Route path="/transfer-logs" element={
                    <AuthWrapper role={user.role} allowedRoles={['owner', 'manager', 'accountant']}>
                      <TransferLogs />
                    </AuthWrapper>
                  } />
                  {/* Catch-all redirects */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            )
          } />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
