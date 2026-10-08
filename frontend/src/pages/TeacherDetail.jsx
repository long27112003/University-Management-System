import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, User, BookOpen, Calendar, Mail, Phone, MapPin, Award
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

import { StatusBadge, SkillBadge } from '../components/common';

const TeacherDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const listPath = user?.role === 'Receptionist' ? '/receptionist/teachers' : '/admin/teachers';

  const fetchTeacher = async () => {
    setLoading(true);
    try {
      const endpoint = id ? `${baseUrl}/api/teachers/${id}` : `${baseUrl}/api/teacher/me`;
      const res = await axios.get(endpoint);
      if (res.data.success) {
        setTeacher(res.data.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể tải chi tiết giáo viên', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedClasses = async () => {
    setLoadingClasses(true);
    try {
      const endpoint = id
        ? `${baseUrl}/api/classes?teacherId=${id}`
        : `${baseUrl}/api/teacher/me/classes`;
      const res = await axios.get(endpoint);
      if (res.data.success) {
        setAssignedClasses(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingClasses(false);
    }
  };

  useEffect(() => {
    fetchTeacher();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'classes') {
      fetchAssignedClasses();
    }
  }, [activeTab, id]);

  if (loading) {
    return (
      <div style={{ maxWidth: '1100px', margin: '2rem auto', textAlign: 'center', color: '#64748B' }}>
        Đang tải hồ sơ giáo viên...
      </div>
    );
  }

  if (!teacher) {
    return (
      <div style={{ maxWidth: '1100px', margin: '2rem auto', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-danger, #EF4444)', fontSize: '1.1rem' }}>Không tìm thấy giáo viên hoặc giáo viên không tồn tại.</p>
        <button onClick={() => navigate(listPath)} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const tabs = [
    { key: 'overview', label: 'Tổng Quan', icon: <User size={17} /> },
    { key: 'classes', label: 'Lớp Giảng Dạy', icon: <BookOpen size={17} /> },
    { key: 'schedule', label: 'Lịch Dạy & Thời Khóa Biểu', icon: <Calendar size={17} /> }
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Back button if not personal profile */}
      {id && (
        <div style={{ marginBottom: '1.25rem' }}>
          <button
            onClick={() => navigate(listPath)}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={16} />
            Quay lại danh sách giáo viên
          </button>
        </div>
      )}

      {/* Header Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg, 8px)',
        border: '1px solid var(--color-border-subtle, #E2E8F0)',
        boxShadow: 'var(--shadow-card)',
        padding: '1.75rem',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'var(--color-primary-50, #EFF6FF)', color: 'var(--color-primary-600, #2563EB)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: '700', border: '1px solid #BFDBFE',
            overflow: 'hidden',
            flexShrink: 0,
            boxShadow: 'var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1))'
          }}>
            {teacher.avatar ? (
              <img
                src={teacher.avatar}
                alt={teacher.fullName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                }}
              />
            ) : null}
            <span style={{ display: teacher.avatar ? 'none' : 'block' }}>
              {teacher.fullName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: '#0F172A' }}>
                {teacher.fullName}
              </h2>
              <StatusBadge status={teacher.status} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.4rem', color: '#64748B', fontSize: '0.875rem' }}>
              <span>Mã GV: <strong style={{ color: 'var(--color-primary-600, #2563EB)', fontFamily: 'monospace' }}>{teacher.teacherCode}</strong></span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Mail size={14} /> {teacher.email}</span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Phone size={14} /> {teacher.phone || 'Chưa cập nhật'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border-subtle, #E2E8F0)', marginBottom: '1.5rem', overflowX: 'auto' }}>
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
                borderBottom: isActive ? '2px solid var(--color-primary-600, #2563EB)' : '2px solid transparent',
                color: isActive ? 'var(--color-primary-600, #2563EB)' : '#64748B',
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

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Thông tin cá nhân */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg, 8px)',
            border: '1px solid var(--color-border-subtle, #E2E8F0)',
            boxShadow: 'var(--shadow-card)',
            padding: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#0F172A' }}>
              Thông Tin Giảng Viên
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border-subtle, #E2E8F0)' }}>
                <span style={{ color: '#64748B' }}>Mã Giáo Viên:</span>
                <strong>{teacher.teacherCode}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border-subtle, #E2E8F0)' }}>
                <span style={{ color: '#64748B' }}>Họ và Tên:</span>
                <strong>{teacher.fullName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border-subtle, #E2E8F0)' }}>
                <span style={{ color: '#64748B' }}>Email Đăng Nhập:</span>
                <strong>{teacher.email}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border-subtle, #E2E8F0)' }}>
                <span style={{ color: '#64748B' }}>Số Điện Thoại:</span>
                <strong>{teacher.phone || '—'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border-subtle, #E2E8F0)' }}>
                <span style={{ color: '#64748B' }}>Giới Tính:</span>
                <strong>{teacher.gender === 'male' ? 'Nam' : teacher.gender === 'female' ? 'Nữ' : 'Khác'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Tài Khoản Liên Kết:</span>
                <span style={{ color: teacher.userId?.status === 'active' ? 'var(--color-success, #10B981)' : 'var(--color-danger, #EF4444)', fontWeight: 600 }}>
                  {teacher.userId?.status === 'active' ? 'Hoạt động (Active)' : 'Đã khóa (Inactive)'}
                </span>
              </div>
            </div>
          </div>

          {/* Chuyên môn & Địa chỉ */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg, 8px)',
            border: '1px solid var(--color-border-subtle, #E2E8F0)',
            boxShadow: 'var(--shadow-card)',
            padding: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#0F172A' }}>
              Chuyên Môn & Nơi Công Tác
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '0.35rem' }}>Kỹ Năng Phụ Trách:</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {teacher.specialization && teacher.specialization.length > 0 ? (
                    teacher.specialization.map((spec) => (
                      <SkillBadge key={spec} skill={spec} />
                    ))
                  ) : (
                    <span style={{ color: '#64748B' }}>Chưa cập nhật kỹ năng chuyên môn</span>
                  )}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border-subtle, #E2E8F0)', paddingTop: '0.75rem' }}>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Địa Chỉ:</span>
                <p style={{ margin: 0, fontWeight: 500, color: '#0F172A' }}>
                  {[teacher.address?.street, teacher.address?.ward, teacher.address?.district, teacher.address?.city]
                    .filter(Boolean)
                    .join(', ') || 'Chưa cập nhật địa chỉ'}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border-subtle, #E2E8F0)', paddingTop: '0.75rem' }}>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Ghi Chú Nghiệp Vụ:</span>
                <p style={{ margin: 0, fontStyle: teacher.notes ? 'normal' : 'italic', color: teacher.notes ? '#0F172A' : '#64748B' }}>
                  {teacher.notes || 'Không có ghi chú.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Classes */}
      {activeTab === 'classes' && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 8px)',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          boxShadow: 'var(--shadow-card)',
          padding: '1.5rem'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#0F172A' }}>
            Lớp Học Được Phân Công Giảng Dạy
          </h3>

          {loadingClasses ? (
            <p style={{ color: '#64748B', textAlign: 'center', padding: '2rem' }}>Đang tải danh sách lớp học...</p>
          ) : assignedClasses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
              <BookOpen size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>Giáo viên hiện chưa được phân công lớp học nào.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã Lớp</th>
                    <th>Tên Lớp Học</th>
                    <th>Kỹ Năng</th>
                    <th>Phòng Học</th>
                    <th>Sĩ Số</th>
                    <th>Ngày Bắt Đầu</th>
                    <th>Trạng Thái</th>
                    <th style={{ textAlign: 'right' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedClasses.map((c) => (
                    <tr key={c._id} className="table-row-hover">
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary-600, #2563EB)' }}>
                          {c.classCode}
                        </span>
                      </td>
                      <td>
                        <strong>{c.className}</strong>
                      </td>
                      <td>
                        <SkillBadge skill={c.skill} />
                      </td>
                      <td>{c.room}</td>
                      <td>{c.activeEnrollmentsCount ?? 0} / {c.maxCapacity}</td>
                      <td>{c.startDate ? new Date(c.startDate).toLocaleDateString('vi-VN') : '—'}</td>
                      <td>
                        <StatusBadge status={c.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            const prefix = user?.role === 'Receptionist' ? '/receptionist/classes' : '/admin/classes';
                            navigate(`${prefix}/${c._id}`);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                        >
                          Chi tiết lớp
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 8px)',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          boxShadow: 'var(--shadow-card)',
          padding: '3rem 2rem',
          textAlign: 'center'
        }}>
          <Calendar size={40} style={{ color: 'var(--color-primary-600, #2563EB)', marginBottom: '1rem', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem', color: '#0F172A' }}>Thời Khóa Biểu Giảng Dạy</h3>
          <p style={{ color: '#64748B', maxWidth: '500px', margin: '0 auto', fontSize: '0.9rem' }}>
            Xem toàn bộ lịch dạy, phòng học và ca học của giảng viên trong tuần tại mô-đun Lịch học & Lịch dạy.
          </p>
          <button
            onClick={() => {
              const schedPath = user?.role === 'Teacher' ? '/teacher/schedule' : (user?.role === 'Receptionist' ? '/receptionist/schedules' : '/admin/schedules');
              navigate(schedPath);
            }}
            className="btn btn-secondary"
            style={{ marginTop: '1rem' }}
          >
            Đến màn hình Lịch học
          </button>
        </div>
      )}
    </div>
  );
};

export default TeacherDetail;
