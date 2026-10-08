import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  Calendar, Clock, MapPin, User, BookOpen, Plus, Search,
  Filter, Trash2, Edit2, AlertCircle, CheckCircle, RefreshCw
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const DAY_NAMES = {
  2: 'Thứ Hai',
  3: 'Thứ Ba',
  4: 'Thứ Tư',
  5: 'Thứ Năm',
  6: 'Thứ Sáu',
  7: 'Thứ Bảy',
  8: 'Chủ Nhật'
};

const SchedulePage = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Filters
  const [filterClass, setFilterClass] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [filterRoom, setFilterRoom] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    classId: '',
    dayOfWeek: 2,
    startTime: '18:00',
    endTime: '19:30',
    room: '',
    teacher: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState(null);

  // Delete confirm
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const isAdmin = user?.role === 'Admin';
  const isTeacher = user?.role === 'Teacher';
  const isStudent = user?.role === 'Student';

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      let endpoint = `${baseUrl}/api/schedules`;
      if (isTeacher) {
        endpoint = `${baseUrl}/api/teacher/me/schedule`;
      } else if (isStudent) {
        endpoint = `${baseUrl}/api/student/schedule`;
      }

      const params = {};
      if (!isTeacher && !isStudent) {
        if (filterClass) params.classId = filterClass;
        if (filterTeacher) params.teacherId = filterTeacher;
        if (filterDay) params.dayOfWeek = filterDay;
        if (filterRoom) params.room = filterRoom;
      }

      const res = await axios.get(endpoint, { params });
      if (res.data.success) {
        // Backend returns array either in res.data.data or paginated
        const list = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.schedules || []);
        setSchedules(list);
      }
    } catch (err) {
      showToast('Không thể tải danh sách thời khóa biểu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    if (isAdmin || user?.role === 'Receptionist') {
      try {
        const [cRes, tRes] = await Promise.all([
          axios.get(`${baseUrl}/api/classes?limit=100`),
          axios.get(`${baseUrl}/api/teachers?limit=100`)
        ]);
        if (cRes.data.success) setClasses(cRes.data.data);
        if (tRes.data.success) setTeachers(tRes.data.data);
      } catch (e) {}
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [filterClass, filterTeacher, filterDay, filterRoom]);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const openCreateModal = () => {
    setEditingSchedule(null);
    setConflictError(null);
    setFormData({
      classId: classes[0]?._id || '',
      dayOfWeek: 2,
      startTime: '18:00',
      endTime: '19:30',
      room: classes[0]?.room || '',
      teacher: ''
    });
    setShowModal(true);
  };

  const openEditModal = (sched) => {
    setEditingSchedule(sched);
    setConflictError(null);
    setFormData({
      classId: sched.class?._id || sched.class,
      dayOfWeek: sched.dayOfWeek,
      startTime: sched.startTime,
      endTime: sched.endTime,
      room: sched.room,
      teacher: sched.teacher?._id || sched.teacher || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setConflictError(null);

    if (formData.endTime <= formData.startTime) {
      setConflictError('Giờ kết thúc phải lớn hơn giờ bắt đầu');
      setSubmitting(false);
      return;
    }

    try {
      if (editingSchedule) {
        const res = await axios.put(`${baseUrl}/api/schedules/${editingSchedule._id}`, {
          dayOfWeek: Number(formData.dayOfWeek),
          startTime: formData.startTime,
          endTime: formData.endTime,
          room: formData.room,
          teacher: formData.teacher || null
        });
        if (res.data.success) {
          showToast('Cập nhật thời khóa biểu thành công', 'success');
          setShowModal(false);
          fetchSchedules();
        }
      } else {
        const res = await axios.post(`${baseUrl}/api/classes/${formData.classId}/schedules`, {
          dayOfWeek: Number(formData.dayOfWeek),
          startTime: formData.startTime,
          endTime: formData.endTime,
          room: formData.room,
          teacher: formData.teacher || null
        });
        if (res.data.success) {
          showToast('Thêm thời khóa biểu thành công', 'success');
          setShowModal(false);
          fetchSchedules();
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Lỗi khi lưu thời khóa biểu';
      setConflictError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await axios.delete(`${baseUrl}/api/schedules/${deleteId}`);
      if (res.data.success) {
        showToast('Xóa thời khóa biểu thành công', 'success');
        setDeleteId(null);
        fetchSchedules();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể xóa thời khóa biểu';
      showToast(msg, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const renderSkillBadge = (skill) => {
    const map = {
      listening: { bg: '#e0f2fe', color: '#0369a1', text: 'Listening' },
      speaking: { bg: '#fef3c7', color: '#b45309', text: 'Speaking' },
      reading: { bg: '#dcfce7', color: '#15803d', text: 'Reading' },
      writing: { bg: '#f3e8ff', color: '#7e22ce', text: 'Writing' }
    };
    const s = map[skill?.toLowerCase()] || { bg: '#f1f5f9', color: '#475569', text: skill || 'Khác' };
    return (
      <span style={{
        backgroundColor: s.bg,
        color: s.color,
        padding: '0.2rem 0.5rem',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: '700',
        textTransform: 'uppercase'
      }}>
        {s.text}
      </span>
    );
  };

  return (
    <div className="schedule-page" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
            {isTeacher || isStudent ? 'Thời Khóa Biểu Của Tôi' : 'Thời Khóa Biểu Tuần'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {isTeacher || isStudent
              ? 'Lịch học định kỳ các lớp đang tham gia'
              : 'Quản lý lịch học hàng tuần và phòng học của các lớp'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={fetchSchedules}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <RefreshCw size={16} />
            Làm mới
          </button>
          {isAdmin && (
            <button
              onClick={openCreateModal}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <Plus size={16} />
              Thêm Ca Học
            </button>
          )}
        </div>
      </div>

      {/* Filter bar (Admin & Receptionist) */}
      {!isTeacher && !isStudent && (
        <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Lớp học:</label>
              <select
                className="form-input"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
              >
                <option value="">Tất cả lớp học</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.classCode} - {c.className}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Giáo viên:</label>
              <select
                className="form-input"
                value={filterTeacher}
                onChange={(e) => setFilterTeacher(e.target.value)}
              >
                <option value="">Tất cả giáo viên</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>{t.teacherCode} - {t.fullName}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Thứ trong tuần:</label>
              <select
                className="form-input"
                value={filterDay}
                onChange={(e) => setFilterDay(e.target.value)}
              >
                <option value="">Tất cả các ngày</option>
                <option value="2">Thứ Hai</option>
                <option value="3">Thứ Ba</option>
                <option value="4">Thứ Tư</option>
                <option value="5">Thứ Năm</option>
                <option value="6">Thứ Sáu</option>
                <option value="7">Thứ Bảy</option>
                <option value="8">Chủ Nhật</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Phòng học:</label>
              <input
                type="text"
                className="form-input"
                placeholder="Nhập tên phòng (VD: Phòng 101)"
                value={filterRoom}
                onChange={(e) => setFilterRoom(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Schedules Table */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Thứ</th>
                <th>Khung Giờ</th>
                <th>Lớp Học</th>
                <th>Kỹ Năng</th>
                <th>Phòng Học</th>
                <th>Giáo Viên</th>
                {isAdmin && <th style={{ textAlign: 'right' }}>Thao Tác</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="text-center" style={{ padding: '2.5rem' }}>
                    Đang tải thời khóa biểu...
                  </td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="text-center" style={{ padding: '3rem', color: 'var(--text-muted)' }}>
                    <Calendar size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                    <p>Chưa có lịch học nào phù hợp với bộ lọc.</p>
                  </td>
                </tr>
              ) : (
                schedules.map((s) => {
                  const effectiveTeacher = s.teacher?.fullName || s.class?.teacher?.fullName || 'Chưa phân công';
                  return (
                    <tr key={s._id}>
                      <td>
                        <span style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>
                          {DAY_NAMES[s.dayOfWeek]}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'monospace', fontWeight: '600' }}>
                          <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                          {s.startTime} – {s.endTime}
                        </span>
                      </td>
                      <td>
                        <div>
                          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                            {s.class?.className || 'Lớp học'}
                          </span>
                          <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                            {s.class?.classCode}
                          </div>
                        </div>
                      </td>
                      <td>{renderSkillBadge(s.class?.skill)}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                          {s.room}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <User size={14} style={{ color: 'var(--text-muted)' }} />
                          {effectiveTeacher}
                        </span>
                      </td>
                      {isAdmin && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <button
                              onClick={() => openEditModal(s)}
                              className="btn btn-secondary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                              title="Sửa ca học"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteId(s._id)}
                              className="btn btn-secondary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: 'var(--danger)' }}
                              title="Xóa ca học"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
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

      {/* Modal Add / Edit Schedule (Admin only) */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              {editingSchedule ? 'Chỉnh Sửa Ca Học' : 'Thêm Ca Học Định Kỳ'}
            </h2>

            {conflictError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--danger)',
                borderRadius: '6px',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                color: 'var(--danger)',
                fontSize: '0.85rem'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{conflictError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {!editingSchedule && (
                <div>
                  <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Lớp học *</label>
                  <select
                    className="form-input"
                    value={formData.classId}
                    onChange={(e) => {
                      const selected = classes.find(c => c._id === e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        classId: e.target.value,
                        room: selected?.room || prev.room
                      }));
                    }}
                    required
                  >
                    <option value="">-- Chọn lớp học --</option>
                    {classes.map(c => (
                      <option key={c._id} value={c._id}>{c.classCode} - {c.className} ({c.skill})</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Thứ trong tuần *</label>
                  <select
                    className="form-input"
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}
                    required
                  >
                    <option value="2">Thứ Hai</option>
                    <option value="3">Thứ Ba</option>
                    <option value="4">Thứ Tư</option>
                    <option value="5">Thứ Năm</option>
                    <option value="6">Thứ Sáu</option>
                    <option value="7">Thứ Bảy</option>
                    <option value="8">Chủ Nhật</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Phòng học *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="VD: Phòng 101"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Giờ bắt đầu *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Giờ kết thúc *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>
                  Giáo viên dạy ca này (Tùy chọn)
                </label>
                <select
                  className="form-input"
                  value={formData.teacher}
                  onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                >
                  <option value="">-- Mặc định theo giáo viên phụ trách lớp --</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>{t.teacherCode} - {t.fullName}</option>
                  ))}
                </select>
                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>
                  Nếu để trống, hệ thống sẽ sử dụng giáo viên chủ nhiệm của lớp học.
                </small>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Đang lưu...' : (editingSchedule ? 'Cập nhật' : 'Thêm ca học')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '1.5rem', textAlign: 'center' }}>
            <AlertCircle size={40} style={{ color: 'var(--danger)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              Xác nhận xóa thời khóa biểu?
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Lịch học chỉ có thể xóa nếu chưa sinh các buổi học thực tế (ClassSessions).
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <button
                onClick={() => setDeleteId(null)}
                className="btn btn-secondary"
                disabled={deleting}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-primary"
                style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
                disabled={deleting}
              >
                {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulePage;
