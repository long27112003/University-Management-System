import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import TeacherDashboard from '../pages/TeacherDashboard';
import AttendancePage from '../pages/AttendancePage';
import StudyMaterialsPage from '../pages/StudyMaterialsPage';
import NoticeBoard from '../pages/NoticeBoard';
import TeacherDetail from '../pages/TeacherDetail';
import ClassList from '../pages/ClassList';
import ClassDetail from '../pages/ClassDetail';
import SchedulePage from '../pages/SchedulePage';
import ResultsEntryPage from '../pages/ResultsEntryPage';

const TeacherLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Exactly 7 approved menu items for Teacher according to 05-ui-ux-spec.md Section 4 & 7
  const routes = [
    { path: '/teacher/dashboard',     name: 'Bảng điều khiển' },
    { path: '/teacher/classes',       name: 'Lớp của tôi' },
    { path: '/teacher/schedule',      name: 'Lịch dạy' },
    { path: '/teacher/attendance',    name: 'Điểm danh' },
    { path: '/teacher/results',       name: 'Kết quả học tập' },
    { path: '/teacher/studymaterial', name: 'Tài liệu' },
    { path: '/teacher/notices',       name: 'Thông báo' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', maxHeight: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--color-bg-app, #F8FAFC)' }}>
      <Sidebar
        routes={routes}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="teacher-layout-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', minWidth: 0 }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 50, flexShrink: 0 }}>
          <TopNav
            title="Cổng Giảng Viên"
            onMenuToggle={() => setSidebarOpen(prev => !prev)}
            noticesPath="/teacher/notices"
          />
        </div>

        <main style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', height: '100%', backgroundColor: 'var(--color-bg-app, #F8FAFC)' }}>
          <Routes>
            <Route path="/"              element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"     element={<TeacherDashboard />} />
            <Route path="classes"       element={<ClassList />} />
            <Route path="classes/:id"   element={<ClassDetail />} />
            <Route path="schedule"      element={<SchedulePage />} />
            <Route path="attendance"    element={<AttendancePage />} />
            <Route path="results"       element={<ResultsEntryPage />} />
            <Route path="studymaterial" element={<StudyMaterialsPage />} />
            <Route path="materials"     element={<StudyMaterialsPage />} />
            <Route path="notices"       element={<NoticeBoard />} />
            {/* Supporting profile route */}
            <Route path="profile"       element={<TeacherDetail />} />
            <Route path="*"             element={<TeacherDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;
