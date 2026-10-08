import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard, Users, UserCheck, Bell, BookOpen,
  Calendar, LogOut, FileText, ClipboardList, Shield, Key, CreditCard,
  GraduationCap
} from 'lucide-react';

import logoImg from '../assets/logo.png';
import logoIconImg from '../assets/logo-icon.png';

const Sidebar = ({ routes = [], isOpen = false, onClose, isCollapsed = false }) => {
  const { user, logout } = useContext(AuthContext);

  const themeMap = {
    'Bảng điều khiển': { icon: <LayoutDashboard size={17} />, color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
    'Dashboard': { icon: <LayoutDashboard size={17} />, color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
    'Học viên': { icon: <Users size={17} />, color: '#0EA5E9', bg: '#F0F9FF', border: '#BAE6FD' },
    'Giáo viên': { icon: <UserCheck size={17} />, color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },
    'Lớp học': { icon: <BookOpen size={17} />, color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
    'Lớp của tôi': { icon: <BookOpen size={17} />, color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
    'Lịch học': { icon: <Calendar size={17} />, color: '#EC4899', bg: '#FDF2F8', border: '#FBCFE8' },
    'Lịch dạy': { icon: <Calendar size={17} />, color: '#EC4899', bg: '#FDF2F8', border: '#FBCFE8' },
    'Thời khóa biểu': { icon: <Calendar size={17} />, color: '#EC4899', bg: '#FDF2F8', border: '#FBCFE8' },
    'Điểm danh': { icon: <ClipboardList size={17} />, color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' },
    'Kết quả học tập': { icon: <FileText size={17} />, color: '#14B8A6', bg: '#F0FDFA', border: '#99F6E4' },
    'Bảng điểm': { icon: <FileText size={17} />, color: '#14B8A6', bg: '#F0FDFA', border: '#99F6E4' },
    'Học phí': { icon: <CreditCard size={17} />, color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
    'Thanh toán': { icon: <CreditCard size={17} />, color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
    'Bảng tin Thông báo': { icon: <Bell size={17} />, color: '#E11D48', bg: '#FFF1F2', border: '#FECDD3' },
    'Thông báo': { icon: <Bell size={17} />, color: '#E11D48', bg: '#FFF1F2', border: '#FECDD3' },
    'Bảng thông báo': { icon: <Bell size={17} />, color: '#E11D48', bg: '#FFF1F2', border: '#FECDD3' },
    'Tài liệu': { icon: <BookOpen size={17} />, color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD' },
    'Tài liệu Lớp học': { icon: <BookOpen size={17} />, color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD' },
    'Tài liệu học tập': { icon: <BookOpen size={17} />, color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD' },
    'Tài khoản': { icon: <Key size={17} />, color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA' },
    'Quản lý tài khoản': { icon: <Key size={17} />, color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA' },
    'Phân quyền': { icon: <Shield size={17} />, color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE' },
    'Ma trận phân quyền': { icon: <Shield size={17} />, color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE' },
    'Hồ sơ cá nhân': { icon: <UserCheck size={17} />, color: '#0D9488', bg: '#F0FDFA', border: '#99F6E4' },
  };

  const getRoleTitle = (role) => {
    if (role === 'Admin') return 'Quản Trị Viên';
    if (role === 'Receptionist') return 'Lễ Tân / Tuyển Sinh';
    if (role === 'Teacher') return 'Giáo Viên';
    if (role === 'Student') return 'Học Viên';
    return role || 'Thành Viên';
  };

  const sidebarWidth = isCollapsed ? '68px' : '250px';

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay${isOpen ? ' active' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Sidebar */}
      <aside
        className={`sidebar-wrapper${isOpen ? ' open' : ''}`}
        style={{
          width: sidebarWidth,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid var(--color-border-subtle, #E2E8F0)'
        }}
        aria-label="Thanh điều hướng chính"
      >
        {/* Brand Header */}
        <div
          className="sidebar-brand-header zoom-hover-sm"
          style={{
          height: '64px',
          padding: isCollapsed ? '0 0.75rem' : '0 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          gap: '0.75rem',
          borderBottom: '1px solid var(--color-border-subtle, #E2E8F0)',
          flexShrink: 0
        }}>
          {isCollapsed ? (
            <img
              src={logoIconImg}
              alt="VLearn"
              style={{
                width: '32px',
                height: '32px',
                objectFit: 'contain'
              }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
              <img
                src={logoImg}
                alt="VLearn English Center"
                style={{
                  height: '34px',
                  width: 'auto',
                  maxWidth: '145px',
                  objectFit: 'contain',
                  objectPosition: 'left'
                }}
              />
              <div style={{
                fontSize: '0.7rem',
                fontWeight: 500,
                color: 'var(--color-text-muted, #64748B)',
                lineHeight: '1',
                whiteSpace: 'nowrap',
                paddingLeft: '2px'
              }}>
                {getRoleTitle(user?.role)}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav style={{
          flex: 1,
          padding: '0.75rem 0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          overflowY: 'auto'
        }}>
          {routes.map((route) => {
            const itemTheme = themeMap[route.name] || {
              icon: <FileText size={17} />,
              color: '#2563EB',
              bg: '#EFF6FF',
              border: '#BFDBFE'
            };

            return (
              <NavLink
                key={route.path}
                to={route.path}
                className="sidebar-nav-link"
                onClick={onClose}
                title={isCollapsed ? route.name : undefined}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: isCollapsed ? '0.5rem 0' : '0.45rem 0.65rem',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  borderRadius: '8px',
                  color: isActive ? '#0F172A' : '#475569',
                  backgroundColor: isActive ? itemTheme.bg : 'transparent',
                  border: isActive ? `1px solid ${itemTheme.border}` : '1px solid transparent',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.04)' : 'none'
                })}
              >
                <span
                  className="sidebar-item-icon-box"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '30px',
                    height: '30px',
                    borderRadius: '7px',
                    backgroundColor: itemTheme.bg,
                    color: itemTheme.color,
                    border: `1px solid ${itemTheme.border}`,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    flexShrink: 0,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                >
                  {itemTheme.icon}
                </span>
                {!isCollapsed && (
                  <span style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {route.name}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom User / Logout Section */}
        <div style={{
          padding: '0.75rem 0.5rem',
          borderTop: '1px solid var(--color-border-subtle, #E2E8F0)',
          flexShrink: 0
        }}>
          {!isCollapsed && user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.55rem 0.65rem',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
              border: '1px solid #E2E8F0',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '1.5px solid #CBD5E1',
                flexShrink: 0,
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '0.8125rem',
                color: '#2563EB'
              }}>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user.name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#0F172A', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user.name || user.fullName || 'Người dùng'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748B', lineHeight: '1.1' }}>
                  {getRoleTitle(user.role)}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: isCollapsed ? '0.625rem 0' : '0.5rem 0.65rem',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              borderRadius: 'var(--radius-md, 6px)',
              color: 'var(--color-danger, #EF4444)',
              backgroundColor: 'transparent',
              fontWeight: 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              border: 'none',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <LogOut size={18} />
            {!isCollapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
