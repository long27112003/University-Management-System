import React from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

/**
 * Standardized ConfirmDialog modal
 * @param {boolean} isOpen
 * @param {Function} onClose
 * @param {Function} onConfirm
 * @param {string} title
 * @param {string} message
 * @param {string} confirmText
 * @param {string} cancelText
 * @param {'danger'|'warning'|'info'} type
 * @param {boolean} loading
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận hành động',
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  type = 'warning',
  loading = false,
  children
}) => {
  if (!isOpen) return null;

  const isDanger = type === 'danger';

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
    >
      <div style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg, 8px)',
        border: '1px solid var(--color-border-subtle, #E2E8F0)',
        boxShadow: 'var(--shadow-lg, 0 10px 25px -5px rgba(0, 0, 0, 0.1))',
        width: '100%',
        maxWidth: '480px',
        overflow: 'hidden',
        animation: 'fadeIn 0.15s ease'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem',
          borderBottom: '1px solid #F1F5F9'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: isDanger ? '#FEF2F2' : '#FFFBEB',
            color: isDanger ? '#EF4444' : '#F59E0B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {isDanger ? <AlertTriangle size={22} /> : <Info size={22} />}
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: '#0F172A',
              margin: '0 0 0.25rem 0'
            }}>
              {title}
            </h3>
            {message && (
              <p style={{
                fontSize: '0.875rem',
                color: '#64748B',
                margin: 0,
                lineHeight: '1.4'
              }}>
                {message}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content body if provided */}
        {children && (
          <div style={{ padding: '1rem 1.5rem' }}>
            {children}
          </div>
        )}

        {/* Action buttons */}
        <div style={{
          padding: '1rem 1.5rem',
          background: '#F8FAFC',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem',
          borderTop: '1px solid #E2E8F0'
        }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md, 6px)',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#334155',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius-md, 6px)',
              background: isDanger ? '#EF4444' : '#2563EB',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
