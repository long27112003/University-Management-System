import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle, Loader2, GraduationCap } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const userData = await login(email, password);
      if (userData.role === 'Admin') navigate('/admin');
      else if (userData.role === 'Receptionist') navigate('/receptionist');
      else if (userData.role === 'Teacher') navigate('/teacher');
      else if (userData.role === 'Student') navigate('/student');
      else navigate('/');
    } catch (err) {
      setError(
        typeof err === 'string'
          ? err
          : err?.response?.data?.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.'
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
      padding: '1.5rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg, 8px)',
        border: '1px solid var(--color-border-subtle, #E2E8F0)',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.08)',
        padding: '2.5rem 2rem'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            backgroundColor: '#EFF6FF',
            color: 'var(--color-primary-600, #2563EB)',
            marginBottom: '1rem'
          }}>
            <GraduationCap size={30} />
          </div>

          <h1 style={{
            fontSize: '1.375rem',
            fontWeight: 700,
            color: 'var(--color-text-main, #0F172A)',
            margin: '0 0 0.25rem 0',
            letterSpacing: '-0.02em'
          }}>
            VLearn English Center
          </h1>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--color-text-muted, #64748B)',
            margin: 0
          }}>
            Hệ thống Quản lý Đào tạo & Học vụ
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
              marginBottom: '1.5rem',
              display: 'flex',
              gap: '0.625rem',
              alignItems: 'flex-start'
            }}
          >
            <AlertCircle size={18} color="#EF4444" style={{ marginTop: '2px', flexShrink: 0 }} />
            <span style={{ color: '#B91C1C', fontSize: '0.875rem', lineHeight: '1.35' }}>
              {error === 'Login failed' || error === 'Invalid email or password'
                ? 'Email hoặc mật khẩu không chính xác.'
                : error}
            </span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email đăng nhập <span style={{ color: '#EF4444' }}>*</span>
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
                type="email"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ten@vlearn.edu.vn"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
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
                type="password"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

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
                Đang xác thực...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Đăng nhập
              </>
            )}
          </button>
        </form>

        <div style={{
          marginTop: '2rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--color-border-subtle, #E2E8F0)',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted, #64748B)'
        }}>
          VLearn English Center &copy; 2026. Bảo mật thông tin nội bộ.
        </div>
      </div>
    </div>
  );
};

export default Login;
