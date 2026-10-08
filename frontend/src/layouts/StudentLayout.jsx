import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import StudentDashboard from '../pages/StudentDashboard';
import StudentProfile from '../pages/StudentProfile';
import StudentAttendance from '../pages/StudentAttendance';
import StudyMaterialsPage from '../pages/StudyMaterialsPage';
import NoticeBoard from '../pages/NoticeBoard';
import SchedulePage from '../pages/SchedulePage';
import StudentResultsPage from '../pages/StudentResultsPage';
import StudentTuitionPage from '../pages/StudentTuitionPage';
import ClassList from '../pages/ClassList';
import ClassDetail from '../pages/ClassDetail';

const StudentLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Exactly 8 approved menu items for Student according to 05-ui-ux-spec.md Section 4 & 7
  const routes = [
    { path: '/student/dashboard',     name: 'Bảng điều khiển' },
    { path: '/student/classes',       name: 'Lớp của tôi' },
    { path: '/student/schedule',      name: 'Lịch học' },
    { path: '/student/attendance',    name: 'Điểm danh' },
    { path: '/student/results',       name: 'Kết quả học tập' },
    { path: '/student/tuition',       name: 'Học phí' },
    { path: '/student/studymaterial', name: 'Tài liệu' },
    { path: '/student/notices',       name: 'Thông báo' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', maxHeight: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--color-bg-app, #F8FAFC)' }}>
      <Sidebar
        routes={routes}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="student-layout-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', minWidth: 0 }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 50, flexShrink: 0 }}>
          <TopNav
            title="Cổng Học Viên"
            onMenuToggle={() => setSidebarOpen(prev => !prev)}
            noticesPath="/student/notices"
          />
        </div>

        <main style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', height: '100%', backgroundColor: 'var(--color-bg-app, #F8FAFC)' }}>
          <Routes>
            <Route path="/"              element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"     element={<StudentDashboard />} />
            <Route path="classes"       element={<ClassList />} />
            <Route path="classes/:id"   element={<ClassDetail />} />
            <Route path="schedule"      element={<SchedulePage />} />
            <Route path="attendance"    element={<StudentAttendance />} />
            <Route path="results"       element={<StudentResultsPage />} />
            <Route path="tuition"       element={<StudentTuitionPage />} />
            <Route path="studymaterial" element={<StudyMaterialsPage />} />
            <Route path="materials"     element={<StudyMaterialsPage />} />
            <Route path="notices"       element={<NoticeBoard />} />
            {/* Supporting profile route */}
            <Route path="profile"       element={<StudentProfile />} />
            <Route path="*"             element={<StudentDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
