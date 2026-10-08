import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Award, Calendar, BookOpen, CheckCircle2, AlertCircle,
  RefreshCw, TrendingUp, HelpCircle
} from 'lucide-react';

const TEST_TYPE_LABELS = {
  placement: 'Đầu Vào (Placement)',
  midterm:   'Giữa Kỳ (Midterm)',
  final:     'Cuối Kỳ (Final)',
  mock:      'Thi Thử (Mock Test)'
};

const StudentResultsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${baseUrl}/api/student/me/results`);
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching student results:', err);
        setError(err.response?.data?.message || 'Không thể tải bảng điểm của bạn');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [baseUrl]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <RefreshCw className="spin" size={32} style={{ margin: '0 auto 1rem', opacity: 0.7 }} />
        <div>Đang tải bảng điểm của bạn...</div>
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

  const results = data?.results || [];
  const latestResult = results.length > 0 ? results[0] : null;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Award size={28} style={{ color: 'var(--accent-primary)' }} />
          Kết Quả Học Tập & Bảng Điểm
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Xem chi tiết điểm số 4 kỹ năng qua các đợt kiểm tra định kỳ tại trung tâm VLearn English Center.
        </p>
      </div>

      {/* Latest Evaluation Summary Card */}
      {latestResult && (
        <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.02) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span className="badge badge-active" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                  Đợt Kiểm Tra Gần Nhất
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Ngày: {formatDate(latestResult.testDate)}
                </span>
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: '700', margin: '0.4rem 0 0.2rem' }}>
                {TEST_TYPE_LABELS[latestResult.testType] || latestResult.testType} - Lớp {latestResult.class?.className} ({latestResult.class?.classCode})
              </h3>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Điểm Tổng Kết</div>
              <div style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--accent-primary)', lineHeight: 1.1 }}>
                {latestResult.overallScore}
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '400' }}> / 100</span>
              </div>
            </div>
          </div>

          {/* 4 Skill Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Nghe (Listening)</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '700', marginTop: '0.2rem' }}>
                {latestResult.listeningScore != null ? latestResult.listeningScore : '—'}
              </div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Nói (Speaking)</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '700', marginTop: '0.2rem' }}>
                {latestResult.speakingScore != null ? latestResult.speakingScore : '—'}
              </div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Đọc (Reading)</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '700', marginTop: '0.2rem' }}>
                {latestResult.readingScore != null ? latestResult.readingScore : '—'}
              </div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Viết (Writing)</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '700', marginTop: '0.2rem' }}>
                {latestResult.writingScore != null ? latestResult.writingScore : '—'}
              </div>
            </div>
          </div>

          {latestResult.teacherComment && (
            <div style={{
              background: 'var(--bg-secondary)',
              padding: '0.85rem 1.25rem',
              borderRadius: '8px',
              borderLeft: '4px solid var(--accent-primary)',
              fontSize: '0.875rem'
            }}>
              <strong>Nhận xét từ giáo viên:</strong> {latestResult.teacherComment}
            </div>
          )}
        </div>
      )}

      {/* History Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={20} style={{ color: 'var(--accent-primary)' }} />
          Lịch Sử Các Đợt Kiểm Tra ({results.length} đợt)
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '110px' }}>Ngày Thi</th>
                <th style={{ minWidth: '180px' }}>Lớp Học</th>
                <th style={{ minWidth: '160px' }}>Loại Đợt Thi</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Nghe</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Nói</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Đọc</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Viết</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Tổng Kết</th>
                <th style={{ minWidth: '220px' }}>Nhận Xét</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r._id}>
                  <td style={{ fontWeight: '600' }}>
                    {formatDate(r.testDate)}
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{r.class?.className || '—'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>{r.class?.classCode}</div>
                  </td>
                  <td>
                    <span className="badge badge-waiting">
                      {TEST_TYPE_LABELS[r.testType] || r.testType}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: '500' }}>
                    {r.listeningScore != null ? r.listeningScore : '—'}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: '500' }}>
                    {r.speakingScore != null ? r.speakingScore : '—'}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: '500' }}>
                    {r.readingScore != null ? r.readingScore : '—'}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: '500' }}>
                    {r.writingScore != null ? r.writingScore : '—'}
                  </td>
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
              {results.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Bạn chưa có kết quả bài kiểm tra nào được ghi nhận.
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

export default StudentResultsPage;
