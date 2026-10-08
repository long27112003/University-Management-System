import React from 'react';

/**
 * Standardized StatusBadge component
 * @param {string} status - status string
 * @param {'academic'|'attendance'|'tuition'|'custom'} type - type category
 * @param {string} customLabel - optional override for text label
 */
const StatusBadge = ({ status, type = 'academic', customLabel }) => {
  const normalized = String(status || '').toLowerCase().trim();

  const configs = {
    // Academic & Classes
    active: { bg: '#ECFDF5', text: '#047857', label: 'Đang hoạt động' },
    upcoming: { bg: '#EFF6FF', text: '#1D4ED8', label: 'Sắp mở' },
    completed: { bg: '#F1F5F9', text: '#475569', label: 'Đã hoàn thành' },
    cancelled: { bg: '#FEF2F2', text: '#B91C1C', label: 'Đã hủy' },
    reserved: { bg: '#FFFBEB', text: '#B45309', label: 'Bảo lưu' },
    waiting: { bg: '#EFF6FF', text: '#1D4ED8', label: 'Chờ xếp lớp' },
    dropped: { bg: '#FEF2F2', text: '#B91C1C', label: 'Thôi học' },

    // Attendance
    present: { bg: '#ECFDF5', text: '#047857', label: 'Có mặt' },
    late: { bg: '#FFFBEB', text: '#B45309', label: 'Đi muộn' },
    excused: { bg: '#EFF6FF', text: '#1D4ED8', label: 'Có phép' },
    absent: { bg: '#FEF2F2', text: '#B91C1C', label: 'Vắng' },

    // Tuition / Invoices
    paid: { bg: '#ECFDF5', text: '#047857', label: 'Đã hoàn tất' },
    partial: { bg: '#FFFBEB', text: '#B45309', label: 'Đóng 1 phần' },
    unpaid: { bg: '#FEF2F2', text: '#B91C1C', label: 'Chưa đóng' },
    overdue: { bg: '#FEE2E2', text: '#991B1B', label: 'Quá hạn' },
    voided: { bg: '#F1F5F9', text: '#475569', label: 'Đã hủy' },

    // General
    inactive: { bg: '#F1F5F9', text: '#475569', label: 'Tạm khóa' },
    draft: { bg: '#F1F5F9', text: '#475569', label: 'Bản nháp' },
    scheduled: { bg: '#EFF6FF', text: '#1D4ED8', label: 'Đã lên lịch' },
    published: { bg: '#ECFDF5', text: '#047857', label: 'Đã xuất bản' }
  };

  const current = configs[normalized] || {
    bg: '#F1F5F9',
    text: '#475569',
    label: status || 'N/A'
  };

  return (
    <span
      className="status-badge"
      style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 8px',
      borderRadius: 'var(--radius-sm, 4px)',
      fontSize: '0.75rem',
      fontWeight: 500,
      lineHeight: '1rem',
      background: current.bg,
      color: current.text,
      whiteSpace: 'nowrap'
    }}>
      {customLabel || current.label}
    </span>
  );
};

export default StatusBadge;
