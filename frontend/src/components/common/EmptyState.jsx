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
  action
}) => {
  return (
    <div style={{
      padding: '3.5rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      background: '#FFFFFF',
      borderRadius: 'var(--radius-lg, 8px)',
      border: '1px dashed var(--color-border-subtle, #E2E8F0)',
      margin: '1rem 0'
    }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: '#F1F5F9',
        color: '#64748B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem'
      }}>
        {icon || <Inbox size={28} />}
      </div>

      <h3 style={{
        fontSize: '1rem',
        fontWeight: 600,
        color: 'var(--color-text-main, #0F172A)',
        margin: '0 0 0.5rem 0'
      }}>
        {title}
      </h3>

      <p style={{
        fontSize: '0.875rem',
        color: 'var(--color-text-muted, #64748B)',
        maxWidth: '400px',
        margin: '0 0 1.25rem 0',
        lineHeight: '1.4'
      }}>
        {description}
      </p>

      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
