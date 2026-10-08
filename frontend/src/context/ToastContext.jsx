import React, { createContext, useContext, useState, useCallback } from 'react';

export const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};

let _id = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const icons = {
    success: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
    ),
    error: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
      </svg>
    ),
    warning: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    info: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
    ),
  };

  const colors = {
    success: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.4)', color: '#10b981' },
    error:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.4)',  color: '#ef4444' },
    warning: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)', color: '#f59e0b' },
    info:    { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.4)', color: '#3b82f6' },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container */}
      <div style={{
        position: 'fixed', bottom: '1.5rem', right: '1.5rem',
        display: 'flex', flexDirection: 'column', gap: '0.75rem',
        zIndex: 99999, pointerEvents: 'none',
      }}>
        {toasts.map(toast => {
          const c = colors[toast.type] || colors.info;
          return (
            <div
              key={toast.id}
              onClick={() => dismiss(toast.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.875rem',
                padding: '0.875rem 1.25rem',
                minWidth: '280px', maxWidth: '400px',
                background: 'var(--bg-secondary)',
                backdropFilter: 'blur(16px)',
                border: `1px solid ${c.border}`,
                borderLeft: `4px solid ${c.color}`,
                borderRadius: '0.75rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                pointerEvents: 'all', cursor: 'pointer',
                animation: 'toastSlideIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              }}
            >
              <span style={{ color: c.color, flexShrink: 0 }}>{icons[toast.type] || icons.info}</span>
              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', flex: 1 }}>
                {toast.message}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}>×</span>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(60px) scale(0.92); }
          to   { opacity: 1; transform: translateX(0)     scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  );
};
