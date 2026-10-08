import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLayout from './layouts/AdminLayout';
import TeacherLayout from './layouts/TeacherLayout';
import ReceptionistLayout from './layouts/ReceptionistLayout';
import StudentLayout from './layouts/StudentLayout';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(AuthContext);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const TitleUpdater = () => {
  const location = useLocation();
  useEffect(() => {
    const path = location.pathname;
    let title = 'VLearn English Center';
    if (path.includes('/dashboard')) title = 'Dashboard - VLearn';
    else if (path.includes('/attendance')) title = 'Attendance - VLearn';
    else if (path.includes('/login')) title = 'Login - VLearn';
    else if (path.includes('/register')) title = 'Register - VLearn';
    else if (path.includes('/profile')) title = 'Profile - VLearn';
    else if (path.includes('/studymaterial') || path.includes('/materials')) title = 'Study Material - VLearn';
    else if (path.includes('/notices')) title = 'Notice Board - VLearn';
    else if (path.includes('/students')) title = 'Students - VLearn';
    else if (path.includes('/teachers')) title = 'Teachers - VLearn';
    else if (path.includes('/classes')) title = 'Classes - VLearn';
    else if (path.includes('/schedule')) title = 'Schedule - VLearn';
    else if (path.includes('/results')) title = 'Results - VLearn';
    else if (path.includes('/tuition')) title = 'Tuition - VLearn';
    else if (path.includes('/payments')) title = 'Payments - VLearn';
    else if (path.includes('/accounts')) title = 'Accounts - VLearn';
    else if (path.includes('/roles')) title = 'Permission Matrix - VLearn';
    document.title = title;
  }, [location]);
  return null;
};

const App = () => {
  const { user } = useContext(AuthContext);
  const getDashboardHome = () => {
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'Admin') return <Navigate to="/admin" replace />;
    if (user.role === 'Receptionist') return <Navigate to="/receptionist" replace />;
    if (user.role === 'Teacher') return <Navigate to="/teacher" replace />;
    if (user.role === 'Student') return <Navigate to="/student" replace />;
    return <Navigate to="/login" replace />;
  };

  return (
    <Router>
      <TitleUpdater />
      <Routes>
        <Route path="/" element={getDashboardHome()} />
        <Route path="/login" element={!user ? <Login /> : getDashboardHome()} />
        <Route path="/register" element={!user ? <Register /> : getDashboardHome()} />
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminLayout />
          </ProtectedRoute>
        } />
        <Route path="/receptionist/*" element={
          <ProtectedRoute allowedRoles={['Receptionist']}>
            <ReceptionistLayout />
          </ProtectedRoute>
        } />
        <Route path="/teacher/*" element={
          <ProtectedRoute allowedRoles={['Teacher']}>
            <TeacherLayout />
          </ProtectedRoute>
        } />
        <Route path="/student/*" element={
          <ProtectedRoute allowedRoles={['Student']}>
            <StudentLayout />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
};

export default App;
