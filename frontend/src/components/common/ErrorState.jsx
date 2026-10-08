import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

/**
 * Standardized ErrorState component
 * @param {string} title
 * @param {string} message
 * @param {Function} onRetry
 */
const ErrorState = ({
  title = 'Đã xảy ra lỗi kết nối',
  message = 'Không thể tải được dữ liệu từ máy chủ. Vui lòng kiểm tra lại kết nối và thử lại.',
  onRetry
}) => {
  return (
    <div style={{
      padding: '3rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      background: '#FFFFFF',
      borderRadius: 'var(--radius-lg, 8px)',
      border: '1px solid #FEE2E2',
      margin: '1rem 0'
    }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: '#FEF2F2',
        color: '#EF4444',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem'
      }}>
        <AlertCircle size={28} />
      </div>

      <h3 style={{
        fontSize: '1rem',
        fontWeight: 600,
        color: '#0F172A',
        margin: '0 0 0.5rem 0'
      }}>
        {title}
      </h3>

      <p style={{
        fontSize: '0.875rem',
        color: '#64748B',
        maxWidth: '420px',
        margin: '0 0 1.25rem 0',
        lineHeight: '1.4'
      }}>
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md, 6px)',
            background: 'var(--color-primary-600, #2563EB)',
            color: '#FFFFFF',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            border: 'none'
          }}
        >
          <RotateCcw size={16} />
          Thử lại
        </button>
      )}
    </div>
  );
};

export default ErrorState;
