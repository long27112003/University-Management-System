import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * Standardized EmptyState component
 * @param {React.ReactNode} icon - optional custom icon
 * @param {string} title - Main title
 * @param {string} description - Explanation text
 * @param {React.ReactNode} action - Action button (CTA)
 */
const EmptyState = ({
  icon,
  title = 'Không có dữ liệu',
  description = 'Hiện tại chưa có dữ liệu nào phù hợp với điều kiện hiển thị.',
  action,
  extra
}) => {
  return (
    <div
      className="empty-state-modern"
      style={{
        margin: '1rem 0'
      }}
    >
      <div className="empty-state-icon-glow">
        {icon || <Inbox size={32} strokeWidth={2} />}
      </div>

      <h3 style={{
        fontSize: '1.125rem',
        fontWeight: 700,
        color: 'var(--color-text-main, #0F172A)',
        margin: '0 0 0.5rem 0',
        letterSpacing: '-0.01em'
      }}>
        {title}
      </h3>

      <p style={{
        fontSize: '0.9rem',
        color: 'var(--color-text-muted, #64748B)',
        maxWidth: '440px',
        margin: '0 auto 1.5rem',
        lineHeight: '1.5'
      }}>
        {description}
      </p>

      {extra && <div style={{ marginBottom: '1.25rem' }}>{extra}</div>}
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
