import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, BookOpen, Users, Calendar, ClipboardCheck, Award, FileText,
  UserPlus, ArrowRightLeft, UserX, MapPin, DollarSign, Clock, CheckCircle,
  Plus, Edit2, Trash2, RefreshCw, AlertCircle, Download, Upload, Save
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import EnrollmentModal from '../components/EnrollmentModal';
import TransferEnrollmentModal from '../components/TransferEnrollmentModal';
import ConfirmModal from '../components/ConfirmModal';

const DAY_NAMES = {
  2: 'Thứ Hai',
  3: 'Thứ Ba',
  4: 'Thứ Tư',
  5: 'Thứ Năm',
  6: 'Thứ Sáu',
  7: 'Thứ Bảy',
  8: 'Chủ Nhật'
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
};

const ClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

  const [classDoc, setClassDoc] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState('active');

  // Modals
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [transferTarget, setTransferTarget] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [dropReason, setDropReason] = useState('');
  const [dropping, setDropping] = useState(false);

  // Schedule state (Phase 4)
  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleFormData, setScheduleFormData] = useState({
    dayOfWeek: 2,
    startTime: '18:00',
    endTime: '19:30',
    room: '',
    teacher: ''
  });
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
  const [scheduleConflictError, setScheduleConflictError] = useState(null);
  const [deleteScheduleId, setDeleteScheduleId] = useState(null);
  const [teachers, setTeachers] = useState([]);

  // Sessions state (Phase 4)
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [generatingSessions, setGeneratingSessions] = useState(false);
  const [updatingSessionId, setUpdatingSessionId] = useState(null);

  // Attendance state (Phase 5)
  const [attendanceSessionId, setAttendanceSessionId] = useState('');
  const [attendanceRoster, setAttendanceRoster] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceSessionInfo, setAttendanceSessionInfo] = useState(null);

  // Results state (Phase 6)
  const [classResults, setClassResults] = useState([]);
  const [loadingClassResults, setLoadingClassResults] = useState(false);
  const [resultFilterTestType, setResultFilterTestType] = useState('');

  // Materials state (Phase 9)
  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [materialFormData, setMaterialFormData] = useState({ title: '', description: '', file: null });
  const [uploadingMaterial, setUploadingMaterial] = useState(false);
  const [deleteMaterialId, setDeleteMaterialId] = useState(null);

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const listPath =
    user?.role === 'Student' ? '/student/classes' :
    user?.role === 'Teacher' ? '/teacher/classes' :
    user?.role === 'Receptionist' ? '/receptionist/classes' :
    '/admin/classes';
  const canManageEnrollment = user?.role === 'Admin' || user?.role === 'Receptionist';
  const isAdmin = user?.role === 'Admin';
  const isTeacher = user?.role === 'Teacher';
  const canEditAttendance = user?.role === 'Admin' || user?.role === 'Teacher';
  const canUploadMaterial = isAdmin || isTeacher;

  const fetchClass = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/api/classes/${id}`);
      if (res.data.success) {
        setClassDoc(res.data.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể tải chi tiết lớp học', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    setLoadingEnrollments(true);
    try {
      const filterParam = enrollmentStatusFilter ? `?status=${enrollmentStatusFilter}` : '';
      const res = await axios.get(`${baseUrl}/api/classes/${id}/enrollments${filterParam}`);
      if (res.data.success) {
        setEnrollments(res.data.data);
      }
    } catch (err) {
      showToast('Không thể tải danh sách học viên trong lớp', 'error');
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const fetchSchedules = async () => {
    setLoadingSchedules(true);
    try {
      const res = await axios.get(`${baseUrl}/api/classes/${id}/schedules`);
      if (res.data.success) {
        setSchedules(res.data.data);
      }
    } catch (err) {
      showToast('Không thể tải thời khóa biểu của lớp', 'error');
    } finally {
      setLoadingSchedules(false);
    }
  };

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await axios.get(`${baseUrl}/api/classes/${id}/sessions`);
      if (res.data.success) {
        setSessions(res.data.data);
      }
    } catch (err) {
      showToast('Không thể tải danh sách buổi học của lớp', 'error');
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchTeachers = async () => {
    if (isAdmin) {
      try {
        const res = await axios.get(`${baseUrl}/api/teachers?limit=100`);
        if (res.data.success) setTeachers(res.data.data);
      } catch (e) {}
    }
  };

  const fetchSessionAttendance = async (sessionId) => {
    if (!sessionId) return;
    setLoadingAttendance(true);
    try {
      const res = await axios.get(`${baseUrl}/api/sessions/${sessionId}/attendance`);
      if (res.data?.success) {
        setAttendanceSessionInfo(res.data.data.session);
        setAttendanceRoster(res.data.data.records || []);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể tải điểm danh của buổi học', 'error');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleSaveClassAttendance = async () => {
    if (!attendanceSessionId) return;
    const records = attendanceRoster.map(r => ({
      studentId: r.studentId,
      status: r.status || 'Present',
      note: (r.note || '').trim()
    }));
    setSavingAttendance(true);
    try {
      const res = await axios.put(`${baseUrl}/api/sessions/${attendanceSessionId}/attendance`, { records });
      if (res.data?.success) {
        showToast('Lưu điểm danh thành công', 'success');
        await fetchSessionAttendance(attendanceSessionId);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi lưu điểm danh', 'error');
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleClassMarkAllPresent = () => {
    setAttendanceRoster(prev => prev.map(r => ({ ...r, status: 'Present' })));
    showToast('Đã chọn Có mặt cho toàn bộ học viên (Chưa lưu)', 'info');
  };

  const updateClassRosterItem = (studentId, field, val) => {
    if (!canEditAttendance) return;
    setAttendanceRoster(prev => prev.map(r => {
      if (r.studentId === studentId) {
        return { ...r, [field]: val };
      }
      return r;
    }));
  };

  const fetchClassResults = async () => {
    setLoadingClassResults(true);
    try {
      const typeParam = resultFilterTestType ? `?testType=${resultFilterTestType}` : '';
      const res = await axios.get(`${baseUrl}/api/classes/${id}/results${typeParam}`);
      if (res.data?.success) {
        setClassResults(res.data.data?.results || []);
      }
    } catch (err) {
      showToast('Không thể tải bảng điểm của lớp', 'error');
    } finally {
      setLoadingClassResults(false);
    }
  };

  const fetchMaterials = async () => {
    if (!id) return;
    setLoadingMaterials(true);
    try {
      const res = await axios.get(`${baseUrl}/api/classes/${id}/materials`);
      setMaterials(res.data || []);
    } catch (err) {
      console.error('Error fetching materials:', err);
      showToast(err.response?.data?.message || 'Không thể tải tài liệu của lớp học', 'error');
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleUploadMaterialSubmit = async (e) => {
    e.preventDefault();
    if (!materialFormData.file) return showToast('Vui lòng chọn tệp tin tải lên', 'error');
    try {
      setUploadingMaterial(true);
      const fd = new FormData();
      fd.append('title', materialFormData.title);
      fd.append('description', materialFormData.description);
      fd.append('file', materialFormData.file);

      await axios.post(`${baseUrl}/api/classes/${id}/materials`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast('Tải lên tài liệu thành công!', 'success');
      setShowMaterialModal(false);
      setMaterialFormData({ title: '', description: '', file: null });
      fetchMaterials();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi tải tài liệu lên', 'error');
    } finally {
      setUploadingMaterial(false);
    }
  };

  const handleDeleteMaterialConfirm = async () => {
    if (!deleteMaterialId) return;
    try {
      await axios.delete(`${baseUrl}/api/materials/${deleteMaterialId}`);
      showToast('Đã xóa tài liệu!', 'success');
      fetchMaterials();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi xóa tài liệu', 'error');
    } finally {
      setDeleteMaterialId(null);
    }
  };

  useEffect(() => {
    fetchClass();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'students' && id) {
      fetchEnrollments();
    } else if (activeTab === 'schedule' && id) {
      fetchSchedules();
      fetchTeachers();
    } else if (activeTab === 'sessions' && id) {
      fetchSessions();
    } else if (activeTab === 'attendance' && id) {
      fetchSessions();
    } else if (activeTab === 'results' && id) {
      fetchClassResults();
    } else if (activeTab === 'materials' && id) {
      fetchMaterials();
    }
  }, [activeTab, id, enrollmentStatusFilter, resultFilterTestType]);

  useEffect(() => {
    if (activeTab === 'attendance' && sessions.length > 0 && !attendanceSessionId) {
      setAttendanceSessionId(sessions[0]._id);
    }
  }, [activeTab, sessions, attendanceSessionId]);

  useEffect(() => {
    if (activeTab === 'attendance' && attendanceSessionId) {
      fetchSessionAttendance(attendanceSessionId);
    }
  }, [activeTab, attendanceSessionId]);

  const openCreateScheduleModal = () => {
    setEditingSchedule(null);
    setScheduleConflictError(null);
    setScheduleFormData({
      dayOfWeek: 2,
      startTime: '18:00',
      endTime: '19:30',
      room: classDoc?.room || '',
      teacher: ''
    });
    setShowScheduleModal(true);
  };

  const openEditScheduleModal = (s) => {
    setEditingSchedule(s);
    setScheduleConflictError(null);
    setScheduleFormData({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.room,
      teacher: s.teacher?._id || s.teacher || ''
    });
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    setScheduleSubmitting(true);
    setScheduleConflictError(null);

    if (scheduleFormData.endTime <= scheduleFormData.startTime) {
      setScheduleConflictError('Giờ kết thúc phải lớn hơn giờ bắt đầu');
      setScheduleSubmitting(false);
      return;
    }

    try {
      if (editingSchedule) {
        const res = await axios.put(`${baseUrl}/api/schedules/${editingSchedule._id}`, {
          dayOfWeek: Number(scheduleFormData.dayOfWeek),
          startTime: scheduleFormData.startTime,
          endTime: scheduleFormData.endTime,
          room: scheduleFormData.room,
          teacher: scheduleFormData.teacher || null
        });
        if (res.data.success) {
          showToast('Cập nhật ca học thành công', 'success');
          setShowScheduleModal(false);
          fetchSchedules();
        }
      } else {
        const res = await axios.post(`${baseUrl}/api/classes/${id}/schedules`, {
          dayOfWeek: Number(scheduleFormData.dayOfWeek),
          startTime: scheduleFormData.startTime,
          endTime: scheduleFormData.endTime,
          room: scheduleFormData.room,
          teacher: scheduleFormData.teacher || null
        });
        if (res.data.success) {
          showToast('Thêm ca học thành công', 'success');
          setShowScheduleModal(false);
          fetchSchedules();
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Lỗi khi lưu thời khóa biểu';
      setScheduleConflictError(msg);
      showToast(msg, 'error');
    } finally {
      setScheduleSubmitting(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!deleteScheduleId) return;
    try {
      const res = await axios.delete(`${baseUrl}/api/schedules/${deleteScheduleId}`);
      if (res.data.success) {
        showToast('Xóa ca học thành công', 'success');
        setDeleteScheduleId(null);
        fetchSchedules();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể xóa ca học', 'error');
    }
  };

  const handleGenerateSessions = async () => {
    setGeneratingSessions(true);
    try {
      const res = await axios.post(`${baseUrl}/api/classes/${id}/sessions/generate`);
      if (res.data.success) {
        showToast(res.data.message || 'Sinh danh sách buổi học thành công', 'success');
        fetchSessions();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi sinh buổi học', 'error');
    } finally {
      setGeneratingSessions(false);
    }
  };

  const handleCompleteSession = async (sessionId) => {
    setUpdatingSessionId(sessionId);
    try {
      const res = await axios.patch(`${baseUrl}/api/sessions/${sessionId}/status`, {
        status: 'completed'
      });
      if (res.data.success) {
        showToast('Đã đánh dấu hoàn thành buổi học', 'success');
        fetchSessions();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể cập nhật trạng thái buổi học', 'error');
    } finally {
      setUpdatingSessionId(null);
    }
  };

  const handleDropEnrollment = async (e) => {
    e.preventDefault();
    if (!dropTarget) return;

    setDropping(true);
    try {
      const res = await axios.post(`${baseUrl}/api/enrollments/${dropTarget._id}/drop`, {
        reason: dropReason.trim()
      });
      if (res.data.success) {
        showToast('Đã ghi nhận thôi học / bảo lưu cho học viên', 'success');
        setDropTarget(null);
        setDropReason('');
        fetchClass();
        fetchEnrollments();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi thôi học / bảo lưu', 'error');
    } finally {
      setDropping(false);
    }
  };

  const renderSkillBadge = (skill) => {
    const map = {
      listening: { bg: '#e0f2fe', color: '#0369a1', text: 'Listening' },
      speaking: { bg: '#fef3c7', color: '#b45309', text: 'Speaking' },
      reading: { bg: '#dcfce7', color: '#15803d', text: 'Reading' },
      writing: { bg: '#f3e8ff', color: '#7e22ce', text: 'Writing' }
    };
    const s = map[skill?.toLowerCase()] || { bg: '#f1f5f9', color: '#475569', text: skill };
    return (
      <span style={{
        backgroundColor: s.bg,
        color: s.color,
        padding: '0.2rem 0.6rem',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: '700',
        textTransform: 'uppercase'
      }}>
        {s.text}
      </span>
    );
  };

  const renderStatusBadge = (status) => {
    const map = {
      upcoming: { bg: '#e0e7ff', color: '#4338ca', text: 'Sắp mở' },
      active: { bg: '#dcfce7', color: '#15803d', text: 'Đang diễn ra' },
      completed: { bg: '#f1f5f9', color: '#475569', text: 'Đã hoàn thành' },
      cancelled: { bg: '#fee2e2', color: '#b91c1c', text: 'Đã hủy' },
      archived: { bg: '#f3f4f6', color: '#6b7280', text: 'Lưu trữ' }
    };
    const s = map[status] || { bg: '#f1f5f9', color: '#475569', text: status };
    return (
      <span style={{
        backgroundColor: s.bg,
        color: s.color,
        padding: '0.25rem 0.65rem',
        borderRadius: '9999px',
        fontSize: '0.8rem',
        fontWeight: '600'
      }}>
        {s.text}
      </span>
    );
  };

  const renderEnrollmentStatusBadge = (status) => {
    const map = {
      active: { bg: '#dcfce7', color: '#15803d', text: 'Đang học' },
      completed: { bg: '#e0e7ff', color: '#4338ca', text: 'Hoàn thành' },
      dropped: { bg: '#fee2e2', color: '#b91c1c', text: 'Thôi học' },
      transferred: { bg: '#fef3c7', color: '#b45309', text: 'Đã chuyển lớp' }
    };
    const s = map[status] || { bg: '#f1f5f9', color: '#475569', text: status };
    return (
      <span style={{
        backgroundColor: s.bg,
        color: s.color,
        padding: '0.2rem 0.55rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600'
      }}>
        {s.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1100px', margin: '2rem auto', textAlign: 'center', color: 'var(--text-muted)' }}>
        Đang tải thông tin lớp học...
      </div>
    );
  }

  if (!classDoc) {
    return (
      <div style={{ maxWidth: '1100px', margin: '2rem auto', textAlign: 'center' }}>
        <p style={{ color: 'var(--danger)', fontSize: '1.1rem' }}>Không tìm thấy lớp học.</p>
        <button onClick={() => navigate(listPath)} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Quay lại danh sách lớp
        </button>
      </div>
    );
  }

  const tabs = [
    { key: 'overview', label: 'Tổng Quan', icon: <BookOpen size={17} /> },
    { key: 'students', label: `Học Viên (${classDoc.activeEnrollmentsCount ?? 0})`, icon: <Users size={17} /> },
    { key: 'schedule', label: 'Thời Khóa Biểu', icon: <Calendar size={17} /> },
    { key: 'sessions', label: 'Buổi Học', icon: <Clock size={17} /> },
    { key: 'attendance', label: 'Điểm Danh', icon: <ClipboardCheck size={17} /> },
    { key: 'results', label: 'Bảng Điểm', icon: <Award size={17} /> },
    { key: 'materials', label: 'Tài Liệu', icon: <FileText size={17} /> }
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top back button */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          onClick={() => navigate(listPath)}
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} />
          Quay lại danh sách lớp học
        </button>
      </div>

      {/* Header Banner Card */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <span style={{ fontWeight: '700', color: 'var(--accent-primary)', fontFamily: 'monospace', fontSize: '1.1rem' }}>
              {classDoc.classCode}
            </span>
            {renderSkillBadge(classDoc.skill)}
            {renderStatusBadge(classDoc.status)}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>
            {classDoc.className}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            <span>GV: <strong style={{ color: 'var(--text-primary)' }}>{classDoc.teacher?.fullName || 'Chưa xếp'}</strong></span>
            <span>•</span>
            <span>Phòng: <strong style={{ color: 'var(--text-primary)' }}>{classDoc.room}</strong></span>
            <span>•</span>
            <span>Học phí: <strong style={{ color: 'var(--text-primary)' }}>{Number(classDoc.tuitionFee).toLocaleString('vi-VN')} đ</strong></span>
          </div>
        </div>

        {/* Capacity Quick Stats */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', padding: '0.75rem 1.25rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Sĩ số hiện tại</span>
            <strong style={{ fontSize: '1.3rem', color: 'var(--accent-primary)' }}>
              {classDoc.activeEnrollmentsCount ?? 0} / {classDoc.maxCapacity}
            </strong>
          </div>
          <div style={{ textAlign: 'center', padding: '0.75rem 1.25rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Chỗ còn trống</span>
            <strong style={{ fontSize: '1.3rem', color: 'var(--success)' }}>
              {classDoc.availableSlots ?? 0}
            </strong>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
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

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Class Spec Details */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Thông Tin Khóa Học
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Mã Lớp Học:</span>
                <strong>{classDoc.classCode}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Kỹ Năng:</span>
                <span style={{ textTransform: 'capitalize', fontWeight: '600' }}>{classDoc.skill}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Phòng Học Cố Định:</span>
                <strong>{classDoc.room}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Ngày Khai Giảng:</span>
                <strong>{classDoc.startDate ? new Date(classDoc.startDate).toLocaleDateString('vi-VN') : '—'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Ngày Bế Giảng Dự Kiến:</span>
                <strong>{classDoc.endDate ? new Date(classDoc.endDate).toLocaleDateString('vi-VN') : '—'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Học Phí Toàn Khóa:</span>
                <strong style={{ color: 'var(--accent-primary)' }}>{Number(classDoc.tuitionFee).toLocaleString('vi-VN')} đ</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Trạng Thái Vận Hành:</span>
                {renderStatusBadge(classDoc.status)}
              </div>
            </div>
          </div>

          {/* Teacher Info */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Giảng Viên Phụ Trách
            </h3>
            {classDoc.teacher ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Họ và Tên:</span>
                  <strong>{classDoc.teacher.fullName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Mã Giáo Viên:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{classDoc.teacher.teacherCode}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Email Liên Hệ:</span>
                  <strong>{classDoc.teacher.email}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Số Điện Thoại:</span>
                  <strong>{classDoc.teacher.phone || '—'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Chuyên Môn Đào Tạo:</span>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {classDoc.teacher.specialization?.map((s) => (
                      <span key={s} style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa phân công giảng viên cho lớp học này.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Students (Enrollments) */}
      {activeTab === 'students' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          {/* Top action toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Lọc trạng thái:</span>
              <select
                className="form-input"
                value={enrollmentStatusFilter}
                onChange={(e) => setEnrollmentStatusFilter(e.target.value)}
                style={{ width: '160px' }}
              >
                <option value="active">Đang học (active)</option>
                <option value="">Tất cả trạng thái</option>
                <option value="transferred">Đã chuyển lớp (transferred)</option>
                <option value="dropped">Thôi học / Bảo lưu (dropped)</option>
                <option value="completed">Đã hoàn thành (completed)</option>
              </select>
            </div>

            {canManageEnrollment && (
              <button
                onClick={() => setShowEnrollModal(true)}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <UserPlus size={16} />
                Ghi Danh Học Viên
              </button>
            )}
          </div>

          {/* Enrollments Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã Học Viên</th>
                  <th>Họ và Tên</th>
                  <th>Số Điện Thoại</th>
                  <th>Email</th>
                  <th>Ngày Ghi Danh</th>
                  <th>Trạng Thái</th>
                  {canManageEnrollment && <th style={{ textAlign: 'right' }}>Thao Tác</th>}
                </tr>
              </thead>
              <tbody>
                {loadingEnrollments ? (
                  <tr>
                    <td colSpan="7" className="text-center" style={{ padding: '2rem' }}>
                      Đang tải danh sách học viên...
                    </td>
                  </tr>
                ) : enrollments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>
                      Chưa có học viên nào trong danh sách.
                    </td>
                  </tr>
                ) : (
                  enrollments.map((enr) => (
                    <tr key={enr._id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--accent-primary)' }}>
                          {enr.student?.studentCode}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: '#EFF6FF',
                            color: '#2563EB',
                            border: '1px solid #BFDBFE',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            flexShrink: 0,
                            overflow: 'hidden'
                          }}>
                            {enr.student?.avatar ? (
                              <img
                                src={enr.student.avatar}
                                alt={enr.student?.fullName}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                                }}
                              />
                            ) : null}
                            <span style={{ display: enr.student?.avatar ? 'none' : 'block' }}>
                              {enr.student?.fullName?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span style={{ fontWeight: '600' }}>{enr.student?.fullName}</span>
                        </div>
                      </td>
                      <td>{enr.student?.phone || '—'}</td>
                      <td>{enr.student?.email}</td>
                      <td>{new Date(enr.enrolledAt).toLocaleDateString('vi-VN')}</td>
                      <td>{renderEnrollmentStatusBadge(enr.status)}</td>
                      {canManageEnrollment && (
                        <td style={{ textAlign: 'right' }}>
                          {enr.status === 'active' ? (
                            <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => setTransferTarget(enr)}
                                className="btn btn-secondary"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: 'var(--accent-primary)' }}
                                title="Chuyển sang lớp khác"
                              >
                                <ArrowRightLeft size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                                Chuyển lớp
                              </button>
                              <button
                                onClick={() => setDropTarget(enr)}
                                className="btn btn-secondary"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: 'var(--danger)' }}
                                title="Thôi học / Bảo lưu"
                              >
                                <UserX size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                                Thôi học
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{enr.note || '—'}</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Schedule */}
      {activeTab === 'schedule' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Thời Khóa Biểu Tuần Của Lớp</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Lịch học định kỳ hàng tuần được áp dụng cho khóa học này
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={openCreateScheduleModal}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <Plus size={16} />
                Thêm Ca Học
              </button>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Thứ</th>
                  <th>Khung Giờ</th>
                  <th>Phòng Học</th>
                  <th>Giáo Viên Giảng Dạy</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Thao Tác</th>}
                </tr>
              </thead>
              <tbody>
                {loadingSchedules ? (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="text-center" style={{ padding: '2rem' }}>
                      Đang tải lịch học...
                    </td>
                  </tr>
                ) : schedules.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="text-center" style={{ padding: '2.5rem', color: 'var(--text-muted)' }}>
                      <Calendar size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                      <p>Chưa có thời khóa biểu nào được thiết lập cho lớp học này.</p>
                    </td>
                  </tr>
                ) : (
                  schedules.map((s) => {
                    const effectiveTeacher = s.teacher?.fullName || classDoc.teacher?.fullName || 'Chưa phân công';
                    return (
                      <tr key={s._id}>
                        <td>
                          <span style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>
                            {DAY_NAMES[s.dayOfWeek]}
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'monospace', fontWeight: '600' }}>
                            <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                            {s.startTime} – {s.endTime}
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                            {s.room}
                          </span>
                        </td>
                        <td>{effectiveTeacher}</td>
                        {isAdmin && (
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                              <button
                                onClick={() => openEditScheduleModal(s)}
                                className="btn btn-secondary"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                title="Sửa ca học"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteScheduleId(s._id)}
                                className="btn btn-secondary"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: 'var(--danger)' }}
                                title="Xóa ca học"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Sessions */}
      {activeTab === 'sessions' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Danh Sách Buổi Học Thực Tế</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Tổng cộng {sessions.length} buổi học trong kế hoạch đào tạo
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={handleGenerateSessions}
                className="btn btn-primary"
                disabled={generatingSessions}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <RefreshCw size={16} className={generatingSessions ? 'spin' : ''} />
                {generatingSessions ? 'Đang sinh buổi học...' : 'Sinh Buổi Học Tự Động'}
              </button>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Buổi #</th>
                  <th>Ngày Học</th>
                  <th>Khung Giờ</th>
                  <th>Phòng Học</th>
                  <th>Giáo Viên</th>
                  <th>Trạng Thái</th>
                  {(isAdmin || user?.role === 'Teacher') && <th style={{ textAlign: 'right' }}>Thao Tác</th>}
                </tr>
              </thead>
              <tbody>
                {loadingSessions ? (
                  <tr>
                    <td colSpan={7} className="text-center" style={{ padding: '2rem' }}>
                      Đang tải danh sách buổi học...
                    </td>
                  </tr>
                ) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center" style={{ padding: '2.5rem', color: 'var(--text-muted)' }}>
                      <Clock size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                      <p>Chưa có buổi học nào được sinh ra. Bấm "Sinh Buổi Học Tự Động" để tạo danh sách từ thời khóa biểu.</p>
                    </td>
                  </tr>
                ) : (
                  sessions.map((sess) => {
                    const statusMap = {
                      scheduled: { bg: '#e0f2fe', color: '#0369a1', text: 'Sắp diễn ra' },
                      completed: { bg: '#dcfce7', color: '#15803d', text: 'Đã hoàn thành' },
                      cancelled: { bg: '#fee2e2', color: '#b91c1c', text: 'Đã hủy' }
                    };
                    const st = statusMap[sess.status] || { bg: '#f1f5f9', color: '#475569', text: sess.status };
                    const d = new Date(sess.sessionDate);
                    const dateFormatted = `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;

                    return (
                      <tr key={sess._id}>
                        <td>
                          <span style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>
                            #{sess.sessionNumber}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: '600' }}>{dateFormatted}</span>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace' }}>
                            {sess.startTime} – {sess.endTime}
                          </span>
                        </td>
                        <td>{sess.room}</td>
                        <td>{sess.teacher?.fullName || 'Chưa xếp'}</td>
                        <td>
                          <span style={{
                            backgroundColor: st.bg,
                            color: st.color,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {st.text}
                          </span>
                        </td>
                        {(isAdmin || user?.role === 'Teacher') && (
                          <td style={{ textAlign: 'right' }}>
                            {sess.status === 'scheduled' && (
                              <button
                                onClick={() => handleCompleteSession(sess._id)}
                                disabled={updatingSessionId === sess._id}
                                className="btn btn-secondary"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--success)' }}
                                title="Đánh dấu đã hoàn thành"
                              >
                                <CheckCircle size={13} style={{ marginRight: '0.2rem', verticalAlign: 'middle' }} />
                                Hoàn thành
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div>
          {/* Session Selector Bar */}
          <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '280px' }}>
                <label style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  Chọn Buổi Học:
                </label>
                <select
                  className="form-input"
                  value={attendanceSessionId}
                  onChange={e => setAttendanceSessionId(e.target.value)}
                  style={{ maxWidth: '400px' }}
                >
                  {sessions.length === 0 ? (
                    <option value="">Chưa có buổi học nào trong lớp</option>
                  ) : (
                    sessions.map(s => (
                      <option key={s._id} value={s._id}>
                        Buổi {s.sessionNumber} - {formatDate(s.sessionDate)} ({s.startTime} - {s.endTime}) {s.status === 'cancelled' ? '[ĐÃ HỦY]' : s.status === 'completed' ? '[HOÀN THÀNH]' : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {canEditAttendance && attendanceSessionInfo?.status !== 'cancelled' && attendanceRoster.length > 0 && (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleClassMarkAllPresent}
                    disabled={loadingAttendance || savingAttendance}
                    style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                  >
                    <CheckCircle size={15} style={{ color: 'var(--success)', marginRight: '0.35rem' }} />
                    Chọn Tất Cả Có Mặt
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveClassAttendance}
                    disabled={loadingAttendance || savingAttendance}
                    style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}
                  >
                    <Save size={15} style={{ marginRight: '0.35rem' }} />
                    {savingAttendance ? 'Đang lưu...' : 'Lưu Điểm Danh'}
                  </button>
                </div>
              )}
            </div>

            {user?.role === 'Receptionist' && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                * Chế độ xem: Nhân viên Lễ tân không có quyền cập nhật điểm danh.
              </div>
            )}
          </div>

          {/* Session Roster */}
          {loadingAttendance ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Đang tải danh sách điểm danh buổi học...
            </div>
          ) : !attendanceSessionId || sessions.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Lớp học chưa có buổi học nào. Vui lòng chuyển sang tab "Thời Khóa Biểu" để thiết lập lịch học và sinh buổi học.
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ClipboardCheck size={20} style={{ color: 'var(--accent-primary)' }} />
                  Bảng Điểm Danh ({attendanceRoster.length} học viên)
                </h3>
                {attendanceSessionInfo && (
                  <span className={`badge ${attendanceSessionInfo.status === 'completed' ? 'badge-active' : attendanceSessionInfo.status === 'cancelled' ? 'badge-cancelled' : 'badge-paused'}`}>
                    {attendanceSessionInfo.status === 'completed' ? 'Đã hoàn thành' : attendanceSessionInfo.status === 'cancelled' ? 'Đã hủy' : 'Đang lên lịch'}
                  </span>
                )}
              </div>

              {attendanceRoster.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
                  Không có học viên nào đang theo học (active enrollment) trong lớp này.
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                        <th style={{ width: '130px' }}>Mã Học Viên</th>
                        <th style={{ minWidth: '180px' }}>Họ Và Tên</th>
                        <th style={{ minWidth: '320px' }}>Trạng Thái Điểm Danh</th>
                        <th style={{ minWidth: '200px' }}>Ghi Chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRoster.map((item, idx) => {
                        const isCancelled = attendanceSessionInfo?.status === 'cancelled';
                        const disabled = !canEditAttendance || isCancelled;
                        return (
                          <tr key={item.studentId}>
                            <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              {idx + 1}
                            </td>
                            <td style={{ fontWeight: '600', color: 'var(--accent-primary)', fontSize: '0.85rem' }}>
                              {item.studentCode}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                <div style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  backgroundColor: '#EFF6FF',
                                  color: '#2563EB',
                                  border: '1px solid #BFDBFE',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  flexShrink: 0,
                                  overflow: 'hidden'
                                }}>
                                  {item.avatar ? (
                                    <img
                                      src={item.avatar}
                                      alt={item.fullName}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                                      }}
                                    />
                                  ) : null}
                                  <span style={{ display: item.avatar ? 'none' : 'block' }}>
                                    {item.fullName?.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div style={{ fontWeight: '600' }}>{item.fullName}</div>
                              </div>
                            </td>
                            <td>
                              {disabled ? (
                                <span className={`badge ${
                                  item.status === 'Present' ? 'badge-active' :
                                  item.status === 'Late' ? 'badge-paused' :
                                  item.status === 'Absent' ? 'badge-cancelled' :
                                  item.status === 'Excused' ? 'badge-waiting' : 'badge-paused'
                                }`}>
                                  {item.status === 'Present' ? 'Có mặt' :
                                   item.status === 'Late' ? 'Đi muộn' :
                                   item.status === 'Absent' ? 'Vắng mặt' :
                                   item.status === 'Excused' ? 'Có phép' : 'Chưa điểm danh'}
                                </span>
                              ) : (
                                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                  {[
                                    { key: 'Present', label: 'Có mặt', color: 'var(--success)' },
                                    { key: 'Late',    label: 'Đi muộn', color: 'var(--warning)' },
                                    { key: 'Absent',  label: 'Vắng mặt', color: 'var(--danger)' },
                                    { key: 'Excused', label: 'Có phép', color: '#8b5cf6' }
                                  ].map(st => {
                                    const isSelected = item.status === st.key;
                                    return (
                                      <button
                                        key={st.key}
                                        type="button"
                                        onClick={() => updateClassRosterItem(item.studentId, 'status', st.key)}
                                        style={{
                                          padding: '0.3rem 0.6rem',
                                          borderRadius: '6px',
                                          fontSize: '0.8rem',
                                          fontWeight: isSelected ? '700' : '500',
                                          cursor: 'pointer',
                                          border: isSelected ? `2px solid ${st.color}` : '1px solid var(--border-color)',
                                          background: isSelected ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                                          color: isSelected ? st.color : 'var(--text-secondary)'
                                        }}
                                      >
                                        {st.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                            <td>
                              {disabled ? (
                                <span style={{ fontSize: '0.85rem', color: item.note ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                  {item.note || '—'}
                                </span>
                              ) : (
                                <input
                                  type="text"
                                  className="form-input"
                                  value={item.note || ''}
                                  onChange={e => updateClassRosterItem(item.studentId, 'note', e.target.value)}
                                  placeholder="Ghi chú lý do..."
                                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.825rem', height: 'auto' }}
                                />
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
        </div>
      )}

      {activeTab === 'results' && (
        <div>
          {/* Results Filter & Action Bar */}
          <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '280px' }}>
                <label style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  Lọc Theo Đợt Thi:
                </label>
                <select
                  className="form-input"
                  value={resultFilterTestType}
                  onChange={e => setResultFilterTestType(e.target.value)}
                  style={{ maxWidth: '300px' }}
                >
                  <option value="">-- Tất cả các đợt thi --</option>
                  <option value="placement">Đầu vào (Placement)</option>
                  <option value="midterm">Giữa kỳ (Midterm)</option>
                  <option value="final">Cuối kỳ (Final)</option>
                  <option value="mock">Thi thử (Mock Test)</option>
                </select>
              </div>

              {(isAdmin || user?.role === 'Teacher') && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate(isAdmin ? '/admin/results' : '/teacher/results')}
                  style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
                >
                  <Award size={16} style={{ marginRight: '0.35rem' }} />
                  Mở Giao Diện Nhập Điểm
                </button>
              )}
            </div>
          </div>

          {/* Results Table */}
          {loadingClassResults ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Đang tải bảng điểm của lớp...
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={20} style={{ color: 'var(--accent-primary)' }} />
                Bảng Điểm Đánh Giá 4 Kỹ Năng ({classResults.length} bản ghi)
              </h3>

              {classResults.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
                  Chưa có bài kiểm tra nào được ghi nhận cho lớp này.
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '45px', textAlign: 'center' }}>#</th>
                        <th style={{ width: '120px' }}>Mã Học Viên</th>
                        <th style={{ minWidth: '160px' }}>Họ Và Tên</th>
                        <th style={{ width: '120px' }}>Loại Đợt Thi</th>
                        <th style={{ width: '110px' }}>Ngày Thi</th>
                        <th style={{ width: '80px', textAlign: 'center' }}>Nghe</th>
                        <th style={{ width: '80px', textAlign: 'center' }}>Nói</th>
                        <th style={{ width: '80px', textAlign: 'center' }}>Đọc</th>
                        <th style={{ width: '80px', textAlign: 'center' }}>Viết</th>
                        <th style={{ width: '100px', textAlign: 'center' }}>Tổng Kết</th>
                        <th style={{ minWidth: '200px' }}>Nhận Xét</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classResults.map((r, idx) => (
                        <tr key={r._id}>
                          <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {idx + 1}
                          </td>
                          <td style={{ fontWeight: '600', color: 'var(--accent-primary)', fontSize: '0.85rem' }}>
                            {r.student?.studentCode}
                          </td>
                          <td style={{ fontWeight: '600' }}>
                            {r.student?.fullName}
                          </td>
                          <td>
                            <span className="badge badge-waiting">
                              {r.testType === 'placement' ? 'Đầu vào' :
                               r.testType === 'midterm' ? 'Giữa kỳ' :
                               r.testType === 'final' ? 'Cuối kỳ' :
                               r.testType === 'mock' ? 'Thi thử' : r.testType}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>
                            {formatDate(r.testDate)}
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

      {activeTab === 'materials' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                Tài Liệu Của Lớp ({materials.length})
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
                Giáo trình, bài tập và tài liệu học tập dành riêng cho lớp {classDoc.classCode}
              </p>
            </div>
            {canUploadMaterial && (
              <button
                className="btn btn-primary"
                onClick={() => setShowMaterialModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
              >
                <Upload size={16} /> Tải Lên Tài Liệu
              </button>
            )}
          </div>

          {loadingMaterials ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Đang tải danh sách tài liệu...
            </div>
          ) : materials.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {materials.map((m) => (
                <div
                  key={m._id}
                  className="glass-panel"
                  style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={22} color="var(--accent-primary)" />
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {m.title}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {m.fileType?.toUpperCase()} • {m.fileSize ? (m.fileSize / 1024 > 1024 ? `${(m.fileSize / 1048576).toFixed(1)} MB` : `${(m.fileSize / 1024).toFixed(0)} KB`) : 'Tệp tin'}
                        </span>
                      </div>
                    </div>
                    {canUploadMaterial && (
                      <button
                        onClick={() => setDeleteMaterialId(m._id)}
                        title="Xóa tài liệu"
                        style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {m.description && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: 1.4 }}>
                      {m.description}
                    </p>
                  )}

                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span>{new Date(m.createdAt).toLocaleDateString('vi-VN')}</span>
                    <a
                      href={`${baseUrl}${m.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="btn btn-secondary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                    >
                      <Download size={14} /> Tải Xuống
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Chưa có tài liệu nào được tải lên cho lớp học này.
            </div>
          )}

          {/* Modal: Upload Material */}
          {showMaterialModal && (
            <div className="modal-backdrop">
              <div className="modal-content glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '1.75rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  Tải Lên Tài Liệu Mới Cho Lớp
                </h3>
                <form onSubmit={handleUploadMaterialSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      Tiêu Đề Tài Liệu <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="VD: Bài tập luyện nghe tuần 1"
                      value={materialFormData.title}
                      onChange={(e) => setMaterialFormData({ ...materialFormData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      Mô Tả / Hướng Dẫn
                    </label>
                    <textarea
                      className="form-input"
                      rows={3}
                      placeholder="Hướng dẫn học viên làm bài..."
                      value={materialFormData.description}
                      onChange={(e) => setMaterialFormData({ ...materialFormData, description: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      Đính Kèm Tệp Tin <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      type="file"
                      className="form-input"
                      onChange={(e) => setMaterialFormData({ ...materialFormData, file: e.target.files[0] })}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
                      required
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                      Chấp nhận PDF, Word, PowerPoint, Excel, Hình ảnh (Tối đa 15MB)
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowMaterialModal(false)}
                      disabled={uploadingMaterial}
                    >
                      Hủy Bỏ
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={uploadingMaterial}>
                      {uploadingMaterial ? 'Đang tải lên...' : 'Tải Lên Ngay'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Delete Material Confirmation */}
          {deleteMaterialId && (
            <ConfirmModal
              isOpen={Boolean(deleteMaterialId)}
              title="Xác Nhận Xóa Tài Liệu"
              message="Bạn có chắc chắn muốn xóa tài liệu này không? Tệp tin sẽ bị gỡ bỏ vĩnh viễn khỏi máy chủ."
              confirmText="Xác Nhận Xóa"
              isDanger={true}
              onConfirm={handleDeleteMaterialConfirm}
              onCancel={() => setDeleteMaterialId(null)}
            />
          )}
        </div>
      )}

      {/* Modal: Enroll Student */}
      <EnrollmentModal
        classDoc={classDoc}
        isOpen={showEnrollModal}
        onClose={() => setShowEnrollModal(false)}
        onEnrolled={() => {
          fetchClass();
          fetchEnrollments();
        }}
      />

      {/* Modal: Transfer Enrollment */}
      <TransferEnrollmentModal
        enrollment={transferTarget}
        isOpen={Boolean(transferTarget)}
        onClose={() => setTransferTarget(null)}
        onTransferred={() => {
          fetchClass();
          fetchEnrollments();
        }}
      />

      {/* Modal: Drop Enrollment Confirmation */}
      {dropTarget && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{
            background: 'var(--bg-secondary)',
            width: '100%',
            maxWidth: '500px',
            padding: '1.75rem',
            borderRadius: 'var(--radius-lg)'
          }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.2rem', fontWeight: '700', color: 'var(--danger)' }}>
              Xác Nhận Thôi Học / Bảo Lưu
            </h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
              Bạn có chắc chắn muốn cập nhật trạng thái thôi học / bảo lưu cho học viên{' '}
              <strong>{dropTarget.student?.fullName}</strong> ({dropTarget.student?.studentCode}) khỏi lớp này?
            </p>
            <form onSubmit={handleDropEnrollment}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Lý Do Thôi Học / Bảo Lưu *</label>
                <textarea
                  className="form-input"
                  required
                  rows="3"
                  placeholder="Nhập lý do..."
                  value={dropReason}
                  onChange={(e) => setDropReason(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setDropTarget(null)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--danger)' }} disabled={dropping || !dropReason.trim()}>
                  {dropping ? 'Đang cập nhật...' : 'Xác Nhận Thôi Học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Schedule (Admin only) */}
      {showScheduleModal && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              {editingSchedule ? 'Chỉnh Sửa Ca Học' : 'Thêm Ca Học Định Kỳ'}
            </h2>

            {scheduleConflictError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--danger)',
                borderRadius: '6px',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                color: 'var(--danger)',
                fontSize: '0.85rem'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{scheduleConflictError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Thứ trong tuần *</label>
                  <select
                    className="form-input"
                    value={scheduleFormData.dayOfWeek}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, dayOfWeek: Number(e.target.value) })}
                    required
                  >
                    <option value="2">Thứ Hai</option>
                    <option value="3">Thứ Ba</option>
                    <option value="4">Thứ Tư</option>
                    <option value="5">Thứ Năm</option>
                    <option value="6">Thứ Sáu</option>
                    <option value="7">Thứ Bảy</option>
                    <option value="8">Chủ Nhật</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Phòng học *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="VD: Phòng 101"
                    value={scheduleFormData.room}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, room: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Giờ bắt đầu *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={scheduleFormData.startTime}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, startTime: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Giờ kết thúc *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={scheduleFormData.endTime}
                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>
                  Giáo viên đứng lớp (Tùy chọn)
                </label>
                <select
                  className="form-input"
                  value={scheduleFormData.teacher}
                  onChange={(e) => setScheduleFormData({ ...scheduleFormData, teacher: e.target.value })}
                >
                  <option value="">-- Mặc định theo giáo viên phụ trách lớp --</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>{t.teacherCode} - {t.fullName}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="btn btn-secondary"
                  disabled={scheduleSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={scheduleSubmitting}
                >
                  {scheduleSubmitting ? 'Đang lưu...' : (editingSchedule ? 'Cập nhật' : 'Thêm ca học')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Schedule Confirmation */}
      {deleteScheduleId && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', textAlign: 'center' }}>
            <AlertCircle size={40} style={{ color: 'var(--danger)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              Xác nhận xóa ca học?
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Chỉ có thể xóa ca học nếu chưa phát sinh các buổi học thực tế.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <button
                onClick={() => setDeleteScheduleId(null)}
                className="btn btn-secondary"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDeleteSchedule}
                className="btn btn-primary"
                style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassDetail;
