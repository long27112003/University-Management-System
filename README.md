# 📘 VLearn English Center - Hệ Thống Quản Lý Trung Tâm Anh Ngữ

Hệ thống quản lý trung tâm Anh ngữ toàn diện (VLearn English Center Student Management System) xây dựng trên nền tảng MERN Stack hiện đại, đáp ứng đầy đủ nghiệp vụ quản lý đào tạo, giáo viên, học viên, lịch học, điểm danh, kết quả học tập và tài chính học phí.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, React Router 7, Lucide Icons, Recharts, Vanilla CSS Design System
- **Backend**: Node.js, Express 5, Mongoose 9, JWT (JSON Web Tokens), Multer, Bcrypt
- **Database**: MongoDB (Atlas / Local Replica Set)

---

## 👥 Roles & Permissions

Hệ thống phân quyền nghiêm ngặt theo 4 vai trò chính:

| Vai trò | Phân hệ truy cập chính |
| :--- | :--- |
| **Admin (Quản trị viên)** | Toàn quyền quản trị hệ thống, quản lý tài khoản nhân viên, giáo viên, học viên, cấu hình lớp học, lịch học, phê duyệt tài chính, hủy phiếu thu, phân quyền và thống kê toàn diện. |
| **Receptionist (Lễ tân / Tuyển sinh)** | Tiếp nhận học viên mới, ghi danh vào lớp, lập hóa đơn học phí, ghi nhận thanh toán/thu tiền học phí, theo dõi công nợ, quản lý lịch học và thông báo trung tâm. |
| **Teacher (Giáo viên)** | Xem danh sách lớp phụ trách, theo dõi thời khóa biểu dạy học, thực hiện điểm danh học viên từng buổi học, nhập bảng điểm đánh giá 4 kỹ năng, tải lên tài liệu học tập. |
| **Student (Học viên)** | Theo dõi thông tin lớp học đã ghi danh, lịch học cá nhân, lịch sử điểm danh, bảng điểm kết quả học tập, hóa đơn học phí, trạng thái đóng tiền và tải tài liệu học tập. |

---

## ✨ Core Features

1. **Quản lý học viên (Students)**: Hồ sơ chi tiết, mã học viên tự động, ngày sinh, liên hệ phụ huynh, trạng thái học tập.
2. **Quản lý giáo viên (Teachers)**: Hồ sơ giảng dạy, chuyên môn, chứng chỉ quốc tế (IELTS/TOEFL/CELTA), lớp phụ trách.
3. **Quản lý lớp học (Classes)**: Phân loại theo kỹ năng (IELTS, TOEIC, General, Communication, v.v.), sức chứa, sĩ số thực tế, học phí.
4. **Ghi danh & Chuyển lớp (Enrollment)**: Ghi danh học viên, tự động khởi tạo hóa đơn học phí, chuyển đổi lớp học an toàn.
5. **Thời khóa biểu & Buổi học (Schedule & ClassSessions)**: Xếp lịch theo phòng/thứ/giờ, tự động phát hiện xung đột phòng học, sinh danh sách buổi học có thứ tự.
6. **Điểm danh (Attendance)**: Điểm danh từng học viên theo từng buổi học (Có mặt, Đi trễ, Nghĩ phép, Vắng mặt), thống kê tỷ lệ chuyên cần.
7. **Kết quả học tập (Learning Results)**: Đánh giá chi tiết 4 kỹ năng (Nghe, Nói, Đọc, Viết) và điểm tổng kết theo bài kiểm tra (Quiz, Midterm, Final, Mock test).
8. **Học phí (Tuition)**: Hóa đơn học phí tự động liên kết ghi danh, quản lý hạn đóng, tình trạng thanh toán (Chưa đóng, Đóng một phần, Đã hoàn tất).
9. **Phiếu thu & Thanh toán (Payments)**: Ghi nhận nhiều lần đóng, phương thức (Tiền mặt, Chuyển khoản, Thẻ), hỗ trợ chức năng hủy phiếu thu (Void) có ghi log lý do dành cho Admin.
10. **Bảng điều khiển (Dashboards)**: Dashboard trực quan, tối ưu hóa theo đặc thù công việc của từng vai trò với biểu đồ phân tích.
11. **Bảng thông báo (Notices)**: Thông báo phân luồng đối tượng (Toàn trung tâm, Giáo viên, Học viên).
12. **Tài liệu học tập (Study Materials)**: Lưu trữ tài liệu theo từng lớp học, kiểm soát quyền tải về theo phân quyền lớp học.

---

## ⚙️ Installation & Setup

### 1. Cài đặt Backend

```bash
cd backend
npm install
```

Tạo tệp `.env` trong thư mục `backend/`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/university-management
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

Khởi chạy backend:

```bash
npm run dev
# hoặc
npm start
```

### 2. Cài đặt Frontend

```bash
cd frontend
npm install
```

Tạo tệp `.env` trong thư mục `frontend/`:

```env
VITE_API_URL=http://localhost:5000
```

Khởi chạy frontend:

```bash
npm run dev
```

Truy cập ứng dụng tại địa chỉ: `http://localhost:5173` (hoặc cổng hiển thị trên terminal).

---

## 🧪 Demo Seed Data

Khởi tạo dữ liệu mẫu VLearn chuẩn hóa (Bao gồm đầy đủ tài khoản, lớp học, buổi học, điểm danh, hóa đơn và phiếu thu đồng bộ 100%):

```bash
cd backend
npm run seed:vlearn
```

### Tài khoản trải nghiệm mặc định (Local Demo Only):

| Vai trò | Email đăng nhập | Mật khẩu mặc định |
| :--- | :--- | :--- |
| **Admin** | `admin@vlearn.edu.vn` | `VLearnAdmin123!` |
| **Receptionist** | `letan@vlearn.edu.vn` | `VLearnReception123!` |
| **Teacher** | `teacher@vlearn.edu.vn` | `VLearnTeacher123!` |
| **Student** | `student@vlearn.edu.vn` | `VLearnStudent123!` |

*(Lưu ý: Thông tin đăng nhập trên chỉ dành riêng cho môi trường chạy thử nghiệm local).*

---

## 📋 Kiểm thử tự động (Automated Verification)

Hệ thống được trang bị bộ kiểm thử tích hợp End-to-End (E2E) bảo đảm toàn vẹn chức năng và tính bảo mật:

```bash
cd backend
node scripts/run_phase13_e2e.js
```
