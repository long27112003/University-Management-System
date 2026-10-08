import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  BookOpen,
  Calendar,
  AlertCircle,
  PlusCircle,
  FileCode,
  FileSpreadsheet,
  Image as ImageIcon
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { PageHeader, LoadingSkeleton, EmptyState } from '../components/common';

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getFileIcon = (fileType) => {
  const type = (fileType || '').toLowerCase();
  if (['xls', 'xlsx'].includes(type)) return <FileSpreadsheet size={22} color="#059669" />;
  if (['png', 'jpg', 'jpeg'].includes(type)) return <ImageIcon size={22} color="#D97706" />;
  if (['pdf'].includes(type)) return <FileText size={22} color="#EF4444" />;
  return <FileCode size={22} color="#2563EB" />;
};

const StudyMaterialsPage = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [materials, setMaterials] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({ title: '', description: '', file: null });
  const [uploading, setUploading] = useState(false);

  // Delete modal state
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const isTeacher = user?.role === 'Teacher';
  const isStudent = user?.role === 'Student';
  const isAdmin = user?.role === 'Admin';
  const canUpload = isAdmin || isTeacher;

  // 1. Fetch available classes based on role
  useEffect(() => {
    const fetchUserClasses = async () => {
      try {
        setLoadingClasses(true);
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        let classList = [];
        if (isTeacher) {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/teachers/me/classes`, { headers });
          classList = res.data?.data || res.data || [];
        } else if (isStudent) {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/student/dashboard`, { headers });
          classList = res.data?.activeClasses || [];
        } else {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/classes?limit=100`, { headers });
          classList = res.data?.data || [];
        }

        setClasses(classList);
        if (classList.length > 0) {
          const firstId = classList[0]._id || classList[0].classId;
          setSelectedClassId(firstId);
        }
      } catch (err) {
        console.error('Error fetching classes:', err);
        showToast(err.response?.data?.message || 'Không thể tải danh sách lớp học', 'error');
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchUserClasses();
  }, [user?.role]);

  // 2. Fetch materials when selectedClassId changes
  const fetchMaterials = async (classId) => {
    if (!classId) return;
    try {
      setLoadingMaterials(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/classes/${classId}/materials`, { headers });
      setMaterials(res.data);
    } catch (err) {
      console.error('Error loading materials:', err);
      showToast(err.response?.data?.message || 'Không thể tải tài liệu lớp học', 'error');
    } finally {
      setLoadingMaterials(false);
    }
  };

  useEffect(() => {
    if (selectedClassId) {
      fetchMaterials(selectedClassId);
    }
  }, [selectedClassId]);

  // 3. Handle upload
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadData.file) {
      showToast('Vui lòng chọn tệp tin cần tải lên', 'error');
      return;
    }
    if (!selectedClassId) {
      showToast('Vui lòng chọn lớp học để tải lên', 'error');
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.description);
      formData.append('material', uploadData.file);

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/classes/${selectedClassId}/materials`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        }
      );

      showToast('Tải lên tài liệu thành công!', 'success');
      setShowUploadModal(false);
      setUploadData({ title: '', description: '', file: null });
      fetchMaterials(selectedClassId);
    } catch (err) {
      console.error('Upload error:', err);
      showToast(err.response?.data?.message || 'Lỗi khi tải tài liệu lên', 'error');
    } finally {
      setUploading(false);
    }
  };

  // 4. Handle delete
  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/materials/${deleteTargetId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      showToast('Đã xóa tài liệu!', 'success');
      setDeleteTargetId(null);
      fetchMaterials(selectedClassId);
    } catch (err) {
      console.error('Delete error:', err);
      showToast(err.response?.data?.message || 'Lỗi khi xóa tài liệu', 'error');
    }
  };

  const selectedClass = classes.find(c => (c._id || c.classId) === selectedClassId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <PageHeader
        title="Tài Liệu & Học Liệu Lớp Học"
        subtitle="Quản lý tài liệu giảng dạy, bài tập và học liệu điện tử theo từng lớp"
        action={
          canUpload && (
            <button
              className="btn btn-primary"
              onClick={() => setShowUploadModal(true)}
              disabled={!selectedClassId}
            >
              <Upload size={16} /> Tải lên tài liệu
            </button>
          )
        }
      />

      {/* Class Selector Bar */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 8px)',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          boxShadow: 'var(--shadow-card)',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#0F172A', fontSize: '0.875rem' }}>
          <BookOpen size={18} color="#2563EB" /> Chọn Lớp Học:
        </div>

        {loadingClasses ? (
          <span style={{ color: '#64748B', fontSize: '0.875rem' }}>Đang tải danh sách lớp...</span>
        ) : classes.length > 0 ? (
          <select
            className="form-input"
            style={{ maxWidth: '380px', flex: 1, padding: '0.45rem 0.75rem' }}
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            {classes.map((c) => {
              const id = c._id || c.classId;
              return (
                <option key={id} value={id}>
                  {c.classCode} - {c.className} ({c.skill || '—'})
                </option>
              );
            })}
          </select>
        ) : (
          <span style={{ color: '#64748B', fontSize: '0.875rem' }}>Bạn chưa tham gia hoặc phụ trách lớp học nào.</span>
        )}

        {selectedClass && (
          <div style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: '#64748B' }}>
            Giáo viên: <strong style={{ color: '#0F172A' }}>{selectedClass.teacher?.fullName || selectedClass.teacher || '—'}</strong>
          </div>
        )}
      </div>

      {/* Materials List */}
      {loadingMaterials ? (
        <LoadingSkeleton type="card" count={3} />
      ) : materials.length === 0 ? (
        <EmptyState
          icon={<FileText size={28} />}
          title="Chưa có tài liệu nào"
          description={selectedClassId ? 'Lớp học này hiện chưa được đăng tải tài liệu học tập nào.' : 'Vui lòng chọn một lớp học để xem tài liệu.'}
          action={
            canUpload && selectedClassId && (
              <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
                <Upload size={16} /> Tải tài liệu đầu tiên
              </button>
            )
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {materials.map((m) => (
            <div
              key={m._id}
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
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  {getFileIcon(m.fileType)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: '#0F172A' }}>
                    {m.title}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
                    {formatFileSize(m.fileSize)} • {(m.fileType || 'tệp tin').toUpperCase()}
                  </div>
                </div>

                {(isAdmin || (isTeacher && m.uploadedBy?._id === user?._id)) && (
                  <button
                    onClick={() => setDeleteTargetId(m._id)}
                    title="Xóa tài liệu"
                    style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {m.description && (
                <p style={{ color: '#64748B', fontSize: '0.8125rem', margin: 0, lineHeight: 1.4 }}>
                  {m.description}
                </p>
              )}

              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  <div>Đăng bởi: <strong style={{ color: '#0F172A' }}>{m.uploadedBy?.name || 'Giáo viên'}</strong></div>
                  <div>{new Date(m.createdAt).toLocaleDateString('vi-VN')}</div>
                </div>

                <a
                  href={`${import.meta.env.VITE_API_URL}${m.fileUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                >
                  <Download size={14} /> Tải xuống
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg, 8px)',
            border: '1px solid var(--color-border-subtle, #E2E8F0)',
            boxShadow: 'var(--shadow-lg)',
            width: '100%',
            maxWidth: '480px',
            padding: '1.75rem'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A', marginBottom: '1.25rem' }}>
              Tải Lên Tài Liệu Cho Lớp
            </h3>

            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">
                  Tiêu Đề Tài Liệu <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Slide bài giảng Unit 1..."
                  value={uploadData.title}
                  onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Mô Tả Thêm</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Ghi chú về nội dung tài liệu..."
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">
                  Chọn Tệp Tin <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="file"
                  className="form-input"
                  onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
                  required
                />
                <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.35rem' }}>
                  Hỗ trợ: PDF, Word, PowerPoint, Excel, Ảnh. Tối đa 15MB.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={uploading}
                >
                  {uploading ? 'Đang tải lên...' : 'Tải lên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Xác nhận xóa tài liệu"
        message="Bạn có chắc chắn muốn xóa tài liệu này khỏi lớp học? Hành động này sẽ xóa dữ liệu trên hệ thống."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
        confirmText="Xóa tài liệu"
        isDanger={true}
      />
    </div>
  );
};

export default StudyMaterialsPage;
