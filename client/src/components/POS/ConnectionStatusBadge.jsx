import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle2, ChevronDown, ListFilter, X } from 'lucide-react';
import { getPendingSales, deletePendingSale } from '../../services/db.js';
import { processPendingSyncQueue } from '../../services/syncEngine.js';

const ConnectionStatusBadge = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState(navigator.onLine ? 'ONLINE' : 'OFFLINE');
  const [pendingItems, setPendingItems] = useState([]);
  const [showQueueModal, setShowQueueModal] = useState(false);

  const refreshQueue = async () => {
    try {
      const list = await getPendingSales();
      setPendingItems(list);
    } catch (err) {
      console.warn('Failed loading pending queue from IndexedDB:', err);
    }
  };

  useEffect(() => {
    refreshQueue();

    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('ONLINE');
      refreshQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('OFFLINE');
      refreshQueue();
    };

    const handleSyncStatusChange = (e) => {
      setSyncStatus(e.detail.status);
      refreshQueue();
    };

    const handleSaleSynced = () => {
      refreshQueue();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('pos_sync_status_changed', handleSyncStatusChange);
    window.addEventListener('pos_sale_synced', handleSaleSynced);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('pos_sync_status_changed', handleSyncStatusChange);
      window.removeEventListener('pos_sale_synced', handleSaleSynced);
    };
  }, []);

  const activePendingCount = pendingItems.filter(i => i.status !== 'synced').length;

  const handleManualSync = async () => {
    setSyncStatus('SYNCING');
    await processPendingSyncQueue();
    await refreshQueue();
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', direction: 'rtl', fontFamily: 'var(--font-ar)' }}>
        {/* Connection Status Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 600,
          background: isOnline ? (syncStatus === 'SYNCING' ? '#eff6ff' : '#f0fdf4') : '#fffbeb',
          color: isOnline ? (syncStatus === 'SYNCING' ? '#2563eb' : '#16a34a') : '#d97706',
          border: `1px solid ${isOnline ? (syncStatus === 'SYNCING' ? '#bfdbfe' : '#bbf7d0') : '#fde68a'}`,
          transition: 'all 0.2s ease'
        }}>
          {!isOnline ? (
            <>
              <WifiOff size={14} />
              <span>أوفلاين (محلي)</span>
            </>
          ) : syncStatus === 'SYNCING' ? (
            <>
              <RefreshCw size={14} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
              <span>جاري المزامنة...</span>
            </>
          ) : syncStatus === 'SYNC_ERROR' ? (
            <>
              <AlertCircle size={14} style={{ color: '#ef4444' }} />
              <span style={{ color: '#ef4444' }}>تعثرت المزامنة</span>
            </>
          ) : (
            <>
              <Wifi size={14} />
              <span>متصل بالشبكة</span>
            </>
          )}
        </div>

        {/* Pending Offline Sales Counter Pill */}
        {activePendingCount > 0 && (
          <button
            onClick={() => setShowQueueModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <ListFilter size={14} />
            <span>{activePendingCount} فواتير معلقة</span>
            <ChevronDown size={14} />
          </button>
        )}
      </div>

      {/* Queue Details Modal */}
      {showQueueModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: '16px',
          direction: 'rtl',
          fontFamily: 'var(--font-ar)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '650px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ListFilter size={20} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  قائمة الفواتير الأوفلاين المعلقة بالمزامنة
                </h3>
              </div>
              <button
                onClick={() => setShowQueueModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content List */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {pendingItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
                  <CheckCircle2 size={40} color="#16a34a" style={{ margin: '0 auto 12px' }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>جميع الفواتير الأوفلاين تم مزامنتها مع السيرفر بنجاح!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pendingItems.map((item) => (
                    <div key={item.id} style={{
                      padding: '14px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      background: item.status === 'synced' ? '#f0fdf4' : (item.status === 'sync_failed' ? '#fef2f2' : '#ffffff'),
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                          فاتورة: {item.invoiceNumber}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          background: item.status === 'synced' ? '#dcfce7' : (item.status === 'sync_failed' ? '#fee2e2' : '#dbeafe'),
                          color: item.status === 'synced' ? '#15803d' : (item.status === 'sync_failed' ? '#b91c1c' : '#1d4ed8')
                        }}>
                          {item.status === 'synced' ? 'تمت المزامنة' : (item.status === 'sync_failed' ? 'فشلت المزامنة' : 'قيد الانتظار')}
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '16px' }}>
                        <span>المبلغ الإجمالي: <strong>{(item.payload?.items || []).reduce((s, i) => s + (i.price * i.qty), 0)} ج.م</strong></span>
                        <span>وقت الإنشاء: {new Date(item.createdAt).toLocaleTimeString('ar-EG')}</span>
                        <span>محاولات: {item.attempts || 0}</span>
                      </div>

                      <div style={{ fontSize: '11px', color: '#94a3b8', wordBreak: 'break-all' }}>
                        ClientRequestId: <code>{item.clientRequestId}</code>
                      </div>

                      {item.lastError && (
                        <div style={{ fontSize: '12px', color: '#dc2626', background: '#fff1f2', padding: '6px 10px', borderRadius: '6px' }}>
                          سبب الخطأ: {item.lastError}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '14px 20px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <button
                onClick={handleManualSync}
                disabled={!isOnline || activePendingCount === 0 || syncStatus === 'SYNCING'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: isOnline && activePendingCount > 0 ? '#2563eb' : '#94a3b8',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: isOnline && activePendingCount > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                <RefreshCw size={14} />
                <span>مزامنة الفواتير الآن</span>
              </button>

              <button
                onClick={() => setShowQueueModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: '#e2e8f0',
                  color: '#334155',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConnectionStatusBadge;
