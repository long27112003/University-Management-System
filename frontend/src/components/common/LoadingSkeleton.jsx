import React from 'react';

/**
 * Standardized LoadingSkeleton component
 * @param {'table'|'card'|'list'|'text'} type
 * @param {number} count - number of skeleton items
 */
const LoadingSkeleton = ({ type = 'table', count = 5 }) => {
  if (type === 'card') {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1.25rem'
      }}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="skeleton-pulse"
            style={{
              height: '180px',
              background: '#F1F5F9',
              borderRadius: 'var(--radius-lg, 8px)',
              border: '1px solid var(--color-border-subtle, #E2E8F0)'
            }}
          />
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="skeleton-pulse"
            style={{
              height: '52px',
              background: '#F1F5F9',
              borderRadius: 'var(--radius-md, 6px)'
            }}
          />
        ))}
      </div>
    );
  }

  // Default: Table skeleton
  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 'var(--radius-lg, 8px)',
      border: '1px solid var(--color-border-subtle, #E2E8F0)',
      overflow: 'hidden',
      padding: '1rem'
    }}>
      <div
        className="skeleton-pulse"
        style={{ height: '36px', background: '#F1F5F9', marginBottom: '1rem', borderRadius: '4px' }}
      />
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton-pulse"
          style={{
            height: '44px',
            background: i % 2 === 0 ? '#F8FAFC' : '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            marginBottom: '4px',
            borderRadius: '4px'
          }}
        />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
