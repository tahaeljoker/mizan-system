import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import apiService from '../services/api';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      const response = await apiService.auth.login(cleanEmail, cleanPassword);
      if (response.success) {
        onLoginSuccess(response.user);
      } else {
        setError(response.message || 'خطأ في البريد الإلكتروني أو كلمة المرور!');
      }
    } catch (err) {
      console.warn('Backend login attempt error:', err.message);
      const apiErrorMessage = err.response?.data?.message || err.message;
      
      // Fallback for default offline owner account
      if (cleanEmail === 'owner@mizan.com' && cleanPassword === '01143632650taha') {
        const shopUser = { role: 'owner', email: cleanEmail, name: 'طه أنس (مالك المحل)' };
        localStorage.setItem('mizan_user', JSON.stringify(shopUser));
        onLoginSuccess(shopUser);
      } else {
        setError(apiErrorMessage || 'خطأ في بيانات الدخول! يرجى التأكد من البريد وكلمة المرور.');
      }
    } finally {
      setLoading(false);
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
      padding: '30px 20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg), 0 20px 40px rgba(0, 0, 0, 0.04)',
        padding: '36px'
      }}>
        {/* Form Container */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: '#fff',
            borderRadius: '16px',
            marginBottom: '16px',
            boxShadow: '0 8px 16px rgba(79, 70, 229, 0.2)'
          }}>
            <ShoppingBag size={30} />
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px' }}>Orbion ERP Cloud</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginBottom: '24px' }}>تسجيل الدخول لإدارة نشاطك التجاري</p>

          {error && (
            <div style={{
              background: 'var(--danger-glow)',
              color: 'var(--danger)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '12.5px',
              marginBottom: '16px',
              textAlign: 'right'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ textAlign: 'right' }}>
            <div className="form-group mb-16">
              <label style={{ fontSize: '13px', fontWeight: '600' }}>البريد الإلكتروني</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@company.com"
                  autoComplete="username"
                  style={{ paddingRight: '40px', direction: 'ltr' }}
                  required
                />
                <Mail size={18} style={{ position: 'absolute', top: '14px', right: '14px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group mb-24">
              <label style={{ fontSize: '13px', fontWeight: '600' }}>كلمة المرور</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  style={{ paddingRight: '40px', direction: 'ltr' }}
                  required
                />
                <Lock size={18} style={{ position: 'absolute', top: '14px', right: '14px', color: 'var(--text-muted)' }} />
                <div
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', top: '14px', left: '14px', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '15px' }} disabled={loading}>
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول للنظام'}
            </button>

            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px', textAlign: 'center', fontSize: '13.5px', color: 'var(--text-muted)' }}>
              <span>ليس لديك حساب بعد؟ </span>
              <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none' }}>
                إنشاء حساب مؤسسة جديد (14 يوم مجاناً)
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
