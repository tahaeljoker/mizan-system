import React from 'react';
import { AlertTriangle, Trash2, ArrowRightLeft, X } from 'lucide-react';

/**
 * ConfirmModal — A beautiful Arabic confirmation dialog
 * Props:
 *   isOpen: bool
 *   onConfirm: fn
 *   onCancel: fn
 *   title: string
 *   message: string
 *   confirmText: string (default: 'تأكيد')
 *   cancelText: string (default: 'إلغاء')
 *   variant: 'danger' | 'warning' | 'info' (default: 'danger')
 */
const ConfirmModal = ({
  isOpen,
  onConfirm,
  onCancel,
  title = 'تأكيد العملية',
  message = 'هل أنت متأكد من المتابعة؟',
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  const variantConfig = {
    danger: {
      iconBg: 'rgba(239,68,68,0.12)',
      iconColor: '#ef4444',
      confirmClass: 'btn-danger',
      Icon: Trash2
    },
    warning: {
      iconBg: 'rgba(245,158,11,0.12)',
      iconColor: '#f59e0b',
      confirmClass: 'btn-warning',
      Icon: AlertTriangle
    },
    info: {
      iconBg: 'rgba(59,130,246,0.12)',
      iconColor: '#3b82f6',
      confirmClass: 'btn-primary',
      Icon: ArrowRightLeft
    }
  };

  const config = variantConfig[variant] || variantConfig.danger;
  const Icon = config.Icon;

  return (
    <div
      className="modal-overlay"
      onClick={onCancel}
      style={{ animation: 'fadeIn 0.15s ease' }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '420px',
          padding: '32px',
          textAlign: 'center',
          animation: 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <X size={18} />
        </button>

        {/* Icon circle */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: config.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <Icon size={32} style={{ color: config.iconColor }} />
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: 'var(--text-main)',
          marginBottom: '12px'
        }}>
          {title}
        </h3>

        {/* Message */}
        <p style={{
          fontSize: '14px',
          color: 'var(--text-muted)',
          lineHeight: '1.7',
          marginBottom: '28px'
        }}>
          {message}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            style={{ minWidth: '100px' }}
          >
            {cancelText}
          </button>
          <button
            className={`btn ${config.confirmClass}`}
            onClick={onConfirm}
            style={{ minWidth: '120px' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
