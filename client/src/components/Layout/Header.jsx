import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Bell, Menu, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';

const Header = ({ toggleSidebar }) => {
  const queryClient = useQueryClient();
  const [showNotifications, setShowNotifications] = useState(false);

  // Unread Count Query with 15s polling
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadNotificationCount'],
    queryFn: () => apiService.workflow.getUnreadCount(),
    refetchInterval: 15000
  });

  // Notifications List Query
  const { data: notificationsData } = useQuery({
    queryKey: ['notificationsList'],
    queryFn: () => apiService.workflow.getNotifications({ limit: 10 })
  });

  const notifications = notificationsData?.data || notificationsData || [];

  const markAllReadMutation = useMutation({
    mutationFn: () => apiService.workflow.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
      queryClient.invalidateQueries({ queryKey: ['notificationsList'] });
    }
  });

  const handleOpenNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      markAllReadMutation.mutate();
    }
  };

  const isShiftOpen = localStorage.getItem('mizan_shift_open') === 'true';

  return (
    <header className="header" style={{ position: 'relative' }}>
      <div className="flex align-center gap-16">
        <button className="menu-toggle" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        <div className="header-search">
          <Search size={18} />
          <input type="text" placeholder="البحث السريع في ميزان..." />
        </div>
      </div>

      <div className="header-actions" style={{ gap: '12px' }}>
        {/* Trial Warning Badge */}
        <Link to="/billing" className="badge warning trial-warning-badge" style={{ cursor: 'pointer', padding: '8px 12px', display: 'flex', gap: '6px', alignItems: 'center' }}>
          <Sparkles size={14} />
          <span className="trial-text">النظام مفعّل بالسحابة السريعة</span>
        </Link>

        {/* Notifications Bell with Popover */}
        <div style={{ position: 'relative' }}>
          <div 
            className="action-btn" 
            onClick={handleOpenNotifications}
            style={{ cursor: 'pointer', position: 'relative' }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                minWidth: '16px',
                height: '16px',
                padding: '0 4px',
                borderRadius: '8px',
                background: 'var(--danger)',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 4px var(--danger)'
              }}>
                {unreadCount}
              </span>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '260px', overflowY: 'auto' }}>
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div key={n._id || n.id} style={{
                      padding: '10px 12px',
                      background: 'var(--bg-main)',
                      borderRadius: '6px',
                      borderRight: `4px solid ${n.type === 'SUCCESS' ? '#10b981' : n.type === 'WARNING' || n.type === 'ERROR' ? '#ef4444' : '#3b82f6'}`,
                      fontSize: '12px'
                    }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px' }}>{n.title}</div>
                      <p style={{ margin: '0 0 6px 0', color: 'var(--text-muted)', lineHeight: '1.4' }}>{n.message}</p>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleTimeString('ar-EG')}</span>
                    </div>
                  ))
                ) : (
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
