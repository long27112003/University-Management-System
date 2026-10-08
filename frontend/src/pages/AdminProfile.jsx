import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { UserCheck } from 'lucide-react';

const AdminProfile = () => {
  const { user } = useContext(AuthContext);
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = { email };
      if (password) payload.password = password;

      const res = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/users/${user._id}`, payload);

      setMessage({ text: 'Cập nhật hồ sơ thành công! Đang tải lại...', type: 'success' });

      const updatedUser = { ...user, email: res.data.email };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ', type: 'error' });
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Cập Nhật Hồ Sơ Cá Nhân</h2>
      </div>

      <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
        {message.text && (
          <div style={{ padding: '1rem', marginBottom: '1rem', borderRadius: 'var(--radius-md)', background: message.type === 'success' ? 'rgba(46, 213, 115, 0.2)' : 'rgba(255, 71, 87, 0.2)', color: message.type === 'success' ? 'var(--success)' : 'var(--danger)' }}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Email Quản Trị Viên</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mật khẩu mới (để trống nếu không đổi)</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <UserCheck size={18} /> Lưu Thay Đổi
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminProfile;
