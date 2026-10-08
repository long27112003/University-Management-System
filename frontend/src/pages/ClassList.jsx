import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Plus, Search, Eye, Edit2, Users, Calendar, MapPin, X, BookOpen, Layers
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SkillBadge, StatusBadge, EmptyState } from '../components/common';

const ClassList = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');

  // Modal create/edit
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    className: '',
    skill: 'speaking',
    teacher: '',
    maxCapacity: 15,
    startDate: '',
    endDate: '',
    tuitionFee: 3500000,
    room: '',
    status: 'upcoming'
  });

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const detailPathPrefix =
    user?.role === 'Student' ? '/student/classes' :
    user?.role === 'Teacher' ? '/teacher/classes' :
    user?.role === 'Receptionist' ? '/receptionist/classes' :
    '/admin/classes';
  const canManageClass = user?.role === 'Admin';

  const fetchClasses = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });
      if (search.trim()) params.append('search', search.trim());
      if (skillFilter) params.append('skill', skillFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (teacherFilter) params.append('teacherId', teacherFilter);

      const res = await axios.get(`${baseUrl}/api/classes?${params.toString()}`);
      if (res.data.success) {
        setClasses(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi tải danh sách lớp học', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/teachers?limit=100&status=active`);
      if (res.data.success) {
        setTeachers(res.data.data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchClasses(1);
  }, [skillFilter, statusFilter, teacherFilter]);

  useEffect(() => {
    if (canManageClass || user?.role === 'Receptionist') {
      fetchTeachers();
    }
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchClasses(1);
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      className: '',
      skill: 'speaking',
      teacher: teachers[0]?._id || '',
      maxCapacity: 15,
      startDate: '',
      endDate: '',
      tuitionFee: 3500000,
      room: '',
      status: 'upcoming'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (c, e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditingId(c._id);
    setFormData({
      className: c.className || '',
      skill: c.skill || 'speaking',
      teacher: c.teacher?._id || c.teacher || '',
      maxCapacity: c.maxCapacity || 15,
      startDate: c.startDate ? c.startDate.substring(0, 10) : '',
      endDate: c.endDate ? c.endDate.substring(0, 10) : '',
      tuitionFee: c.tuitionFee || 0,
      room: c.room || '',
      status: c.status || 'upcoming'
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing) {
        await axios.put(`${baseUrl}/api/classes/${editingId}`, formData);
        showToast('Cập nhật lớp học thành công', 'success');
      } else {
        await axios.post(`${baseUrl}/api/classes`, formData);
        showToast('Tạo lớp học mới thành công', 'success');
      }
      setShowModal(false);
      fetchClasses(pagination.page);
    } catch (err) {
      showToast(err.response?.data?.message || 'Thao tác không thành công', 'error');
    } finally {
      setSaving(false);
    }
  };

  const renderSkillBadge = (skill) => {
    const map = {
      listening: { bg: '#e0f2fe', color: '#0369a1', text: 'Listening' },
      speaking: { bg: '#fef3c7', color: '#b45309', text: 'Speaking' },
      reading: { bg: '#dcfce7', color: '#15803d', text: 'Reading' },
      writing: { bg: '#f3e8ff', color: '#7e22ce', text: 'Writing' }
    };
    const s = map[skill?.toLowerCase()] || { bg: '#f1f5f9', color: '#475569', text: skill };
    return (
      <span style={{
        backgroundColor: s.bg,
        color: s.color,
        padding: '0.2rem 0.55rem',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: '700',
        textTransform: 'uppercase'
      }}>
        {s.text}
      </span>
    );
  };

  const renderStatusBadge = (status) => {
    const map = {
      upcoming: { bg: '#e0e7ff', color: '#4338ca', text: 'Sắp mở' },
      active: { bg: '#dcfce7', color: '#15803d', text: 'Đang diễn ra' },
      completed: { bg: '#f1f5f9', color: '#475569', text: 'Đã hoàn thành' },
      cancelled: { bg: '#fee2e2', color: '#b91c1c', text: 'Đã hủy' },
      archived: { bg: '#f3f4f6', color: '#6b7280', text: 'Lưu trữ' }
    };
    const s = map[status] || { bg: '#f1f5f9', color: '#475569', text: status };
    return (
      <span style={{
        backgroundColor: s.bg,
        color: s.color,
        padding: '0.2rem 0.55rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600'
      }}>
        {s.text}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
            Quản Lý Lớp Học
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Hệ thống quản lý lớp học theo kỹ năng IELTS tại VLearn English Center
          </p>
        </div>
        {canManageClass && (
          <button
            onClick={handleOpenCreate}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={18} />
            Mở Lớp Mới
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '240px', display: 'flex', gap: '0.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Tìm theo tên lớp, mã lớp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.5rem' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          <button type="submit" className="btn btn-secondary">Tìm kiếm</button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Kỹ năng:</span>
          <select
            className="form-input"
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            style={{ width: '130px' }}
          >
            <option value="">Tất cả kỹ năng</option>
            <option value="listening">Listening</option>
            <option value="speaking">Speaking</option>
            <option value="reading">Reading</option>
            <option value="writing">Writing</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Trạng thái:</span>
          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '140px' }}
          >
            <option value="">Tất cả</option>
            <option value="upcoming">Sắp mở</option>
            <option value="active">Đang diễn ra</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>

        {teachers.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Giáo viên:</span>
            <select
              className="form-input"
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              style={{ width: '160px' }}
            >
              <option value="">Tất cả GV</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.fullName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Class Cards Grid */}
      {loading ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Đang tải danh sách lớp học...
        </div>
      ) : classes.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={36} color="#3B82F6" />}
          title={user?.role === 'Student' ? 'Bạn chưa có lớp học nào đang tham gia' : 'Không tìm thấy lớp học phù hợp'}
          description={
            user?.role === 'Student'
              ? 'Bạn hiện chưa được ghi danh vào lớp học nào. Hãy liên hệ bộ phận Tuyển sinh hoặc Cố vấn học tập để nhận tư vấn và xếp lớp IELTS phù hợp với mục tiêu của bạn.'
              : 'Không tìm thấy lớp học nào khớp với từ khóa hoặc bộ lọc hiện tại. Hãy thử chọn kỹ năng hoặc trạng thái khác.'
          }
          extra={
            user?.role === 'Student' ? (
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <SkillBadge skill="listening" />
                <SkillBadge skill="speaking" />
                <SkillBadge skill="reading" />
                <SkillBadge skill="writing" />
              </div>
            ) : null
          }
          action={
            (search || skillFilter || statusFilter || teacherFilter) ? (
              <button
                className="btn btn-secondary zoom-hover-sm"
                onClick={() => {
                  setSearch('');
                  setSkillFilter('');
                  setStatusFilter('');
                  setTeacherFilter('');
                }}
              >
                Xóa tất cả bộ lọc
              </button>
            ) : null
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {classes.map((c) => {
            const activeSlots = c.activeEnrollmentsCount ?? 0;
            const percentage = Math.min(100, Math.round((activeSlots / c.maxCapacity) * 100));

            return (
              <div
                key={c._id}
                className="glass-panel zoom-hover-sm"
                onClick={() => navigate(`${detailPathPrefix}/${c._id}`)}
                style={{
                  padding: '1.25rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '14px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
                  transition: 'all 0.25s ease'
                }}
              >
                <div>
                  {/* Top Bar: Code, Skill, Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: '700', color: 'var(--accent-primary)', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                        {c.classCode}
                      </span>
                      <SkillBadge skill={c.skill} />
                    </div>
                    <StatusBadge status={c.status} />
                  </div>

                  {/* Class Name */}
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: '0 0 0.75rem', color: 'var(--text-primary)', lineHeight: '1.35' }}>
                    {c.className}
                  </h3>

                  {/* Teacher & Room */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {c.teacher?.avatar ? (
                        <img
                          src={c.teacher.avatar}
                          alt={c.teacher.fullName}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '1.5px solid #DBEAFE',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                          color: '#FFFFFF',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
                        }}>
                          {c.teacher?.fullName ? c.teacher.fullName.charAt(0) : 'G'}
                        </div>
                      )}
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', lineHeight: 1.1 }}>Giảng viên hướng dẫn</span>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                          {c.teacher?.fullName || 'Chưa phân công'}
                        </strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '0.25rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <MapPin size={14} style={{ color: '#0EA5E9' }} /> {c.room || 'Phòng học'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={14} style={{ color: '#EC4899' }} />
                        {c.startDate ? new Date(c.startDate).toLocaleDateString('vi-VN') : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Sĩ số:</span>
                    <strong>
                      {activeSlots} / {c.maxCapacity} học viên ({percentage}%)
                    </strong>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${percentage}%`,
                        background: percentage >= 100 ? 'var(--danger)' : 'var(--accent-gradient)',
                        borderRadius: '3px'
                      }}
                    />
                  </div>

                  {/* Bottom Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {Number(c.tuitionFee).toLocaleString('vi-VN')} đ
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {canManageClass && (
                        <button
                          onClick={(e) => handleOpenEdit(c, e)}
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                          title="Sửa lớp học"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`${detailPathPrefix}/${c._id}`);
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                      >
                        <Eye size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                        Xem lớp
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination controls */}
      {!loading && pagination.total > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 0', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total} lớp học
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary"
              disabled={pagination.page <= 1}
              onClick={() => fetchClasses(pagination.page - 1)}
              style={{ padding: '0.35rem 0.75rem', opacity: pagination.page <= 1 ? 0.5 : 1 }}
            >
              Trước
            </button>
            <span style={{ alignSelf: 'center', padding: '0 0.5rem', fontWeight: '600' }}>
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              className="btn btn-secondary"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchClasses(pagination.page + 1)}
              style={{ padding: '0.35rem 0.75rem', opacity: pagination.page >= pagination.totalPages ? 0.5 : 1 }}
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Class (Admin Only) */}
      {showModal && canManageClass && (
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
            maxWidth: '620px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.75rem',
            borderRadius: 'var(--radius-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>
                {isEditing ? 'Chỉnh Sửa Thông Tin Lớp Học' : 'Mở Lớp Học Mới'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Tên Lớp Học *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="VD: IELTS Speaking Intensive K15"
                  value={formData.className}
                  onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Kỹ Năng Đào Tạo *</label>
                  <select
                    className="form-input"
                    value={formData.skill}
                    onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
                  >
                    <option value="speaking">Speaking (Nói)</option>
                    <option value="listening">Listening (Nghe)</option>
                    <option value="reading">Reading (Đọc)</option>
                    <option value="writing">Writing (Viết)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Giáo Viên Phụ Trách *</label>
                  <select
                    className="form-input"
                    required
                    value={formData.teacher}
                    onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                  >
                    <option value="">-- Chọn giảng viên --</option>
                    {teachers.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.fullName} ({t.teacherCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Sĩ Số Tối Đa (1 - 30) *</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    className="form-input"
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phòng Học *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="VD: Phòng 302, Lab 01"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Ngày Khai Giảng *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ngày Bế Giảng Dự Kiến *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Học Phí Khóa Học (VNĐ) *</label>
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    required
                    className="form-input"
                    value={formData.tuitionFee}
                    onChange={(e) => setFormData({ ...formData, tuitionFee: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Trạng Thái Lớp</label>
                  <select
                    className="form-input"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="upcoming">Sắp mở (upcoming)</option>
                    <option value="active">Đang diễn ra (active)</option>
                    <option value="completed">Đã hoàn thành (completed)</option>
                    <option value="cancelled">Đã hủy (cancelled)</option>
                    <option value="archived">Lưu trữ (archived)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : (isEditing ? 'Cập Nhật' : 'Tạo Lớp Học')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassList;
