import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserPlus, Search, Shield, ToggleLeft, ToggleRight, X, AlertTriangle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const AccountManagement = () => {
  const { user: currentUser } = useContext(AuthContext);
  const { showToast } = useToast();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create Account Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Receptionist',
    status: 'active'
  });
  const [creating, setCreating] = useState(false);

  // Change Role Modal
  const [roleModalTarget, setRoleModalTarget] = useState(null);
  const [targetNewRole, setTargetNewRole] = useState('');
  const [savingRole, setSavingRole] = useState(false);

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchAccounts = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });
      if (search.trim()) params.append('search', search.trim());
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await axios.get(`${baseUrl}/api/accounts?${params.toString()}`);
      if (res.data.success) {
        setAccounts(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi tải danh sách tài khoản', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts(1);
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAccounts(1);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await axios.post(`${baseUrl}/api/accounts`, createData);
      showToast('Tạo tài khoản người dùng thành công', 'success');
      setShowCreateModal(false);
      setCreateData({ name: '', email: '', password: '', role: 'Receptionist', status: 'active' });
      fetchAccounts(1);
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể tạo tài khoản', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (account) => {
    if (account._id === currentUser?._id) {
      showToast('Bạn không thể tự vô hiệu hóa tài khoản của chính mình', 'warning');
      return;
    }
    const nextStatus = account.status === 'active' ? 'inactive' : 'active';
    try {
      await axios.patch(`${baseUrl}/api/accounts/${account._id}/status`, { status: nextStatus });
      showToast(`Tài khoản đã chuyển sang trạng thái [${nextStatus}]`, 'success');
      fetchAccounts(pagination.page);
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi cập nhật trạng thái', 'error');
    }
  };

  const handleOpenRoleModal = (account) => {
    setRoleModalTarget(account);
    setTargetNewRole(account.role);
  };

  const handleSaveRole = async () => {
    if (!roleModalTarget || targetNewRole === roleModalTarget.role) {
      setRoleModalTarget(null);
      return;
    }

    setSavingRole(true);
    try {
      await axios.patch(`${baseUrl}/api/accounts/${roleModalTarget._id}/role`, { role: targetNewRole });
      showToast(`Chuyển đổi vai trò sang [${targetNewRole}] thành công`, 'success');
      setRoleModalTarget(null);
      fetchAccounts(pagination.page);
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể thay đổi vai trò', 'error');
    } finally {
      setSavingRole(false);
    }
  };

  const renderRoleBadge = (role) => {
    const map = {
      Admin: { bg: '#fee2e2', color: '#991b1b' },
      Receptionist: { bg: '#e0e7ff', color: '#3730a3' },
      Teacher: { bg: '#dcfce7', color: '#166534' },
      Student: { bg: '#fef3c7', color: '#92400e' }
    };
    const s = map[role] || { bg: '#f1f5f9', color: '#475569' };
    return (
      <span style={{
        backgroundColor: s.bg,
        color: s.color,
        padding: '0.2rem 0.65rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        display: 'inline-block'
      }}>
        {role}
      </span>
    );
  };

  const renderStatusBadge = (status) => {
    const isActive = status === 'active';
    return (
      <span style={{
        backgroundColor: isActive ? '#dcfce7' : '#fee2e2',
        color: isActive ? '#15803d' : '#b91c1c',
        padding: '0.2rem 0.65rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        display: 'inline-block'
      }}>
        {isActive ? 'Hoạt động' : 'Đã khóa'}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
            Quản Lý Tài Khoản Hệ Thống
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Quản trị danh sách tài khoản xác thực, vai trò bảo mật và phân quyền truy cập
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <UserPlus size={18} />
          Thêm Tài Khoản
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '260px', display: 'flex', gap: '0.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Tìm theo email, họ tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.5rem' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          <button type="submit" className="btn btn-secondary">Tìm kiếm</button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Vai trò:</span>
          <select
            className="form-input"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="">Tất cả vai trò</option>
            <option value="Admin">Admin</option>
            <option value="Receptionist">Receptionist</option>
            <option value="Teacher">Teacher</option>
            <option value="Student">Student</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Trạng thái:</span>
          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '140px' }}
          >
            <option value="">Tất cả</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Đã khóa</option>
          </select>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="glass-panel" style={{ overflowX: 'auto', padding: '0.5rem 0' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Họ và Tên</th>
              <th>Vai Trò</th>
              <th>Trạng Thái</th>
              <th>Ngày Tạo</th>
              <th>Đăng Nhập Gần Nhất</th>
              <th style={{ textAlign: 'right' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center" style={{ padding: '2rem' }}>
                  Đang tải danh sách tài khoản...
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>
                  Không tìm thấy tài khoản nào.
                </td>
              </tr>
            ) : (
              accounts.map((acc) => (
                <tr key={acc._id}>
                  <td>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{acc.email}</span>
                  </td>
                  <td>{acc.name || '—'}</td>
                  <td>{renderRoleBadge(acc.role)}</td>
                  <td>{renderStatusBadge(acc.status)}</td>
                  <td>{new Date(acc.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    {acc.lastLogin ? (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {new Date(acc.lastLogin).toLocaleString('vi-VN')}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Chưa đăng nhập</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleOpenRoleModal(acc)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                        title="Đổi vai trò tài khoản"
                      >
                        <Shield size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                        Đổi vai trò
                      </button>
                      <button
                        onClick={() => handleToggleStatus(acc)}
                        disabled={acc._id === currentUser?._id}
                        className="btn btn-secondary"
                        style={{
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.8rem',
                          opacity: acc._id === currentUser?._id ? 0.4 : 1,
                          cursor: acc._id === currentUser?._id ? 'not-allowed' : 'pointer'
                        }}
                        title={acc._id === currentUser?._id ? 'Không thể khóa tài khoản của chính mình' : (acc.status === 'active' ? 'Khóa tài khoản' : 'Kích hoạt tài khoản')}
                      >
                        {acc.status === 'active' ? (
                          <ToggleRight size={18} style={{ color: 'var(--success)' }} />
                        ) : (
                          <ToggleLeft size={18} style={{ color: 'var(--danger)' }} />
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
              Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total} tài khoản
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                disabled={pagination.page <= 1}
                onClick={() => fetchAccounts(pagination.page - 1)}
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
                onClick={() => fetchAccounts(pagination.page + 1)}
                style={{ padding: '0.35rem 0.75rem', opacity: pagination.page >= pagination.totalPages ? 0.5 : 1 }}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create Account */}
      {showCreateModal && (
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
          <div className="glass-panel" style={{
            background: 'var(--bg-secondary)',
            width: '100%',
            maxWidth: '500px',
            padding: '1.75rem',
            borderRadius: 'var(--radius-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>Thêm Tài Khoản Mới</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Tên Người Dùng</label>
                <input
                  type="text"
                  className="form-input"
                  value={createData.name}
                  onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Đăng Nhập *</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  value={createData.email}
                  onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                  placeholder="user@vlearn.edu.vn"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mật Khẩu *</label>
                <input
                  type="password"
                  required
                  className="form-input"
                  value={createData.password}
                  onChange={(e) => setCreateData({ ...createData, password: e.target.value })}
                  placeholder="Nhập mật khẩu..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Vai Trò</label>
                <select
                  className="form-input"
                  value={createData.role}
                  onChange={(e) => setCreateData({ ...createData, role: e.target.value })}
                >
                  <option value="Receptionist">Receptionist (Lễ tân)</option>
                  <option value="Admin">Admin (Quản trị viên)</option>
                </select>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  * Lưu ý: Hồ sơ Học viên và Giáo viên vui lòng tạo từ mục Học viên hoặc Giáo viên để liên kết hồ sơ chuyên môn.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Đang tạo...' : 'Tạo Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Role */}
      {roleModalTarget && (
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
          <div className="glass-panel" style={{
            background: 'var(--bg-secondary)',
            width: '100%',
            maxWidth: '520px',
            padding: '1.75rem',
            borderRadius: 'var(--radius-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>Thay Đổi Vai Trò Tài Khoản</h3>
              <button
                onClick={() => setRoleModalTarget(null)}
                style={{ background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
              <p style={{ margin: '0 0 0.5rem' }}>
                Tài khoản: <strong>{roleModalTarget.email}</strong>
              </p>
              <p style={{ margin: '0 0 0.5rem' }}>
                Vai trò hiện tại: {renderRoleBadge(roleModalTarget.role)}
              </p>
            </div>

            {/* Warning regarding Student/Teacher transitions */}
            {(roleModalTarget.role === 'Student' || roleModalTarget.role === 'Teacher') ? (
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                color: '#92400e',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'flex-start'
              }}>
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  Quy tắc an toàn MVP: Không thể chuyển trực tiếp tài khoản có hồ sơ nghiệp vụ [{roleModalTarget.role}] sang vai trò khác để tránh mất toàn vẹn dữ liệu điểm danh, lớp học và học phí.
                </span>
              </div>
            ) : null}

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Chọn Vai Trò Mới</label>
              <select
                className="form-input"
                value={targetNewRole}
                onChange={(e) => setTargetNewRole(e.target.value)}
              >
                <option value="Admin">Admin</option>
                <option value="Receptionist">Receptionist</option>
                <option value="Teacher">Teacher</option>
                <option value="Student">Student</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setRoleModalTarget(null)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={savingRole || targetNewRole === roleModalTarget.role}
                onClick={handleSaveRole}
              >
                {savingRole ? 'Đang lưu...' : 'Xác Nhận Đổi Vai Trò'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;
