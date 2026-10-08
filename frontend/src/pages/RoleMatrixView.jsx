import React from 'react';

const RoleMatrixView = () => {
  const permissions = [
    {
      module: 'Tài khoản & Phân quyền',
      admin: 'Toàn quyền (CRUD, Khóa, Đổi role)',
      receptionist: 'Không có quyền truy cập',
      teacher: 'Không có quyền truy cập',
      student: 'Không có quyền truy cập'
    },
    {
      module: 'Hồ sơ Học viên',
      admin: 'Toàn quyền',
      receptionist: 'Tạo mới, Cập nhật thông tin, Tra cứu',
      teacher: 'Chỉ xem học viên trong lớp mình dạy',
      student: 'Chỉ xem và cập nhật hồ sơ cá nhân'
    },
    {
      module: 'Hồ sơ Giáo viên',
      admin: 'Toàn quyền (Tuyển dụng, Gán môn, Khóa)',
      receptionist: 'Xem danh bạ & chuyên môn (Read-only)',
      teacher: 'Chỉ xem hồ sơ cá nhân',
      student: 'Không có quyền truy cập'
    },
    {
      module: 'Lớp học & Xếp lớp (Enrollment)',
      admin: 'Toàn quyền (Mở lớp, Gán GV, Hủy)',
      receptionist: 'Ghi danh, Chuyển lớp, Rút tên học viên',
      teacher: 'Xem thông tin lớp mình được phân công',
      student: 'Xem thông tin lớp mình đang theo học'
    },
    {
      module: 'Thời khóa biểu & Buổi học',
      admin: 'Toàn quyền & Bấm sinh buổi học tự động',
      receptionist: 'Xem lịch toàn trung tâm (Read-only)',
      teacher: 'Xem lịch dạy trong tuần của mình',
      student: 'Xem thời khóa biểu cá nhân'
    },
    {
      module: 'Điểm danh (Attendance)',
      admin: 'Toàn quyền & Báo cáo chuyên cần',
      receptionist: 'Tra cứu chuyên cần (Read-only)',
      teacher: 'Điểm danh buổi học lớp mình phụ trách',
      student: 'Xem lịch sử chuyên cần của bản thân'
    },
    {
      module: 'Kết quả học tập 4 Kỹ năng',
      admin: 'Toàn quyền & Thống kê học vụ',
      receptionist: 'Tra cứu bảng điểm (Read-only)',
      teacher: 'Nhập & sửa điểm lớp mình phụ trách',
      student: 'Xem bảng điểm cá nhân'
    },
    {
      module: 'Học phí & Thanh toán (Tuition)',
      admin: 'Toàn quyền & Duyệt Hủy phiếu thu (Void)',
      receptionist: 'Lập phiếu thu, Thu tiền các đợt',
      teacher: 'Không có quyền truy cập (Bảo mật tài chính)',
      student: 'Xem tình trạng học phí cá nhân'
    },
    {
      module: 'Bảng điều khiển (Dashboards)',
      admin: 'Dashboard Quản trị Tổng quan & Tài chính',
      receptionist: 'Dashboard Tuyển sinh & Công nợ',
      teacher: 'Dashboard Giảng dạy & Chuyên cần',
      student: 'Dashboard Học tập cá nhân'
    },
    {
      module: 'Thông báo & Tài liệu',
      admin: 'Toàn quyền quản lý',
      receptionist: 'Đăng thông báo chung & học vụ',
      teacher: 'Tải bài giảng lên lớp phụ trách',
      student: 'Xem thông báo & Tải bài giảng'
    }
  ];

  const getBadgeStyle = (text) => {
    if (text.includes('Toàn quyền')) {
      return { background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' };
    }
    if (text.includes('Không có quyền')) {
      return { background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0' };
    }
    if (text.includes('Read-only') || text.includes('Chỉ xem')) {
      return { background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' };
    }
    return { background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' };
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Ma Trận Phân Quyền Hệ Thống (RBAC Matrix)
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
            Chế độ tra cứu chỉ đọc (Read-Only) theo tiêu chuẩn bảo mật Zero-Trust của VLearn English Center.
          </p>
        </div>
        <div style={{ padding: '0.5rem 1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.813rem', color: '#475569' }}>
          🔒 <strong>Quy định MVP:</strong> 4 Role cố định, không tạo/xóa role tùy biến
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '1rem', fontWeight: 600, color: '#334155', width: '22%' }}>Phân hệ Nghiệp vụ</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: '#1D4ED8', width: '22%' }}>Admin (Quản trị)</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: '#047857', width: '20%' }}>Receptionist (Lễ tân)</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: '#7C3AED', width: '18%' }}>Teacher (Giáo viên)</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: '#D97706', width: '18%' }}>Student (Học viên)</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((p, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#1E293B' }}>{p.module}</td>
                <td style={{ padding: '0.875rem 1rem' }}>
                  <span style={{ display: 'inline-block', padding: '0.25rem 0.625rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500, ...getBadgeStyle(p.admin) }}>
                    {p.admin}
                  </span>
                </td>
                <td style={{ padding: '0.875rem 1rem' }}>
                  <span style={{ display: 'inline-block', padding: '0.25rem 0.625rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500, ...getBadgeStyle(p.receptionist) }}>
                    {p.receptionist}
                  </span>
                </td>
                <td style={{ padding: '0.875rem 1rem' }}>
                  <span style={{ display: 'inline-block', padding: '0.25rem 0.625rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500, ...getBadgeStyle(p.teacher) }}>
                    {p.teacher}
                  </span>
                </td>
                <td style={{ padding: '0.875rem 1rem' }}>
                  <span style={{ display: 'inline-block', padding: '0.25rem 0.625rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500, ...getBadgeStyle(p.student) }}>
                    {p.student}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoleMatrixView;
