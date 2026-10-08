import React from 'react';
import LoadingSkeleton from './LoadingSkeleton';
import EmptyState from './EmptyState';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Standardized DataTable component
 * @param {Array<{key: string, title: string, render?: Function, width?: string, align?: string}>} columns
 * @param {Array<any>} data
 * @param {boolean} loading
 * @param {Object} pagination - { page, limit, total, totalPages }
 * @param {Function} onPageChange
 * @param {string} emptyTitle
 * @param {string} emptyDescription
 * @param {React.ReactNode} emptyAction
 */
const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  pagination,
  onPageChange,
  emptyTitle,
  emptyDescription,
  emptyAction
}) => {
  if (loading) {
    return <LoadingSkeleton type="table" count={pagination?.limit || 5} />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle || 'Không tìm thấy dữ liệu'}
        description={emptyDescription || 'Không có bản ghi nào phù hợp với bộ lọc tìm kiếm.'}
        action={emptyAction}
      />
    );
  }

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 'var(--radius-lg, 8px)',
      border: '1px solid var(--color-border-subtle, #E2E8F0)',
      boxShadow: 'var(--shadow-card, 0 1px 3px 0 rgba(0, 0, 0, 0.05))',
      overflow: 'hidden'
    }}>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '0.875rem'
        }}>
          <thead>
            <tr style={{
              background: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              height: '44px'
            }}>
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  style={{
                    padding: '10px 16px',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: col.width || 'auto',
                    textAlign: col.align || 'left',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr
                key={row._id || row.id || rowIdx}
                className="table-row-hover"
                style={{
                  height: '52px',
                  borderBottom: rowIdx === data.length - 1 && !pagination ? 'none' : '1px solid #E2E8F0',
                  transition: 'background-color 0.15s ease'
                }}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={col.key || colIdx}
                    style={{
                      padding: '12px 16px',
                      color: '#0F172A',
                      verticalAlign: 'middle',
                      textAlign: col.align || 'left',
                      whiteSpace: col.wrap ? 'normal' : 'nowrap'
                    }}
                  >
                    {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #E2E8F0',
          background: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          fontSize: '0.8125rem',
          color: '#64748B'
        }}>
          <div>
            Hiển thị <span style={{ fontWeight: 600, color: '#0F172A' }}>
              {(pagination.page - 1) * pagination.limit + 1}
            </span> - <span style={{ fontWeight: 600, color: '#0F172A' }}>
              {Math.min(pagination.page * pagination.limit, pagination.total || (pagination.page * pagination.limit))}
            </span> trên <span style={{ fontWeight: 600, color: '#0F172A' }}>{pagination.total}</span> kết quả
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              aria-label="Trang trước"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm, 4px)',
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                color: pagination.page <= 1 ? '#94A3B8' : '#334155',
                cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.8125rem'
              }}
            >
              <ChevronLeft size={16} />
              Trước
            </button>

            <span style={{ padding: '0 4px', fontWeight: 500, color: '#0F172A' }}>
              {pagination.page} / {pagination.totalPages}
            </span>

            <button
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              aria-label="Trang sau"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm, 4px)',
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                color: pagination.page >= pagination.totalPages ? '#94A3B8' : '#334155',
                cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                fontSize: '0.8125rem'
              }}
            >
              Sau
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
