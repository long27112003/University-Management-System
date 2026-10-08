import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Mail, Phone, Lock, Eye, EyeOff, UserPlus,
  AlertCircle, CheckCircle, Loader2, Calendar
} from 'lucide-react';
import logoImg from '../assets/logo.png';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gender: 'other',
    dateOfBirth: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const validate = () => {
    if (!formData.fullName.trim()) {
      return 'Vui lòng nhập họ và tên của bạn';
    }
    if (!formData.email.trim()) {
      return 'Vui lòng nhập địa chỉ email';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      return 'Địa chỉ email không đúng định dạng';
    }
    if (!formData.phone.trim()) {
      return 'Vui lòng nhập số điện thoại liên hệ';
    }
    const phoneRegex = /^[0-9]{9,11}$/;
    if (!phoneRegex.test(formData.phone.trim().replace(/\D/g, ''))) {
      return 'Số điện thoại phải từ 9 đến 11 chữ số';
    }
    if (!formData.password) {
      return 'Vui lòng nhập mật khẩu';
    }
    if (formData.password.length < 6) {
      return 'Mật khẩu phải có tối thiểu 6 ký tự';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Mật khẩu xác nhận không khớp';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth || null
      };

      const res = await register(payload);
      setSuccess('Đăng ký tài khoản thành công! Đang chuyển hướng...');
      setTimeout(() => {
        navigate('/student');
      }, 1200);
    } catch (err) {
      setError(
        typeof err === 'string'
          ? err
          : err?.response?.data?.message || 'Đăng ký không thành công. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-bg-app, #F8FAFC)',
      padding: '2rem 1rem'
    }}>
      <div
        className="auth-card"
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 12px)',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          boxShadow: '0 4px 24px -2px rgba(15, 23, 42, 0.08)',
          padding: '2.5rem 2rem'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <img
            src={logoImg}
            alt="VLearn English Center"
            className="zoom-hover-sm"
            style={{
              height: '48px',
              maxWidth: '200px',
              objectFit: 'contain',
              marginBottom: '0.75rem'
            }}
          />
          <h1 style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--color-text-main, #0F172A)',
            margin: '0 0 0.25rem 0',
            letterSpacing: '-0.02em'
          }}>
            Đăng Ký Tài Khoản Học Viên
          </h1>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--color-text-muted, #64748B)',
            margin: 0
          }}>
            Tạo tài khoản học vụ để theo dõi lịch học & kết quả
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FEE2E2',
              borderRadius: 'var(--radius-md, 6px)',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.625rem',
              color: 'var(--color-danger, #EF4444)',
              fontSize: '0.875rem',
              lineHeight: '1.4'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div
            role="status"
            style={{
              backgroundColor: '#F0FDF4',
              border: '1px solid #DCFCE7',
              borderRadius: 'var(--radius-md, 6px)',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              color: '#15803D',
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="form-group" style={{ marginBottom: '1.125rem' }}>
            <label className="form-label" htmlFor="fullName">
              Họ và tên học viên <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={18}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '0.875rem',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted, #64748B)'
                }}
              />
              <input
                id="fullName"
                name="fullName"
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                required
                autoComplete="name"
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group" style={{ marginBottom: '1.125rem' }}>
            <label className="form-label" htmlFor="email">
              Địa chỉ Email <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '0.875rem',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted, #64748B)'
                }}
              />
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                value={formData.email}
                onChange={handleChange}
                placeholder="hocvien@vlearn.edu.vn"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="form-group" style={{ marginBottom: '1.125rem' }}>
            <label className="form-label" htmlFor="phone">
              Số điện thoại <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Phone
                size={18}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '0.875rem',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted, #64748B)'
                }}
              />
              <input
                id="phone"
                name="phone"
                type="tel"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                value={formData.phone}
                onChange={handleChange}
                placeholder="0912 345 678"
                required
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Gender & Date of Birth Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.125rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="gender">
                Giới tính
              </label>
              <select
                id="gender"
                name="gender"
                className="form-input"
                value={formData.gender}
                onChange={handleChange}
                style={{ cursor: 'pointer' }}
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="dateOfBirth">
                Ngày sinh
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                className="form-input"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group" style={{ marginBottom: '1.125rem' }}>
            <label className="form-label" htmlFor="password">
              Mật khẩu <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '0.875rem',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted, #64748B)'
                }}
              />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                value={formData.password}
                onChange={handleChange}
                placeholder="Tối thiểu 6 ký tự"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '0.875rem',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted, #64748B)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label" htmlFor="confirmPassword">
              Xác nhận mật khẩu <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '0.875rem',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted, #64748B)'
                }}
              />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Nhập lại mật khẩu"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(p => !p)}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '0.875rem',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted, #64748B)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
                aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.625rem 1rem',
              fontSize: '0.9375rem',
              fontWeight: 600,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: loading ? 0.75 : 1
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="skeleton-pulse" />
                Đang khởi tạo tài khoản...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Đăng Ký Tài Khoản
              </>
            )}
          </button>
        </form>

        {/* Back to Login Link */}
        <div style={{
          textAlign: 'center',
          marginTop: '1.25rem',
          fontSize: '0.875rem',
          color: 'var(--color-text-muted, #64748B)'
        }}>
          Đã có tài khoản?{' '}
          <Link
            to="/login"
            style={{
              color: 'var(--color-primary-600, #2563EB)',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            Đăng nhập ngay
          </Link>
        </div>

        {/* Footer info */}
        <div style={{
          marginTop: '1.75rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--color-border-subtle, #E2E8F0)',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted, #64748B)'
        }}>
          VLearn English Center &copy; 2026. Bảo mật thông tin học viên.
        </div>
      </div>
    </div>
  );
};

export default Register;
