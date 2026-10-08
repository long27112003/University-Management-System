import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, UserPlus, Search, AlertCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const EnrollmentModal = ({ classDoc, isOpen, onClose, onEnrolled }) => {
  const { showToast } = useToast();
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [note, setNote] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
      setSelectedStudentId('');
      setNote('');
    }
  }, [isOpen]);

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const res = await axios.get(`${baseUrl}/api/students?limit=100`);
      if (res.data.success) {
        setStudents(res.data.data);
      }
    } catch (err) {
      showToast('Không thể tải danh sách học viên', 'error');
    } finally {
      setLoadingStudents(false);
    }
  };

  if (!isOpen || !classDoc) return null;

  const filteredStudents = students.filter((s) => {
    const q = studentSearch.toLowerCase().trim();
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.studentCode.toLowerCase().includes(q) ||
      (s.phone && s.phone.includes(q))
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) {
      showToast('Vui lòng chọn học viên cần ghi danh', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${baseUrl}/api/classes/${classDoc._id}/enrollments`, {
        studentId: selectedStudentId,
        note: note.trim()
      });

      if (res.data.success) {
        showToast('Ghi danh học viên vào lớp thành công!', 'success');
        if (onEnrolled) onEnrolled(res.data.data);
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Lỗi khi ghi danh học viên';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isFull = classDoc.availableSlots !== undefined ? classDoc.availableSlots <= 0 : false;

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
            <UserPlus size={20} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>
              Ghi Danh Học Viên
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Class summary badge */}
        <div style={{
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1rem',
          marginBottom: '1.25rem',
          fontSize: '0.875rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ color: 'var(--accent-primary)' }}>{classDoc.classCode}</strong>
              <span style={{ margin: '0 0.5rem', color: 'var(--text-muted)' }}>•</span>
              <span style={{ fontWeight: '600' }}>{classDoc.className}</span>
            </div>
            <span style={{
              background: isFull ? '#fee2e2' : '#dcfce7',
              color: isFull ? '#b91c1c' : '#15803d',
              padding: '0.2rem 0.5rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              Sĩ số: {classDoc.activeEnrollmentsCount ?? 0} / {classDoc.maxCapacity}
            </span>
          </div>
        </div>

        {isFull && (
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            color: '#92400e',
            fontSize: '0.85rem',
            marginBottom: '1rem',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>Lớp học đã đạt sĩ số tối đa. Ghi danh thêm sẽ bị từ chối với mã 409 Conflict.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Search student */}
          <div className="form-group">
            <label className="form-label">Tìm Kiếm Học Viên</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Nhập tên, mã học viên hoặc SĐT..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.3rem' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Select student */}
          <div className="form-group">
            <label className="form-label">Chọn Học Viên *</label>
            <select
              className="form-input"
              required
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              disabled={loadingStudents}
            >
              <option value="">-- Chọn học viên --</option>
              {filteredStudents.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.studentCode} — {s.fullName} ({s.phone || 'Chưa có SĐT'})
                </option>
              ))}
            </select>
            {filteredStudents.length === 0 && !loadingStudents && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Không tìm thấy học viên phù hợp với từ khóa.
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Ghi Chú Ghi Danh</label>
            <textarea
              className="form-input"
              rows="2"
              placeholder="Ghi chú về đợt ghi danh này..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !selectedStudentId}
            >
              {submitting ? 'Đang ghi danh...' : 'Xác Nhận Ghi Danh'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnrollmentModal;
