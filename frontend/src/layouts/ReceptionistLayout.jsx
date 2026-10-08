import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import ReceptionistDashboard from '../pages/ReceptionistDashboard';
import StudentList from '../pages/StudentList';
import StudentDetail from '../pages/StudentDetail';
import TeacherList from '../pages/TeacherList';
import TeacherDetail from '../pages/TeacherDetail';
import ClassList from '../pages/ClassList';
import ClassDetail from '../pages/ClassDetail';
import NoticeBoard from '../pages/NoticeBoard';
import AdminProfile from '../pages/AdminProfile';
import SchedulePage from '../pages/SchedulePage';
import AttendancePage from '../pages/AttendancePage';
import ResultsEntryPage from '../pages/ResultsEntryPage';
import TuitionListPage from '../pages/TuitionListPage';
import InvoiceDetailPage from '../pages/InvoiceDetailPage';

const ReceptionistLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Exactly 9 approved menu items for Receptionist according to 05-ui-ux-spec.md Section 4 & 7
  const routes = [
    { path: '/receptionist/dashboard',  name: 'Bảng điều khiển' },
    { path: '/receptionist/students',   name: 'Học viên' },
    { path: '/receptionist/classes',    name: 'Lớp học' },
    { path: '/receptionist/schedules',  name: 'Lịch học' },
    { path: '/receptionist/attendance', name: 'Điểm danh' },
    { path: '/receptionist/results',    name: 'Kết quả học tập' },
    { path: '/receptionist/tuition',    name: 'Học phí' },
    { path: '/receptionist/payments',   name: 'Thanh toán' },
    { path: '/receptionist/notices',    name: 'Thông báo' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', maxHeight: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--color-bg-app, #F8FAFC)' }}>
      <Sidebar
        routes={routes}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="receptionist-layout-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', minWidth: 0 }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 50, flexShrink: 0 }}>
          <TopNav
            title="Cổng Lễ Tân & Tuyển Sinh"
            onMenuToggle={() => setSidebarOpen(prev => !prev)}
            noticesPath="/receptionist/notices"
          />
        </div>

        <main style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', height: '100%', backgroundColor: 'var(--color-bg-app, #F8FAFC)' }}>
          <Routes>
            <Route path="/" element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ReceptionistDashboard />} />
            <Route path="students" element={<StudentList />} />
            <Route path="students/:id" element={<StudentDetail />} />
            <Route path="classes" element={<ClassList />} />
            <Route path="classes/:id" element={<ClassDetail />} />
            <Route path="schedules" element={<SchedulePage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="results" element={<ResultsEntryPage />} />
            <Route path="tuition" element={<TuitionListPage />} />
            <Route path="tuition/:id" element={<InvoiceDetailPage />} />
            <Route path="payments" element={<TuitionListPage />} />
            <Route path="notices" element={<NoticeBoard />} />
            {/* Supporting read-only detail routes */}
            <Route path="teachers" element={<TeacherList />} />
            <Route path="teachers/:id" element={<TeacherDetail />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="*" element={<ReceptionistDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default ReceptionistLayout;
