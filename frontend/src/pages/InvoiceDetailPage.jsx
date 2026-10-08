import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import PaymentModal from '../components/PaymentModal';
import VoidPaymentDialog from '../components/VoidPaymentDialog';
import {
  CreditCard, ArrowLeft, Plus, AlertTriangle, CheckCircle,
  Clock, ShieldAlert, FileText, User, Calendar
} from 'lucide-react';

const InvoiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isVoidDialogOpen, setIsVoidDialogOpen] = useState(false);
  const [selectedPaymentToVoid, setSelectedPaymentToVoid] = useState(null);

  const fetchInvoiceDetail = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/tuition/invoices/${id}`);
      if (res.data.success) {
        setInvoice(res.data.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể tải chi tiết hóa đơn', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchInvoiceDetail();
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
        Đang tải thông tin hóa đơn học phí...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h3>Không tìm thấy hóa đơn học phí</h3>
        <button
          onClick={() => navigate(-1)}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: '1px solid var(--border-color, #cbd5e1)',
            background: 'white',
            cursor: 'pointer',
          }}
        >
          Quay lại
        </button>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return (
          <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '0.8125rem', fontWeight: 600, background: '#dcfce7', color: '#15803d' }}>
            Đã hoàn thành
          </span>
        );
      case 'partial':
        return (
          <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '0.8125rem', fontWeight: 600, background: '#fef3c7', color: '#b45309' }}>
            Đóng 1 phần
          </span>
        );
      case 'overdue':
        return (
          <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '0.8125rem', fontWeight: 600, background: '#fee2e2', color: '#b91c1c' }}>
            Quá hạn
          </span>
        );
      case 'cancelled':
        return (
          <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '0.8125rem', fontWeight: 600, background: '#f1f5f9', color: '#64748b' }}>
            Đã hủy
          </span>
        );
      case 'unpaid':
      default:
        return (
          <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '0.8125rem', fontWeight: 600, background: '#f1f5f9', color: '#475569' }}>
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

  const remaining = invoice.remainingAmount || 0;
  const isPaid = remaining === 0 || invoice.status === 'paid';
  const effectiveStatus = invoice.effectiveStatus || invoice.status;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top back button & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.45rem 0.85rem',
            fontSize: '0.875rem'
          }}
        >
          <ArrowLeft size={16} /> Quay lại danh sách
        </button>

        {!isPaid && invoice.status !== 'cancelled' && (
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="btn btn-primary"
            style={{
              padding: '0.5rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            <Plus size={16} /> Ghi nhận thanh toán
          </button>
        )}
      </div>

      {/* Header Info */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 8px)',
          padding: '1.25rem 1.5rem',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          boxShadow: 'var(--shadow-card)',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--color-primary-600, #2563EB)' }}>
              {invoice.invoiceCode}
            </h1>
            {getStatusBadge(effectiveStatus)}
          </div>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#64748B' }}>
            Ngày tạo: {new Date(invoice.createdAt).toLocaleDateString('vi-VN')} | Người lập:{' '}
            {invoice.createdBy?.name || 'Hệ thống'}
          </p>
        </div>
      </div>

      {/* 3 Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg, 8px)',
            padding: '1.25rem',
            border: '1px solid var(--color-border-subtle, #E2E8F0)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ fontSize: '0.8125rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
            Tổng Học Phí
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.5rem', color: '#0F172A' }}>
            {(invoice.totalAmount || 0).toLocaleString('vi-VN')} ₫
          </div>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg, 8px)',
            padding: '1.25rem',
            border: '1px solid var(--color-border-subtle, #E2E8F0)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ fontSize: '0.8125rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
            Đã Thanh Toán
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.5rem', color: '#15803D' }}>
            {(invoice.paidAmount || 0).toLocaleString('vi-VN')} ₫
          </div>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg, 8px)',
            padding: '1.25rem',
            border: '1px solid var(--color-border-subtle, #E2E8F0)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ fontSize: '0.8125rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
            Công Nợ Còn Lại
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.5rem', color: isPaid ? '#94A3B8' : '#EA580C' }}>
            {(invoice.remainingAmount || 0).toLocaleString('vi-VN')} ₫
          </div>
        </div>
      </div>

      {/* Invoice Details Information */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 8px)',
          padding: '1.5rem',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          boxShadow: 'var(--shadow-card)',
          marginBottom: '1.5rem',
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 1rem 0' }}>Thông Tin Chi Tiết Hóa Đơn</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)', marginBottom: '0.25rem' }}>Học viên:</div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{invoice.student?.fullName}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)' }}>
              Mã HV: {invoice.student?.studentCode} | SĐT: {invoice.student?.phone || '—'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)', marginBottom: '0.25rem' }}>Lớp học:</div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{invoice.class?.className}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)' }}>
              Mã lớp: {invoice.class?.classCode} | Kỹ năng: {invoice.class?.skill?.toUpperCase()}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)', marginBottom: '0.25rem' }}>Hạn nộp học phí:</div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: invoice.dueDate && new Date(invoice.dueDate) < new Date() && remaining > 0 ? '#ef4444' : 'inherit' }}>
              {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('vi-VN') : 'Không có hạn nộp'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)', marginBottom: '0.25rem' }}>Ghi chú:</div>
            <div style={{ fontSize: '0.875rem' }}>{invoice.note || 'Không có ghi chú'}</div>
          </div>
        </div>
      </div>

      {/* Payment History Table */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 8px)',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border-subtle, #E2E8F0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>Lịch Sử Thu Tiền & Phiếu Thu</h3>
          <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>
            Tổng cộng {invoice.payments?.length || 0} lần ghi nhận
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-app, #f8fafc)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Mã phiếu thu</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Ngày thu</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Số tiền</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Phương thức</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Mã GD / UNC</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Người thu</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>Trạng thái</th>
                {user?.role === 'Admin' && (
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', textAlign: 'right' }}>
                    Thao tác
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {!invoice.payments || invoice.payments.length === 0 ? (
                <tr>
                  <td colSpan={user?.role === 'Admin' ? 8 : 7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
                    Chưa có giao dịch thu tiền nào cho hóa đơn này
                  </td>
                </tr>
              ) : (
                invoice.payments.map((p) => {
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
                      <td style={{ padding: '0.875rem 1rem' }}>{p.createdBy?.name || 'Nhân sự'}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {isVoided ? (
                          <div>
                            <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#fee2e2', color: '#b91c1c' }}>
                              Đã hủy (Voided)
                            </span>
                            {p.voidReason && (
                              <div style={{ fontSize: '0.75rem', color: '#b91c1c', marginTop: '2px' }}>
                                Lý do: {p.voidReason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#dcfce7', color: '#15803d' }}>
                            Hợp lệ
                          </span>
                        )}
                      </td>
                      {user?.role === 'Admin' && (
                        <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                          {!isVoided && (
                            <button
                              onClick={() => {
                                setSelectedPaymentToVoid({
                                  ...p,
                                  student: invoice.student,
                                });
                                setIsVoidDialogOpen(true);
                              }}
                              style={{
                                padding: '0.375rem 0.625rem',
                                borderRadius: '4px',
                                border: '1px solid #fecaca',
                                background: '#fef2f2',
                                color: '#dc2626',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Hủy phiếu thu
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoice={invoice}
        onSuccess={() => {
          fetchInvoiceDetail();
        }}
      />

      {/* Admin Void Payment Dialog */}
      <VoidPaymentDialog
        isOpen={isVoidDialogOpen}
        onClose={() => {
          setIsVoidDialogOpen(false);
          setSelectedPaymentToVoid(null);
        }}
        payment={selectedPaymentToVoid}
        onSuccess={() => {
          fetchInvoiceDetail();
        }}
      />
    </div>
  );
};

export default InvoiceDetailPage;
