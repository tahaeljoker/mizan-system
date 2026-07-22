import React, { useState } from 'react';
import { Shield, ShoppingBag, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import apiService from '../services/api';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await apiService.auth.login(email, password);
      if (response.success) {
        onLoginSuccess(response.user);
      } else {
        setError(response.message || 'خطأ في البريد الإلكتروني أو كلمة المرور!');
      }
    } catch (err) {
      console.warn('Backend connection failed, falling back to local simulation:', err.message);
      // Credentials matching (Offline fallback)
      if (email === 'admin@mizan.com' && password === '01143632650taha') {
        // Super Admin
        const adminUser = { role: 'admin', email: 'admin@mizan.com', name: 'طه أنس (المشرف)' };
        localStorage.setItem('mizan_user', JSON.stringify(adminUser));
        onLoginSuccess(adminUser);
      } else if ((email === 'shop@mizan.com' || email === 'owner@mizan.com') && password === '01143632650taha') {
        // Demo Shop Owner
        const shopUser = { role: 'owner', email: email, name: 'طه أنس (مالك المحل)', tenantName: 'بوتيك مودابيلا للملابس' };
        localStorage.setItem('mizan_user', JSON.stringify(shopUser));
        onLoginSuccess(shopUser);
      } else if (email === 'manager@mizan.com' && password === '01143632650taha') {
        // Shop Branch Manager
        const managerUser = { role: 'manager', email: 'manager@mizan.com', name: 'سارة أحمد (مدير الفرع)' };
        localStorage.setItem('mizan_user', JSON.stringify(managerUser));
        onLoginSuccess(managerUser);
      } else if (email === 'cashier@mizan.com' && password === '01143632650taha') {
        // Cashier
        const cashierUser = { role: 'cashier', email: 'cashier@mizan.com', name: 'سارة أحمد' };
        localStorage.setItem('mizan_user', JSON.stringify(cashierUser));
        onLoginSuccess(cashierUser);
      } else if (email === 'staff@mizan.com' && password === '01143632650taha') {
        // Inventory Staff
        const staffUser = { role: 'staff', email: 'staff@mizan.com', name: 'كريم محمود' };
        localStorage.setItem('mizan_user', JSON.stringify(staffUser));
        onLoginSuccess(staffUser);
      } else {
        setError('خطأ في البريد الإلكتروني أو كلمة المرور! يرجى المحاولة مرة أخرى.');
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.1) 0%, rgba(124, 58, 237, 0.05) 90.2%), #f8fafc',
      fontFamily: 'var(--font-ar)',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '450px',
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg), 0 20px 40px rgba(0, 0, 0, 0.03)',
        padding: '40px 32px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Soft decorative background circles */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'var(--primary-glow)',
          zIndex: 0
        }}></div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo / Icon */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: '#fff',
            borderRadius: '16px',
            marginBottom: '16px',
            boxShadow: '0 8px 16px rgba(79, 70, 229, 0.2)'
          }}>
            <ShoppingBag size={32} />
          </div>

          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>مِيزان</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' }}>منصة الكاشير الذكية وإدارة المحلات السحابية</p>

          {error && (
            <div style={{
              background: 'var(--danger-glow)',
              color: 'var(--danger)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '13px',
              marginBottom: '20px',
              textAlign: 'right'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ textAlign: 'right' }}>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13.5px', fontWeight: '600' }}>البريد الإلكتروني</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@mizan.com"
                  style={{ paddingRight: '40px', direction: 'ltr' }}
                  required
                />
                <Mail size={18} style={{ position: 'absolute', top: '15px', right: '14px', color: 'var(--text-dark)' }} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '32px' }}>
              <label style={{ fontSize: '13.5px', fontWeight: '600' }}>كلمة المرور</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{ paddingRight: '40px', direction: 'ltr' }}
                  required
                />
                <Lock size={18} style={{ position: 'absolute', top: '15px', right: '14px', color: 'var(--text-dark)' }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    top: '15px',
                    left: '14px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dark)',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '15px',
                fontWeight: '700',
                borderRadius: 'var(--radius-md)'
              }}
            >
              تسجيل الدخول للمنصة
            </button>
          </form>

          {/* Quick instructions / Help tags */}
          <div style={{
            marginTop: '32px',
            borderTop: '1px solid var(--border)',
            paddingTop: '20px',
            textAlign: 'right'
          }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>للتجربة والتحكم السريع:</h4>
            <ul style={{ paddingRight: '20px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>
                <strong>حساب المالك (أدمن المنصة):</strong>
                <div style={{ direction: 'ltr', textAlign: 'left', background: 'var(--bg-main)', padding: '6px', borderRadius: '4px', marginTop: '2px', fontFamily: 'monospace' }}>
                  User: admin@mizan.com / Pass: 01143632650taha
                </div>
              </li>
              <li>
                <strong>حساب المحل (للتجربة والتطوير):</strong>
                <div style={{ direction: 'ltr', textAlign: 'left', background: 'var(--bg-main)', padding: '6px', borderRadius: '4px', marginTop: '2px', fontFamily: 'monospace' }}>
                  User: shop@mizan.com / Pass: 01143632650taha
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
