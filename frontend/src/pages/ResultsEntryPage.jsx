import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import {
  Award, BookOpen, Calendar, CheckCircle2, AlertCircle,
  Save, RefreshCw, Filter, Search, UserCheck, AlertTriangle
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/common';

const TEST_TYPES = [
  { value: 'placement', label: 'Kiểm Tra Đầu Vào (Placement)' },
  { value: 'midterm',   label: 'Kiểm Tra Giữa Kỳ (Midterm)' },
  { value: 'final',     label: 'Kiểm Tra Cuối Kỳ (Final)' },
  { value: 'mock',      label: 'Thi Thử (Mock Test)' }
];

const ResultsEntryPage = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [testType, setTestType] = useState('midterm');
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);

  // Students and Scores
  const [records, setRecords] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const isReadOnly = user?.role === 'Receptionist';

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

  // 2. Fetch enrolled students and existing test scores for class + testType + testDate
  const loadClassStudentsAndResults = useCallback(async () => {
    if (!selectedClassId) {
      setRecords([]);
      return;
    }

    setLoadingData(true);
    try {
      // Fetch active enrollments
      const enrollRes = await axios.get(`${baseUrl}/api/classes/${selectedClassId}/enrollments?status=active`);
      const enrollments = enrollRes.data?.data || [];

      // Fetch existing results for this class and testType
      const resultRes = await axios.get(
        `${baseUrl}/api/classes/${selectedClassId}/results?testType=${testType}&testDate=${testDate}`
      );
      const existingResults = resultRes.data?.data?.results || [];
      const resultMap = new Map();
      for (const r of existingResults) {
        if (r.student?._id) {
          resultMap.set(r.student._id.toString(), r);
        }
      }

      // Merge enrollments with existing results
      const merged = enrollments
        .filter(enr => enr.student != null)
        .map(enr => {
          const st = enr.student;
          const exist = resultMap.get(st._id.toString());
          return {
            studentId: st._id,
            studentCode: st.studentCode,
            fullName: st.fullName,
            gender: st.gender,
            phone: st.phone,
            resultId: exist ? exist._id : null,
            listeningScore: exist?.listeningScore != null ? exist.listeningScore : '',
            speakingScore:  exist?.speakingScore != null ? exist.speakingScore : '',
            readingScore:   exist?.readingScore != null ? exist.readingScore : '',
            writingScore:   exist?.writingScore != null ? exist.writingScore : '',
            teacherComment: exist?.teacherComment || ''
          };
        })
        .sort((a, b) => a.fullName.localeCompare(b.fullName, 'vi'));

      setRecords(merged);
      setIsDirty(false);
    } catch (err) {
      showToast('Không thể tải danh sách học viên hoặc bảng điểm', 'error');
    } finally {
      setLoadingData(false);
    }
  }, [selectedClassId, testType, testDate, baseUrl, showToast]);

  useEffect(() => {
    if (selectedClassId) {
      loadClassStudentsAndResults();
    }
  }, [selectedClassId, testType, testDate, loadClassStudentsAndResults]);

  // Handle score change
  const handleScoreChange = (studentId, field, val) => {
    if (isReadOnly) return;
    setRecords(prev =>
      prev.map(r => {
        if (r.studentId === studentId) {
          return { ...r, [field]: val };
        }
        return r;
      })
    );
    setIsDirty(true);
  };

  // Calculate overall preview
  const calcOverall = (l, s, r, w) => {
    const scores = [l, s, r, w].filter(val => val !== '' && val !== null && val !== undefined && !isNaN(Number(val)));
    if (scores.length === 0) return '—';
    const sum = scores.reduce((acc, curr) => acc + Number(curr), 0);
    return (sum / scores.length).toFixed(1);
  };

  const isInvalidScore = (val) => {
    if (val === '' || val === null || val === undefined) return false;
    const num = Number(val);
    return isNaN(num) || num < 0 || num > 100;
  };

  // Save / Submit
  const handleSaveAll = async () => {
    if (isReadOnly) return;
    if (!selectedClassId) return;

    // Validate all entered scores
    for (const r of records) {
      if (isInvalidScore(r.listeningScore) || isInvalidScore(r.speakingScore) ||
          isInvalidScore(r.readingScore)   || isInvalidScore(r.writingScore)) {
        showToast(`Điểm số của học viên ${r.fullName} không hợp lệ (Phải từ 0 đến 100)`, 'error');
        return;
      }
    }

    setSaving(true);
    try {
      // Split into updates (existing resultId) vs creates (no resultId)
      const toUpdate = records.filter(r => r.resultId);
      const toCreate = records.filter(r => !r.resultId);

      // 1. Perform PUT updates for existing records
      for (const item of toUpdate) {
        await axios.put(`${baseUrl}/api/results/${item.resultId}`, {
          listeningScore: item.listeningScore === '' ? null : Number(item.listeningScore),
          speakingScore:  item.speakingScore === '' ? null : Number(item.speakingScore),
          readingScore:   item.readingScore === '' ? null : Number(item.readingScore),
          writingScore:   item.writingScore === '' ? null : Number(item.writingScore),
          teacherComment: item.teacherComment.trim()
        });
      }

      // 2. Perform POST bulk create for newly entered records
      if (toCreate.length > 0) {
        const payloadRecords = toCreate.map(r => ({
          studentId: r.studentId,
          listeningScore: r.listeningScore === '' ? null : Number(r.listeningScore),
          speakingScore:  r.speakingScore === '' ? null : Number(r.speakingScore),
          readingScore:   r.readingScore === '' ? null : Number(r.readingScore),
          writingScore:   r.writingScore === '' ? null : Number(r.writingScore),
          teacherComment: r.teacherComment.trim()
        }));

        await axios.post(`${baseUrl}/api/classes/${selectedClassId}/results`, {
          testType,
          testDate,
          records: payloadRecords
        });
      }

      showToast('Lưu bảng điểm thành công!', 'success');
      setIsDirty(false);
      await loadClassStudentsAndResults();
    } catch (err) {
      const msg = err.response?.data?.message || 'Lỗi khi lưu bảng điểm';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const selectedClassDoc = classes.find(c => c._id === selectedClassId);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <PageHeader
        title="Kết quả học tập"
        subtitle="Ghi nhận điểm số 4 kỹ năng IELTS (0 - 100) và nhận xét theo từng đợt kiểm tra của lớp học"
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
          <span><strong>Chế độ Xem (Chỉ Đọc):</strong> Lễ tân chỉ được xem bảng điểm, không có quyền chỉnh sửa hoặc nhập điểm.</span>
        </div>
      )}

      {/* Workflow Selectors Panel */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg, 8px)',
        border: '1px solid var(--color-border-subtle, #E2E8F0)',
        boxShadow: 'var(--shadow-card)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {/* Step 1: Select Class */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
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
                <option value="">Đang tải lớp...</option>
              ) : classes.length === 0 ? (
                <option value="">Không có lớp học nào</option>
              ) : (
                classes.map(c => (
                  <option key={c._id} value={c._id}>
                    [{c.classCode}] {c.className} ({c.skill?.toUpperCase()})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Step 2: Select Test Type */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
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
              Loại Bài Kiểm Tra
            </label>
            <select
              className="form-input"
              value={testType}
              onChange={e => setTestType(e.target.value)}
            >
              {TEST_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Step 3: Select Test Date */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
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
              }}>3</span>
              Ngày Kiểm Tra
            </label>
            <input
              type="date"
              className="form-input"
              value={testDate}
              onChange={e => setTestDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Results Entry & Table */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg, 8px)',
        border: '1px solid var(--color-border-subtle, #E2E8F0)',
        boxShadow: 'var(--shadow-card)',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
              Bảng Điểm Lớp {selectedClassDoc ? `[${selectedClassDoc.classCode}] ${selectedClassDoc.className}` : ''}
            </h3>
            <p style={{ margin: '0.2rem 0 0', color: '#64748B', fontSize: '0.85rem' }}>
              Thang điểm chuẩn: <strong>0 – 100</strong>. Điểm tổng kết tự động tính theo trung bình các kỹ năng có điểm.
            </p>
          </div>

          {!isReadOnly && records.length > 0 && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveAll}
              disabled={saving || loadingData}
              style={{ padding: '0.5rem 1.25rem', fontWeight: '600' }}
            >
              <Save size={16} />
              {saving ? 'Đang lưu...' : 'Lưu Toàn Bộ Bảng Điểm'}
            </button>
          )}
        </div>

        {loadingData ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw className="spin" size={28} style={{ margin: '0 auto 1rem', opacity: 0.7 }} />
            <div>Đang tải dữ liệu học viên và điểm số...</div>
          </div>
        ) : records.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Không có học viên nào đang theo học trong lớp này.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '45px', textAlign: 'center' }}>#</th>
                  <th style={{ width: '120px' }}>Mã Học Viên</th>
                  <th style={{ minWidth: '160px' }}>Họ Và Tên</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Nghe (L)</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Nói (S)</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Đọc (R)</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Viết (W)</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Tổng Kết</th>
                  <th style={{ minWidth: '220px' }}>Nhận Xét Của Giáo Viên</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => {
                  const overall = calcOverall(r.listeningScore, r.speakingScore, r.readingScore, r.writingScore);
                  return (
                    <tr key={r.studentId}>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {idx + 1}
                      </td>
                      <td style={{ fontWeight: '600', color: 'var(--accent-primary)', fontSize: '0.85rem' }}>
                        {r.studentCode}
                      </td>
                      <td style={{ fontWeight: '600' }}>
                        {r.fullName}
                      </td>
                      {/* Listening Score */}
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          disabled={isReadOnly}
                          value={r.listeningScore}
                          onChange={e => handleScoreChange(r.studentId, 'listeningScore', e.target.value)}
                          placeholder="—"
                          className="form-input"
                          style={{
                            textAlign: 'center',
                            padding: '0.35rem 0.25rem',
                            fontSize: '0.875rem',
                            width: '75px',
                            margin: '0 auto',
                            borderColor: isInvalidScore(r.listeningScore) ? 'var(--danger)' : undefined
                          }}
                        />
                      </td>
                      {/* Speaking Score */}
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          disabled={isReadOnly}
                          value={r.speakingScore}
                          onChange={e => handleScoreChange(r.studentId, 'speakingScore', e.target.value)}
                          placeholder="—"
                          className="form-input"
                          style={{
                            textAlign: 'center',
                            padding: '0.35rem 0.25rem',
                            fontSize: '0.875rem',
                            width: '75px',
                            margin: '0 auto',
                            borderColor: isInvalidScore(r.speakingScore) ? 'var(--danger)' : undefined
                          }}
                        />
                      </td>
                      {/* Reading Score */}
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          disabled={isReadOnly}
                          value={r.readingScore}
                          onChange={e => handleScoreChange(r.studentId, 'readingScore', e.target.value)}
                          placeholder="—"
                          className="form-input"
                          style={{
                            textAlign: 'center',
                            padding: '0.35rem 0.25rem',
                            fontSize: '0.875rem',
                            width: '75px',
                            margin: '0 auto',
                            borderColor: isInvalidScore(r.readingScore) ? 'var(--danger)' : undefined
                          }}
                        />
                      </td>
                      {/* Writing Score */}
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          disabled={isReadOnly}
                          value={r.writingScore}
                          onChange={e => handleScoreChange(r.studentId, 'writingScore', e.target.value)}
                          placeholder="—"
                          className="form-input"
                          style={{
                            textAlign: 'center',
                            padding: '0.35rem 0.25rem',
                            fontSize: '0.875rem',
                            width: '75px',
                            margin: '0 auto',
                            borderColor: isInvalidScore(r.writingScore) ? 'var(--danger)' : undefined
                          }}
                        />
                      </td>
                      {/* Overall Preview */}
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          fontWeight: '700',
                          fontSize: '0.95rem',
                          color: overall !== '—' && Number(overall) >= 50 ? 'var(--success)' : 'var(--accent-primary)',
                          background: 'var(--bg-secondary)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          display: 'inline-block',
                          minWidth: '45px'
                        }}>
                          {overall}
                        </span>
                      </td>
                      {/* Teacher Comment */}
                      <td>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={r.teacherComment}
                          onChange={e => handleScoreChange(r.studentId, 'teacherComment', e.target.value)}
                          placeholder="Nhận xét tiến bộ, điểm cần cải thiện..."
                          className="form-input"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.825rem', height: 'auto' }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Bottom Save Bar */}
            {!isReadOnly && records.length > 0 && (
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
                    <AlertTriangle size={15} /> Bạn có thay đổi điểm số chưa lưu
                  </span>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveAll}
                  disabled={saving || loadingData}
                  style={{ padding: '0.6rem 1.75rem', fontWeight: '600' }}
                >
                  <Save size={18} />
                  {saving ? 'Đang lưu bảng điểm...' : 'Lưu Toàn Bộ Bảng Điểm'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsEntryPage;
