# 📖 TÀI LIỆU GIẢI THÍCH KIẾN TRÚC MÃ NGUỒN & LOGIC NGHIỆP VỤ HỆ THỐNG VLEARN

> Tài liệu này cung cấp cái nhìn chi tiết và toàn diện từ A - Z về cấu trúc mã nguồn dự án **VLearn English Center (University Management System)**: giải thích rõ ràng từng file code dùng để làm gì, module nào phục vụ tính năng nào, cơ sở dữ liệu liên kết ra sao và luồng logic hoạt động cốt lõi của hệ thống.

---

## 📑 MỤC LỤC
1. [Tổng Quan Kiến Trúc Hệ Thống (Architecture Overview)](#1-tổng-quan-kiến-trúc-hệ-thống)
2. [Chi Tiết Backend: Cấu Trúc, Trách Nhiệm & Logic Code](#2-chi-tiết-backend)
   - [2.1 File Khởi Động Trung Tâm: server.js](#21-file-khởi-động-trung-tâm-serverjs)
   - [2.2 Lớp Middleware: Xác Thực, Phân Quyền & Upload File](#22-lớp-middleware)
   - [2.3 Lớp Cơ Sở Dữ Liệu (13 Models Mongoose)](#23-lớp-cơ-sở-dữ-liệu-13-models-mongoose)
   - [2.4 Lớp Dịch Vụ Nghiệp Vụ Cốt Lõi (Services)](#24-lớp-dịch-vụ-nghiệp-vụ-cốt-lõi-services)
   - [2.5 Lớp Điều Khiển API (Controllers & Routes)](#25-lớp-điều-khiển-api-controllers--routes)
3. [Chi Tiết Frontend: Giao Diện, Trạng Thái & Điều Hướng](#3-chi-tiết-frontend)
   - [3.1 Điều Phối Ứng Dụng & Phân Luồng: App.jsx](#31-điều-phối-ứng-dụng--phân-luồng-appjsx)
   - [3.2 Quản Lý Phiên Đăng Nhập Toàn Cục: AuthContext.jsx](#32-quản-lý-phiên-đăng-nhập-toàn-cục-authcontextjsx)
   - [3.3 Hệ Thống Khung Bố Cục (Layouts) Theo Vai Trò](#33-hệ-thống-khung-bố-cục-layouts-theo-vai-trò)
   - [3.4 Danh Sách Các Trang Giao Diện (Pages) & Nhiệm Vụ](#34-danh-sách-các-trang-giao-diện-pages--nhiệm-vụ)
   - [3.5 Các Components Tái Sử Dụng & Hộp Thoại Nghiệp Vụ](#35-các-components-tái-sử-dụng--hộp-thoại-nghiệp-vụ)
4. [Bản Đồ Ánh Xạ Tính Năng (Feature-to-Module Mapping)](#4-bản-đồ-ánh-xạ-tính-năng)
5. [Giải Thích Các Luồng Logic Nghiệp Vụ Phức Tạp Nhất](#5-giải-thích-các-luồng-logic-nghiệp-vụ-phức-tạp-nhất)
   - [Logic 1: Ghi Danh Tự Động Sinh Hóa Đơn & Cập Nhật Sĩ Số](#logic-1-ghi-danh-tự-động-sinh-hóa-đơn--cập-nhật-sĩ-số)
   - [Logic 2: Thu Tiền Nhiều Lần & Hủy Phiếu Thu (Void Payment) An Toàn](#logic-2-thu-tiền-nhiều-lần--hủy-phiếu-thu-void-payment-an-toàn)
   - [Logic 3: Sinh Lịch Học & Điểm Danh Hợp Nhất (Hybrid Roster)](#logic-3-sinh-lịch-học--điểm-danh-hợp-nhất-hybrid-roster)
   - [Logic 4: Bảo Vệ Đa Tầng (Multi-layered Security & RBAC Guard)](#logic-4-bảo-vệ-đa-tầng-multi-layered-security--rbac-guard)

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG

Dự án áp dụng mô hình kiến trúc **Client - Server hiện đại (MERN Stack)**:

```text
[ Trình Duyệt Client (React 19 + Vite) ]
        │
        │ HTTP RESTful Requests (Kèm JWT Bearer Token)
        ▼
[ Backend API (Node.js + Express.js 5) ]
   ├── Middleware Layer  : Kiểm tra tính hợp lệ của Token, phân quyền vai trò (RBAC)
   ├── Route Layer       : Định tuyến URL tới đúng Controller
   ├── Controller Layer  : Tiếp nhận Request, kiểm tra tham số, trả về mã HTTP & JSON
   ├── Service Layer     : Thực thi toàn bộ tính toán nghiệp vụ phức tạp & Transaction
   └── Model Layer       : Mongoose Schemas tương tác với Database
        │
        ▼
[ Cơ Sở Dữ Liệu NoSQL (MongoDB Community Server / MongoDB Atlas) ]
```

### Nguyên tắc phân quyền 4 vai trò (RBAC - Role-Based Access Control):
1. **Admin (Quản trị viên)**: Quyền cao nhất, quản lý tài khoản người dùng, toàn bộ lớp học, cấu hình hệ thống, theo dõi doanh thu tổng, và đặc biệt là độc quyền thực hiện tính năng **Hủy phiếu thu (Void Payment)**.
2. **Receptionist (Lễ tân / Tuyển sinh)**: Quản lý học viên, ghi danh vào lớp, tạo hóa đơn học phí, thực hiện thu tiền học phí (Tiền mặt/Chuyển khoản/Thẻ), quản lý bảng tin thông báo.
3. **Teacher (Giáo viên)**: Chỉ truy cập vào các lớp mình phụ trách giảng dạy; thực hiện điểm danh học viên từng buổi học, nhập bảng điểm 4 kỹ năng (Nghe, Nói, Đọc, Viết) và upload tài liệu bài giảng.
4. **Student (Học viên)**: Chỉ truy cập vào thông tin cá nhân; xem lịch học của bản thân, lịch sử điểm danh, bảng điểm kết quả các bài thi, tình trạng nợ học phí/hóa đơn và tải bài giảng của giáo viên.

---

## 2. CHI TIẾT BACKEND

Toàn bộ mã nguồn phía máy chủ nằm trong thư mục `backend/`.

### 2.1 File Khởi Động Trung Tâm: `server.js`
- **Vị trí**: `backend/server.js`
- **Nhiệm vụ**:
  1. Nạp các biến môi trường từ `.env` qua thư viện `dotenv`.
  2. Cấu hình middleware toàn cục: `cors()` (cho phép Frontend gọi API qua các domain khác nhau), `express.json()` và `express.urlencoded()` (đọc dữ liệu gửi lên dạng JSON).
  3. Cung cấp thư mục chứa file tĩnh: `app.use('/uploads', express.static(path.join(__dirname, 'uploads')))` giúp Client xem/tải trực tiếp ảnh đại diện và tài liệu học tập.
  4. Đăng ký toàn bộ các nhóm Routes theo phân hệ nghiệp vụ (`/api/auth`, `/api/admin`, `/api/students`, `/api/classes`, `/api/schedules`, `/api/sessions`, `/api/results`, `/api/tuition/invoices`, `/api/payments`, `/api/notices`, `/api/materials`, `/api/accounts`).
  5. Thiết lập kết nối tới MongoDB thông qua `mongoose.connect(process.env.MONGO_URI)`.
  6. Lắng nghe yêu cầu kết nối tại cổng `PORT` (mặc định là `5000`).

---

### 2.2 Lớp Middleware (`backend/middleware/`)

| Tên File | Vai Trò & Logic Hoạt Động |
| :--- | :--- |
| **`authMiddleware.js`** | **Xác thực và phân quyền người dùng:**<br>• `protect`: Lấy chuỗi token từ Header `Authorization: Bearer <token>`, giải mã bằng `jwt.verify(token, JWT_SECRET)`, trích xuất `id` và tìm user trong database. Nếu hợp lệ, gán thông tin user vào `req.user`.<br>• `adminOnly`: Kiểm tra `req.user.role === 'Admin'`, chặn ngay mã `403 Forbidden` nếu không phải.<br>• `staffOnly`: Cho phép cả `Admin` và `Receptionist` truy cập các tính năng vận hành.<br>• `hasRole(...roles)`: Middleware linh hoạt kiểm tra xem role của user hiện tại có nằm trong danh sách được cấp phép hay không. |
| **`materialUploadMiddleware.js`** | **Quản lý upload tài liệu giáo trình:**<br>• Sử dụng thư viện `multer.diskStorage` lưu file vào thư mục `backend/uploads/materials`.<br>• Tạo tên file ngẫu nhiên chống trùng lặp: `Date.now() + '-' + Math.round(Math.random() * 1E9) + extension`.<br>• Kiểm tra phần mở rộng file (chỉ cho phép `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx`, `.txt`, `.zip`, `.rar`) và giới hạn dung lượng tối đa 25MB. |
| **`uploadMiddleware.js`** | **Quản lý upload hình ảnh đại diện (Avatar/Logo):**<br>• Lưu file vào `backend/uploads/avatars`, kiểm tra định dạng hình ảnh (`jpg`, `jpeg`, `png`, `webp`) với dung lượng tối đa 5MB. |

---

### 2.3 Lớp Cơ Sở Dữ Liệu (13 Models Mongoose trong `backend/models/`)

Các models đại diện cho các bảng dữ liệu trong MongoDB:

1. **`User.js` (Tài khoản người dùng)**:
   - Các trường chính: `email`, `password` (đã hash bằng Bcrypt), `role` (`Admin`, `Receptionist`, `Teacher`, `Student`), `status` (`active`, `inactive`), `avatar`, `relatedId` (liên kết với bản ghi học viên hoặc giáo viên cụ thể).
   - Logic: Phương thức `matchPassword(enteredPassword)` so sánh mật khẩu đăng nhập với hash trong database.
2. **`Student.js` (Hồ sơ học viên)**:
   - Các trường chính: `studentCode` (Mã học viên dạng `HV-2026-0001`), `fullName`, `gender`, `dateOfBirth`, `phone`, `email`, `address`, `parentName`, `parentPhone`, `academicStatus` (`active`, `reserved`, `graduated`, `dropped`).
3. **`Teacher.js` (Hồ sơ giáo viên)**:
   - Các trường chính: `teacherCode` (Mã `GV-2026-0001`), `fullName`, `gender`, `phone`, `email`, `specialization` (chuyên môn: IELTS, TOEIC, Giao tiếp), `certifications` (IELTS 8.5, CELTA...), `status` (`active`, `on_leave`, `resigned`).
4. **`Class.js` (Lớp học)**:
   - Các trường chính: `classCode` (Mã lớp ví dụ `IELTS-F01`), `className`, `skill` / `program`, `tuitionFee` (Học phí cơ bản), `maxCapacity` (Sức chứa tối đa), `currentEnrollment` (Sĩ số học viên hiện tại), `teacher` (Ref tới `Teacher`), `room` (Phòng học), `startDate`, `endDate`, `status` (`planning`, `open`, `in_progress`, `completed`, `cancelled`).
5. **`Enrollment.js` (Bản ghi ghi danh)**:
   - Các trường chính: `student` (Ref `Student`), `class` (Ref `Class`), `enrollmentDate`, `status` (`active`, `transferred`, `dropped`), `notes`.
   - Quan hệ: Một học viên có thể có nhiều bản ghi ghi danh ở các lớp khác nhau.
6. **`Schedule.js` (Lịch học định kỳ của lớp)**:
   - Các trường: `class` (Ref `Class`), `dayOfWeek` (Thứ 2 đến Chủ nhật: 0-6), `startTime` (vd: `"18:00"`), `endTime` (vd: `"19:30"`), `room`.
7. **`ClassSession.js` (Buổi học thực tế)**:
   - Các trường: `class` (Ref `Class`), `sessionNumber` (Buổi số mấy trong lộ trình), `date` (Ngày diễn ra buổi học), `startTime`, `endTime`, `room`, `teacher`, `status` (`scheduled`, `completed`, `cancelled`).
8. **`Attendance.js` (Điểm danh học viên)**:
   - Các trường: `session` (Ref `ClassSession`), `student` (Ref `Student`), `status` (`Present` - Có mặt, `Late` - Đi trễ, `Excused` - Nghỉ phép, `Absent` - Vắng không phép), `notes`.
9. **`LearningResult.js` (Kết quả học tập & Bảng điểm)**:
   - Các trường: `student` (Ref `Student`), `class` (Ref `Class`), `examType` (`Quiz`, `Midterm`, `Final`, `MockTest`), `scores` (`listening`, `speaking`, `reading`, `writing`), `overallScore` (Điểm trung bình hoặc tổng kết theo hệ thống thang điểm), `feedback` (Nhận xét của giáo viên).
10. **`TuitionInvoice.js` (Hóa đơn học phí)**:
    - Các trường: `invoiceCode` (vd: `INV-2026-0001`), `student` (Ref `Student`), `class` (Ref `Class`), `enrollment` (Ref `Enrollment`), `totalAmount` (Tổng học phí phải đóng), `paidAmount` (Đã nộp), `remainingAmount` (Còn nợ), `dueDate` (Hạn đóng tiền), `status` (`unpaid`, `partial`, `paid`, `overdue`, `cancelled`).
11. **`Payment.js` (Phiếu thu tiền học phí)**:
    - Các trường: `paymentCode` (vd: `PAY-2026-0001`), `invoice` (Ref `TuitionInvoice`), `student` (Ref `Student`), `amount` (Số tiền của đợt thanh toán này), `paymentMethod` (`Cash`, `BankTransfer`, `Card`), `paidAt`, `receivedBy` (Nhân viên thu tiền), `isVoid` (Boolean - Đánh dấu phiếu bị hủy), `voidReason` (Lý do hủy), `voidedBy` (Admin thực hiện hủy).
12. **`StudyMaterial.js` (Tài liệu học tập)**:
    - Các trường: `title`, `class` (Ref `Class`), `fileUrl`, `fileType`, `fileSize`, `uploadedBy` (Ref `User`).
13. **`Notice.js` (Thông báo trung tâm)**:
    - Các trường: `title`, `content`, `targetAudience` (`All`, `Teachers`, `Students`), `priority` (`Normal`, `Urgent`), `createdBy`.

---

### 2.4 Lớp Dịch Vụ Nghiệp Vụ Cốt Lõi (`backend/services/`)

Các dịch vụ (services) chịu trách nhiệm thực thi các logic tính toán nặng và đảm bảo tính toàn vẹn dữ liệu:

#### 1. `tuitionService.js` (Tài chính học phí & Giao dịch thanh toán)
- **`runInTransaction(workFn)`**: Tự động phát hiện xem MongoDB đang chạy ở chế độ Replica Set (hỗ trợ ACID Transactions) hay Standalone (máy dev local). Nếu có Replica Set sẽ khởi tạo `session.startTransaction()`, nếu có lỗi sẽ `abortTransaction()`. Giúp hệ thống chạy mượt trên mọi môi trường phát triển lẫn production.
- **`generateInvoiceCode(session)` & `generatePaymentCode(session)`**: Thuật toán sinh mã hóa đơn/phiếu thu dạng `INV-2026-0001` tự động tăng dần, tích hợp cơ chế chống trùng lặp (Collision retry loop tối đa 10 lần) để tránh lỗi khi có nhiều nhân viên thu tiền cùng lúc.
- **`recalculateInvoiceFinancials(invoiceId, session)`**: Hàm tài chính then chốt. Sau bất kỳ hành động thu tiền hoặc hủy phiếu thu nào, hàm này tìm toàn bộ phiếu thu có trạng thái hợp lệ (`status: 'completed'` và `isVoid: false`), tính tổng số tiền `paidAmount`, tính lại `remainingAmount = totalAmount - paidAmount` và tự động cập nhật trạng thái hóa đơn sang `paid`, `partial`, `unpaid` hoặc `overdue`.

#### 2. `attendanceService.js` (Điểm danh & Chuyên cần)
- **`getSessionAttendanceRoster(sessionId, requestingUser)`**: Khi mở màn hình điểm danh của 1 buổi học, hàm này truy vấn danh sách học viên đang ghi danh lớp đó (`status: 'active'`), kết hợp (merge) với các bản ghi điểm danh đã có trong cơ sở dữ liệu. Nếu học viên chưa từng được điểm danh, trạng thái mặc định sẽ được khởi tạo trong bộ nhớ.
- Kiểm soát phân quyền: Kiểm tra xem giáo viên gửi yêu cầu có phải là người đứng lớp của buổi học đó hay không, ngăn chặn giáo viên điểm danh lớp của người khác.

#### 3. `scheduleService.js` (Xếp lịch & Kiểm tra xung đột)
- **`checkRoomAndTeacherConflict(...)`**: Quét kiểm tra xung đột thời khóa biểu: Một phòng học hoặc một giáo viên không thể xuất hiện trong 2 lớp học có cùng thứ và khung giờ trùng nhau.
- **`generateClassSessions(...)`**: Dựa vào ngày bắt đầu, ngày kết thúc và lịch học các thứ trong tuần của lớp, hàm này tự động tạo ra một chuỗi các bản ghi `ClassSession` tương ứng theo từng tuần.

#### 4. `learningResultService.js` (Xử lý bảng điểm)
- Tính toán điểm số trung bình, kiểm tra giới hạn điểm hợp lệ (thang điểm 10 hoặc thang 9.0 IELTS), cập nhật kết quả từng kỹ năng cho học viên.

#### 5. `dashboardService.js` (Thống kê biểu đồ)
- Tổng hợp số liệu theo thời gian thực: Doanh thu thực thu theo tháng, tỷ lệ công nợ, tổng số học viên mới ghi danh, số lượng lớp học đang mở, tỷ lệ chuyên cần trung bình của trung tâm.

---

### 2.5 Lớp Điều Khiển API (`backend/controllers/` & `backend/routes/`)

| Phân Hệ / Route | Controller Tương Ứng | Chức Năng Cụ Thể |
| :--- | :--- | :--- |
| `/api/auth` | `authController.js` | Đăng nhập (`login`), đăng ký học viên mới (`register`), lấy thông tin cá nhân hiện tại (`getMe`/`profile`), cập nhật avatar. |
| `/api/accounts` | `accountController.js` | Quản trị tài khoản người dùng: Khóa/mở khóa tài khoản, cấp quyền vai trò (Admin Only). |
| `/api/students` | `studentResourceController.js` | CRUD danh sách học viên; cung cấp các sub-endpoints cho giao diện Tab chi tiết học viên: `/enrollments`, `/attendance`, `/results`, `/invoices`, `/payments`. |
| `/api/teachers` | `teacherController.js` | Quản lý danh sách giáo viên, chuyên môn, chứng chỉ quốc tế và các lớp đang phụ trách. |
| `/api/classes` | `classController.js` | Tạo lớp mới, cập nhật thông tin lớp, phân công giáo viên, kiểm tra điều kiện sĩ số. |
| `/api/enrollments` | `enrollmentController.js` | Ghi danh học viên vào lớp (kiểm tra sĩ số, tự động tạo hóa đơn học phí), xử lý chuyển lớp (`transfer`). |
| `/api/schedules` | `scheduleController.js` | Cấu hình lịch học các ngày trong tuần của lớp, gọi service phát hiện trùng lịch. |
| `/api/sessions` | `sessionController.js` | Xem danh sách buổi học, sửa thông tin buổi học, đổi phòng hoặc đổi giáo viên dạy thay. |
| `/api/tuition/invoices` | `tuitionController.js` | Tra cứu danh sách hóa đơn học phí, xem chi tiết hóa đơn, lọc theo trạng thái (chưa đóng/đã đóng/quá hạn). |
| `/api/payments` | `tuitionController.js` | Lập phiếu thu tiền học phí mới, thực hiện chức năng **Hủy phiếu thu (Void Payment)** của Admin. |
| `/api/results` | `learningResultController.js`| Lưu bảng điểm kiểm tra (Quiz, Midterm, Final) theo 4 kỹ năng Nghe-Nói-Đọc-Viết. |
| `/api/notices` | `noticeController.js` | Đăng thông báo mới, lọc thông báo theo đối tượng người xem (Toàn trung tâm, Giáo viên, Học viên). |
| `/api/materials` | `materialController.js` | Tiếp nhận file upload từ giáo viên, trả về danh sách tài liệu theo từng lớp học. |
| `/api/admin` | `adminController.js` | Cung cấp dữ liệu thống kê tổng hợp phục vụ Admin Dashboard. |

---

## 3. CHI TIẾT FRONTEND

Toàn bộ giao diện người dùng được viết bằng **React 19 & Vite** trong thư mục `frontend/`.

### 3.1 Điều Phối Ứng Dụng & Phân Luồng: `App.jsx`
- **File**: `frontend/src/App.jsx`
- **Logic**:
  1. Sử dụng `react-router-dom` v7 với cấu trúc thẻ `<Routes>` và `<Route>`.
  2. **`ProtectedRoute` component**: Kiểm tra xem người dùng đã đăng nhập chưa (`user !== null`). Nếu chưa đăng nhập, tự động chuyển hướng (`<Navigate to="/login" />`). Nếu đã đăng nhập nhưng truy cập sai vai trò cho phép (`allowedRoles`), lập tức chuyển hướng về trang chủ tương ứng.
  3. **`getDashboardHome()`**: Hàm điều hướng thông minh dựa vào vai trò người dùng:
     - `Admin` ➡️ `/admin/dashboard`
     - `Receptionist` ➡️ `/receptionist/dashboard`
     - `Teacher` ➡️ `/teacher/dashboard`
     - `Student` ➡️ `/student/dashboard`
  4. **`TitleUpdater`**: Tự động lắng nghe thay đổi của URL (`useLocation`) để đổi tiêu đề thẻ trình duyệt (ví dụ: `Dashboard - VLearn`, `Attendance - VLearn`).

---

### 3.2 Quản Lý Phiên Đăng Nhập Toàn Cục: `AuthContext.jsx`
- **File**: `frontend/src/context/AuthContext.jsx`
- **Logic**:
  1. Cung cấp dữ liệu `user` và hàm `logout`, `setUser` cho toàn bộ các component con thông qua React Context.
  2. Khi người dùng mở trang web: Kiểm tra `localStorage.getItem('token')`. Dùng `jwtDecode(token)` kiểm tra thời hạn (nếu hết hạn, tự động gọi `logout()` xóa token).
  3. Tự động gắn token vào cấu hình mặc định của Axios:
     ```javascript
     axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
     ```
  4. Thiết lập **Axios Response Interceptor**: Bất cứ khi nào một API trả về mã lỗi HTTP `401 Unauthorized` (do token hết hạn hoặc tài khoản bị khóa), hệ thống tự động xóa bộ nhớ đăng nhập và đẩy người dùng ra trang đăng nhập.
  5. Đồng bộ thông tin người dùng ngầm: Gọi API `/api/auth/profile` để cập nhật ảnh đại diện và họ tên mới nhất mà không gây giật lag giao diện.

---

### 3.3 Hệ Thống Khung Bố Cục (Layouts) Theo Vai Trò

Hệ thống có 4 Layout riêng biệt tại `frontend/src/layouts/`:

1. **`AdminLayout.jsx`**: Dành cho Quản trị viên, tích hợp 12 mục menu trong Sidebar (Bảng điều khiển, Học viên, Giáo viên, Lớp học, Lịch học, Điểm danh, Kết quả học tập, Học phí, Thông báo, Tài liệu, Tài khoản, Phân quyền).
2. **`ReceptionistLayout.jsx`**: Dành cho Lễ tân, tích hợp 8 mục menu tập trung vào nghiệp vụ học vụ, ghi danh và tài chính thu học phí.
3. **`TeacherLayout.jsx`**: Dành cho Giảng viên, tích hợp 7 mục menu (Lớp của tôi, Lịch dạy, Điểm danh, Nhập kết quả học tập, Tài liệu môn học, Bảng tin).
4. **`StudentLayout.jsx`**: Cổng thông tin học viên, tích hợp 8 mục menu (Thời khóa biểu, Chuyên cần điểm danh, Bảng điểm, Tra cứu học phí, Tải tài liệu học).

Tất cả layout đều tích hợp thanh điều hướng trên cùng **`TopNav.jsx`** hiển thị avatar người dùng, chuông thông báo và nút đăng xuất.

---

### 3.4 Danh Sách Các Trang Giao Diện (Pages) & Nhiệm Vụ

Các trang nằm tại `frontend/src/pages/`:

| Tên Trang | Vai Trò Truy Cập | Chức Năng Nghiệp Vụ Cụ Thể |
| :--- | :--- | :--- |
| **`Login.jsx`** | Công khai | Màn hình đăng nhập hiện đại với banner thương hiệu, kiểm tra email/password, lưu JWT token. |
| **`Register.jsx`** | Công khai | Cho phép học viên tự đăng ký tài khoản mới trực tuyến. |
| **`AdminDashboard.jsx`** | Admin | Tổng quan hệ thống: Thống kê tổng doanh thu, biểu đồ doanh thu theo tháng (Recharts), số học viên mới, tỷ lệ lấp đầy lớp. |
| **`ReceptionistDashboard.jsx`** | Receptionist | Bảng công việc của lễ tân: Học viên cần đóng học phí, lớp học sắp khai giảng, hóa đơn cần thu. |
| **`TeacherDashboard.jsx`** | Teacher | Bảng điều khiển của giảng viên: Buổi dạy trong ngày hôm nay, lớp đang phụ trách, thông báo nội bộ. |
| **`StudentDashboard.jsx`** | Student | Cổng cá nhân của học viên: Lịch học tiếp theo, điểm danh gần đây, thông báo mới của lớp. |
| **`StudentList.jsx`** | Admin, Receptionist | Danh sách toàn bộ học viên kèm bộ lọc tìm kiếm theo tên, mã học viên, số điện thoại; nút thêm mới học viên. |
| **`StudentDetail.jsx`** | Admin, Receptionist | Chi tiết học viên dạng Hybrid Tab: Xem thông tin cá nhân, Lịch sử ghi danh, Lịch sử điểm danh, Bảng điểm kết quả, Hóa đơn và Phiếu thu. |
| **`TeacherList.jsx`** | Admin, Receptionist | Danh sách giáo viên, thông tin liên hệ, bằng cấp chứng chỉ (IELTS/CELTA) và trạng thái công tác. |
| **`TeacherDetail.jsx`** | Admin, Receptionist, Teacher | Hồ sơ chi tiết của giảng viên và danh sách các lớp giảng viên đó đang đứng lớp. |
| **`ClassList.jsx`** | Toàn bộ các vai trò | Danh sách các lớp học với các huy hiệu môn học (IELTS, TOEIC), thanh tiến độ sĩ số lớp, trạng thái mở/đang học. |
| **`ClassDetail.jsx`** | Toàn bộ các vai trò | Chi tiết một lớp học: Danh sách học viên trong lớp, thời khóa biểu, danh sách các buổi học, tài liệu của lớp. |
| **`SchedulePage.jsx`** | Toàn bộ các vai trò | Bảng thời khóa biểu tuần trực quan theo khung giờ và phòng học. |
| **`AttendancePage.jsx`** | Admin, Receptionist, Teacher | Giao diện điểm danh buổi học: Danh sách học viên kèm các nút chọn trạng thái Có mặt / Đi trễ / Nghỉ phép / Vắng mặt và nút lưu đồng loạt. |
| **`StudentAttendance.jsx`** | Student | Trang học viên tự theo dõi tỷ lệ chuyên cần của bản thân qua các buổi học. |
| **`ResultsEntryPage.jsx`** | Admin, Teacher | Giao diện nhập bảng điểm 4 kỹ năng (Nghe, Nói, Đọc, Viết) cho cả lớp học. |
| **`StudentResultsPage.jsx`** | Student | Giao diện học viên tra cứu bảng điểm các bài kiểm tra đã được chấm. |
| **`TuitionListPage.jsx`** | Admin, Receptionist | Quản lý hóa đơn học phí: Danh sách hóa đơn, bộ lọc theo trạng thái Chưa đóng / Đóng một phần / Đã hoàn tất / Quá hạn. |
| **`InvoiceDetailPage.jsx`** | Admin, Receptionist | Chi tiết hóa đơn: Số tiền cần nộp, lịch sử các lần nộp tiền, nút mở modal "Thu tiền" hoặc nút "Hủy phiếu thu" (chỉ Admin). |
| **`StudentTuitionPage.jsx`** | Student | Tra cứu các hóa đơn học phí và lịch sử phiếu thu cá nhân của học viên. |
| **`StudyMaterialsPage.jsx`** | Toàn bộ các vai trò | Kho tài liệu bài giảng: Upload bài giảng mới (Teacher/Admin) và tải về file tài liệu (Học viên). |
| **`NoticeBoard.jsx`** | Toàn bộ các vai trò | Bảng tin thông báo trung tâm có gắn cờ mức độ ưu tiên (Bình thường / Khẩn cấp). |
| **`AccountManagement.jsx`** | Admin | Quản trị tài khoản nhân viên, giáo viên: Khóa hoặc mở khóa quyền truy cập. |
| **`RoleMatrixView.jsx`** | Admin | Bảng ma trận phân quyền trực quan giúp kiểm tra quyền hạn của từng vai trò trên hệ thống. |

---

### 3.5 Các Components Tái Sử Dụng & Hộp Thoại Nghiệp Vụ

- **`PaymentModal.jsx`**: Hộp thoại thu tiền học phí. Lễ tân nhập số tiền học viên nộp, chọn hình thức (Tiền mặt, Chuyển khoản, Thẻ) và ghi chú. Gửi request `POST /api/payments`.
- **`VoidPaymentDialog.jsx`**: Hộp thoại hủy phiếu thu dành riêng cho Admin. Bắt buộc nhập lý do hủy trước khi gửi request `POST /api/payments/:id/void` để đảm bảo tính minh bạch kiểm toán tài chính.
- **`EnrollmentModal.jsx`**: Hộp thoại chọn học viên và lớp học để thực hiện ghi danh mới.
- **`TransferEnrollmentModal.jsx`**: Hộp thoại chuyển lớp cho học viên từ lớp này sang lớp khác an toàn.
- **`StatCard.jsx`**: Thẻ thống kê số liệu trên Dashboard kèm biểu tượng icon và phần trăm tăng trưởng.
- **`SkillBadge.jsx`**: Huy hiệu hiển thị môn học/chương trình đào tạo (IELTS, TOEIC, General English) với màu sắc nhận diện chuẩn.
- **`StatusBadge.jsx`**: Huy hiệu hiển thị trạng thái động (Đã đóng, Còn nợ, Quá hạn, Đang học...).

---

## 4. BẢN ĐỒ ÁNH XẠ TÍNH NĂNG (Feature-to-Module Mapping)

Bảng dưới đây giúp bạn nhanh chóng tìm ra đoạn code tương ứng khi cần chỉnh sửa hoặc mở rộng tính năng:

```text
+-----------------------+-----------------------------+-----------------------------+-----------------------+
| Tính Năng Nghiệp Vụ   | Frontend (Giao diện)        | Backend (Controller / API)  | Model Cơ Sở Dữ Liệu   |
+-----------------------+-----------------------------+-----------------------------+-----------------------+
| Đăng nhập & Xác thực  | Login.jsx, AuthContext.jsx  | authController.js           | User.js               |
|                       |                             | -> /api/auth/login          |                       |
+-----------------------+-----------------------------+-----------------------------+-----------------------+
| Hồ sơ học viên        | StudentList.jsx,            | studentResourceController.js| Student.js,           |
|                       | StudentDetail.jsx           | -> /api/students            | Enrollment.js         |
+-----------------------+-----------------------------+-----------------------------+-----------------------+
| Quản lý lớp học       | ClassList.jsx,              | classController.js          | Class.js, Teacher.js, |
|                       | ClassDetail.jsx             | -> /api/classes             | Room                  |
+-----------------------+-----------------------------+-----------------------------+-----------------------+
| Ghi danh vào lớp      | EnrollmentModal.jsx,        | enrollmentController.js     | Enrollment.js,        |
|                       | ClassDetail.jsx             | -> /api/enrollments         | TuitionInvoice.js     |
+-----------------------+-----------------------------+-----------------------------+-----------------------+
| Thu tiền học phí      | PaymentModal.jsx,           | tuitionController.js,       | TuitionInvoice.js,    |
|                       | InvoiceDetailPage.jsx       | tuitionService.js           | Payment.js            |
|                       |                             | -> /api/payments            |                       |
+-----------------------+-----------------------------+-----------------------------+-----------------------+
| Hủy phiếu thu (Admin) | VoidPaymentDialog.jsx,      | tuitionController.js,       | Payment.js (isVoid),  |
|                       | InvoiceDetailPage.jsx       | tuitionService.js           | TuitionInvoice.js     |
|                       |                             | -> /api/payments/:id/void   |                       |
+-----------------------+-----------------------------+-----------------------------+-----------------------+
| Điểm danh học viên    | AttendancePage.jsx          | attendanceController.js,    | ClassSession.js,      |
|                       |                             | attendanceService.js        | Attendance.js         |
|                       |                             | -> /api/sessions/:id/roster |                       |
+-----------------------+-----------------------------+-----------------------------+-----------------------+
| Nhập kết quả học tập  | ResultsEntryPage.jsx        | learningResultController.js | LearningResult.js     |
|                       |                             | -> /api/results             |                       |
+-----------------------+-----------------------------+-----------------------------+-----------------------+
| Upload tài liệu học   | StudyMaterialsPage.jsx      | materialController.js       | StudyMaterial.js      |
|                       |                             | -> /api/materials           |                       |
+-----------------------+-----------------------------+-----------------------------+-----------------------+
| Thông báo trung tâm   | NoticeBoard.jsx             | noticeController.js         | Notice.js             |
|                       |                             | -> /api/notices             |                       |
+-----------------------+-----------------------------+-----------------------------+-----------------------+
```

---

## 5. GIẢI THÍCH CÁC LUỒNG LOGIC NGHIỆP VỤ PHỨC TẠP NHẤT

### Logic 1: Ghi Danh Tự Động Sinh Hóa Đơn & Cập Nhật Sĩ Số
Khi Lễ tân thực hiện ghi danh một học viên vào một lớp học (`POST /api/enrollments`):
1. **Kiểm tra sức chứa lớp học**: Hệ thống kiểm tra `class.currentEnrollment >= class.maxCapacity`. Nếu lớp đã đầy, trả về lỗi ngay lập tức.
2. **Kiểm tra trùng lặp**: Xác minh học viên chưa có bản ghi ghi danh đang hoạt động (`status: 'active'`) trong lớp này.
3. **Tạo bản ghi Ghi danh**: Tạo bản ghi `Enrollment` mới với trạng thái `active`.
4. **Tăng sĩ số thực tế**: Tự động tăng `currentEnrollment = currentEnrollment + 1` trong bảng `Class`.
5. **Khởi tạo Hóa đơn học phí tự động**:
   - Tự động sinh mã hóa đơn duy nhất dạng `INV-2026-XXXX`.
   - Lấy giá học phí từ `class.tuitionFee`.
   - Khởi tạo hóa đơn `TuitionInvoice`: `totalAmount = class.tuitionFee`, `paidAmount = 0`, `remainingAmount = class.tuitionFee`, trạng thái ban đầu là `unpaid`.

---

### Logic 2: Thu Tiền Nhiều Lần & Hủy Phiếu Thu (Void Payment) An Toàn
Một học viên không nhất thiết phải đóng toàn bộ học phí một lần mà có thể chia làm nhiều đợt (đặt cọc, đóng đợt 1, đóng đợt 2):

```text
[ Ghi Danh ] ──> Hóa Đơn: 5.000.000 VNĐ (Unpaid)
       │
       ├── Lần 1: Nộp 2.000.000 VNĐ (Tiền mặt)
       │          Phiếu thu PAY-0001 sinh ra
       │          Hóa Đơn cập nhật: Đã nộp 2.000.000đ, Còn nợ 3.000.000đ ──> Trạng thái: PARTIAL
       │
       ├── Lần 2: Nộp 3.000.000 VNĐ (Chuyển khoản)
       │          Phiếu thu PAY-0002 sinh ra
       │          Hóa Đơn cập nhật: Đã nộp 5.000.000đ, Còn nợ 0đ ──> Trạng thái: PAID
       │
       └── Trường hợp sai sót: Admin bấm "Hủy phiếu thu PAY-0002" kèm lý do:
                  PAY-0002 được đánh dấu isVoid = true, lưu voidReason, voidedBy
                  Hàm recalculateInvoiceFinancials() tự động chạy lại:
                  Tổng thu hợp lệ chỉ còn PAY-0001 (2.000.000đ)
                  Hóa Đơn hoàn tác: Còn nợ 3.000.000đ ──> Trạng thái quay về: PARTIAL
```
* **Ý nghĩa thực tế**: Ngăn chặn tình trạng gian lận tài chính, đảm bảo mọi khoản tiền vào/ra đều có dấu vết kiểm toán (Audit Trail) rõ ràng.

---

### Logic 3: Sinh Lịch Học & Điểm Danh Hợp Nhất (Hybrid Roster)
1. **Lập thời khóa biểu**: Khi cấu hình lớp học học các ngày Thứ 2, Thứ 4, Thứ 6 từ 18:00 - 19:30, `scheduleService.js` tự động tạo ra danh sách tất cả các ngày diễn ra lớp học trong suốt khóa học dưới dạng các bản ghi `ClassSession`.
2. **Cơ chế Hybrid Roster khi Điểm danh**:
   - Khi giáo viên mở một buổi học bất kỳ để điểm danh, `attendanceService.js` sẽ tìm tất cả học viên đang học lớp đó (`Enrollment: active`).
   - Lấy toàn bộ các bản ghi `Attendance` đã lưu trước đó của buổi học này và hợp nhất lại.
   - Nhờ vậy, ngay cả khi vừa có học viên mới ghi danh giữa chừng, học viên đó vẫn sẽ tự động xuất hiện trong danh sách điểm danh của các buổi học tiếp theo mà không gây lỗi dữ liệu.

---

### Logic 4: Bảo Vệ Đa Tầng (Multi-layered Security & RBAC Guard)
Hệ thống áp dụng cơ chế bảo mật sâu 3 lớp:
1. **Lớp 1 - Frontend Guard (`App.jsx`)**: Ẩn các menu không thuộc quyền hạn và chặn truy cập URL trái phép bằng component `<ProtectedRoute>`.
2. **Lớp 2 - API Middleware Guard (`authMiddleware.js`)**: Mọi request đều bắt buộc có JWT token hợp lệ và kiểm tra role (`protect`, `adminOnly`, `staffOnly`, `hasRole`). Nếu người dùng cố tình gửi request trái quyền qua Postman, server sẽ chặn đứng với mã `403 Forbidden`.
3. **Lớp 3 - Scoping Level Guard (`attendanceService.js`, `materialController.js`)**: Kiểm tra quyền sở hữu tài nguyên ở mức dữ liệu. Ví dụ: Giáo viên A dù có token hợp lệ cũng không thể xem hoặc sửa điểm danh lớp của Giáo viên B phụ trách.

---

## 💡 LỜI KẾT

Kiến trúc mã nguồn của **VLearn English Center** được phân chia rõ ràng theo nguyên tắc **Separation of Concerns (Phân tách mối quan tâm)**:
- **Routes**: Chỉ nhận diện đường dẫn URL.
- **Controllers**: Chỉ xử lý đầu vào/đầu ra của HTTP Request.
- **Services**: Chứa 100% logic thuật toán và tính toán nghiệp vụ.
- **Models**: Định nghĩa cấu trúc dữ liệu và quan hệ cơ sở dữ liệu.
- **Frontend Components & Pages**: Tái sử dụng tối đa, bám sát trải nghiệm người dùng hiện đại.

Mọi module đều có tính độc lập cao, giúp bạn dễ dàng bảo trì, nâng cấp và mở rộng thêm các tính năng mới trong tương lai.
