import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Bell, Trash2, Edit3, PlusCircle, Calendar, User, CheckCircle2, AlertCircle } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { PageHeader, LoadingSkeleton, EmptyState } from '../components/common';

const AUDIENCE_MAP = {
  all: { label: 'Tất cả', color: '#1D4ED8', bg: '#EFF6FF' },
  teacher: { label: 'Giáo viên', color: '#6D28D9', bg: '#F5F3FF' },
  student: { label: 'Học viên', color: '#047857', bg: '#ECFDF5' },
  receptionist: { label: 'Lễ tân', color: '#B45309', bg: '#FFFBEB' },
};

const NoticeBoard = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', audience: 'all' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const canCreateOrEdit = user?.role === 'Admin' || user?.role === 'Receptionist';
  const canDelete = user?.role === 'Admin';

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/notices`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setNotices(res.data);
    } catch (err) {
      console.error('Error fetching notices:', err);
      showToast(err.response?.data?.message || 'Không thể tải bảng thông báo', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [user?.role]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ title: '', content: '', audience: 'all' });
    setShowForm(true);
  };

  const handleOpenEdit = (notice) => {
    setEditingId(notice._id);
    setFormData({
      title: notice.title,
      content: notice.content,
      audience: notice.audience || 'all',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canCreateOrEdit) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (editingId) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/notices/${editingId}`, formData, { headers });
        showToast('Cập nhật thông báo thành công!', 'success');
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/notices`, formData, { headers });
        showToast('Đăng thông báo mới thành công!', 'success');
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({ title: '', content: '', audience: 'all' });
      fetchNotices();
    } catch (err) {
      console.error('Error saving notice:', err);
      showToast(err.response?.data?.message || 'Lỗi khi lưu thông báo', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !canDelete) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/notices/${deleteTarget}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      showToast('Đã xóa thông báo!', 'success');
      setDeleteTarget(null);
      fetchNotices();
    } catch (err) {
      console.error('Error deleting notice:', err);
      showToast(err.response?.data?.message || 'Lỗi khi xóa thông báo', 'error');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <PageHeader
        title="Bảng Tin & Thông Báo"
        subtitle="Thông tin lịch học, sự kiện và thông báo điều hành trung tâm VLearn"
        action={
          canCreateOrEdit && (
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              <PlusCircle size={16} /> Tạo thông báo
            </button>
          )
        }
      />

      {/* Notice Form (Create / Edit) */}
      {showForm && canCreateOrEdit && (
        <div
          className="card-panel fade-slide-up"
          style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg, 8px)',
            border: '1px solid var(--color-border-subtle, #E2E8F0)',
            borderLeft: '4px solid var(--color-primary-600, #2563EB)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#0F172A' }}>
            {editingId ? 'Chỉnh Sửa Thông Báo' : 'Tạo Thông Báo Mới'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-label">
                Tiêu Đề Thông Báo <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Nhập tiêu đề thông báo..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label">
                Nội Dung Thông Báo <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="Nhập nội dung thông báo chi tiết..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label">
                Đối Tượng Nhận <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                className="form-input"
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
              >
                <option value="all">Tất cả (Toàn trung tâm)</option>
                <option value="teacher">Giáo viên</option>
                <option value="student">Học viên</option>
                <option value="receptionist">Lễ tân</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Đang lưu...' : (editingId ? 'Cập Nhật' : 'Đăng Thông Báo')}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                disabled={submitting}
              >
                Hủy Bỏ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notices Grid */}
      {loading ? (
        <LoadingSkeleton type="card" count={4} />
      ) : notices.length === 0 ? (
        <EmptyState
          icon={<Bell size={28} />}
          title="Không có thông báo nào"
          description="Hiện tại không có thông báo nào phù hợp với tài khoản của bạn."
          action={
            canCreateOrEdit && (
              <button className="btn btn-primary" onClick={handleOpenCreate}>
                <PlusCircle size={16} /> Tạo thông báo đầu tiên
              </button>
            )
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {notices.map((notice) => {
            const audInfo = AUDIENCE_MAP[notice.audience] || AUDIENCE_MAP.all;
            return (
              <div
                key={notice._id}
                className="card-panel zoom-hover-sm"
                style={{
                  background: '#FFFFFF',
                  borderRadius: 'var(--radius-lg, 8px)',
                  border: '1px solid var(--color-border-subtle, #E2E8F0)',
                  boxShadow: 'var(--shadow-card)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: audInfo.color,
                      background: audInfo.bg,
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {audInfo.label}
                  </span>

                  {/* Actions for Admin / Receptionist */}
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {canCreateOrEdit && (
                      <button
                        onClick={() => handleOpenEdit(notice)}
                        title="Chỉnh sửa"
                        style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}
                      >
                        <Edit3 size={16} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => setDeleteTarget(notice._id)}
                        title="Xóa thông báo"
                        style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Bell size={16} color="#2563EB" style={{ flexShrink: 0 }} />
                  {notice.title}
                </h3>

                <p style={{ color: '#64748B', fontSize: '0.875rem', flex: 1, whiteSpace: 'pre-wrap', lineHeight: 1.5, margin: 0 }}>
                  {notice.content}
                </p>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 'auto',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid #E2E8F0',
                    fontSize: '0.75rem',
                    color: '#64748B',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={13} /> {formatDate(notice.createdAt)}
                  </span>
                  <span>
                    Người đăng: <strong style={{ color: '#0F172A' }}>{notice.createdBy?.name || 'Quản trị viên'}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Xác nhận xóa thông báo"
        message="Bạn có chắc chắn muốn xóa thông báo này? Hành động này sẽ không thể khôi phục."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmText="Xóa thông báo"
        isDanger={true}
      />
    </div>
  );
};

export default NoticeBoard;
