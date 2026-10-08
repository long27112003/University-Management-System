import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, Search, Eye, Edit2, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

import { PageHeader, StatusBadge, SkillBadge } from '../components/common';

const TeacherList = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [teachers, setTeachers] = useState([]);
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
    gender: 'other',
    specialization: [],
    status: 'active',
    address: { street: '', ward: '', district: '', city: '' },
    notes: ''
  });

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const detailPathPrefix = user?.role === 'Receptionist' ? '/receptionist/teachers' : '/admin/teachers';
  const canManageTeachers = user?.role === 'Admin';

  const specializationOptions = [
    { value: 'listening', label: 'Listening' },
    { value: 'speaking', label: 'Speaking' },
    { value: 'reading', label: 'Reading' },
    { value: 'writing', label: 'Writing' },
    { value: 'ielts', label: 'IELTS Tổng Quát' }
  ];

  const fetchTeachers = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter) params.append('status', statusFilter);

      const res = await axios.get(`${baseUrl}/api/teachers?${params.toString()}`);
      if (res.data.success) {
        setTeachers(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi tải danh sách giáo viên', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTeachers(1);
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      password: '',
      gender: 'other',
      specialization: [],
      status: 'active',
      address: { street: '', ward: '', district: '', city: '' },
      notes: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (teacher) => {
    setIsEditing(true);
    setEditingId(teacher._id);
    setFormData({
      fullName: teacher.fullName || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      password: '',
      gender: teacher.gender || 'other',
      specialization: teacher.specialization || [],
      status: teacher.status || 'active',
      address: {
        street: teacher.address?.street || '',
        ward: teacher.address?.ward || '',
        district: teacher.address?.district || '',
        city: teacher.address?.city || ''
      },
      notes: teacher.notes || ''
    });
    setShowModal(true);
  };

  const handleSpecializationToggle = (value) => {
    setFormData(prev => {
      const exists = prev.specialization.includes(value);
      if (exists) {
        return { ...prev, specialization: prev.specialization.filter(item => item !== value) };
      } else {
        return { ...prev, specialization: [...prev.specialization, value] };
      }
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing) {
        const payload = { ...formData };
        delete payload.password;
        await axios.put(`${baseUrl}/api/teachers/${editingId}`, payload);
        showToast('Cập nhật thông tin giáo viên thành công', 'success');
      } else {
        await axios.post(`${baseUrl}/api/teachers`, formData);
        showToast('Tạo hồ sơ giáo viên mới thành công', 'success');
      }
      setShowModal(false);
      fetchTeachers(pagination.page);
    } catch (err) {
      showToast(err.response?.data?.message || 'Thao tác không thành công', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatusChange = async (teacherId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await axios.patch(`${baseUrl}/api/teachers/${teacherId}/status`, { status: nextStatus });
      showToast(`Đã cập nhật trạng thái giáo viên sang [${nextStatus}]`, 'success');
      fetchTeachers(pagination.page);
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể đổi trạng thái', 'error');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <PageHeader
        title="Giáo viên"
        subtitle="Quản lý hồ sơ, đội ngũ giảng viên và chuyên môn đào tạo tại VLearn"
        action={
          canManageTeachers && (
            <button
              onClick={handleOpenCreate}
              className="btn btn-primary"
            >
              <UserPlus size={16} />
              Thêm giáo viên
            </button>
          )
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
              placeholder="Tìm theo tên, email, SĐT, mã GV..."
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
                fetchTeachers(1);
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
            <option value="active">Đang công tác (active)</option>
            <option value="inactive">Tạm ngưng (inactive)</option>
          </select>
        </div>
      </div>

      {/* Teachers Data Table */}
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
              <th>Mã GV</th>
              <th>Họ và Tên</th>
              <th>Số Điện Thoại</th>
              <th>Email</th>
              <th>Chuyên Môn</th>
              <th>Trạng Thái</th>
              <th style={{ textAlign: 'right' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center" style={{ padding: '2rem' }}>
                  Đang tải dữ liệu giảng viên...
                </td>
              </tr>
            ) : teachers.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center" style={{ padding: '2.5rem', color: '#64748B' }}>
                  Không tìm thấy giáo viên nào phù hợp với điều kiện tìm kiếm.
                </td>
              </tr>
            ) : (
              teachers.map((teacher) => (
                <tr key={teacher._id} className="table-row-hover">
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--color-primary-600, #2563EB)', fontFamily: 'monospace' }}>
                      {teacher.teacherCode}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        backgroundColor: '#EFF6FF',
                        color: '#2563EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '0.8125rem'
                      }}>
                        {teacher.fullName?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{teacher.fullName}</span>
                    </div>
                  </td>
                  <td>{teacher.phone || '—'}</td>
                  <td>{teacher.email}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {teacher.specialization && teacher.specialization.length > 0 ? (
                        teacher.specialization.map((spec) => (
                          <SkillBadge key={spec} skill={spec} />
                        ))
                      ) : (
                        <span style={{ color: '#64748B', fontSize: '0.8rem' }}>Chưa thiết lập</span>
                      )}
                    </div>
                  </td>
                  <td><StatusBadge status={teacher.status} /></td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => navigate(`${detailPathPrefix}/${teacher._id}`)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                        title="Xem chi tiết giáo viên"
                      >
                        <Eye size={15} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                        Chi tiết
                      </button>
                      {canManageTeachers && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(teacher)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: 'var(--color-primary-600, #2563EB)' }}
                            title="Chỉnh sửa giáo viên"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleQuickStatusChange(teacher._id, teacher.status)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                            title={`Chuyển trạng thái sang ${teacher.status === 'active' ? 'Tạm ngưng' : 'Đang công tác'}`}
                          >
                            {teacher.status === 'active' ? (
                              <ToggleRight size={18} style={{ color: 'var(--color-success, #10B981)' }} />
                            ) : (
                              <ToggleLeft size={18} style={{ color: '#94A3B8' }} />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination controls */}
        {!loading && pagination.total > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border-subtle, #E2E8F0)', fontSize: '0.875rem' }}>
            <span style={{ color: '#64748B' }}>
              Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total} giáo viên
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                disabled={pagination.page <= 1}
                onClick={() => fetchTeachers(pagination.page - 1)}
                style={{ padding: '0.35rem 0.75rem', opacity: pagination.page <= 1 ? 0.5 : 1 }}
              >
                Trước
              </button>
              <span style={{ alignSelf: 'center', padding: '0 0.5rem', fontWeight: 600, color: '#0F172A' }}>
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchTeachers(pagination.page + 1)}
                style={{ padding: '0.35rem 0.75rem', opacity: pagination.page >= pagination.totalPages ? 0.5 : 1 }}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Add / Edit Teacher (Admin Only) */}
      {showModal && canManageTeachers && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.75rem',
            borderRadius: 'var(--radius-lg, 8px)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid var(--color-border-subtle, #E2E8F0)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>
                {isEditing ? 'Chỉnh Sửa Hồ Sơ Giáo Viên' : 'Thêm Giáo Viên Mới'}
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
                    placeholder="Nguyễn Văn B"
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
                    placeholder="teacher@example.com"
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
                    placeholder="0987654321"
                  />
                </div>
                {!isEditing ? (
                  <div className="form-group">
                    <label className="form-label">Mật khẩu ban đầu</label>
                    <input
                      type="password"
                      className="form-input"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Mặc định: teacher123"
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Trạng Thái Công Tác</label>
                    <select
                      className="form-input"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">Đang công tác (active)</option>
                      <option value="inactive">Tạm ngưng (inactive)</option>
                    </select>
                  </div>
                )}
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

              {/* Specializations checkboxes */}
              <div>
                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Chuyên Môn Giảng Dạy</label>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {specializationOptions.map((opt) => (
                    <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                      <input
                        type="checkbox"
                        checked={formData.specialization.includes(opt.value)}
                        onChange={() => handleSpecializationToggle(opt.value)}
                        style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
                      />
                      {opt.label}
                    </label>
                  ))}
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

              <div className="form-group">
                <label className="form-label">Ghi Chú</label>
                <textarea
                  className="form-input"
                  rows="2"
                  placeholder="Ghi chú về giảng viên..."
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
                  {saving ? 'Đang lưu...' : (isEditing ? 'Cập Nhật' : 'Tạo Giáo Viên')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherList;
