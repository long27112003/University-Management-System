import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import PaymentModal from '../components/PaymentModal';
import {
  CreditCard, Search, Filter, AlertTriangle, CheckCircle,
  Clock, Eye, Plus, ArrowRight
} from 'lucide-react';

import { PageHeader } from '../components/common';

const TuitionListPage = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Fetch classes for filter dropdown
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/classes?limit=100`);
        if (res.data.success) {
          setClasses(res.data.data || []);
        }
      } catch (err) {
        console.error('Error fetching classes:', err);
      }
    };
    fetchClasses();
  }, []);

  // Fetch invoices
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 15);
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter) params.append('status', statusFilter);
      if (classFilter) params.append('classId', classFilter);
      if (overdueOnly) params.append('overdue', 'true');

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/tuition/invoices?${params.toString()}`
      );
      if (res.data.success) {
        setInvoices(res.data.data || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalCount(res.data.pagination?.total || 0);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể tải danh sách hóa đơn', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, statusFilter, classFilter, overdueOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchInvoices();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setClassFilter('');
    setOverdueOnly(false);
    setPage(1);
  };

  const getStatusBadge = (inv) => {
    const status = inv.effectiveStatus || inv.status;
    switch (status) {
      case 'paid':
        return (
          <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#dcfce7', color: '#15803d' }}>
            Đã hoàn thành
          </span>
        );
      case 'partial':
        return (
          <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#fef3c7', color: '#b45309' }}>
            Đóng 1 phần
          </span>
        );
      case 'overdue':
        return (
          <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#fee2e2', color: '#b91c1c' }}>
            Quá hạn
          </span>
        );
      case 'cancelled':
        return (
          <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#f1f5f9', color: '#64748b' }}>
            Đã hủy
          </span>
        );
      case 'unpaid':
      default:
        return (
          <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#fee2e2', color: '#ef4444' }}>
            Chưa thanh toán
          </span>
        );
    }
  };

  const basePath = user?.role === 'Admin' ? '/admin/tuition' : '/receptionist/tuition';

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <PageHeader
        title="Học phí & Thu tiền"
        subtitle="Quản lý công nợ, hóa đơn học phí và theo dõi tiến độ thu tiền học viên"
      />

      {/* Filter Toolbar */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 8px)',
          padding: '1rem',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          boxShadow: 'var(--shadow-card)',
          marginBottom: '1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 280px', maxWidth: '400px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã hóa đơn, ghi chú..."
              className="form-input"
              style={{
                width: '100%',
                paddingLeft: '2.25rem',
              }}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '0.45rem 1rem' }}
          >
            Tìm
          </button>
        </form>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="form-input"
            style={{ width: 'auto' }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="unpaid">Chưa thanh toán</option>
            <option value="partial">Đóng 1 phần</option>
            <option value="paid">Đã hoàn thành</option>
            <option value="overdue">Quá hạn</option>
            <option value="cancelled">Đã hủy</option>
          </select>

          {/* Class filter */}
          <select
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value);
              setPage(1);
            }}
            className="form-input"
            style={{ width: 'auto', maxWidth: '220px' }}
          >
            <option value="">Tất cả lớp học</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.className} ({c.classCode})
              </option>
            ))}
          </select>

          {/* Overdue checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => {
                setOverdueOnly(e.target.checked);
                setPage(1);
              }}
              style={{ accentColor: 'var(--color-danger, #EF4444)' }}
            />
            <span style={{ color: overdueOnly ? 'var(--color-danger, #EF4444)' : '#0F172A', fontWeight: overdueOnly ? 600 : 400 }}>
              Chỉ quá hạn
            </span>
          </label>

          {(search || statusFilter || classFilter || overdueOnly) && (
            <button
              onClick={handleResetFilters}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.8125rem' }}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Invoices Data Table */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 8px)',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-app, #f8fafc)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Mã hóa đơn</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Học viên</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Lớp học</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Tổng tiền</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Đã đóng</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Còn thiếu</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Hạn nộp</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Trạng thái</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
                    Đang tải danh sách hóa đơn...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
                    Không có hóa đơn học phí nào phù hợp
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const studentName = inv.student?.fullName || 'Học viên';
                  const studentCode = inv.student?.studentCode || 'N/A';
                  const className = inv.class?.className || 'Lớp học';
                  const classCode = inv.class?.classCode || 'N/A';
                  const isPaid = inv.remainingAmount === 0 || inv.status === 'paid';

                  return (
                    <tr
                      key={inv._id}
                      style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--color-primary-600, #2563eb)' }}>
                        {inv.invoiceCode}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>{studentName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>{studentCode}</div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ fontWeight: 500, color: 'var(--text-main, #0f172a)' }}>{className}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>{classCode}</div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 500 }}>
                        {(inv.totalAmount || 0).toLocaleString('vi-VN')} ₫
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#15803d' }}>
                        {(inv.paidAmount || 0).toLocaleString('vi-VN')} ₫
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: isPaid ? '#94a3b8' : '#ea580c' }}>
                        {(inv.remainingAmount || 0).toLocaleString('vi-VN')} ₫
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted, #64748b)' }}>
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {getStatusBadge(inv)}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                          {!isPaid && inv.status !== 'cancelled' && (
                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setIsPaymentModalOpen(true);
                              }}
                              style={{
                                padding: '0.375rem 0.625rem',
                                borderRadius: '4px',
                                border: 'none',
                                background: 'var(--color-primary-600, #2563eb)',
                                color: 'white',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <Plus size={14} /> Thu tiền
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`${basePath}/${inv._id}`)}
                            style={{
                              padding: '0.375rem 0.625rem',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color, #cbd5e1)',
                              background: 'white',
                              color: 'var(--text-main, #0f172a)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <Eye size={14} /> Xem
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderTop: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.875rem',
            }}
          >
            <div style={{ color: 'var(--text-muted, #64748b)' }}>
              Tổng cộng <strong>{totalCount}</strong> hóa đơn (Trang {page}/{totalPages})
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: 'white',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: page <= 1 ? 0.5 : 1,
                }}
              >
                Trước
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: 'white',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  opacity: page >= totalPages ? 0.5 : 1,
                }}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        onSuccess={() => {
          fetchInvoices();
        }}
      />
    </div>
  );
};

export default TuitionListPage;
