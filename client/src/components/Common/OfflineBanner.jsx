import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#ef4444',
      color: '#ffffff',
      padding: '8px 16px',
      fontSize: '13px',
      fontWeight: 'bold',
      textAlign: 'center',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontFamily: 'var(--font-ar)',
      direction: 'rtl'
    }}>
      <WifiOff size={16} />
      <span>عذراً، انقطع الاتصال بالإنترنت! يرجى التحقق من الشبكة لاستمرار مزامنة البيانات.</span>
    </div>
  );
};

export default OfflineBanner;
