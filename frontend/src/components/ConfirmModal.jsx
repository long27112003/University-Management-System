import React from 'react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Xác nhận", isDanger = false }) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <div
        className="modal-dialog"
        style={{
          padding: '2rem',
          width: '90%',
          maxWidth: '450px',
          textAlign: 'center',
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 8px)',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          boxShadow: 'var(--shadow-lg, 0 10px 25px -5px rgba(0, 0, 0, 0.1))'
        }}
      >
        <div style={{ 
          width: '64px', height: '64px', 
          borderRadius: '50%', 
          background: isDanger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem auto'
        }}>
          {isDanger ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          ) : (
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path>
             </svg>
          )}
        </div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--text-primary)' }}>{title}</h3>
        <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>{message}</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={onCancel} style={{ flex: 1, padding: '0.75rem' }}>
            Hủy
          </button>
          <button className="btn btn-primary" onClick={onConfirm} style={{ flex: 1, padding: '0.75rem', background: isDanger ? 'var(--danger)' : 'var(--accent-gradient)', border: 'none', boxShadow: 'none' }}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
