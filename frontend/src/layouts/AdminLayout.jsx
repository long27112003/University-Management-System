import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import AdminDashboard from '../pages/AdminDashboard';
import StudentList from '../pages/StudentList';
import StudentDetail from '../pages/StudentDetail';
import TeacherList from '../pages/TeacherList';
import TeacherDetail from '../pages/TeacherDetail';
import AccountManagement from '../pages/AccountManagement';
import ClassList from '../pages/ClassList';
import ClassDetail from '../pages/ClassDetail';
import NoticeBoard from '../pages/NoticeBoard';
import AdminProfile from '../pages/AdminProfile';
import RoleMatrixView from '../pages/RoleMatrixView';
import SchedulePage from '../pages/SchedulePage';
import AttendancePage from '../pages/AttendancePage';
import ResultsEntryPage from '../pages/ResultsEntryPage';
import TuitionListPage from '../pages/TuitionListPage';
import InvoiceDetailPage from '../pages/InvoiceDetailPage';
import StudyMaterialsPage from '../pages/StudyMaterialsPage';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 13 approved menu items according to 05-ui-ux-spec.md Section 4 & 7
  const routes = [
    { path: '/admin/dashboard',  name: 'Bảng điều khiển' },
    { path: '/admin/students',   name: 'Học viên' },
    { path: '/admin/teachers',   name: 'Giáo viên' },
    { path: '/admin/classes',    name: 'Lớp học' },
    { path: '/admin/schedules',  name: 'Lịch học' },
    { path: '/admin/attendance', name: 'Điểm danh' },
    { path: '/admin/results',    name: 'Kết quả học tập' },
    { path: '/admin/tuition',    name: 'Học phí' },
    { path: '/admin/payments',   name: 'Thanh toán' },
    { path: '/admin/notices',    name: 'Thông báo' },
    { path: '/admin/materials',  name: 'Tài liệu' },
    { path: '/admin/accounts',   name: 'Tài khoản' },
    { path: '/admin/roles',      name: 'Phân quyền' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', maxHeight: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--color-bg-app, #F8FAFC)' }}>
      <Sidebar
        routes={routes}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="admin-layout-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', minWidth: 0 }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 50, flexShrink: 0 }}>
          <TopNav
            title="Quản Trị Hệ Thống"
            onMenuToggle={() => setSidebarOpen(prev => !prev)}
            noticesPath="/admin/notices"
          />
        </div>

        <main style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', height: '100%', backgroundColor: 'var(--color-bg-app, #F8FAFC)' }}>
          <Routes>
            <Route path="/" element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="students" element={<StudentList />} />
            <Route path="students/:id" element={<StudentDetail />} />
            <Route path="teachers" element={<TeacherList />} />
            <Route path="teachers/:id" element={<TeacherDetail />} />
            <Route path="classes" element={<ClassList />} />
            <Route path="classes/:id" element={<ClassDetail />} />
            <Route path="schedules" element={<SchedulePage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="results" element={<ResultsEntryPage />} />
            <Route path="tuition" element={<TuitionListPage />} />
            <Route path="tuition/:id" element={<InvoiceDetailPage />} />
            <Route path="payments" element={<TuitionListPage />} />
            <Route path="accounts" element={<AccountManagement />} />
            <Route path="materials" element={<StudyMaterialsPage />} />
            <Route path="studymaterial" element={<StudyMaterialsPage />} />
            <Route path="notices" element={<NoticeBoard />} />
            <Route path="roles" element={<RoleMatrixView />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="*" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
