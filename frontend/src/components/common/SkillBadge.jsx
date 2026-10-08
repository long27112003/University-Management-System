import React from 'react';
import { Headphones, Mic, BookOpen, PenTool, Award, Layers } from 'lucide-react';

/**
 * Standardized SkillBadge for English 4 skills
 * @param {'listening'|'speaking'|'reading'|'writing'|'ielts'} skill
 * @param {string} customLabel
 */
const SkillBadge = ({ skill, customLabel }) => {
  const normalized = String(skill || '').toLowerCase().trim();

  const configs = {
    listening: {
      bg: '#EFF6FF',
      text: '#1D4ED8',
      border: '#BFDBFE',
      label: 'Listening',
      icon: <Headphones size={12} style={{ marginRight: '4px' }} />
    },
    speaking: {
      bg: '#F5F3FF',
      text: '#6D28D9',
      border: '#DDD6FE',
      label: 'Speaking',
      icon: <Mic size={12} style={{ marginRight: '4px' }} />
    },
    reading: {
      bg: '#FFF7ED',
      text: '#C2410C',
      border: '#FED7AA',
      label: 'Reading',
      icon: <BookOpen size={12} style={{ marginRight: '4px' }} />
    },
    writing: {
      bg: '#ECFDF5',
      text: '#047857',
      border: '#A7F3D0',
      label: 'Writing',
      icon: <PenTool size={12} style={{ marginRight: '4px' }} />
    },
    ielts: {
      bg: '#FDF2F8',
      text: '#BE185D',
      border: '#FBCFE8',
      label: 'IELTS',
      icon: <Award size={12} style={{ marginRight: '4px' }} />
    }
  };

  const current = configs[normalized] || {
    bg: '#F1F5F9',
    text: '#475569',
    border: '#E2E8F0',
    label: skill ? skill.toUpperCase() : 'General',
    icon: <Layers size={12} style={{ marginRight: '4px' }} />
  };

  return (
    <span
      className="status-badge zoom-hover-sm"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 9px',
        borderRadius: '6px',
        fontSize: '0.75rem',
        fontWeight: 600,
        lineHeight: '1rem',
        background: current.bg,
        color: current.text,
        border: `1px solid ${current.border}`,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}
    >
      {current.icon}
      {customLabel || current.label}
    </span>
  );
};

export default SkillBadge;
