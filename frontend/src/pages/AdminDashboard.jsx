import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users, UserCheck, BookOpen, Calendar, DollarSign,
  CheckCircle, AlertCircle, Clock, ChevronRight, GraduationCap
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Link } from 'react-router-dom';
import { PageHeader, StatCard, StatusBadge, LoadingSkeleton, ErrorState } from '../components/common';

const ATTENDANCE_COLORS = {
  Present: '#10B981',
  Absent: '#EF4444',
  Late: '#F59E0B',
  Excused: '#3B82F6'
};

const ATTENDANCE_LABELS = {
  Present: 'Có mặt',
  Absent: 'Vắng mặt',
  Late: 'Đi muộn',
  Excused: 'Có phép'
};

const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/dashboard`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
      setError(err.response?.data?.message || 'Không thể tải dữ liệu bảng điều khiển');
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
        <LoadingSkeleton type="table" count={6} />
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

  // Attendance pie data
  const attendancePieData = Object.entries(data.attendanceOverview || {})
    .map(([status, count]) => ({
      name: ATTENDANCE_LABELS[status] || status,
      statusKey: status,
      value: count
    }))
    .filter(item => item.value > 0);

  const collectionRate = data.totalTuition > 0
    ? Math.round((data.paidTuition / data.totalTuition) * 100)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Page Header */}
      <PageHeader
        title="Bảng Điều Khiển Quản Trị"
        subtitle="Tổng quan hoạt động đào tạo, tuyển sinh và tài chính trung tâm VLearn"
      />

      {/* Row 1: Academic KPIs (4 cards) */}
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.75rem' }}>
          Chỉ Số Đào Tạo & Học Vụ
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <StatCard
            title="Tổng Học Viên"
            value={data.totalStudents}
            icon={<Users size={20} />}
            iconBg="#EFF6FF"
            iconColor="#2563EB"
            subtitle="Tổng hồ sơ trong hệ thống"
          />
          <StatCard
            title="Học Viên Đang Học"
            value={data.activeStudents}
            icon={<UserCheck size={20} />}
            iconBg="#ECFDF5"
            iconColor="#059669"
            subtitle={`${Math.round((data.activeStudents / (data.totalStudents || 1)) * 100)}% tỷ lệ đang học`}
          />
          <StatCard
            title="Đội Ngũ Giáo Viên"
            value={data.totalTeachers}
            icon={<GraduationCap size={20} />}
            iconBg="#F5F3FF"
            iconColor="#7C3AED"
            subtitle="Giáo viên đang giảng dạy"
          />
          <StatCard
            title="Lớp Học Đang Mở"
            value={data.activeClasses}
            icon={<BookOpen size={20} />}
            iconBg="#FFFBEB"
            iconColor="#D97706"
            subtitle="Lớp học active trong kỳ"
          />
        </div>
      </div>

      {/* Row 2: Financial KPIs (3 cards) */}
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.75rem' }}>
          Chỉ Số Học Phí & Tài Chính
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          <StatCard
            title="Tổng Học Phí Phải Thu"
            value={formatCurrency(data.totalTuition)}
            icon={<DollarSign size={20} />}
            iconBg="#EFF6FF"
            iconColor="#2563EB"
            subtitle="Tổng giá trị hóa đơn đã phát hành"
          />
          <StatCard
            title="Đã Thu Thực Tế"
            value={formatCurrency(data.paidTuition)}
            icon={<CheckCircle size={20} />}
            iconBg="#ECFDF5"
            iconColor="#059669"
            subtitle={`Đạt ${collectionRate}% trên tổng học phí`}
            trend={`${collectionRate}%`}
            trendPositive={true}
          />
          <StatCard
            title="Công Nợ Còn Phải Thu"
            value={formatCurrency(data.outstandingTuition)}
            icon={<AlertCircle size={20} />}
            iconBg="#FEF2F2"
            iconColor="#EF4444"
            subtitle="Khoản chưa hoàn tất hoặc quá hạn"
            trend={data.outstandingTuition > 0 ? "Cần đôn đốc" : "Hoàn tất"}
            trendPositive={data.outstandingTuition === 0}
          />
        </div>
      </div>

      {/* Row 3: Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {/* Monthly Tuition Collection Chart */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 8px)',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-card)'
        }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '1rem' }}>
            Học Phí Thực Thu (6 Tháng Gần Nhất)
          </h3>
          {data.monthlyTuitionSummary && data.monthlyTuitionSummary.length > 0 ? (
            <div style={{ height: '240px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyTuitionSummary} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`} />
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'Học phí thực thu']}
                    labelFormatter={(label) => `Tháng: ${label}`}
                    contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px' }}
                  />
                  <Bar dataKey="collectedAmount" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: '0.875rem' }}>
              Chưa có dữ liệu thu học phí
            </div>
          )}
        </div>

        {/* Student Growth Chart */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 8px)',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-card)'
        }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '1rem' }}>
            Học Viên Mới (6 Tháng Gần Nhất)
          </h3>
          {data.monthlyStudentGrowth && data.monthlyStudentGrowth.length > 0 ? (
            <div style={{ height: '240px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyStudentGrowth} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    formatter={(val) => [`${val} học viên`, 'Học viên mới']}
                    labelFormatter={(label) => `Tháng: ${label}`}
                    contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px' }}
                  />
                  <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: '0.875rem' }}>
              Chưa có dữ liệu học viên mới
            </div>
          )}
        </div>

        {/* Attendance Overview (Current Month) */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 8px)',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-card)'
        }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '1rem' }}>
            Tỷ Lệ Điểm Danh (Tháng Hiện Tại)
          </h3>
          {attendancePieData.length > 0 ? (
            <div style={{ height: '240px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendancePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {attendancePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ATTENDANCE_COLORS[entry.statusKey] || '#64748B'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [`${val} lượt`, name]}
                    contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: '0.875rem' }}>
              Chưa có dữ liệu điểm danh tháng này
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Today's Classes List */}
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
              Lớp Học Hôm Nay
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', margin: '0.2rem 0 0 0' }}>
              Có {data.todayClasses} ca học được lên lịch trong ngày
            </p>
          </div>
          <Link
            to="/admin/classes"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--color-primary-600)'
            }}
          >
            Xem tất cả lớp <ChevronRight size={14} />
          </Link>
        </div>

        {data.todayClassList && data.todayClassList.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Mã Lớp</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Tên Lớp</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Kỹ Năng</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Giáo Viên</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Thời Gian</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Phòng</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {data.todayClassList.map((session, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--color-primary-600)' }}>{session.classCode}</td>
                    <td style={{ padding: '10px 12px' }}>{session.className}</td>
                    <td style={{ padding: '10px 12px', textTransform: 'capitalize' }}>{session.skill}</td>
                    <td style={{ padding: '10px 12px' }}>{session.teacher}</td>
                    <td style={{ padding: '10px 12px' }}>{session.startTime} - {session.endTime}</td>
                    <td style={{ padding: '10px 12px' }}>{session.room}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <StatusBadge status={session.status === 'completed' ? 'completed' : 'scheduled'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '0.875rem' }}>
            Hôm nay không có buổi học nào được lên lịch
          </div>
        )}
      </div>

      {/* Row 5: Recent Students & Recent Payments */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Recent Students */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 8px)',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: 0, color: 'var(--color-text-main)' }}>
              Học Viên Mới Đăng Ký
            </h3>
            <Link to="/admin/students" style={{ color: 'var(--color-primary-600)', fontSize: '0.8125rem' }}>
              Xem thêm
            </Link>
          </div>
          {data.recentStudents && data.recentStudents.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.recentStudents.map((st, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.75rem', background: '#F8FAFC', borderRadius: '6px' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>{st.fullName}</div>
                    <div style={{ color: '#64748B', fontSize: '0.75rem' }}>{st.studentCode} • {st.phone}</div>
                  </div>
                  <StatusBadge status={st.academicStatus || 'active'} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748B', fontSize: '0.875rem' }}>
              Chưa có học viên nào
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 8px)',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: 0, color: 'var(--color-text-main)' }}>
              Giao Dịch Học Phí Gần Nhất
            </h3>
            <Link to="/admin/tuition" style={{ color: 'var(--color-primary-600)', fontSize: '0.8125rem' }}>
              Xem thêm
            </Link>
          </div>
          {data.recentPayments && data.recentPayments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.recentPayments.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.75rem', background: '#F8FAFC', borderRadius: '6px' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>{p.student?.fullName || 'Học viên'}</div>
                    <div style={{ color: '#64748B', fontSize: '0.75rem' }}>
                      {p.paymentCode} • {p.paymentMethod === 'bank_transfer' ? 'Chuyển khoản' : p.paymentMethod === 'cash' ? 'Tiền mặt' : p.paymentMethod}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#059669', fontSize: '0.875rem' }}>+{formatCurrency(p.amount)}</div>
                    <div style={{ color: '#64748B', fontSize: '0.75rem' }}>
                      {new Date(p.paymentDate || p.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748B', fontSize: '0.875rem' }}>
              Chưa có giao dịch thanh toán nào
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
