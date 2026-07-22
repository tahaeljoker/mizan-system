import React, { useState } from 'react';
import { Search, Bell, Menu, Sparkles, X, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header = ({ toggleSidebar }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const isShiftOpen = localStorage.getItem('mizan_shift_open') === 'true';

  // Load notifications from local storage log
  const notifications = JSON.parse(localStorage.getItem('mizan_notifications_log')) || [
    { text: 'مرحباً بك في منصة ميزان! تم تفعيل حسابك بنجاح ونقله إلى خوادم السحابة الفعالة.', type: 'success', date: '2026-07-12 01:10' }
  ];

  // For unread badge indicator - clear unread dot when popover is opened
  const [hasUnread, setHasUnread] = useState(true);

  const handleOpenNotifications = () => {
    setShowNotifications(!showNotifications);
    setHasUnread(false);
  };

  return (
    <header className="header" style={{ position: 'relative' }}>
      <div className="flex align-center gap-16">
        <button className="menu-toggle" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        <div className="header-search">
          <Search size={18} />
          <input type="text" placeholder="البحث السريع..." />
        </div>
      </div>

      <div className="header-actions" style={{ gap: '12px' }}>
        {/* Trial Warning Badge */}
        <Link to="/billing" className="badge warning trial-warning-badge" style={{ cursor: 'pointer', padding: '8px 12px', display: 'flex', gap: '6px', alignItems: 'center' }}>
          <Sparkles size={14} />
          <span className="trial-text">ينتهي التجريب بعد 14 يوم - جدد الآن</span>
        </Link>

        {/* Notifications Bell with Popover */}
        <div style={{ position: 'relative' }}>
          <div 
            className="action-btn" 
            onClick={handleOpenNotifications}
            style={{ cursor: 'pointer', position: 'relative' }}
          >
            <Bell size={20} />
            {hasUnread && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--danger)',
                boxShadow: '0 0 4px var(--danger)'
              }}></span>
            )}
          </div>

          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: '45px',
              left: 0,
              width: '320px',
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg), 0 10px 20px rgba(0,0,0,0.1)',
              zIndex: 9999,
              padding: '16px',
              fontFamily: 'var(--font-ar)',
              direction: 'rtl',
              textAlign: 'right'
            }}>
              <div className="flex justify-between align-center mb-12" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <h4 style={{ fontWeight: 'bold', fontSize: '14px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bell size={16} className="text-primary" />
                  <span>سجل الإشعارات المستلمة 🔔</span>
                </h4>
                <X size={16} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowNotifications(false)} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
                {notifications.map((n, idx) => (
                  <div key={idx} style={{
                    padding: '10px 12px',
                    background: 'var(--bg-main)',
                    borderRadius: '6px',
                    borderRight: `4px solid ${n.type === 'success' ? '#10b981' : n.type === 'warning' ? '#f59e0b' : '#3b82f6'}`,
                    fontSize: '12px'
                  }}>
                    <p style={{ margin: '0 0 6px 0', color: 'var(--text-main)', lineHeight: '1.5' }}>{n.text}</p>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>التاريخ: {n.date}</span>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                    لا توجد إشعارات نشطة حالياً.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Status Indicator */}
        {isShiftOpen && (
          <div className="shift-status-badge flex align-center gap-8" style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
            <span className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></span>
            <span style={{ fontSize: '13px', color: 'var(--success)', fontWeight: 'bold' }}>الشيفت مفتوح</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
