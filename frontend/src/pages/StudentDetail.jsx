import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, User, BookOpen, Calendar, ClipboardCheck,
  Award, CreditCard, Mail, Phone, MapPin, AlertCircle, Edit2
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [enrollments, setEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [resultsData, setResultsData] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [tuitionInvoices, setTuitionInvoices] = useState([]);
  const [tuitionPayments, setTuitionPayments] = useState([]);
  const [loadingTuition, setLoadingTuition] = useState(false);

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const listPath = user?.role === 'Receptionist' ? '/receptionist/students' : '/admin/students';

  const fetchStudent = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/api/students/${id}`);
      if (res.data.success) {
        setStudent(res.data.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể tải chi tiết học viên', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    setLoadingEnrollments(true);
    try {
      const res = await axios.get(`${baseUrl}/api/students/${id}/enrollments`);
      if (res.data.success) {
        setEnrollments(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const fetchAttendance = async () => {
    setLoadingAttendance(true);
    try {
      const res = await axios.get(`${baseUrl}/api/students/${id}/attendance`);
      if (res.data?.success) {
        setAttendanceData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const fetchResults = async () => {
    setLoadingResults(true);
    try {
      const res = await axios.get(`${baseUrl}/api/students/${id}/results`);
      if (res.data?.success) {
        setResultsData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingResults(false);
    }
  };

  const fetchTuition = async () => {
    setLoadingTuition(true);
    try {
      const [invRes, payRes] = await Promise.all([
        axios.get(`${baseUrl}/api/students/${id}/invoices`),
        axios.get(`${baseUrl}/api/students/${id}/payments`),
      ]);
      if (invRes.data?.success) setTuitionInvoices(invRes.data.data || []);
      if (payRes.data?.success) setTuitionPayments(payRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTuition(false);
    }
  };

  useEffect(() => {
    fetchStudent();
    fetchEnrollments();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'classes' && id) {
      fetchEnrollments();
    } else if (activeTab === 'attendance' && id) {
      fetchAttendance();
    } else if (activeTab === 'results' && id) {
      fetchResults();
    } else if (activeTab === 'tuition' && id) {
      fetchTuition();
    }
  }, [activeTab, id]);

  const renderStatusBadge = (status) => {
    const map = {
      active: { text: 'Đang học', bg: '#dcfce7', color: '#15803d' },
      waiting: { text: 'Chờ xếp lớp', bg: '#dbeafe', color: '#1d4ed8' },
      paused: { text: 'Bảo lưu', bg: '#fef3c7', color: '#b45309' },
      completed: { text: 'Hoàn thành', bg: '#ede9fe', color: '#6d28d9' },
      inactive: { text: 'Nghỉ học', bg: '#fee2e2', color: '#b91c1c' }
    };
    const s = map[status] || { text: status, bg: '#f1f5f9', color: '#475569' };
    return (
      <span style={{
        backgroundColor: s.bg,
        color: s.color,
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.8rem',
        fontWeight: '600',
        display: 'inline-block'
      }}>
        {s.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1100px', margin: '2rem auto', textAlign: 'center', color: 'var(--text-muted)' }}>
        Đang tải hồ sơ học viên...
      </div>
    );
  }

  if (!student) {
    return (
      <div style={{ maxWidth: '1100px', margin: '2rem auto', textAlign: 'center' }}>
        <p style={{ color: 'var(--danger)', fontSize: '1.1rem' }}>Không tìm thấy học viên hoặc học viên không tồn tại.</p>
        <button onClick={() => navigate(listPath)} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const tabs = [
    { key: 'overview', label: 'Tổng Quan', icon: <User size={17} /> },
    { key: 'classes', label: 'Lớp Học', icon: <BookOpen size={17} /> },
    { key: 'schedule', label: 'Thời Khóa Biểu', icon: <Calendar size={17} /> },
    { key: 'attendance', label: 'Điểm Danh', icon: <ClipboardCheck size={17} /> },
    { key: 'results', label: 'Kết Quả Học Tập', icon: <Award size={17} /> },
    { key: 'tuition', label: 'Học Phí & Thanh Toán', icon: <CreditCard size={17} /> }
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Back button & top bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          onClick={() => navigate(listPath)}
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} />
          Quay lại danh sách học viên
        </button>
      </div>

      {/* Profile Header Card */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'var(--accent-gradient)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: '700'
          }}>
            {student.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
                {student.fullName}
              </h2>
              {renderStatusBadge(student.academicStatus)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.4rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <span>Mã HV: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{student.studentCode}</strong></span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Mail size={14} /> {student.email}</span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Phone size={14} /> {student.phone || 'Chưa cập nhật'}</span>
            </div>
          </div>
        </div>

        {/* Quick metrics */}
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center', padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.03)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Lớp Đang Học</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--accent-primary)' }}>
              {enrollments.filter((e) => e.status === 'active').length}
            </strong>
          </div>
          <div style={{ textAlign: 'center', padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.03)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Tỷ Lệ Điểm Danh</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>—</strong>
          </div>
          <div style={{ textAlign: 'center', padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.03)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Công Nợ Học Phí</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>—</strong>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', overflowX: 'auto' }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? '600' : '400',
                fontSize: '0.9rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Personal Information */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Thông Tin Cá Nhân
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Mã Học Viên:</span>
                <strong>{student.studentCode}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Họ và Tên:</span>
                <strong>{student.fullName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Email Đăng Nhập:</span>
                <strong>{student.email}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Số Điện Thoại:</span>
                <strong>{student.phone || '—'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Ngày Sinh:</span>
                <strong>{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('vi-VN') : '—'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Giới Tính:</span>
                <strong>{student.gender === 'male' ? 'Nam' : student.gender === 'female' ? 'Nữ' : 'Khác'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tài Khoản Liên Kết:</span>
                <span style={{ color: student.userId?.status === 'active' ? 'var(--success)' : 'var(--danger)', fontWeight: '600' }}>
                  {student.userId?.status === 'active' ? 'Hoạt động (Active)' : 'Đã khóa (Inactive)'}
                </span>
              </div>
            </div>
          </div>

          {/* Address & Emergency Contact */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Địa Chỉ & Liên Hệ Khẩn Cấp
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Địa Chỉ Thường Trú:</span>
                <p style={{ margin: 0, fontWeight: '500' }}>
                  {[student.address?.street, student.address?.ward, student.address?.district, student.address?.city]
                    .filter(Boolean)
                    .join(', ') || 'Chưa cập nhật địa chỉ'}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Người Liên Hệ Khẩn Cấp:</span>
                <strong>{student.emergencyContact?.name || 'Chưa cập nhật'}</strong>
                {student.emergencyContact?.relationship && (
                  <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({student.emergencyContact.relationship})</span>
                )}
                {student.emergencyContact?.phone && (
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)' }}>SĐT: {student.emergencyContact.phone}</p>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Ghi Chú Học Vụ:</span>
                <p style={{ margin: 0, fontStyle: student.notes ? 'normal' : 'italic', color: student.notes ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {student.notes || 'Không có ghi chú.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Classes (Phase 3 Real Data) */}
      {activeTab === 'classes' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
            Danh Sách Lớp Học Của Học Viên
          </h3>

          {loadingEnrollments ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Đang tải danh sách lớp học...</p>
          ) : enrollments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <BookOpen size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>Học viên hiện chưa ghi danh vào lớp học nào.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã Lớp</th>
                    <th>Tên Lớp Học</th>
                    <th>Kỹ Năng</th>
                    <th>Giảng Viên</th>
                    <th>Ngày Bắt Đầu</th>
                    <th>Trạng Thái Ghi Danh</th>
                    <th style={{ textAlign: 'right' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((enr) => {
                    const classItem = enr.class;
                    const statusColorMap = {
                      active: { bg: '#dcfce7', color: '#15803d', text: 'Đang học' },
                      transferred: { bg: '#fef3c7', color: '#b45309', text: 'Đã chuyển lớp' },
                      dropped: { bg: '#fee2e2', color: '#b91c1c', text: 'Thôi học' },
                      completed: { bg: '#e0e7ff', color: '#4338ca', text: 'Hoàn thành' }
                    };
                    const badge = statusColorMap[enr.status] || { bg: '#f1f5f9', color: '#475569', text: enr.status };

                    return (
                      <tr key={enr._id}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--accent-primary)' }}>
                            {classItem?.classCode || '—'}
                          </span>
                        </td>
                        <td>
                          <strong>{classItem?.className || 'Lớp đã lưu trữ'}</strong>
                        </td>
                        <td>
                          <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '600' }}>
                            {classItem?.skill || '—'}
                          </span>
                        </td>
                        <td>{classItem?.teacher?.fullName || 'Chưa xếp'}</td>
                        <td>{classItem?.startDate ? new Date(classItem.startDate).toLocaleDateString('vi-VN') : '—'}</td>
                        <td>
                          <span style={{
                            backgroundColor: badge.bg,
                            color: badge.color,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {badge.text}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {classItem?._id && (
                            <button
                              onClick={() => {
                                const classPathPrefix = user?.role === 'Receptionist' ? '/receptionist/classes' : '/admin/classes';
                                navigate(`${classPathPrefix}/${classItem._id}`);
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                            >
                              Chi tiết lớp
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
          <Calendar size={40} style={{ color: 'var(--accent-primary)', marginBottom: '1rem', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem' }}>Mô-đun Thời Khóa Biểu (Phase 4)</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto', fontSize: '0.9rem' }}>
            Lịch học tuần, phòng học và ca học sẽ được tích hợp đầy đủ sau khi hoàn thành Phase 4: Schedule Migration.
          </p>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div>
          {loadingAttendance ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Đang tải dữ liệu điểm danh của học viên...
            </div>
          ) : !attendanceData ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Chưa có dữ liệu điểm danh.
            </div>
          ) : (
            <div>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tỷ Lệ Chuyên Cần</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--accent-primary)', marginTop: '0.25rem' }}>
                    {attendanceData.summary?.attendanceRate}%
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Có Mặt</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--success)', marginTop: '0.25rem' }}>
                    {attendanceData.summary?.presentCount}
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--warning)' }}>Đi Muộn</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--warning)', marginTop: '0.25rem' }}>
                    {attendanceData.summary?.lateCount}
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>Vắng Mặt</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--danger)', marginTop: '0.25rem' }}>
                    {attendanceData.summary?.absentCount}
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: '#8b5cf6' }}>Có Phép</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#8b5cf6', marginTop: '0.25rem' }}>
                    {attendanceData.summary?.excusedCount}
                  </div>
                </div>
              </div>

              {/* Records Table */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ClipboardCheck size={18} style={{ color: 'var(--accent-primary)' }} />
                  Lịch Sử Điểm Danh ({attendanceData.records?.length || 0} buổi)
                </h3>
                {attendanceData.records?.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
                    Học viên chưa tham gia buổi học nào được ghi nhận điểm danh.
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Ngày Học</th>
                          <th>Giờ Học</th>
                          <th>Lớp Học</th>
                          <th>Kỹ Năng</th>
                          <th>Phòng</th>
                          <th>Trạng Thái</th>
                          <th>Ghi Chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceData.records.map(r => (
                          <tr key={r._id}>
                            <td style={{ fontWeight: '500' }}>
                              {r.sessionDate ? new Date(r.sessionDate).toLocaleDateString('vi-VN') : '—'}
                              {r.sessionNumber ? ` (Buổi ${r.sessionNumber})` : ''}
                            </td>
                            <td>{r.startTime && r.endTime ? `${r.startTime} - ${r.endTime}` : '—'}</td>
                            <td>
                              <div style={{ fontWeight: '600' }}>{r.className}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>{r.classCode}</div>
                            </td>
                            <td>
                              <span className="badge badge-skill" style={{ textTransform: 'capitalize' }}>
                                {r.skill}
                              </span>
                            </td>
                            <td>{r.room || '—'}</td>
                            <td>
                              <span className={`badge ${
                                r.status === 'Present' ? 'badge-active' :
                                r.status === 'Late' ? 'badge-paused' :
                                r.status === 'Absent' ? 'badge-cancelled' : 'badge-waiting'
                              }`}>
                                {r.status === 'Present' ? 'Có mặt' :
                                 r.status === 'Late' ? 'Đi muộn' :
                                 r.status === 'Absent' ? 'Vắng mặt' :
                                 r.status === 'Excused' ? 'Có phép' : r.status}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.85rem', color: r.note ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                              {r.note || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'results' && (
        <div>
          {loadingResults ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Đang tải kết quả học tập của học viên...
            </div>
          ) : !resultsData ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Chưa có dữ liệu bảng điểm.
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={18} style={{ color: 'var(--accent-primary)' }} />
                Bảng Điểm Các Đợt Kiểm Tra ({resultsData.results?.length || 0} bài kiểm tra)
              </h3>

              {resultsData.results?.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
                  Học viên chưa có kết quả bài kiểm tra nào được ghi nhận.
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Ngày Thi</th>
                        <th>Lớp Học</th>
                        <th>Loại Bài Test</th>
                        <th style={{ textAlign: 'center' }}>Nghe</th>
                        <th style={{ textAlign: 'center' }}>Nói</th>
                        <th style={{ textAlign: 'center' }}>Đọc</th>
                        <th style={{ textAlign: 'center' }}>Viết</th>
                        <th style={{ textAlign: 'center' }}>Tổng Kết</th>
                        <th>Nhận Xét</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultsData.results.map(r => (
                        <tr key={r._id}>
                          <td style={{ fontWeight: '500' }}>
                            {r.testDate ? new Date(r.testDate).toLocaleDateString('vi-VN') : '—'}
                          </td>
                          <td>
                            <div style={{ fontWeight: '600' }}>{r.class?.className || '—'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>{r.class?.classCode}</div>
                          </td>
                          <td>
                            <span className="badge badge-waiting">
                              {r.testType === 'placement' ? 'Đầu vào' :
                               r.testType === 'midterm' ? 'Giữa kỳ' :
                               r.testType === 'final' ? 'Cuối kỳ' :
                               r.testType === 'mock' ? 'Thi thử' : r.testType}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: '500' }}>{r.listeningScore != null ? r.listeningScore : '—'}</td>
                          <td style={{ textAlign: 'center', fontWeight: '500' }}>{r.speakingScore != null ? r.speakingScore : '—'}</td>
                          <td style={{ textAlign: 'center', fontWeight: '500' }}>{r.readingScore != null ? r.readingScore : '—'}</td>
                          <td style={{ textAlign: 'center', fontWeight: '500' }}>{r.writingScore != null ? r.writingScore : '—'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{
                              fontWeight: '700',
                              color: r.overallScore >= 50 ? 'var(--success)' : 'var(--accent-primary)',
                              background: 'var(--bg-secondary)',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px'
                            }}>
                              {r.overallScore}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: r.teacherComment ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {r.teacherComment || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'tuition' && (
        <div>
          {loadingTuition ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Đang tải dữ liệu học phí và thanh toán...
            </div>
          ) : (
            <div>
              {/* Invoices */}
              <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CreditCard size={18} style={{ color: 'var(--accent-primary)' }} />
                  Hóa Đơn Học Phí ({tuitionInvoices.length} hóa đơn)
                </h3>

                {tuitionInvoices.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem 0' }}>
                    Học viên chưa có hóa đơn học phí nào.
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Mã Hóa Đơn</th>
                          <th>Lớp Học</th>
                          <th>Tổng Tiền</th>
                          <th>Đã Đóng</th>
                          <th>Còn Nợ</th>
                          <th>Hạn Nộp</th>
                          <th>Trạng Thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tuitionInvoices.map((inv) => (
                          <tr key={inv._id}>
                            <td style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>{inv.invoiceCode}</td>
                            <td>
                              <div style={{ fontWeight: '600' }}>{inv.class?.className || '—'}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inv.class?.classCode}</div>
                            </td>
                            <td>{(inv.totalAmount || 0).toLocaleString('vi-VN')} ₫</td>
                            <td style={{ fontWeight: '600', color: 'var(--success)' }}>
                              {(inv.paidAmount || 0).toLocaleString('vi-VN')} ₫
                            </td>
                            <td style={{ fontWeight: '600', color: inv.remainingAmount > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                              {(inv.remainingAmount || 0).toLocaleString('vi-VN')} ₫
                            </td>
                            <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('vi-VN') : '—'}</td>
                            <td>
                              <span className={`badge ${
                                inv.status === 'paid' ? 'badge-active' :
                                inv.status === 'partial' ? 'badge-waiting' :
                                inv.status === 'overdue' ? 'badge-inactive' : 'badge-paused'
                              }`}>
                                {inv.status === 'paid' ? 'Đã đóng đủ' :
                                 inv.status === 'partial' ? 'Đóng 1 phần' :
                                 inv.status === 'overdue' ? 'Quá hạn' :
                                 inv.status === 'cancelled' ? 'Đã hủy' : 'Chưa đóng'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Payments */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CreditCard size={18} style={{ color: 'var(--accent-primary)' }} />
                  Lịch Sử Phiếu Thu ({tuitionPayments.length} lần thu)
                </h3>

                {tuitionPayments.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem 0' }}>
                    Chưa có phiếu thu nào được ghi nhận cho học viên này.
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Mã Phiếu Thu</th>
                          <th>Ngày Thu</th>
                          <th>Số Tiền</th>
                          <th>Hình Thức</th>
                          <th>Mã Giao Dịch</th>
                          <th>Người Thu</th>
                          <th>Trạng Thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tuitionPayments.map((p) => (
                          <tr key={p._id} style={{ opacity: p.status === 'voided' ? 0.6 : 1 }}>
                            <td style={{ fontWeight: '600', textDecoration: p.status === 'voided' ? 'line-through' : 'none' }}>
                              {p.paymentCode}
                            </td>
                            <td>{new Date(p.paymentDate || p.createdAt).toLocaleString('vi-VN')}</td>
                            <td style={{ fontWeight: '700', color: p.status === 'voided' ? 'var(--text-muted)' : 'var(--success)' }}>
                              {(p.amount || 0).toLocaleString('vi-VN')} ₫
                            </td>
                            <td>
                              {p.paymentMethod === 'cash' ? 'Tiền mặt' :
                               p.paymentMethod === 'bank_transfer' ? 'Chuyển khoản' :
                               p.paymentMethod === 'card' ? 'Thẻ' : p.paymentMethod}
                            </td>
                            <td>{p.transactionCode || '—'}</td>
                            <td>{p.createdBy?.name || 'Nhân sự'}</td>
                            <td>
                              <span className={`badge ${p.status === 'completed' ? 'badge-active' : 'badge-inactive'}`}>
                                {p.status === 'completed' ? 'Hợp lệ' : 'Đã hủy'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentDetail;
