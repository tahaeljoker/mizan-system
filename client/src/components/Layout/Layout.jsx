import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { AlertCircle, Lock, Send, LogOut } from 'lucide-react';

const Layout = ({ children, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Get active session user
  const user = JSON.parse(localStorage.getItem('mizan_user')) || null;

  // Load SaaS Announcement Broadcast
  const broadcast = JSON.parse(localStorage.getItem('mizan_broadcast')) || null;

  // Subscription Expiration checks
  const [isExpired, setIsExpired] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(30);
  const [graceStatus, setGraceStatus] = useState(() => {
    return localStorage.getItem('mizan_grace_status') || 'none'; // 'none', 'pending', 'approved'
  });

  const [isBroadcastDismissed, setIsBroadcastDismissed] = useState(() => {
    const dismissedList = JSON.parse(localStorage.getItem('mizan_dismissed_broadcasts')) || [];
    return broadcast ? dismissedList.includes(broadcast.text) : false;
  });

  const isTargeted = !broadcast ? false : (
    broadcast.target === 'all' || 
    (broadcast.target === 'owner' && user?.role === 'owner') ||
    (broadcast.target === 'manager' && user?.role === 'manager') ||
    (broadcast.target === 'cashier' && (user?.role === 'cashier' || user?.role === 'staff'))
  );

  const handleDismissBroadcast = () => {
    setIsBroadcastDismissed(true);
    const dismissedList = JSON.parse(localStorage.getItem('mizan_dismissed_broadcasts')) || [];
    dismissedList.push(broadcast.text);
    localStorage.setItem('mizan_dismissed_broadcasts', JSON.stringify(dismissedList));

    // Append to the notification history log
    const log = JSON.parse(localStorage.getItem('mizan_notifications_log')) || [];
    if (!log.some(n => n.text === broadcast.text)) {
      log.unshift({
        text: broadcast.text,
        type: broadcast.type,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16)
      });
      localStorage.setItem('mizan_notifications_log', JSON.stringify(log));
    }
  };

  useEffect(() => {
    if (user && (user.role === 'shop' || user.role === 'owner')) {
      // Simulate expiration check
      // Starter plan defaults to trial/expiry
      const expiryStr = user.expiresAt || localStorage.getItem('mizan_tenant_expiry') || '2026-07-26';
      const expiryDate = new Date(expiryStr);
      const today = new Date();
      const diffTime = expiryDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      setDaysRemaining(diffDays);
      if (diffDays <= 0) {
        setIsExpired(true);
      } else {
        setIsExpired(false);
      }
    }
  }, [user]);

  const handleReturnToAdmin = () => {
    const adminUser = { role: 'admin', email: 'admin@mizan.com', name: 'طه أنس (المشرف)' };
    localStorage.setItem('mizan_user', JSON.stringify(adminUser));
    window.location.href = '/admin'; // Redirect back to Admin
  };

  const handleRequestGrace = () => {
    setGraceStatus('pending');
    localStorage.setItem('mizan_grace_status', 'pending');

    // Add to Admin Panel grace requests list
    const requests = JSON.parse(localStorage.getItem('mizan_grace_requests')) || [];
    const newReq = {
      id: 'g_' + Date.now(),
      tenantName: user?.tenantName || 'سوبرماركت المدينة المنورة',
      owner: user?.name?.split('(')[0]?.trim() || 'طه أنس',
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'pending'
    };
    localStorage.setItem('mizan_grace_requests', JSON.stringify([newReq, ...requests]));
    alert('تم إرسال طلب المهلة بنجاح إلى الأدمن طه أنس! سيتم تفعيل حسابك بمجرد الموافقة. 📡');
  };

  return (
    <div className="app-container" style={{ paddingTop: (user?.impersonated || (isTargeted && !isBroadcastDismissed) || (daysRemaining > 0 && daysRemaining <= 3)) ? '50px' : '0' }}>
      
      {/* Support Impersonation Mirroring Alert Bar */}
      {user?.impersonated && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '50px',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: '#fff',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 24px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
          fontFamily: 'var(--font-ar)',
          fontSize: '13px',
          fontWeight: 'bold'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', animation: 'scan-anim 1.5s infinite alternate' }}></span>
            <span>وضع محاكاة الدعم الفني النشط (طه أنس) - تصفح حساب العميل: <span style={{ textDecoration: 'underline' }}>{user.name}</span></span>
          </div>
          <button 
            onClick={handleReturnToAdmin}
            style={{
              background: '#fff',
              color: '#d97706',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            العودة للوحة الأدمن ↩️
          </button>
        </div>
      )}

      {/* Global SaaS Announcement Broadcast Bar */}
      {isTargeted && !isBroadcastDismissed && !user?.impersonated && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '50px',
          background: broadcast.type === 'success' ? '#10b981' : broadcast.type === 'warning' ? '#f59e0b' : '#3b82f6',
          color: '#fff',
          zIndex: 9990,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          fontFamily: 'var(--font-ar)',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          <span>📢 إشعار عام من ميزان: {broadcast.text}</span>
          <button 
            onClick={handleDismissBroadcast}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
              padding: '6px 12px',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: '4px'
            }}
          >
            قرأت الإشعار ✕
          </button>
        </div>
      )}

      {/* Expiry Warning Notification Banner (diffDays <= 3 but not blocked) */}
      {daysRemaining > 0 && daysRemaining <= 3 && !broadcast && !user?.impersonated && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '50px',
          background: '#ef4444',
          color: '#fff',
          zIndex: 9980,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          fontFamily: 'var(--font-ar)',
          fontSize: '13.5px',
          fontWeight: 'bold'
        }}>
          <AlertCircle size={16} />
          <span>تنبيه هام ⚠️: اشتراك متجرك ينتهي خلال {daysRemaining} أيام. يرجى التجديد لتفادي إيقاف واجهة البيع.</span>
        </div>
      )}

      {/* Expiration Lock Screen Overlay */}
      {isExpired && (user?.role === 'shop' || user?.role === 'owner') && (
        <div style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(15, 23, 42, 0.98)',
          color: '#fff',
          zIndex: 100000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'var(--font-ar)',
          direction: 'rtl'
        }}>
          <div className="card" style={{ maxWidth: '480px', background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '32px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '50%', marginBottom: '24px' }}>
              <Lock size={48} />
            </div>
            
            <h2 style={{ fontSize: '24px', color: '#fff', marginBottom: '12px', fontWeight: 'bold' }}>تم تعليق خدمة حساب متجرك لانتهاء الاشتراك 🔒</h2>
            <p style={{ color: '#94a3b8', fontSize: '14.5px', lineHeight: '1.6', marginBottom: '24px' }}>
              عذراً! انتهت صلاحية اشتراك متجرك بالكامل على منصة ميزان. يرجى تحويل قيمة الباقة المطلوبة على حساب انستا باي المعتمد وتفعيل الحساب:
            </p>

            <div style={{ background: '#0f172a', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '13.5px', border: '1px dashed #334155', textAlign: 'right' }}>
              <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '8px' }}>تفاصيل التحويل (InstaPay):</strong>
              <div style={{ color: '#e2e8f0', marginBottom: '6px' }}>رقم انستا باي: <strong>01143632650</strong></div>
              <div style={{ color: '#e2e8f0' }}>اسم المستلم بالتطبيق: <strong>طه أنس</strong></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {graceStatus === 'pending' ? (
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '12px', borderRadius: '8px', fontSize: '13px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  ⏳ تم إرسال طلب مهلة السماح. بانتظار تفعيل الأدمن طه أنس لـ 3 أيام إضافية.
                </div>
              ) : (
                <button 
                  onClick={handleRequestGrace}
                  className="btn btn-secondary w-full"
                  style={{ padding: '12px', display: 'flex', gap: '8px', justifyContent: 'center', borderColor: '#334155', color: '#fff' }}
                >
                  <Send size={16} />
                  <span>طلب مهلة سماح طارئة (3 أيام) ⏳</span>
                </button>
              )}

              <button 
                onClick={() => {
                  window.location.href = '/billing';
                }}
                className="btn btn-primary w-full"
                style={{ padding: '12px', background: '#3b82f6' }}
              >
                الذهاب لصفحة تجديد الاشتراك الدفع
              </button>

              <button 
                onClick={onLogout}
                className="btn btn-danger w-full"
                style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: 'none', display: 'flex', gap: '8px', justifyContent: 'center' }}
              >
                <LogOut size={16} />
                <span>تسجيل الخروج من الحساب</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} onLogout={onLogout} />
      <div className="main-content">
        <Header toggleSidebar={toggleSidebar} />
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
