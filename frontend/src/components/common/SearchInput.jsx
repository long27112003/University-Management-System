import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * Standardized SearchInput component
 * @param {string} value
 * @param {Function} onChange
 * @param {Function} onSubmit
 * @param {string} placeholder
 */
const SearchInput = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Tìm kiếm...'
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit(e);
    }
  };

  return (
    <div style={{
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      minWidth: '240px',
      maxWidth: '360px',
      width: '100%'
    }}>
      <Search
        size={16}
        style={{
          position: 'absolute',
          left: '10px',
          color: 'var(--color-text-muted, #64748B)',
          pointerEvents: 'none'
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '0.45rem 2rem 0.45rem 2.25rem',
          fontSize: '0.875rem',
          color: 'var(--color-text-main, #0F172A)',
          background: 'var(--color-surface, #FFFFFF)',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          borderRadius: 'var(--radius-md, 6px)',
          outline: 'none',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--color-primary-600, #2563EB)';
          e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.15)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--color-border-subtle, #E2E8F0)';
          e.target.style.boxShadow = 'none';
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Xóa từ khóa tìm kiếm"
          style={{
            position: 'absolute',
            right: '8px',
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted, #64748B)',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
