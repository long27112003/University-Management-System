import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BookOpen, Calendar, CheckSquare, Award, DollarSign,
  Clock, AlertCircle, ChevronRight, CheckCircle2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PageHeader, StatCard, StatusBadge, SkillBadge,
  LoadingSkeleton, ErrorState
} from '../components/common';

const DAY_LABELS = {
  Monday: 'Thứ Hai',
  Tuesday: 'Thứ Ba',
  Wednesday: 'Thứ Tư',
  Thursday: 'Thứ Năm',
  Friday: 'Thứ Sáu',
  Saturday: 'Thứ Bảy',
  Sunday: 'Chủ Nhật',
};

const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/student/dashboard`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
      setError(err.response?.data?.message || 'Không thể tải dữ liệu bảng điều khiển học viên');
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

  const outstanding = data.tuitionSummary?.totalOutstanding || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Page Header */}
      <PageHeader
        title="Bảng Điều Khiển Học Viên"
        subtitle="Theo dõi quá trình học tập, thời khóa biểu, chuyên cần và học phí cá nhân"
      />

      {/* Row 1: KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <StatCard
          title="Lớp Đang Học"
          value={data.activeClassesCount || 0}
          icon={<BookOpen size={20} />}
          iconBg="#EFF6FF"
          iconColor="#2563EB"
          subtitle="Khóa học đang hoạt động"
        />
        <StatCard
          title="Tỷ Lệ Chuyên Cần"
          value={`${data.attendanceSummary?.attendanceRate || 100}%`}
          icon={<CheckSquare size={20} />}
          iconBg="#ECFDF5"
          iconColor="#059669"
          subtitle={`${data.attendanceSummary?.presentCount || 0} có mặt / ${data.attendanceSummary?.totalSessions || 0} buổi`}
          trend={data.attendanceSummary?.attendanceRate >= 80 ? "Tốt" : "Cần cải thiện"}
          trendPositive={data.attendanceSummary?.attendanceRate >= 80}
        />
        <StatCard
          title="Điểm Bài Thi Gần Nhất"
          value={data.latestResults && data.latestResults.length > 0
            ? `${data.latestResults[0].overallScore || 0}/100`
            : 'Chưa có'}
          icon={<Award size={20} />}
          iconBg="#F5F3FF"
          iconColor="#7C3AED"
          subtitle={data.latestResults && data.latestResults.length > 0
            ? `${data.latestResults[0].testType} • ${data.latestResults[0].class?.className || ''}`
            : 'Chưa có dữ liệu bài thi'}
        />
        <StatCard
          title="Học Phí Còn Lại"
          value={formatCurrency(outstanding)}
          icon={<DollarSign size={20} />}
          iconBg={outstanding > 0 ? "#FEF2F2" : "#ECFDF5"}
          iconColor={outstanding > 0 ? "#EF4444" : "#059669"}
          subtitle={outstanding > 0 ? `${data.tuitionSummary?.unpaidInvoiceCount || 0} hóa đơn cần hoàn tất` : 'Đã hoàn tất học phí'}
          trend={outstanding > 0 ? "Chưa xong" : "Đã đủ"}
          trendPositive={outstanding === 0}
        />
      </div>

      {/* Row 2: Two Columns - Weekly Schedule & Active Classes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {/* Weekly Schedule */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 8px)',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: 0, color: 'var(--color-text-main)' }}>
              Thời Khóa Biểu Tuần
            </h3>
            <Link to="/student/schedule" style={{ color: 'var(--color-primary-600)', fontSize: '0.8125rem' }}>
              Xem lịch tuần &rarr;
            </Link>
          </div>

          {data.weeklySchedule && data.weeklySchedule.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.weeklySchedule.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    background: '#F8FAFC',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#2563EB' }}>
                        {DAY_LABELS[item.dayOfWeek] || item.dayOfWeek}
                      </span>
                      <SkillBadge skill={item.class?.skill} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>
                      {item.class?.className}
                    </div>
                    <div style={{ color: '#64748B', fontSize: '0.75rem' }}>
                      Phòng {item.room} • GV {item.teacher?.fullName || 'Giáo viên'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#0F172A' }}>
                      {item.startTime} - {item.endTime}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '0.875rem' }}>
              Bạn chưa có lịch học nào trong tuần này.
            </div>
          )}
        </div>

        {/* Active Classes List */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 8px)',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: 0, color: 'var(--color-text-main)' }}>
              Lớp Học Đang Tham Gia
            </h3>
            <Link to="/student/classes" style={{ color: 'var(--color-primary-600)', fontSize: '0.8125rem' }}>
              Xem tất cả &rarr;
            </Link>
          </div>

          {data.activeClasses && data.activeClasses.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.activeClasses.map((c, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    background: '#F8FAFC',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#0F172A' }}>
                        {c.classCode}
                      </span>
                      <SkillBadge skill={c.skill} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>
                      {c.className}
                    </div>
                    <div style={{ color: '#64748B', fontSize: '0.75rem' }}>
                      GV: {c.teacher?.fullName || 'Giáo viên'} • Phòng: {c.room}
                    </div>
                  </div>
                  <div>
                    <button
                      onClick={() => navigate(`/student/classes/${c._id || c.id}`)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm, 4px)',
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        color: '#334155',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      Vào lớp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '0.875rem' }}>
              Bạn chưa đăng ký lớp học nào.
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Latest Results Table */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg, 8px)',
        border: '1px solid var(--color-border-subtle, #E2E8F0)',
        padding: '1.25rem',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--color-text-main)' }}>
              Kết Quả Đánh Giá 4 Kỹ Năng
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', margin: '0.2rem 0 0 0' }}>
              Điểm số chi tiết các bài kiểm tra gần đây
            </p>
          </div>
          <Link to="/student/results" style={{ color: 'var(--color-primary-600)', fontSize: '0.8125rem' }}>
            Xem bảng điểm chi tiết &rarr;
          </Link>
        </div>

        {data.latestResults && data.latestResults.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Lớp Học</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Đợt Thi</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>Listening</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>Speaking</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>Reading</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>Writing</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>Overall</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Nhận Xét</th>
                </tr>
              </thead>
              <tbody>
                {data.latestResults.map((r, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{r.class?.className || 'Lớp học'}</td>
                    <td style={{ padding: '10px 12px' }}>{r.testType}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{r.skills?.listening ?? '—'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{r.skills?.speaking ?? '—'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{r.skills?.reading ?? '—'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{r.skills?.writing ?? '—'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: 'var(--color-primary-600)' }}>
                      {r.overallScore ?? '—'}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#64748B', fontSize: '0.8125rem' }}>
                      {r.feedback || 'Chưa có nhận xét'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '0.875rem' }}>
            Chưa có bài kiểm tra nào được ghi nhận điểm.
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
