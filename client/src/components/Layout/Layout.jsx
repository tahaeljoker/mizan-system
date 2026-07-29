import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Sparkles, LogOut, RefreshCw } from 'lucide-react';
import apiService from '../../services/api';

const Layout = ({ children, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const user = JSON.parse(localStorage.getItem('mizan_user')) || null;
  const isDemoUser = user?.email?.endsWith('@demo.madar.app') || user?.tenantName === 'Madar Demo';

  const [resetting, setResetting] = useState(false);

  const handleManualDemoReset = async () => {
    if (!window.confirm('هل تريد إعادة ضبط بيانات البيئة التجريبية الآن؟')) return;
    setResetting(true);
    try {
      await apiService.demo.reset();
      alert('تم إعادة ضبط بيانات البيئة التجريبية بنجاح! 🔄');
      window.location.reload();
    } catch (err) {
      alert('حدث خطأ في إعادة الضبط: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="app-container" style={{ paddingTop: isDemoUser ? '44px' : '0' }}>
      {/* Persistent Demo Sandbox Banner */}
      {isDemoUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '44px',
          background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
          color: '#ffffff',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          fontSize: '13px',
          fontWeight: '600',
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
          fontFamily: 'var(--font-ar)'
        }}>
          <div className="flex align-center gap-8">
            <Sparkles size={16} />
            <span>أنت تستخدم بيئة مدار العرض التوضيحية (Madar Demo Environment). البيانات للتجربة فقط وتُرست دورياً.</span>
          </div>

          <div className="flex align-center gap-12">
            <button 
              onClick={handleManualDemoReset} 
              disabled={resetting}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <RefreshCw size={12} className={resetting ? 'spin-animation' : ''} />
              <span>{resetting ? 'جاري الضبط...' : 'إعادة ضبط البيانات'}</span>
            </button>
            <button 
              onClick={onLogout}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px'
              }}
            >
              <LogOut size={14} />
              <span>خروج</span>
            </button>
          </div>
        </div>
      )}

      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="main-content flex-column">
        <Header toggleSidebar={toggleSidebar} />
        
        <main className="content-body" style={{ flex: 1, padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
