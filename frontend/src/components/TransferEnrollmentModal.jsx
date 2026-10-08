import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const TransferEnrollmentModal = ({ enrollment, isOpen, onClose, onTransferred }) => {
  const { showToast } = useToast();
  const [classes, setClasses] = useState([]);
  const [targetClassId, setTargetClassId] = useState('');
  const [reason, setReason] = useState('');
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (isOpen) {
      fetchAvailableClasses();
      setTargetClassId('');
      setReason('');
    }
  }, [isOpen]);

  const fetchAvailableClasses = async () => {
    setLoadingClasses(true);
    try {
      const res = await axios.get(`${baseUrl}/api/classes?limit=100`);
      if (res.data.success) {
        // Exclude current class
        const filtered = res.data.data.filter(
          (c) => c._id !== enrollment?.class?._id && c._id !== enrollment?.class
        );
        setClasses(filtered);
      }
    } catch (err) {
      showToast('Không thể tải danh sách lớp học chuyển đến', 'error');
    } finally {
      setLoadingClasses(false);
    }
  };

  if (!isOpen || !enrollment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetClassId) {
      showToast('Vui lòng chọn lớp học chuyển đến', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${baseUrl}/api/enrollments/${enrollment._id}/transfer`, {
        newClassId: targetClassId,
        reason: reason.trim()
      });

      if (res.data.success) {
        showToast('Chuyển lớp học thành công!', 'success');
        if (onTransferred) onTransferred(res.data.data);
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Lỗi khi chuyển lớp học';
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
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        padding: '1rem'
      }}
    >
      <div className="glass-panel modal-dialog" style={{
        background: 'var(--bg-secondary)',
        width: '100%',
        maxWidth: '540px',
        padding: '1.75rem',
        borderRadius: 'var(--radius-lg)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowRightLeft size={20} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>
              Chuyển Lớp Cho Học Viên
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Current Info Card */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.03)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1rem',
          marginBottom: '1.25rem',
          fontSize: '0.875rem'
        }}>
          <p style={{ margin: '0 0 0.35rem' }}>
            Học viên: <strong>{enrollment.student?.fullName || 'Học viên'}</strong> (
            <span style={{ fontFamily: 'monospace' }}>{enrollment.student?.studentCode}</span>)
          </p>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Lớp học hiện tại: <strong style={{ color: 'var(--accent-primary)' }}>{enrollment.class?.classCode || 'Lớp hiện tại'}</strong> — {enrollment.class?.className}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Chọn Lớp Chuyển Đến *</label>
            <select
              className="form-input"
              required
              value={targetClassId}
              onChange={(e) => setTargetClassId(e.target.value)}
              disabled={loadingClasses}
            >
              <option value="">-- Chọn lớp học mới --</option>
              {classes.map((c) => {
                const slots = c.availableSlots !== undefined ? c.availableSlots : c.maxCapacity;
                const isFull = slots <= 0;
                return (
                  <option key={c._id} value={c._id} disabled={isFull || c.status !== 'upcoming' && c.status !== 'active'}>
                    {c.classCode} — {c.className} ({c.skill?.toUpperCase()}) — Sĩ số: {c.activeEnrollmentsCount ?? 0}/{c.maxCapacity} {isFull ? '(ĐÃ ĐẦY)' : ''}
                  </option>
                );
              })}
            </select>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
              * Chỉ các lớp còn chỗ trống và đang hoạt động / sắp mở mới có thể chọn.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Lý Do Chuyển Lớp *</label>
            <textarea
              className="form-input"
              required
              rows="3"
              placeholder="VD: Thay đổi lịch làm việc, muốn đổi ca học tối..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !targetClassId || !reason.trim()}
            >
              {submitting ? 'Đang xử lý...' : 'Xác Nhận Chuyển Lớp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferEnrollmentModal;
