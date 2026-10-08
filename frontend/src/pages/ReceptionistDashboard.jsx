import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  Users, BookOpen, AlertCircle, DollarSign, Clock,
  ChevronRight, Phone, Calendar, CreditCard, PlusCircle, Sparkles
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { PageHeader, StatCard, StatusBadge, LoadingSkeleton, ErrorState } from '../components/common';

const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const ReceptionistDashboard = () => {
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
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/receptionist/dashboard`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load receptionist dashboard:', err);
      setError(err.response?.data?.message || 'Không thể tải dữ liệu bảng điều khiển lễ tân');
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
          background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 50%, #075985 100%)',
          boxShadow: '0 12px 32px -8px rgba(2, 132, 199, 0.35)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.fullName || 'Lễ tân'}
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
                {user?.fullName?.charAt(0) || 'L'}
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
                  Bộ Phận Lễ Tân & Tuyển Sinh
                </span>
                <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>💼 Dịch Vụ Khách Hàng</span>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                Xin chào, {user?.fullName || 'Lễ Tân'}! 🌸
              </h2>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', opacity: 0.9, color: 'rgba(255, 255, 255, 0.9)' }}>
                Tháng này có {data.newStudentsThisMonth || 0} học viên mới nhập học và {data.upcomingClasses ? data.upcomingClasses.length : 0} lớp sắp khai giảng trong 14 ngày tới.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => navigate('/receptionist/tuition')}
              className="zoom-hover-sm"
              style={{
                background: '#FFFFFF',
                border: 'none',
                color: '#0369A1',
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
              <PlusCircle size={16} />
              Ghi nhận thanh toán
            </button>
          </div>
        </div>
      </div>

      {/* Row 1: Operational KPIs (4 cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <StatCard
          title="Học Viên Mới Tháng Này"
          value={data.newStudentsThisMonth}
          icon={<Users size={20} />}
          iconBg="#EFF6FF"
          iconColor="#2563EB"
          subtitle="Đăng ký nhập học trong tháng"
        />
        <StatCard
          title="Lớp Sắp Khai Giảng"
          value={data.upcomingClasses ? data.upcomingClasses.length : 0}
          icon={<BookOpen size={20} />}
          iconBg="#F5F3FF"
          iconColor="#7C3AED"
          subtitle="Trong vòng 14 ngày tới"
        />
        <StatCard
          title="Học Phí Chưa Thu"
          value={formatCurrency(data.outstandingTuition)}
          icon={<AlertCircle size={20} />}
          iconBg="#FEF2F2"
          iconColor="#EF4444"
          subtitle={`${data.overdueInvoicesCount || 0} hóa đơn quá hạn`}
          trend={data.overdueInvoicesCount > 0 ? "Cần nhắc nộp" : "Tốt"}
          trendPositive={data.overdueInvoicesCount === 0}
        />
        <StatCard
          title="Học Phí Thu Hôm Nay"
          value={formatCurrency(data.todayCollectedAmount)}
          icon={<DollarSign size={20} />}
          iconBg="#ECFDF5"
          iconColor="#059669"
          subtitle="Giao dịch thành công trong ngày"
        />
      </div>

      {/* Row 2: Payment Reminder List */}
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
              Học Viên Cần Nhắc Học Phí
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', margin: '0.2rem 0 0 0' }}>
              Danh sách hóa đơn chưa thanh toán hoặc đã quá hạn
            </p>
          </div>
          <Link to="/receptionist/tuition" style={{ color: 'var(--color-primary-600)', fontSize: '0.8125rem' }}>
            Xem toàn bộ hóa đơn &rarr;
          </Link>
        </div>

        {data.studentsNeedingPaymentReminder && data.studentsNeedingPaymentReminder.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Học Viên</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Lớp Học</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Số Tiền Còn Nợ</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Hạn Nộp</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Trạng Thái</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {data.studentsNeedingPaymentReminder.map((item, idx) => (
                  <tr key={idx} className="table-row-hover" style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600, color: '#0F172A' }}>{item.student?.fullName}</div>
                      <div style={{ color: '#64748B', fontSize: '0.75rem' }}>{item.student?.phone}</div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {item.class?.className || item.class?.classCode || 'Lớp học'}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#B45309' }}>
                      {formatCurrency(item.remainingAmount)}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#64748B', fontSize: '0.8125rem' }}>
                      {item.dueDate ? new Date(item.dueDate).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <StatusBadge status={item.status} />
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <button
                        onClick={() => navigate(`/receptionist/tuition/${item._id || item.invoiceId}`)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm, 4px)',
                          background: 'var(--color-primary-600, #2563EB)',
                          color: '#FFFFFF',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          cursor: 'pointer'
                        }}
                      >
                        <CreditCard size={14} />
                        Thu tiền
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '0.875rem' }}>
            Không có học viên nào cần nhắc học phí lúc này!
          </div>
        )}
      </div>

      {/* Row 3: Two Columns - Today's Classes & Recent Payments */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Today's Classes */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 8px)',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: 0, color: 'var(--color-text-main)' }}>
              Lịch Lớp Hôm Nay
            </h3>
            <Link to="/receptionist/classes" style={{ color: 'var(--color-primary-600)', fontSize: '0.8125rem' }}>
              Xem tất cả &rarr;
            </Link>
          </div>
          {data.todayClasses && data.todayClasses.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.todayClasses.map((c, i) => (
                <div key={i} className="list-item-hover" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.75rem', background: '#F8FAFC', borderRadius: '6px' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>{c.className}</div>
                    <div style={{ color: '#64748B', fontSize: '0.75rem' }}>
                      Phòng {c.room} • {c.teacher}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-primary-600)' }}>
                      {c.startTime} - {c.endTime}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748B', fontSize: '0.875rem' }}>
              Hôm nay không có lớp học nào diễn ra
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
              Khoản Thu Gần Đây
            </h3>
            <Link to="/receptionist/tuition" style={{ color: 'var(--color-primary-600)', fontSize: '0.8125rem' }}>
              Xem sổ quỹ &rarr;
            </Link>
          </div>
          {data.recentPayments && data.recentPayments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.recentPayments.map((p, i) => (
                <div key={i} className="list-item-hover" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.75rem', background: '#F8FAFC', borderRadius: '6px' }}>
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
              Chưa có phiếu thu nào hôm nay
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
