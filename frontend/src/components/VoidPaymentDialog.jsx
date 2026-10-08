import React, { useState, useContext } from 'react';
import axios from 'axios';
import { ToastContext } from '../context/ToastContext';
import { AlertTriangle, X } from 'lucide-react';

const VoidPaymentDialog = ({ isOpen, onClose, payment, onSuccess }) => {
  const { showToast } = useContext(ToastContext);

  const [voidReason, setVoidReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !payment) return null;

  const isReasonValid = voidReason.trim().length >= 10;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isReasonValid) {
      setError('Lý do hủy giao dịch là bắt buộc và phải có ít nhất 10 ký tự');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/payments/${payment._id}/void`,
        { voidReason: voidReason.trim() }
      );

      if (res.data.success) {
        showToast('Hủy phiếu thu thành công. Công nợ học viên đã được tính lại.', 'success');
        if (onSuccess) onSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi hủy phiếu thu';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="modal-dialog"
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '500px',
          padding: '1.75rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid var(--border-color, #e2e8f0)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#fef2f2',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#ef4444' }}>
                Hủy Giao Dịch Phiếu Thu (Void)
              </h3>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)' }}>
                Thao tác dành riêng cho Quản Trị Viên
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted, #64748b)',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Payment info summary */}
        <div
          style={{
            background: 'var(--bg-app, #f8fafc)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)' }}>Mã phiếu thu:</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{payment.paymentCode}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)' }}>Số tiền đã thu:</span>
            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#ef4444' }}>
              {(payment.amount || 0).toLocaleString('vi-VN')} ₫
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)' }}>Học viên:</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
              {payment.student?.fullName || 'Học viên'}
            </span>
          </div>
        </div>

        {/* Warning callout */}
        <div
          style={{
            padding: '0.75rem',
            borderRadius: '6px',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#b45309',
            fontSize: '0.8125rem',
            lineHeight: 1.4,
            marginBottom: '1rem',
          }}
        >
          <strong>Lưu ý:</strong> Phiếu thu sẽ <strong>không bị xóa</strong>. Giao dịch sẽ được đánh dấu đã hủy và công nợ của học viên sẽ được tính toán lại ngay lập tức.
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: '6px',
              background: '#fef2f2',
              color: '#dc2626',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              border: '1px solid #fecaca',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Lý do hủy giao dịch <span style={{ color: '#ef4444' }}>*</span>{' '}
              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted, #64748b)' }}>
                (Tối thiểu 10 ký tự)
              </span>
            </label>
            <textarea
              rows="3"
              value={voidReason}
              onChange={(e) => {
                setVoidReason(e.target.value);
                setError('');
              }}
              placeholder="VD: Nhập nhầm số tiền thanh toán của học viên khác hoặc giao dịch trùng lặp..."
              required
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color, #cbd5e1)',
                fontSize: '0.875rem',
                outline: 'none',
                resize: 'vertical',
              }}
            />
            {voidReason.length > 0 && voidReason.length < 10 && (
              <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                Đã nhập {voidReason.length}/10 ký tự cần thiết
              </span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '0.625rem 1rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color, #cbd5e1)',
                background: 'white',
                color: 'var(--text-main, #0f172a)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting || !isReasonValid}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '6px',
                border: 'none',
                background: !isReasonValid || submitting ? '#94a3b8' : '#ef4444',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: !isReasonValid || submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Đang hủy...' : 'Xác Nhận Hủy Giao Dịch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VoidPaymentDialog;
