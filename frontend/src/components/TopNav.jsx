import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

const TopNav = ({ title, onMenuToggle, noticesPath }) => {
  const { user, logout } = useContext(AuthContext);

  const getRoleLabel = (role) => {
    if (role === 'Admin') return 'Quản trị viên';
    if (role === 'Receptionist') return 'Lễ tân';
    if (role === 'Teacher') return 'Giáo viên';
    if (role === 'Student') return 'Học viên';
    return role || 'Người dùng';
  };

  return (
    <header
      style={{
        height: '64px',
        padding: '0 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid var(--color-border-subtle, #E2E8F0)',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)'
      }}
    >
      {/* Left: Hamburger & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <button
          className="hamburger-btn"
          onClick={onMenuToggle}
          aria-label="Đóng mở thanh điều hướng"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            borderRadius: 'var(--radius-sm, 4px)',
            color: 'var(--color-text-main, #0F172A)'
          }}
        >
          <Menu size={20} />
        </button>

        <h2 style={{
          margin: 0,
          fontSize: '1.125rem',
          fontWeight: 600,
          color: 'var(--color-text-main, #0F172A)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {title}
        </h2>
      </div>

      {/* Right: Notification Bell & User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
        {noticesPath && (
          <Link
            to={noticesPath}
            className="top-nav-bell zoom-hover-sm"
            aria-label="Thông báo trung tâm"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md, 6px)',
              color: 'var(--color-text-muted, #64748B)',
              backgroundColor: 'var(--color-bg-app, #F8FAFC)',
              border: '1px solid var(--color-border-subtle, #E2E8F0)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <Bell size={18} />
          </Link>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            className="top-nav-avatar zoom-hover-sm"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-50, #EFF6FF)',
              color: 'var(--color-primary-600, #2563EB)',
              border: '1px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '0.875rem',
              flexShrink: 0,
              overflow: 'hidden'
            }}
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.name || 'User'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                }}
              />
            ) : null}
            <span style={{ display: user?.avatar ? 'none' : 'block' }}>
              {user?.name?.charAt(0).toUpperCase() || <User size={18} />}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontWeight: 600,
              fontSize: '0.875rem',
              color: 'var(--color-text-main, #0F172A)',
              lineHeight: '1.2'
            }}>
              {user?.name || user?.fullName || 'Người dùng'}
            </span>
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-muted, #64748B)',
              lineHeight: '1.1'
            }}>
              {getRoleLabel(user?.role)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
