import React, { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import logoImg from '../assets/logo.png';

const VIDEO_URL = 'https://vinuni.edu.vn/wp-content/uploads/2025/04/Banner-Homepage.mp4';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const videoRef = useRef(null);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Ensure video autoplays safely when mounted
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {
        // Autoplay policy or load error handled silently by fallback
      });
    }
  }, []);

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
    <div
      className="login-container"
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // High quality static fallback background if video fails or is loading
        background: 'radial-gradient(ellipse at center, #1e293b 0%, #0f172a 60%, #020617 100%)',
      }}
    >
      {/* Fullscreen Video Background */}
      {!videoError && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          onError={() => setVideoError(true)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            pointerEvents: 'none',
            opacity: videoLoaded ? 1 : 0,
            transition: 'opacity 0.8s ease-in-out',
          }}
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>
      )}

      {/* Semi-transparent Dark Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.58)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      {/* Centered Login Card Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}
      >
        <div
          className="auth-card"
          style={{
            width: '100%',
            maxWidth: '420px',
            backgroundColor: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.65)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 1px 1px rgba(255, 255, 255, 0.6)',
            padding: '2.5rem 2rem',
          }}
        >
          {/* Brand Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <img
              src={logoImg}
              alt="VLearn English Center"
              className="zoom-hover-sm"
              style={{
                height: '52px',
                maxWidth: '220px',
                objectFit: 'contain',
                marginBottom: '0.875rem',
              }}
            />
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-muted, #64748B)',
                margin: 0,
                fontWeight: 500,
              }}
            >
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
                alignItems: 'flex-start',
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
                    color: 'var(--color-text-muted, #64748B)',
                  }}
                />
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  style={{
                    paddingLeft: '2.5rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  }}
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
                    color: 'var(--color-text-muted, #64748B)',
                  }}
                />
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  style={{
                    paddingLeft: '2.5rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  }}
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
                opacity: loading ? 0.75 : 1,
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

          <div
            style={{
              textAlign: 'center',
              marginTop: '1.25rem',
              fontSize: '0.875rem',
              color: 'var(--color-text-muted, #64748B)',
            }}
          >
            Chưa có tài khoản học viên?{' '}
            <Link
              to="/register"
              style={{
                color: 'var(--color-primary-600, #2563EB)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Đăng ký ngay
            </Link>
          </div>

          <div
            style={{
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--color-border-subtle, #E2E8F0)',
              textAlign: 'center',
              fontSize: '0.75rem',
              color: 'var(--color-text-muted, #64748B)',
            }}
          >
            VLearn English Center &copy; 2026. Bảo mật thông tin nội bộ.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
