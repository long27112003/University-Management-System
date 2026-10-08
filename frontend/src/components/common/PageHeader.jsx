import React from 'react';

/**
 * Reusable PageHeader component
 * @param {string} title - Page title (H1, 24px/700)
 * @param {string} subtitle - Descriptive subtitle (14px/400 muted)
 * @param {React.ReactNode} action - Primary action button or CTA
 * @param {Array<{label: string, link?: string}>} breadcrumbs - Optional breadcrumb array
 */
const PageHeader = ({ title, subtitle, action, breadcrumbs }) => {
  return (
    <div style={{
      marginBottom: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem'
    }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" style={{ marginBottom: '0.25rem' }}>
          <ol style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            listStyle: 'none',
            padding: 0,
            margin: 0,
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)'
          }}>
            {breadcrumbs.map((crumb, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {crumb.link ? (
                  <a href={crumb.link} style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
                    {crumb.label}
                  </a>
                ) : (
                  <span style={{ color: 'var(--color-text-main)', fontWeight: 500 }}>{crumb.label}</span>
                )}
                {idx < breadcrumbs.length - 1 && <span style={{ opacity: 0.5 }}>/</span>}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--color-text-main)',
            margin: 0,
            lineHeight: '2rem',
            letterSpacing: '-0.02em'
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{
              fontSize: '0.875rem',
              color: 'var(--color-text-muted)',
              margin: '0.25rem 0 0 0',
              lineHeight: '1.25rem'
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {action && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
