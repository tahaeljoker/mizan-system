import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Suppliers from './pages/Suppliers';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Branches from './pages/Branches';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import AdminPanel from './pages/AdminPanel';
import Expenses from './pages/Expenses';
import Login from './pages/Login';
import PriceChecker from './pages/PriceChecker';
import CashierShift from './pages/CashierShift';
import TransferLogs from './pages/TransferLogs';
import Returns from './pages/Returns';
import { ShieldAlert } from 'lucide-react';

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
          هذه الصفحة مخصصة لمدراء النظام وملاك المحل فقط. يرجى مراجعة إدارة الفرع أو المالك للحصول على صلاحيات الترقية.
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
    localStorage.removeItem('mizan_user');
    setUser(null);
  };

  // If not logged in, render the login page
  if (!user) {
    return <Login onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  // If logged in as Super Admin, route all to Admin Panel directly
  if (user.role === 'admin') {
    return (
      <Router>
        <Routes>
          <Route path="/admin" element={<AdminPanel user={user} onLogout={handleLogout} />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Router>
    );
  }

  // Define Home Redirect based on specific role
  const getHomeElement = () => {
    if (user.role === 'staff') return <Navigate to="/price-checker" replace />;
    if (user.role === 'cashier') return <Navigate to="/pos" replace />;
    return <Dashboard />;
  };

  // Regular shop workspace
  return (
    <Router>
      <Layout onLogout={handleLogout}>
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
      </Layout>
    </Router>
  );
}

export default App;
