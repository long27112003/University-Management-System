import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Calendar, CheckCircle2, Clock, XCircle, AlertCircle,
  Percent, Award, BookOpen, MapPin, RefreshCw, ClipboardCheck
} from 'lucide-react';

const STATUS_BADGES = {
  Present: { label: 'Có mặt', class: 'badge-active', color: 'var(--success)' },
  Late:    { label: 'Đi muộn', class: 'badge-paused', color: 'var(--warning)' },
  Absent:  { label: 'Vắng mặt', class: 'badge-cancelled', color: 'var(--danger)' },
  Excused: { label: 'Có phép', class: 'badge-waiting', color: '#8b5cf6' }
};

const StudentAttendance = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${baseUrl}/api/student/me/attendance`);
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching student attendance:', err);
        setError(err.response?.data?.message || 'Không thể tải lịch sử điểm danh');
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [baseUrl]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <RefreshCw className="spin" size={32} style={{ margin: '0 auto 1rem', opacity: 0.7 }} />
        <div>Đang tải dữ liệu điểm danh của bạn...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>
        <AlertCircle size={36} style={{ margin: '0 auto 0.75rem' }} />
        <p>{error}</p>
      </div>
    );
  }

  const summary = data?.summary || {
    totalSessionsMarked: 0,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    excusedCount: 0,
    attendanceRate: 0
  };

  const records = data?.records || [];

  const statCards = [
    {
      title: 'Tỷ Lệ Chuyên Cần',
      value: `${summary.attendanceRate}%`,
      icon: <Percent size={24} color="var(--accent-primary)" />,
      bg: 'rgba(59, 130, 246, 0.12)'
    },
    {
      title: 'Có Mặt (Đúng Giờ)',
      value: summary.presentCount,
      icon: <CheckCircle2 size={24} color="var(--success)" />,
      bg: 'rgba(16, 185, 129, 0.12)'
    },
    {
      title: 'Đi Muộn',
      value: summary.lateCount,
      icon: <Clock size={24} color="var(--warning)" />,
      bg: 'rgba(245, 158, 11, 0.12)'
    },
    {
      title: 'Vắng Mặt Không Phép',
      value: summary.absentCount,
      icon: <XCircle size={24} color="var(--danger)" />,
      bg: 'rgba(239, 68, 68, 0.12)'
    },
    {
      title: 'Vắng Có Phép',
      value: summary.excusedCount,
      icon: <Award size={24} color="#8b5cf6" />,
      bg: 'rgba(139, 92, 246, 0.12)'
    }
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ClipboardCheck size={28} style={{ color: 'var(--accent-primary)' }} />
          Chuyên Cần & Điểm Danh Cá Nhân
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Theo dõi quá trình tham gia các buổi học trực tiếp tại trung tâm VLearn English Center.
        </p>
      </div>

      {/* Summary Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {statCards.map((card, index) => (
          <div key={index} className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ background: card.bg, padding: '0.85rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {card.icon}
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.25rem', fontWeight: '500' }}>
                {card.title}
              </p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* History Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={20} style={{ color: 'var(--accent-primary)' }} />
          Lịch Sử Điểm Danh Chi Tiết ({records.length} buổi)
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Ngày Học</th>
                <th style={{ width: '110px' }}>Giờ Học</th>
                <th style={{ minWidth: '180px' }}>Lớp Học</th>
                <th style={{ width: '110px' }}>Kỹ Năng</th>
                <th style={{ width: '100px' }}>Phòng</th>
                <th style={{ width: '140px' }}>Trạng Thái</th>
                <th style={{ minWidth: '200px' }}>Ghi Chú</th>
              </tr>
            </thead>
            <tbody>
              {records.map(record => {
                const badgeCfg = STATUS_BADGES[record.status] || {
                  label: record.status || 'Chưa rõ',
                  class: 'badge-paused',
                  color: 'var(--text-muted)'
                };
                return (
                  <tr key={record._id}>
                    <td style={{ fontWeight: '600' }}>
                      {formatDate(record.sessionDate)}
                      {record.sessionNumber ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                          (Buổi {record.sessionNumber})
                        </span>
                      ) : null}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {record.startTime && record.endTime ? `${record.startTime} - ${record.endTime}` : '—'}
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{record.className}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>{record.classCode}</div>
                    </td>
                    <td>
                      <span className="badge badge-skill" style={{ textTransform: 'capitalize' }}>
                        {record.skill}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{record.room || '—'}</td>
                    <td>
                      <span className={`badge ${badgeCfg.class}`}>
                        {badgeCfg.label}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: record.note ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {record.note || '—'}
                    </td>
                  </tr>
                );
              })}
              {records.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Chưa có buổi học nào được ghi nhận điểm danh.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendance;
