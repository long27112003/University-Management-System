import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard, Users, UserCheck, Bell, BookOpen,
  Calendar, LogOut, FileText, ClipboardList, Shield, Key, CreditCard,
  GraduationCap
} from 'lucide-react';

const Sidebar = ({ routes = [], isOpen = false, onClose, isCollapsed = false }) => {
  const { user, logout } = useContext(AuthContext);

  const iconMap = {
    'Bảng điều khiển': <LayoutDashboard size={18} />,
    'Dashboard': <LayoutDashboard size={18} />,
    'Học viên': <Users size={18} />,
    'Giáo viên': <UserCheck size={18} />,
    'Lớp học': <BookOpen size={18} />,
    'Lớp của tôi': <BookOpen size={18} />,
    'Lịch học': <Calendar size={18} />,
    'Lịch dạy': <Calendar size={18} />,
    'Thời khóa biểu': <Calendar size={18} />,
    'Điểm danh': <ClipboardList size={18} />,
    'Kết quả học tập': <FileText size={18} />,
    'Bảng điểm': <FileText size={18} />,
    'Học phí': <CreditCard size={18} />,
    'Thanh toán': <CreditCard size={18} />,
    'Bảng tin Thông báo': <Bell size={18} />,
    'Thông báo': <Bell size={18} />,
    'Bảng thông báo': <Bell size={18} />,
    'Tài liệu': <BookOpen size={18} />,
    'Tài liệu Lớp học': <BookOpen size={18} />,
    'Tài liệu học tập': <BookOpen size={18} />,
    'Tài khoản': <Key size={18} />,
    'Quản lý tài khoản': <Key size={18} />,
    'Phân quyền': <Shield size={18} />,
    'Ma trận phân quyền': <Shield size={18} />,
    'Hồ sơ cá nhân': <UserCheck size={18} />,
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
        <div style={{
          height: '64px',
          padding: isCollapsed ? '0 1rem' : '0 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          borderBottom: '1px solid var(--color-border-subtle, #E2E8F0)',
          flexShrink: 0
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: 'var(--color-primary-50, #EFF6FF)',
            color: 'var(--color-primary-600, #2563EB)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <GraduationCap size={22} />
          </div>

          {!isCollapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--color-text-main, #0F172A)',
                lineHeight: '1.2',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.01em'
              }}>
                VLearn
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-muted, #64748B)',
                lineHeight: '1.1',
                whiteSpace: 'nowrap'
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
          gap: '2px',
          overflowY: 'auto'
        }}>
          {routes.map((route) => (
            <NavLink
              key={route.path}
              to={route.path}
              onClick={onClose}
              title={isCollapsed ? route.name : undefined}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: isCollapsed ? '0.625rem 0' : '0.55rem 0.75rem',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                borderRadius: 'var(--radius-md, 6px)',
                color: isActive ? 'var(--color-primary-600, #2563EB)' : 'var(--color-text-muted, #64748B)',
                backgroundColor: isActive ? 'var(--color-primary-50, #EFF6FF)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.875rem',
                textDecoration: 'none',
                transition: 'background-color 0.15s ease, color 0.15s ease'
              })}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {iconMap[route.name] || <FileText size={18} />}
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
          ))}
        </nav>

        {/* Bottom User / Logout Section */}
        <div style={{
          padding: '0.75rem 0.5rem',
          borderTop: '1px solid var(--color-border-subtle, #E2E8F0)',
          flexShrink: 0
        }}>
          <button
            onClick={logout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: isCollapsed ? '0.625rem 0' : '0.55rem 0.75rem',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              borderRadius: 'var(--radius-md, 6px)',
              color: 'var(--color-danger, #EF4444)',
              backgroundColor: 'transparent',
              fontWeight: 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
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
