import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  BookOpen, Users, Calendar, CheckSquare, Clock,
  AlertCircle, ChevronRight, CheckCircle2, ClipboardCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  PageHeader, StatCard, StatusBadge, SkillBadge,
  LoadingSkeleton, ErrorState
} from '../components/common';

const TeacherDashboard = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/teacher/dashboard`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load teacher dashboard:', err);
      setError(err.response?.data?.message || 'Không thể tải dữ liệu bảng điều khiển giáo viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <LoadingSkeleton type="card" count={4} />
        <LoadingSkeleton type="table" count={5} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Lỗi tải Bảng Điều Khiển"
        message={error}
        onRetry={fetchDashboard}
      />
    );
  }

  if (!data) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Welcome Hero Banner */}
      <div
        className="hero-welcome-banner"
        style={{
          background: 'linear-gradient(135deg, #065F46 0%, #059669 50%, #10B981 100%)',
          boxShadow: '0 12px 32px -8px rgba(5, 150, 105, 0.35)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.fullName || 'Giảng viên'}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid rgba(255, 255, 255, 0.45)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.25)'
                }}
              />
            ) : (
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: '1.5rem',
                fontWeight: 800,
                border: '3px solid rgba(255, 255, 255, 0.45)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.25)'
              }}>
                {user?.fullName?.charAt(0) || 'G'}
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backdropFilter: 'blur(4px)'
                }}>
                  Giảng viên VLearn
                </span>
                <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>🎓 Giảng viên chuyên ngữ IELTS</span>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                Xin chào Thầy/Cô, {user?.fullName || 'Giảng viên'}! ✨
              </h2>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', opacity: 0.9, color: 'rgba(255, 255, 255, 0.9)' }}>
                Hôm nay thầy cô có {data.todaySchedule ? data.todaySchedule.length : 0} ca giảng dạy. Hãy kiểm tra thời khóa biểu và điểm danh cho các em nhé!
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => navigate('/teacher/attendance')}
              className="zoom-hover-sm"
              style={{
                background: '#FFFFFF',
                border: 'none',
                color: '#065F46',
                borderRadius: '10px',
                padding: '0.65rem 1.15rem',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <ClipboardCheck size={16} />
              Điểm danh buổi học
            </button>
          </div>
        </div>
      </div>

      {/* Row 1: KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <StatCard
          title="Lớp Phụ Trách"
          value={data.assignedClassesCount || 0}
          icon={<BookOpen size={20} />}
          iconBg="#EFF6FF"
          iconColor="#2563EB"
          subtitle={`${data.totalStudentsTaught || 0} học viên đang theo học`}
        />
        <StatCard
          title="Ca Dạy Hôm Nay"
          value={data.todaySchedule ? data.todaySchedule.length : 0}
          icon={<Calendar size={20} />}
          iconBg="#F5F3FF"
          iconColor="#7C3AED"
          subtitle="Buổi giảng dạy trong ngày"
        />
        <StatCard
          title="Tỷ Lệ Chuyên Cần"
          value={`${data.attendanceSummary?.averageAttendanceRate || 100}%`}
          icon={<CheckSquare size={20} />}
          iconBg="#ECFDF5"
          iconColor="#059669"
          subtitle="Trung bình các lớp phụ trách"
        />
        <StatCard
          title="Tiến Độ Điểm Danh"
          value={`${data.attendanceSummary?.markedSessions || 0} / ${data.attendanceSummary?.totalSessions || 0}`}
          icon={<CheckCircle2 size={20} />}
          iconBg="#FFFBEB"
          iconColor="#D97706"
          subtitle="Số buổi đã hoàn tất điểm danh"
        />
      </div>

      {/* Row 2: Today's Sessions Cards */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg, 8px)',
        border: '1px solid var(--color-border-subtle, #E2E8F0)',
        padding: '1.25rem',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--color-text-main)' }}>
              Lịch Dạy Hôm Nay
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', margin: '0.2rem 0 0 0' }}>
              Các ca học trực tiếp cần giáo viên có mặt và điểm danh
            </p>
          </div>
          <Link to="/teacher/schedule" style={{ color: 'var(--color-primary-600)', fontSize: '0.8125rem' }}>
            Xem toàn bộ thời khóa biểu &rarr;
          </Link>
        </div>

        {data.todaySchedule && data.todaySchedule.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {data.todaySchedule.map((session, idx) => (
              <div
                key={idx}
                className="list-item-hover zoom-hover-sm"
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md, 6px)',
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <SkillBadge skill={session.skill} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748B' }}>
                    Phòng: <strong style={{ color: '#0F172A' }}>{session.room}</strong>
                  </span>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A', margin: '0 0 0.25rem 0' }}>
                    {session.className}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.8125rem' }}>
                    <Clock size={14} />
                    <span>{session.startTime} - {session.endTime}</span>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid #E2E8F0',
                  marginTop: 'auto'
                }}>
                  <StatusBadge status={session.isMarked ? 'completed' : 'scheduled'} customLabel={session.isMarked ? 'Đã điểm danh' : 'Chưa điểm danh'} />
                  <button
                    onClick={() => navigate(`/teacher/attendance?classId=${session.classId}&sessionId=${session.sessionId || ''}`)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-sm, 4px)',
                      background: 'var(--color-primary-600, #2563EB)',
                      color: '#FFFFFF',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Điểm danh
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '0.875rem' }}>
            Hôm nay bạn không có ca dạy nào. Hãy chuẩn bị giáo án cho các buổi học tiếp theo!
          </div>
        )}
      </div>

      {/* Row 3: Assigned Classes List */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg, 8px)',
        border: '1px solid var(--color-border-subtle, #E2E8F0)',
        padding: '1.25rem',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--color-text-main)' }}>
              Danh Sách Lớp Giảng Dạy
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', margin: '0.2rem 0 0 0' }}>
              Các lớp học đang phụ trách và sĩ số học viên
            </p>
          </div>
          <Link to="/teacher/classes" style={{ color: 'var(--color-primary-600)', fontSize: '0.8125rem' }}>
            Xem chi tiết các lớp &rarr;
          </Link>
        </div>

        {data.assignedClasses && data.assignedClasses.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Mã Lớp</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Tên Lớp</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Kỹ Năng</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Sĩ Số</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Phòng</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {data.assignedClasses.map((cls, idx) => (
                  <tr key={idx} className="table-row-hover" style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--color-primary-600)' }}>
                      {cls.classCode}
                    </td>
                    <td style={{ padding: '10px 12px' }}>{cls.className}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <SkillBadge skill={cls.skill} />
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{cls.enrolledCount || cls.studentsCount || 0}</span>
                      <span style={{ color: '#64748B' }}> / {cls.maxCapacity || 15} học viên</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>{cls.room || 'Chưa xếp'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => navigate(`/teacher/classes/${cls._id || cls.id}`)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-sm, 4px)',
                            background: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            color: '#334155',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          Chi tiết
                        </button>
                        <button
                          onClick={() => navigate(`/teacher/results?classId=${cls._id || cls.id}`)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-sm, 4px)',
                            background: 'var(--color-primary-50, #EFF6FF)',
                            border: '1px solid #BFDBFE',
                            color: 'var(--color-primary-600, #2563EB)',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                        >
                          Nhập điểm
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '0.875rem' }}>
            Bạn chưa được phân công phụ trách lớp học nào.
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
