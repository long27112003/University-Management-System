import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Slide-over drawer component
 * @param {boolean} isOpen
 * @param {Function} onClose
 * @param {string} title
 * @param {string} subtitle
 * @param {React.ReactNode} children
 * @param {string} width - default '480px'
 */
const DetailDrawer = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = '480px'
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          zIndex: 900,
          backdropFilter: 'blur(2px)',
          animation: 'fadeIn 0.2s ease'
        }}
      />

      {/* Drawer Panel */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: width,
          background: '#FFFFFF',
          zIndex: 901,
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.25s ease'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFFFFF'
        }}>
          <div>
            <h2 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: '#0F172A',
              margin: 0
            }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{
                fontSize: '0.8125rem',
                color: '#64748B',
                margin: '0.2rem 0 0 0'
              }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng ngăn chi tiết"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 'var(--radius-sm, 4px)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem'
        }}>
          {children}
        </div>
      </div>
    </>
  );
};

export default DetailDrawer;
