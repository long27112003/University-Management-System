import React from 'react';

/**
 * Standardized FilterSelect dropdown component
 * @param {string} label - optional label
 * @param {string} value - current value
 * @param {Function} onChange - handler
 * @param {Array<{value: string, label: string}>} options - options list
 * @param {string} placeholder - default unselected text
 */
const FilterSelect = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Tất cả'
}) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      {label && (
        <span style={{
          fontSize: '0.8125rem',
          color: 'var(--color-text-muted, #64748B)',
          fontWeight: 500
        }}>
          {label}:
        </span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '0.45rem 1.75rem 0.45rem 0.75rem',
          fontSize: '0.875rem',
          color: 'var(--color-text-main, #0F172A)',
          background: 'var(--color-surface, #FFFFFF)',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          borderRadius: 'var(--radius-md, 6px)',
          outline: 'none',
          cursor: 'pointer',
          appearance: 'auto'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--color-primary-600, #2563EB)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--color-border-subtle, #E2E8F0)';
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FilterSelect;
