import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const icons = {
    success: <CheckCircle2 size={18} className="text-success" />,
    error: <AlertCircle size={18} className="text-danger" />,
    warning: <AlertTriangle size={18} style={{ color: '#f59e0b' }} />,
    info: <Info size={18} className="text-primary" />
  };

  const bgColors = {
    success: 'rgba(16, 185, 129, 0.1)',
    error: 'rgba(239, 68, 68, 0.1)',
    warning: 'rgba(245, 158, 11, 0.1)',
    info: 'rgba(79, 70, 229, 0.1)'
  };

  const borderColors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#4f46e5'
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '24px',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 18px',
      background: '#ffffff',
      borderRight: `4px solid ${borderColors[type]}`,
      borderRadius: '8px',
      boxShadow: 'var(--shadow-lg), 0 10px 25px rgba(0,0,0,0.1)',
      fontFamily: 'var(--font-ar)',
      direction: 'rtl',
      minWidth: '280px',
      maxWidth: '420px',
      animation: 'slideUp 0.3s ease-out'
    }}>
      {icons[type]}
      <span style={{ fontSize: '13.5px', color: 'var(--text-main)', flex: 1, lineHeight: '1.4' }}>
        {message}
      </span>
      <X size={16} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={onClose} />
    </div>
  );
};

export default Toast;
