import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import { ShieldAlert, Loader2 } from 'lucide-react';

// Lazy-loaded Page Routes for Code Splitting & Performance
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

// Loading Fallback Component
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', flexDirection: 'column', gap: '12px', color: 'var(--primary)' }}>
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
          هذه الصفحة مخصصة لمدراء النظام وملاك المحل فقط. يرجى مراجعة إدارة الفرع للحصول على صلاحيات الترقية.
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

  // If not logged in, render login page
  if (!user) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Login onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />
      </Suspense>
    );
  }

  // If logged in as Super Admin, route all to Admin Panel directly
  if (user.role === 'admin') {
    return (
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/admin" element={<AdminPanel user={user} onLogout={handleLogout} />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </Suspense>
      </Router>
    );
  }

  // Define Home Redirect based on specific role
  const getHomeElement = () => {
    if (user.role === 'staff') return <Navigate to="/price-checker" replace />;
    if (user.role === 'cashier') return <Navigate to="/pos" replace />;
    return <Dashboard />;
  };

  return (
    <Router>
      <Layout onLogout={handleLogout}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={getHomeElement()} />
            <Route path="/price-checker" element={
              <AuthWrapper role={user.role} allowedRoles={['owner', 'manager', 'cashier', 'staff']}>
                <PriceChecker />
              </AuthWrapper>
            } />
            <Route path="/pos" element={
              <AuthWrapper role={user.role} allowedRoles={['owner', 'manager', 'cashier']}>
                <POS />
              </AuthWrapper>
            } />
            <Route path="/products" element={
              <AuthWrapper role={user.role} allowedRoles={['owner', 'manager']}>
                <Products />
              </AuthWrapper>
            } />
            <Route path="/inventory" element={
              <AuthWrapper role={user.role} allowedRoles={['owner', 'manager', 'staff']}>
                <Inventory />
              </AuthWrapper>
            } />
            <Route path="/suppliers" element={
              <AuthWrapper role={user.role} allowedRoles={['owner', 'manager']}>
                <Suppliers />
              </AuthWrapper>
            } />
            <Route path="/customers" element={
              <AuthWrapper role={user.role} allowedRoles={['owner', 'manager']}>
                <Customers />
              </AuthWrapper>
            } />
            <Route path="/reports" element={
              <AuthWrapper role={user.role} allowedRoles={['owner', 'manager']}>
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
              <AuthWrapper role={user.role} allowedRoles={['owner', 'manager', 'cashier']}>
                <CashierShift />
              </AuthWrapper>
            } />
            <Route path="/returns" element={
              <AuthWrapper role={user.role} allowedRoles={['owner', 'manager', 'cashier']}>
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
              <AuthWrapper role={user.role} allowedRoles={['owner', 'manager']}>
                <Expenses />
              </AuthWrapper>
            } />
            <Route path="/transfer-logs" element={
              <AuthWrapper role={user.role} allowedRoles={['owner', 'manager']}>
                <TransferLogs />
              </AuthWrapper>
            } />
            {/* Catch-all redirects */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
}

export default App;
