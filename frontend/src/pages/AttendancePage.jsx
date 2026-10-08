import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import {
  ClipboardCheck, Calendar, Clock, MapPin, CheckCircle, XCircle,
  AlertCircle, Save, CheckCheck, Filter, RefreshCw, AlertTriangle,
  UserCheck, UserX, Clock3, FileText, ChevronRight
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/common';

const STATUS_CONFIG = {
  Present: { label: 'Có mặt', color: 'var(--color-success, #10B981)', bg: '#DCFCE7', border: '#86EFAC' },
  Late:    { label: 'Đi muộn', color: 'var(--color-warning, #F59E0B)', bg: '#FEF3C7', border: '#FCD34D' },
  Absent:  { label: 'Vắng mặt', color: 'var(--color-danger, #EF4444)', bg: '#FEE2E2', border: '#FCA5A5' },
  Excused: { label: 'Có phép', color: 'var(--color-primary-600, #2563EB)', bg: '#EFF6FF', border: '#BFDBFE' }
};

const AttendancePage = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');

  // Attendance roster data
  const [sessionInfo, setSessionInfo] = useState(null);
  const [classInfo, setClassInfo] = useState(null);
  const [roster, setRoster] = useState([]);
  const [initialRosterState, setInitialRosterState] = useState([]);

  // UI state
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const isReadOnly = user?.role === 'Receptionist';
  const isCancelled = sessionInfo?.status === 'cancelled';

  // 1. Fetch accessible classes
  useEffect(() => {
    const fetchClasses = async () => {
      setLoadingClasses(true);
      try {
        const res = await axios.get(`${baseUrl}/api/classes?limit=100`);
        if (res.data?.success) {
          const list = res.data.data || [];
          setClasses(list);
          if (list.length > 0) {
            setSelectedClassId(list[0]._id);
          }
        }
      } catch (err) {
        showToast('Không thể tải danh sách lớp học', 'error');
      } finally {
        setLoadingClasses(false);
      }
    };
    fetchClasses();
  }, [baseUrl]);

  // 2. Fetch sessions when selectedClassId changes
  useEffect(() => {
    if (!selectedClassId) {
      setSessions([]);
      setSelectedSessionId('');
      setRoster([]);
      setSessionInfo(null);
      return;
    }

    const fetchSessions = async () => {
      setLoadingSessions(true);
      try {
        const res = await axios.get(`${baseUrl}/api/classes/${selectedClassId}/sessions`);
        if (res.data?.success) {
          const sList = res.data.data || [];
          setSessions(sList);
          if (sList.length > 0) {
            setSelectedSessionId(sList[0]._id);
          } else {
            setSelectedSessionId('');
            setRoster([]);
            setSessionInfo(null);
          }
        }
      } catch (err) {
        showToast('Không thể tải danh sách buổi học của lớp', 'error');
      } finally {
        setLoadingSessions(false);
      }
    };
    fetchSessions();
  }, [selectedClassId, baseUrl]);

  // 3. Fetch attendance roster when selectedSessionId changes
  const fetchRoster = useCallback(async (sessionIdToFetch) => {
    if (!sessionIdToFetch) {
      setRoster([]);
      setSessionInfo(null);
      return;
    }

    setLoadingRoster(true);
    try {
      const res = await axios.get(`${baseUrl}/api/sessions/${sessionIdToFetch}/attendance`);
      if (res.data?.success) {
        const data = res.data.data;
        setSessionInfo(data.session);
        setClassInfo(data.class);
        setRoster(data.records || []);
        setInitialRosterState(JSON.stringify(data.records || []));
        setIsDirty(false);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể tải bảng điểm danh buổi học';
      showToast(msg, 'error');
    } finally {
      setLoadingRoster(false);
    }
  }, [baseUrl, showToast]);

  useEffect(() => {
    if (selectedSessionId) {
      fetchRoster(selectedSessionId);
    }
  }, [selectedSessionId, fetchRoster]);

  // 4. Handle unsaved changes warning before unload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'Bạn có thay đổi điểm danh chưa lưu. Bạn có chắc muốn rời đi?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Check dirty state on local roster change
  const updateRosterItem = (studentId, field, value) => {
    if (isReadOnly || isCancelled) return;
    setRoster(prev => {
      const updated = prev.map(item => {
        if (item.studentId === studentId) {
          return { ...item, [field]: value };
        }
        return item;
      });
      setIsDirty(JSON.stringify(updated) !== initialRosterState);
      return updated;
    });
  };

  // Quick Action: Mark All Present (Local UI state ONLY)
  const handleMarkAllPresent = () => {
    if (isReadOnly || isCancelled) return;
    setRoster(prev => {
      const updated = prev.map(item => ({
        ...item,
        status: 'Present'
      }));
      setIsDirty(JSON.stringify(updated) !== initialRosterState);
      return updated;
    });
    showToast('Đã chọn Có mặt cho toàn bộ học viên (Chưa lưu vào hệ thống)', 'info');
  };

  // 5. Submit attendance via PUT Bulk Upsert
  const handleSaveAttendance = async () => {
    if (isReadOnly) {
      showToast('Lễ tân không có quyền cập nhật điểm danh', 'error');
      return;
    }
    if (isCancelled) {
      showToast('Không thể lưu điểm danh cho buổi học đã hủy', 'error');
      return;
    }
    if (!selectedSessionId) return;

    // Filter students with status marked
    const unmarkedCount = roster.filter(r => !r.status).length;
    if (unmarkedCount > 0) {
      const confirmed = window.confirm(
        `Hiện có ${unmarkedCount} học viên chưa được chọn trạng thái điểm danh. Các học viên này sẽ được đặt mặc định là 'Present' (Có mặt). Bạn có muốn tiếp tục?`
      );
      if (!confirmed) return;
    }

    const payloadRecords = roster.map(r => ({
      studentId: r.studentId,
      status: r.status || 'Present',
      note: (r.note || '').trim()
    }));

    setSaving(true);
    try {
      const res = await axios.put(`${baseUrl}/api/sessions/${selectedSessionId}/attendance`, {
        records: payloadRecords
      });

      if (res.data?.success) {
        showToast('Lưu kết quả điểm danh thành công!', 'success');
        setIsDirty(false);
        // Reload roster to reconcile with backend
        await fetchRoster(selectedSessionId);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Lỗi khi lưu điểm danh';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  // Metrics
  const totalCount = roster.length;
  const presentCount = roster.filter(r => r.status === 'Present').length;
  const lateCount = roster.filter(r => r.status === 'Late').length;
  const absentCount = roster.filter(r => r.status === 'Absent').length;
  const excusedCount = roster.filter(r => r.status === 'Excused').length;
  const unmarkedCount = roster.filter(r => !r.status).length;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <PageHeader
        title="Điểm danh buổi học"
        subtitle="Quản lý và ghi nhận chuyên cần cho học viên theo từng buổi học thực tế"
        action={
          isDirty && !isReadOnly ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md, 6px)',
              background: '#FEF3C7',
              border: '1px solid #FCD34D',
              color: '#B45309',
              fontSize: '0.875rem',
              fontWeight: 600
            }}>
              <AlertTriangle size={16} />
              Có thay đổi chưa lưu
            </div>
          ) : null
        }
      />

      {/* Role Notice Banner */}
      {isReadOnly && (
        <div style={{
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md, 6px)',
          background: 'var(--color-primary-50, #EFF6FF)',
          border: '1px solid #BFDBFE',
          color: '#1E40AF',
          fontSize: '0.875rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertCircle size={20} style={{ color: 'var(--color-primary-600, #2563EB)', flexShrink: 0 }} />
          <span><strong>Chế độ Xem (Chỉ Đọc):</strong> Bạn đang đăng nhập bằng quyền Lễ tân, chỉ được xem danh sách điểm danh và không có quyền cập nhật dữ liệu.</span>
        </div>
      )}

      {/* Step 1 & 2: Selectors Panel */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg, 8px)',
        border: '1px solid var(--color-border-subtle, #E2E8F0)',
        boxShadow: 'var(--shadow-card)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {/* Step 1: Select Class */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
              <span style={{
                background: 'var(--color-primary-600, #2563EB)',
                color: '#fff',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: '700'
              }}>1</span>
              Chọn Lớp Học
            </label>
            <select
              className="form-input"
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              disabled={loadingClasses}
            >
              {loadingClasses ? (
                <option value="">Đang tải danh sách lớp...</option>
              ) : classes.length === 0 ? (
                <option value="">Không có lớp học nào được phân công</option>
              ) : (
                classes.map(c => (
                  <option key={c._id} value={c._id}>
                    [{c.classCode}] {c.className} ({c.skill?.toUpperCase()})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Step 2: Select Session */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
              <span style={{
                background: 'var(--color-primary-600, #2563EB)',
                color: '#fff',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: '700'
              }}>2</span>
              Chọn Buổi Học
            </label>
            <select
              className="form-input"
              value={selectedSessionId}
              onChange={e => setSelectedSessionId(e.target.value)}
              disabled={loadingSessions || sessions.length === 0}
            >
              {loadingSessions ? (
                <option value="">Đang tải buổi học...</option>
              ) : sessions.length === 0 ? (
                <option value="">Lớp này chưa có buổi học nào</option>
              ) : (
                sessions.map(s => (
                  <option key={s._id} value={s._id}>
                    Buổi {s.sessionNumber} - {formatDate(s.sessionDate)} ({s.startTime} - {s.endTime}) {s.status === 'cancelled' ? '[ĐÃ HỦY]' : s.status === 'completed' ? '[HOÀN THÀNH]' : ''}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Selected Session Information Card */}
      {sessionInfo && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 8px)',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          boxShadow: 'var(--shadow-card)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--color-border-subtle, #E2E8F0)', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                  Buổi {sessionInfo.sessionNumber}: {formatDate(sessionInfo.sessionDate)}
                </h3>
                <span className={`badge ${sessionInfo.status === 'completed' ? 'badge-active' : sessionInfo.status === 'cancelled' ? 'badge-cancelled' : 'badge-paused'}`}>
                  {sessionInfo.status === 'completed' ? 'Đã hoàn thành' : sessionInfo.status === 'cancelled' ? 'Đã hủy' : 'Đang lên lịch'}
                </span>
              </div>
              <p style={{ margin: 0, color: '#64748B', fontSize: '0.875rem' }}>
                Lớp: <strong style={{ color: '#0F172A' }}>{classInfo?.className}</strong> ({classInfo?.classCode}) &bull; Kỹ năng: <strong>{classInfo?.skill?.toUpperCase()}</strong>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.875rem', color: '#64748B' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={16} /> {sessionInfo.startTime} - {sessionInfo.endTime}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={16} /> {sessionInfo.room}
              </span>
              {sessionInfo.teacher && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <UserCheck size={16} /> GV: {sessionInfo.teacher.fullName}
                </span>
              )}
            </div>
          </div>

          {/* Counters bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
            <div style={{ padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md, 6px)', background: '#F8FAFC', border: '1px solid var(--color-border-subtle, #E2E8F0)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Tổng Học Viên</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0F172A' }}>{totalCount}</div>
            </div>
            <div style={{ padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md, 6px)', background: '#DCFCE7', border: '1px solid #86EFAC', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#15803D' }}>Có Mặt</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#15803D' }}>{presentCount}</div>
            </div>
            <div style={{ padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md, 6px)', background: '#FEF3C7', border: '1px solid #FCD34D', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#B45309' }}>Đi Muộn</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#B45309' }}>{lateCount}</div>
            </div>
            <div style={{ padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md, 6px)', background: '#FEE2E2', border: '1px solid #FCA5A5', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#B91C1C' }}>Vắng Mặt</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#B91C1C' }}>{absentCount}</div>
            </div>
            <div style={{ padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md, 6px)', background: '#EFF6FF', border: '1px solid #BFDBFE', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#1D4ED8' }}>Có Phép</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1D4ED8' }}>{excusedCount}</div>
            </div>
            {unmarkedCount > 0 && (
              <div style={{ padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md, 6px)', background: '#F1F5F9', border: '1px solid #CBD5E1', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Chưa Đánh Dấu</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#64748B' }}>{unmarkedCount}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Attendance Roster Table */}
      {selectedSessionId && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 8px)',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          boxShadow: 'var(--shadow-card)',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCheck size={20} style={{ color: 'var(--accent-primary)' }} />
              Danh Sách Học Viên ({roster.length})
            </h3>

            {!isReadOnly && !isCancelled && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleMarkAllPresent}
                  disabled={loadingRoster || roster.length === 0}
                  style={{ fontSize: '0.875rem', padding: '0.45rem 0.85rem' }}
                >
                  <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                  Chọn Tất Cả Có Mặt
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveAttendance}
                  disabled={saving || loadingRoster || roster.length === 0}
                  style={{ fontSize: '0.875rem', padding: '0.45rem 1rem' }}
                >
                  <Save size={16} />
                  {saving ? 'Đang lưu...' : 'Lưu Điểm Danh'}
                </button>
              </div>
            )}
          </div>

          {loadingRoster ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <RefreshCw className="spin" size={28} style={{ margin: '0 auto 1rem', opacity: 0.7 }} />
              <div>Đang tải bảng điểm danh của buổi học...</div>
            </div>
          ) : roster.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Không có học viên nào đang theo học (active enrollment) trong lớp này.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                    <th style={{ width: '130px' }}>Mã Học Viên</th>
                    <th style={{ minWidth: '180px' }}>Họ Và Tên</th>
                    <th style={{ minWidth: '320px' }}>Trạng Thái Điểm Danh</th>
                    <th style={{ minWidth: '220px' }}>Ghi Chú</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((item, idx) => (
                    <tr key={item.studentId}>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {idx + 1}
                      </td>
                      <td style={{ fontWeight: '600', color: 'var(--accent-primary)', fontSize: '0.85rem' }}>
                        {item.studentCode}
                      </td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{item.fullName}</div>
                        {item.phone && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SĐT: {item.phone}</div>
                        )}
                      </td>
                      <td>
                        {/* Status Pills */}
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {['Present', 'Late', 'Absent', 'Excused'].map(stKey => {
                            const cfg = STATUS_CONFIG[stKey];
                            const isSelected = item.status === stKey;
                            return (
                              <button
                                key={stKey}
                                type="button"
                                disabled={isReadOnly || isCancelled}
                                onClick={() => updateRosterItem(item.studentId, 'status', stKey)}
                                style={{
                                  padding: '0.35rem 0.65rem',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                  fontWeight: isSelected ? '700' : '500',
                                  cursor: (isReadOnly || isCancelled) ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.15s ease',
                                  border: isSelected ? `2px solid ${cfg.color}` : '1px solid var(--border-color)',
                                  background: isSelected ? cfg.bg : 'var(--bg-secondary)',
                                  color: isSelected ? cfg.color : 'var(--text-secondary)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem'
                                }}
                              >
                                {isSelected && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.color }} />}
                                {cfg.label}
                              </button>
                            );
                          })}
                          {!item.status && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center', marginLeft: '0.25rem', fontStyle: 'italic' }}>
                              (Chưa chọn)
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-input"
                          value={item.note || ''}
                          disabled={isReadOnly || isCancelled}
                          onChange={e => updateRosterItem(item.studentId, 'note', e.target.value)}
                          placeholder="Lý do muộn/vắng, thái độ..."
                          style={{
                            padding: '0.35rem 0.6rem',
                            fontSize: '0.825rem',
                            height: 'auto'
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Bottom Save Bar */}
              {!isReadOnly && !isCancelled && (
                <div style={{
                  padding: '1.25rem 0 0',
                  marginTop: '1rem',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  {isDirty && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <AlertTriangle size={15} /> Bạn có thay đổi chưa lưu
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveAttendance}
                    disabled={saving || loadingRoster || roster.length === 0}
                    style={{ padding: '0.6rem 1.5rem', fontWeight: '600' }}
                  >
                    <Save size={18} />
                    {saving ? 'Đang lưu kết quả...' : 'Lưu Điểm Danh Buổi Học'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
