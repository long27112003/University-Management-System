import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, Search, Eye, Edit2, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader, StatusBadge } from '../components/common';

const StudentList = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Form modal state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    dateOfBirth: '',
    gender: 'other',
    academicStatus: 'active',
    address: { street: '', ward: '', district: '', city: '' },
    emergencyContact: { name: '', relationship: '', phone: '' },
    notes: ''
  });

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const detailPathPrefix = user?.role === 'Receptionist' ? '/receptionist/students' : '/admin/students';

  const fetchStudents = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter) params.append('academicStatus', statusFilter);

      const res = await axios.get(`${baseUrl}/api/students?${params.toString()}`);
      if (res.data.success) {
        setStudents(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi tải danh sách học viên', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents(1);
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      password: '',
      dateOfBirth: '',
      gender: 'other',
      academicStatus: 'active',
      address: { street: '', ward: '', district: '', city: '' },
      emergencyContact: { name: '', relationship: '', phone: '' },
      notes: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (student) => {
    setIsEditing(true);
    setEditingId(student._id);
    setFormData({
      fullName: student.fullName || '',
      email: student.email || '',
      phone: student.phone || '',
      password: '',
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.substring(0, 10) : '',
      gender: student.gender || 'other',
      academicStatus: student.academicStatus || 'active',
      address: {
        street: student.address?.street || '',
        ward: student.address?.ward || '',
        district: student.address?.district || '',
        city: student.address?.city || ''
      },
      emergencyContact: {
        name: student.emergencyContact?.name || '',
        relationship: student.emergencyContact?.relationship || '',
        phone: student.emergencyContact?.phone || ''
      },
      notes: student.notes || ''
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing) {
        const payload = { ...formData };
        delete payload.password; // email/profile edits
        await axios.put(`${baseUrl}/api/students/${editingId}`, payload);
        showToast('Cập nhật hồ sơ học viên thành công', 'success');
      } else {
        await axios.post(`${baseUrl}/api/students`, formData);
        showToast('Tạo hồ sơ học viên thành công', 'success');
      }
      setShowModal(false);
      fetchStudents(pagination.page);
    } catch (err) {
      showToast(err.response?.data?.message || 'Thao tác không thành công', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatusChange = async (studentId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await axios.patch(`${baseUrl}/api/students/${studentId}/status`, { academicStatus: nextStatus });
      showToast(`Đã chuyển trạng thái sang [${nextStatus}]`, 'success');
      fetchStudents(pagination.page);
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể đổi trạng thái', 'error');
    }
  };

  const renderStatusBadge = (status) => {
    const map = {
      active: { text: 'Đang học', bg: '#dcfce7', color: '#15803d' },
      waiting: { text: 'Chờ xếp lớp', bg: '#dbeafe', color: '#1d4ed8' },
      paused: { text: 'Bảo lưu', bg: '#fef3c7', color: '#b45309' },
      completed: { text: 'Hoàn thành', bg: '#ede9fe', color: '#6d28d9' },
      inactive: { text: 'Nghỉ học', bg: '#fee2e2', color: '#b91c1c' }
    };
    const s = map[status] || { text: status, bg: '#f1f5f9', color: '#475569' };
    return (
      <span style={{
        backgroundColor: s.bg,
        color: s.color,
        padding: '0.25rem 0.65rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        display: 'inline-block'
      }}>
        {s.text}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <PageHeader
        title="Học viên"
        subtitle="Quản lý hồ sơ, lớp học và quá trình đào tạo học viên trung tâm"
        action={
          <button
            onClick={handleOpenCreate}
            className="btn btn-primary"
          >
            <UserPlus size={16} />
            Thêm học viên
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 8px)',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          padding: '1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '260px', display: 'flex', gap: '0.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Tìm theo tên, email, SĐT, mã HV..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.5rem' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.45rem 1rem' }}>Tìm kiếm</button>
          {search && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearch('');
                fetchStudents(1);
              }}
            >
              Đặt lại
            </button>
          )}
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: '#64748B' }}>Trạng thái:</span>
          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '170px' }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="waiting">Chờ xếp lớp (waiting)</option>
            <option value="active">Đang học (active)</option>
            <option value="paused">Bảo lưu (paused)</option>
            <option value="completed">Hoàn thành (completed)</option>
            <option value="inactive">Nghỉ học (inactive)</option>
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg, 8px)',
        border: '1px solid var(--color-border-subtle, #E2E8F0)',
        boxShadow: 'var(--shadow-card)',
        overflowX: 'auto'
      }}>
        <table className="data-table" style={{ marginTop: 0 }}>
          <thead>
            <tr>
              <th>Mã Học Viên</th>
              <th>Họ và Tên</th>
              <th>Số Điện Thoại</th>
              <th>Email</th>
              <th>Trạng Thái Học Vụ</th>
              <th style={{ textAlign: 'right' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center" style={{ padding: '2rem' }}>
                  Đang tải dữ liệu học viên...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center" style={{ padding: '2.5rem', color: '#64748B' }}>
                  Không tìm thấy học viên nào phù hợp với điều kiện tìm kiếm.
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student._id} className="table-row-hover">
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--color-primary-600, #2563EB)', fontFamily: 'monospace' }}>
                      {student.studentCode}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#EFF6FF',
                        color: '#2563EB',
                        border: '1px solid #BFDBFE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '0.8125rem',
                        flexShrink: 0,
                        overflow: 'hidden'
                      }}>
                        {student.avatar ? (
                          <img
                            src={student.avatar}
                            alt={student.fullName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                            }}
                          />
                        ) : null}
                        <span style={{ display: student.avatar ? 'none' : 'block' }}>
                          {student.fullName?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{student.fullName}</span>
                    </div>
                  </td>
                  <td>{student.phone || '—'}</td>
                  <td>{student.email}</td>
                  <td><StatusBadge status={student.academicStatus} /></td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => navigate(`${detailPathPrefix}/${student._id}`)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                        title="Xem chi tiết hồ sơ"
                      >
                        <Eye size={15} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                        Chi tiết
                      </button>
                      <button
                        onClick={() => handleOpenEdit(student)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: 'var(--accent-primary)' }}
                        title="Chỉnh sửa thông tin"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleQuickStatusChange(student._id, student.academicStatus)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                        title={`Đổi trạng thái sang ${student.academicStatus === 'active' ? 'Bảo lưu' : 'Đang học'}`}
                      >
                        {student.academicStatus === 'active' ? (
                          <ToggleRight size={18} style={{ color: 'var(--success)' }} />
                        ) : (
                          <ToggleLeft size={18} style={{ color: 'var(--text-muted)' }} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination controls */}
        {!loading && pagination.total > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total} học viên
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                disabled={pagination.page <= 1}
                onClick={() => fetchStudents(pagination.page - 1)}
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
                onClick={() => fetchStudents(pagination.page + 1)}
                style={{ padding: '0.35rem 0.75rem', opacity: pagination.page >= pagination.totalPages ? 0.5 : 1 }}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Add / Edit Student */}
      {showModal && (
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
            maxWidth: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.75rem',
            borderRadius: 'var(--radius-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>
                {isEditing ? 'Chỉnh Sửa Hồ Sơ Học Viên' : 'Thêm Học Viên Mới'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Họ và Tên *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email (Đăng nhập) *</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="student@example.com"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Số Điện Thoại *</label>
                  <input
                    type="tel"
                    required
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0912345678"
                  />
                </div>
                {!isEditing && (
                  <div className="form-group">
                    <label className="form-label">Mật khẩu ban đầu</label>
                    <input
                      type="password"
                      className="form-input"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Mặc định: student123"
                    />
                  </div>
                )}
                {isEditing && (
                  <div className="form-group">
                    <label className="form-label">Trạng Thái Học Vụ</label>
                    <select
                      className="form-input"
                      value={formData.academicStatus}
                      onChange={(e) => setFormData({ ...formData, academicStatus: e.target.value })}
                    >
                      <option value="waiting">Chờ xếp lớp (waiting)</option>
                      <option value="active">Đang học (active)</option>
                      <option value="paused">Bảo lưu (paused)</option>
                      <option value="completed">Hoàn thành (completed)</option>
                      <option value="inactive">Nghỉ học (inactive)</option>
                    </select>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Ngày Sinh</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Giới Tính</label>
                  <select
                    className="form-input"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>

              {/* Address details */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Địa Chỉ Thường Trú</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Số nhà, đường"
                    value={formData.address.street}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Phường / Xã"
                    value={formData.address.ward}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, ward: e.target.value } })}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Quận / Huyện"
                    value={formData.address.district}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, district: e.target.value } })}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Tỉnh / Thành phố"
                    value={formData.address.city}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                  />
                </div>
              </div>

              {/* Emergency contact */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Liên Hệ Khẩn Cấp</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Họ tên người liên hệ"
                    value={formData.emergencyContact.name}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, name: e.target.value } })}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Mối quan hệ"
                    value={formData.emergencyContact.relationship}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, relationship: e.target.value } })}
                  />
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="SĐT người liên hệ"
                    value={formData.emergencyContact.phone}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, phone: e.target.value } })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Ghi Chú</label>
                <textarea
                  className="form-input"
                  rows="2"
                  placeholder="Ghi chú về học viên..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Đang lưu...' : (isEditing ? 'Cập Nhật' : 'Tạo Học Viên')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
