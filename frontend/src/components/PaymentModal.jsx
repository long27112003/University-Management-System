import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ToastContext } from '../context/ToastContext';
import { X, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, invoice, onSuccess }) => {
  const { showToast } = useContext(ToastContext);

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transactionCode, setTransactionCode] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (invoice) {
      setAmount(invoice.remainingAmount || '');
      setPaymentMethod('cash');
      setTransactionCode('');
      setNote('');
      setError('');
    }
  }, [invoice, isOpen]);

  if (!isOpen || !invoice) return null;

  const remaining = invoice.remainingAmount || 0;
  const numAmount = Number(amount);
  const isOverRemaining = numAmount > remaining;
  const isInvalidAmount = !numAmount || numAmount <= 0 || isOverRemaining;

  const handlePayFull = () => {
    setAmount(remaining);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isInvalidAmount) {
      if (isOverRemaining) {
        setError(`Số tiền không được vượt quá số dư còn nợ (${remaining.toLocaleString('vi-VN')} ₫)`);
      } else {
        setError('Vui lòng nhập số tiền hợp lệ lớn hơn 0');
      }
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/tuition/invoices/${invoice._id}/payments`,
        {
          amount: numAmount,
          paymentMethod,
          transactionCode: transactionCode.trim(),
          note: note.trim(),
        }
      );

      if (res.data.success) {
        showToast('Ghi nhận thanh toán thành công!', 'success');
        if (onSuccess) onSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi ghi nhận thanh toán';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
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
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '520px',
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
                background: 'var(--color-primary-50, #eff6ff)',
                color: 'var(--color-primary-600, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CreditCard size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>
                Ghi Nhận Thanh Toán
              </h3>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)' }}>
                Hóa đơn: {invoice.invoiceCode}
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

        {/* Outstanding Balance Banner */}
        <div
          style={{
            background: 'var(--bg-app, #f8fafc)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', fontWeight: 600 }}>
              Công nợ còn lại
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>
              {remaining.toLocaleString('vi-VN')} ₫
            </div>
          </div>
          <button
            type="button"
            onClick={handlePayFull}
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid var(--color-primary-600, #2563eb)',
              background: 'var(--color-primary-50, #eff6ff)',
              color: 'var(--color-primary-600, #2563eb)',
              cursor: 'pointer',
            }}
          >
            Nộp toàn bộ số dư
          </button>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              borderRadius: '6px',
              background: '#fef2f2',
              color: '#dc2626',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              border: '1px solid #fecaca',
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Payment Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Số tiền thanh toán (VNĐ) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="number"
              min="1000"
              max={remaining}
              step="1000"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
              }}
              placeholder="VD: 2000000"
              required
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                borderRadius: '6px',
                border: `1px solid ${isOverRemaining ? '#ef4444' : 'var(--border-color, #cbd5e1)'}`,
                fontSize: '0.9375rem',
                outline: 'none',
              }}
            />
            {isOverRemaining && (
              <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                Số tiền vượt quá số dư còn nợ ({remaining.toLocaleString('vi-VN')} ₫)
              </span>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Hình thức thanh toán <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color, #cbd5e1)',
                fontSize: '0.9375rem',
                outline: 'none',
                background: 'white',
              }}
            >
              <option value="cash">Tiền mặt (Cash)</option>
              <option value="bank_transfer">Chuyển khoản (Bank Transfer)</option>
              <option value="card">Thẻ / POS (Card)</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Mã giao dịch / Mã tham chiếu ngân hàng
            </label>
            <input
              type="text"
              value={transactionCode}
              onChange={(e) => setTransactionCode(e.target.value)}
              placeholder="VD: FT2628091823 hoặc để trống"
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color, #cbd5e1)',
                fontSize: '0.9375rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Ghi chú đợt nộp tiền
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Nộp đợt 1 50% qua Vietcombank"
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color, #cbd5e1)',
                fontSize: '0.9375rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
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
              disabled={submitting || isInvalidAmount}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '6px',
                border: 'none',
                background: isInvalidAmount || submitting ? '#94a3b8' : 'var(--color-primary-600, #2563eb)',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: isInvalidAmount || submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Đang xử lý...' : 'Xác Nhận Thu Tiền'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
