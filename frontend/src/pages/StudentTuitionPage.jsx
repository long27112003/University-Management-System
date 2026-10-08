import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ToastContext } from '../context/ToastContext';
import { CreditCard, CheckCircle, Clock, AlertTriangle, FileText } from 'lucide-react';

const StudentTuitionPage = () => {
  const { showToast } = useContext(ToastContext);

  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [invRes, payRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/student/me/invoices`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/student/me/payments`),
        ]);

        if (invRes.data.success) setInvoices(invRes.data.data || []);
        if (payRes.data.success) setPayments(payRes.data.data || []);
      } catch (err) {
        showToast(err.response?.data?.message || 'Không thể tải thông tin học phí', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalTuition = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const totalRemaining = invoices.reduce((sum, inv) => sum + (inv.remainingAmount || 0), 0);

  const getStatusBadge = (inv) => {
    const status = inv.effectiveStatus || inv.status;
    switch (status) {
      case 'paid':
        return (
          <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#dcfce7', color: '#15803d' }}>
            Đã hoàn thành
          </span>
        );
      case 'partial':
        return (
          <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#fef3c7', color: '#b45309' }}>
            Đóng 1 phần
          </span>
        );
      case 'overdue':
        return (
          <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#fee2e2', color: '#b91c1c' }}>
            Quá hạn
          </span>
        );
      case 'cancelled':
        return (
          <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#f1f5f9', color: '#64748b' }}>
            Đã hủy
          </span>
        );
      case 'unpaid':
      default:
        return (
          <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#f1f5f9', color: '#475569' }}>
            Chưa thanh toán
          </span>
        );
    }
  };

  const getMethodDisplay = (method) => {
    switch (method) {
      case 'cash':
        return 'Tiền mặt';
      case 'bank_transfer':
        return 'Chuyển khoản';
      case 'card':
        return 'Thẻ / POS';
      default:
        return method;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
        Đang tải thông tin học phí...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-main, #0f172a)' }}>
          Học Phí & Lịch Sử Đóng Tiền
        </h1>
        <p style={{ color: 'var(--text-muted, #64748b)', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
          Theo dõi chi tiết hóa đơn các lớp học và các đợt đã đóng tiền
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div
          className="glass-panel"
          style={{
            background: 'var(--surface-card, #ffffff)',
            borderRadius: '8px',
            padding: '1.25rem',
            border: '1px solid var(--border-color, #e2e8f0)',
          }}
        >
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', fontWeight: 600 }}>
            Tổng Học Phí Cần Đóng
          </div>
          <div style={{ fontSize: '1.375rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--text-main, #0f172a)' }}>
            {totalTuition.toLocaleString('vi-VN')} ₫
          </div>
        </div>

        <div
          className="glass-panel"
          style={{
            background: 'var(--surface-card, #ffffff)',
            borderRadius: '8px',
            padding: '1.25rem',
            border: '1px solid var(--border-color, #e2e8f0)',
          }}
        >
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', fontWeight: 600 }}>
            Đã Thanh Toán
          </div>
          <div style={{ fontSize: '1.375rem', fontWeight: 700, marginTop: '0.5rem', color: '#15803d' }}>
            {totalPaid.toLocaleString('vi-VN')} ₫
          </div>
        </div>

        <div
          className="glass-panel"
          style={{
            background: 'var(--surface-card, #ffffff)',
            borderRadius: '8px',
            padding: '1.25rem',
            border: '1px solid var(--border-color, #e2e8f0)',
          }}
        >
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', fontWeight: 600 }}>
            Học Phí Còn Thiếu
          </div>
          <div style={{ fontSize: '1.375rem', fontWeight: 700, marginTop: '0.5rem', color: totalRemaining > 0 ? '#ea580c' : '#15803d' }}>
            {totalRemaining.toLocaleString('vi-VN')} ₫
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div
        className="glass-panel"
        style={{
          background: 'var(--surface-card, #ffffff)',
          borderRadius: '8px',
          border: '1px solid var(--border-color, #e2e8f0)',
          marginBottom: '1.5rem',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Hóa Đơn Theo Lớp Học</h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-app, #f8fafc)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Mã hóa đơn</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Lớp học</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Tổng học phí</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Đã đóng</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Còn thiếu</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Hạn nộp</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
                    Bạn chưa có hóa đơn học phí nào
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv._id} style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)' }}>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--color-primary-600, #2563eb)' }}>
                      {inv.invoiceCode}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontWeight: 500 }}>{inv.class?.className || 'Lớp học'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                        {inv.class?.classCode}
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>{(inv.totalAmount || 0).toLocaleString('vi-VN')} ₫</td>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#15803d' }}>
                      {(inv.paidAmount || 0).toLocaleString('vi-VN')} ₫
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: inv.remainingAmount > 0 ? '#ea580c' : '#94a3b8' }}>
                      {(inv.remainingAmount || 0).toLocaleString('vi-VN')} ₫
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted, #64748b)' }}>
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>{getStatusBadge(inv)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History Table */}
      <div
        className="glass-panel"
        style={{
          background: 'var(--surface-card, #ffffff)',
          borderRadius: '8px',
          border: '1px solid var(--border-color, #e2e8f0)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Lịch Sử Phiếu Thu</h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-app, #f8fafc)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Mã phiếu thu</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Hóa đơn</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Ngày thu</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Số tiền</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Phương thức</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Mã GD / UNC</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
                    Chưa có giao dịch đóng tiền nào
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const isVoided = p.status === 'voided';

                  return (
                    <tr
                      key={p._id}
                      style={{
                        borderBottom: '1px solid var(--border-color, #f1f5f9)',
                        background: isVoided ? '#fef2f2' : 'transparent',
                        opacity: isVoided ? 0.75 : 1,
                      }}
                    >
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: isVoided ? '#94a3b8' : 'var(--color-primary-600, #2563eb)' }}>
                        <span style={{ textDecoration: isVoided ? 'line-through' : 'none' }}>{p.paymentCode}</span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>{p.invoice?.invoiceCode || '—'}</td>
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted, #64748b)' }}>
                        {new Date(p.paymentDate || p.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: isVoided ? '#94a3b8' : '#15803d' }}>
                        <span style={{ textDecoration: isVoided ? 'line-through' : 'none' }}>
                          {(p.amount || 0).toLocaleString('vi-VN')} ₫
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>{getMethodDisplay(p.paymentMethod)}</td>
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted, #64748b)' }}>
                        {p.transactionCode || '—'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {isVoided ? (
                          <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#fee2e2', color: '#b91c1c' }}>
                            Đã hủy
                          </span>
                        ) : (
                          <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#dcfce7', color: '#15803d' }}>
                            Hợp lệ
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentTuitionPage;
