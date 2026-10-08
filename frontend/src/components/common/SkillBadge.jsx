import React from 'react';

/**
 * Standardized SkillBadge for English 4 skills
 * @param {'listening'|'speaking'|'reading'|'writing'} skill
 * @param {string} customLabel
 */
const SkillBadge = ({ skill, customLabel }) => {
  const normalized = String(skill || '').toLowerCase().trim();

  const configs = {
    listening: { bg: '#EFF6FF', text: '#1D4ED8', label: 'Listening' },
    speaking: { bg: '#F5F3FF', text: '#6D28D9', label: 'Speaking' },
    reading: { bg: '#FFF7ED', text: '#C2410C', label: 'Reading' },
    writing: { bg: '#ECFDF5', text: '#047857', label: 'Writing' }
  };

  const current = configs[normalized] || {
    bg: '#F1F5F9',
    text: '#475569',
    label: skill ? skill.toUpperCase() : 'General'
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 8px',
      borderRadius: 'var(--radius-sm, 4px)',
      fontSize: '0.75rem',
      fontWeight: 600,
      lineHeight: '1rem',
      background: current.bg,
      color: current.text,
      textTransform: 'uppercase',
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap'
    }}>
      {customLabel || current.label}
    </span>
  );
};

export default SkillBadge;
