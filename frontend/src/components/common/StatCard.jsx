import React from 'react';

/**
 * Reusable StatCard for KPIs
 * @param {string} title - Card title (15px / 600)
 * @param {string|number} value - Main metric value
 * @param {React.ReactNode} icon - Lucide icon element
 * @param {string} trend - Optional trend text (e.g. "+12% tháng này")
 * @param {boolean} trendPositive - Whether trend is positive/neutral
 * @param {string} subtitle - Optional bottom description or progress
 * @param {string} iconBg - Background color for icon container
 * @param {string} iconColor - Icon color
 */
const StatCard = ({
  title,
  value,
  icon,
  trend,
  trendPositive = true,
  subtitle,
  iconBg = '#EFF6FF',
  iconColor = '#2563EB'
}) => {
  return (
    <div
      className="stat-card"
      style={{
        background: 'var(--color-surface, #FFFFFF)',
        borderRadius: 'var(--radius-lg, 8px)',
        border: '1px solid var(--color-border-subtle, #E2E8F0)',
        boxShadow: 'var(--shadow-card, 0 1px 3px 0 rgba(0, 0, 0, 0.05))',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '0.75rem',
        cursor: 'default'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <span style={{
          fontSize: '0.9375rem',
          fontWeight: 600,
          color: 'var(--color-text-muted, #64748B)',
          lineHeight: '1.25rem'
        }}>
          {title}
        </span>
        {icon && (
          <div
            className="stat-icon"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md, 6px)',
              background: iconBg,
              color: iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: 'var(--color-text-main, #0F172A)',
          lineHeight: '2rem',
          letterSpacing: '-0.02em'
        }}>
          {value}
        </span>

        {trend && (
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm, 4px)',
            background: trendPositive ? '#ECFDF5' : '#FEF2F2',
            color: trendPositive ? '#047857' : '#B91C1C',
            display: 'inline-flex',
            alignItems: 'center'
          }}>
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--color-text-muted, #64748B)',
          marginTop: '-0.25rem'
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default StatCard;
