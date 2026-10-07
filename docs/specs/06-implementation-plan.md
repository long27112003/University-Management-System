# IMPLEMENTATION PLAN: VLEARN ENGLISH CENTER STUDENT MANAGEMENT SYSTEM (VLEARN EC-SMS)
### Kế hoạch Triển khai & Lộ trình Di trú Từng bước từ Mã nguồn Hiện tại (University Management System)

---

## 1. NGUYÊN TẮC CỐT LÕI & NGUỒN CHÂN LÝ (SOURCE OF TRUTH & CORE PRINCIPLES)

### 1.1. Quy tắc Nguồn Chân lý (Source of Truth Hierarchy):
> [!IMPORTANT]
> **QUY TẮC BẮT BUỘC KHI XẢY RA XUNG ĐỘT (SOURCE OF TRUTH RULE):**  
> Khi có bất kỳ điểm nào trong Kế hoạch Triển khai (Implementation Plan) này mâu thuẫn hoặc chưa khớp với các tài liệu Specification đã được phê duyệt, **Implementation Plan bắt buộc phải thích ứng và tuân theo Specification, tuyệt đối không được tự ý ghi đè (override)**:
> - **`01-product-spec.md`**: Định nghĩa Phạm vi Sản phẩm (Product Scope) & Luồng nghiệp vụ trung tâm.
> - **`02-role-permission-spec.md`**: Định nghĩa Ma trận Phân quyền (Authorization & RBAC Zero-Trust).
> - **`03-data-model-spec.md`**: Định nghĩa Cấu trúc Dữ liệu, Enums & Ràng buộc toàn vẹn (Data Model & Schema Constraints).
> - **`04-api-spec.md`**: Định nghĩa Hợp đồng Giao tiếp RESTful API (API Contracts & Endpoints).
> - **`05-ui-ux-spec.md`**: Định nghĩa Hành vi Giao diện, Wireframes & Design Tokens (UI/UX Behaviors).

### 1.2. Thứ tự Triển khai Bắt buộc:
$$\text{AUDIT} \longrightarrow \text{MODIFY FOUNDATION} \longrightarrow \text{BUILD CORE DOMAIN} \longrightarrow \text{BUILD BUSINESS MODULES} \longrightarrow \text{MIGRATE FRONTEND} \longrightarrow \text{UI POLISH} \longrightarrow \text{TEST} \longrightarrow \text{FINAL AUDIT}$$

### 1.3. Các Điều Cấm Tuyệt đối (Strict Prohibitions):
1. **Tuyệt đối KHÔNG viết lại dự án từ đầu (No Project Rewrite):** Phải tận dụng tối đa kiến trúc hiện có: Express 5, Mongoose 9, JWT Auth, Bcrypt, Multer, Vite + React 19, React Router v7, Axios instance, ToastContext và hệ thống CSS Tokens.
2. **Tuyệt đối KHÔNG code đồng thời tất cả các module:** Phải hoàn thành và nghiệm thu từng Phase độc lập trước khi mở khóa Phase tiếp theo.
3. **Tuyệt đối KHÔNG refactor file không liên quan:** Chỉ can thiệp vào các file được quy định trong danh mục `FILES TO MODIFY` của từng Phase.
4. **Tuyệt đối KHÔNG redesign UI trước khi Data Model và API ổn định:** Logic dữ liệu và API luôn đi trước; UI chỉ hoàn thiện sau khi backend đã chạy đúng.
5. **Tuyệt đối KHÔNG xóa module/file cũ trước khi module thay thế hoạt động ổn định:** Các thành phần trường đại học cũ (`Course`, `Subject`, `Leave`, `Professor`) chỉ được gỡ bỏ tại **Phase 14 (Final Cleanup)** sau khi toàn bộ quy trình E2E đã thông qua.
6. **Tuyệt đối KHÔNG đổi tech stack:** Giữ nguyên stack Frontend (React 19, Vite, React Router, Axios, Vanilla CSS) và Backend (Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, multer).
7. **Tuyệt đối KHÔNG thêm thư viện bên ngoài (third-party dependencies) nếu stack hiện tại đã giải quyết được.**

### 1.4. Tiêu chuẩn Thực hiện cho Mỗi Phase:
- Có mục tiêu kỹ thuật rõ ràng (`Objective`).
- Phân định rõ ràng mã nguồn tái sử dụng (`Existing code reused`).
- Liệt kê chi tiết Backend tasks và Frontend tasks.
- Chỉ rõ Models affected và APIs affected (Khớp 100% với `03-data-model-spec.md` và `04-api-spec.md`).
- Liệt kê chính xác đường dẫn các file: `FILES TO MODIFY`, `FILES TO CREATE`, `FILES TO DEPRECATE LATER`.
- Xác định rõ mối phụ thuộc (`Dependencies`).
- Đánh giá rủi ro kỹ thuật và biện pháp phòng ngừa (`Risks`).
- Xây dựng danh mục kiểm thử chi tiết (`Test cases`).
- Có tiêu chí nghiệm thu cụ thể (`Acceptance criteria`).
- Có định nghĩa hoàn thành (`Definition of Done`).
- Có Git checkpoint đề xuất tương ứng với mỗi Phase.

---

## 2. QUY CHUẨN ROLE MANAGEMENT TRONG PHIÊN BẢN MVP (ROLE CLARIFICATION)

Nhằm giữ phạm vi MVP tinh gọn, ổn định và bảo mật cao:
- **4 Role cố định duy nhất:**
  1. `Admin` (Quản trị viên toàn hệ thống)
  2. `Receptionist` (Lễ tân / Nhân viên ghi danh & thu phí)
  3. `Teacher` (Giáo viên giảng dạy & đánh giá)
  4. `Student` (Học viên trung tâm)
- **Ma trận quyền tĩnh (Static Permission Matrix):** Cố định tuyệt đối theo đặc tả tại `docs/specs/02-role-permission-spec.md`.
- **Phạm vi MVP nghiêm ngặt:**
  - **KHÔNG** xây dựng bộ tạo quyền động (No dynamic role creator).
  - **KHÔNG** xây dựng trình chỉnh sửa quyền (No permission editor UI).
  - **KHÔNG** xây dựng bảng dữ liệu quyền tùy biến trong database (No custom permission database).
  - **KHÔNG** cho phép tạo/xóa Role từ giao diện người dùng.
- **Quy định về Giao diện Phân quyền:**
  - Tuyến đường `/roles` chỉ là **Bảng tra cứu Ma trận Phân quyền dạng READ-ONLY** dành riêng cho tài khoản Admin nhằm kiểm tra trực quan phạm vi quyền hạn.
  - Admin quản trị quyền tài khoản bằng cách thay đổi Role giữa 4 vai trò cố định này thông qua trang **Quản lý Tài khoản (Account Management)** tại tuyến đường `/admin/accounts`.

---

## 3. MỐC PHÁT TRIỂN (MVP MILESTONES)

Dự án được chia thành 4 mốc phát triển chiến lược:

```
[Phase 0] ──> [Phase 1 - 9] ───────────────> [Phase 10] ───────────> [Phase 11 - 13] ─────────> [Phase 14]
Baseline       Core Business Logic            Modern SaaS UI           Security, Seed & E2E       Final Cleanup
& Safety       MVP FUNCTIONALLY COMPLETE      Polish                   Hardening                  Ready for Prod
```

1. **MỐC 1: MVP FUNCTIONALLY COMPLETE (Kết thúc Phase 9)**
   - Toàn bộ 11 Core Modules và 2 Utility Modules đã hoàn thành: Auth, Student, Teacher, Class, Enrollment, Schedule, ClassSession, Attendance, LearningResult, TuitionInvoice, Payment, 4 Dashboards, Notice, StudyMaterial.
   - Luồng dữ liệu, ràng buộc toàn vẹn, API và giao diện vận hành cơ bản hoạt động thông suốt 100%.
2. **MỐC 2: MODERN EDUCATION SAAS UI POLISH (Phase 10)**
   - Chuẩn hóa toàn bộ Design Tokens theo phong cách SaaS chuyên nghiệp (Slate + Blue/Green, không màu mè trường đại học cũ).
   - Đồng bộ hóa các thành phần Reusable UI: Card Grid, Table, Modal, Drawer, Badges, Toast, Skeletons.
   - Tối ưu hóa trải nghiệm Responsive. Tuyệt đối không thay đổi business logic.
3. **MỐC 3: SECURITY HARDENING, SEED DATA & E2E VERIFICATION (Phase 11 $\rightarrow$ 13)**
   - Kiểm toán bảo mật phân quyền Zero-Trust và kiểm tra cô lập dữ liệu 4 Roles.
   - Nạp bộ dữ liệu mẫu trung tâm Anh ngữ chân thực (`seedVLearn.js`).
   - Kiểm thử E2E thông suốt 8 luồng nghiệp vụ thực tế trên trình duyệt.
4. **MỐC 4: FINAL CLEANUP & PRODUCTION READINESS (Phase 14)**
   - Gỡ bỏ dứt điểm mã nguồn trường đại học cũ (`Course`, `Subject`, `Leave`, `Professor`).
   - Chuẩn hóa thương hiệu **VLearn English Center** và sẵn sàng đưa vào vận hành.

---

## 4. CHI TIẾT 15 GIAI ĐOẠN TRIỂN KHAI (PHASE-BY-PHASE ROADMAP)

---

### PHASE 0 — BASELINE & SAFETY (THIẾT LẬP ĐIỂM TỰA AN TOÀN)

- **1. Objective (Mục tiêu):**
  - Kiểm tra, đóng băng và xác nhận toàn bộ mã nguồn hiện tại của dự án chạy bình thường trước khi thực hiện bất kỳ thay đổi nào. Thiết lập điểm tựa an toàn để rollback ngay lập tức nếu xảy ra sự cố.
- **2. Existing Code Reused (Mã nguồn tái sử dụng):**
  - Toàn bộ 100% cấu trúc backend và frontend hiện có.
- **3. Backend Tasks:**
  - Khởi động backend Node.js (`npm run dev` / `node server.js`) tại port 5000.
  - **Kiểm tra kết nối Cơ sở dữ liệu:** Không giả định cố định database cục bộ; kiểm tra kết nối Mongoose thành công thông qua biến môi trường `MONGO_URI` được khai báo trong `backend/.env` (có thể là MongoDB Atlas hoặc MongoDB Local).
  - Ghi nhận và kiểm tra cấu hình môi trường: `backend/.env` (`PORT`, `MONGO_URI`, `JWT_SECRET`).
  - Ghi nhận danh sách routes hiện có trong `backend/routes/`.
- **4. Frontend Tasks:**
  - Khởi động frontend Vite (`npm run dev`) tại port 5173.
  - Xác nhận build frontend không có lỗi cú pháp (`npm run build`).
  - Kiểm tra đăng nhập thử nghiệm bằng 3 tài khoản cũ: Admin, Professor, Student.
  - Kiểm tra hoạt động cơ bản của các trang Dashboard cũ.
- **5. Models Affected:**
  - Không có model nào bị ảnh hưởng.
- **6. APIs Affected:**
  - Không có API nào bị thay đổi.
- **7. Files Affected:**
  - `FILES TO MODIFY`: Không có.
  - `FILES TO CREATE`: Không có.
  - `FILES TO DEPRECATE LATER`: Không có.
- **8. Dependencies:**
  - Không có phụ thuộc trước.
- **9. Risks:**
  - Chuỗi kết nối `MONGO_URI` trong `backend/.env` không hợp lệ hoặc cụm database (Atlas/Local) không truy cập được.
  - *Biện pháp:* Kiểm tra log kết nối Mongoose `Connected to MongoDB`; nếu lỗi thì kiểm tra whitelist IP (đối với Atlas) hoặc service mongod (đối với Local).
- **10. Test Cases:**
  - `TC0.1`: Truy cập `http://localhost:5000/` trả về thông báo API đang chạy.
  - `TC0.2`: Truy cập `http://localhost:5173/` hiển thị trang Login.
  - `TC0.3`: Đăng nhập thử nghiệm thành công với tài khoản cũ trong database cấu hình bởi `MONGO_URI`.
- **11. Acceptance Criteria:**
  - Backend và Frontend đều khởi động bình thường không có lỗi crash.
  - Kết nối tới `MONGO_URI` thành công và ổn định.
- **12. Definition of Done:**
  - Hệ thống cũ hoạt động ổn định và checkpoint Git được gắn nhãn an toàn.
- **13. Suggested Git Commit:**
  - `chore: baseline before vlearn migration`

---

### PHASE 1 — AUTH FOUNDATION & ROLE MIGRATION (NỀN TẢNG XÁC THỰC & 4 VAI TRÒ MỚI)

- **1. Objective (Mục tiêu):**
  - Chuyển đổi hệ thống phân quyền cốt lõi từ 3 vai trò cũ (`Admin`, `Professor`, `Student`) sang 4 vai trò VLearn chuẩn (`Admin`, `Receptionist`, `Teacher`, `Student`). Bổ sung trạng thái tài khoản `active`/`inactive`. Xây dựng middleware phân quyền tổng quát `hasRole()`.
- **2. Existing Code Reused (Mã nguồn tái sử dụng):**
  - Cơ chế băm mật khẩu bcrypt và sinh JWT token trong `backend/controllers/authController.js`.
  - Quản lý token, axios header và lưu trữ session trong `frontend/src/context/AuthContext.jsx`.
  - Cơ chế bảo vệ tuyến đường `ProtectedRoute` trong `frontend/src/App.jsx`.
- **3. Backend Tasks:**
  - Cập nhật Enum `role` trong model `backend/models/User.js`: `['Admin', 'Receptionist', 'Teacher', 'Student']`.
  - Thêm trường `status: { type: String, enum: ['active', 'inactive'], default: 'active' }` vào `User.js`.
  - Refactor `backend/middleware/authMiddleware.js`:
    - Viết hàm tổng quát `hasRole(roles)` kiểm tra vai trò người dùng.
    - Tạo các middleware tiện ích: `adminOnly`, `receptionistOnly`, `teacherOnly`, `staffOnly` (Admin + Receptionist).
    - Cưỡng chế kiểm tra trạng thái: Nếu `user.status !== 'active'` $\rightarrow$ trả về `401 Unauthorized` ("Tài khoản đã bị vô hiệu hóa").
  - Cập nhật `backend/controllers/authController.js`:
    - Khi đăng nhập (`POST /api/auth/login`), kiểm tra nếu `user.status === 'inactive'` $\rightarrow$ từ chối đăng nhập với lỗi 401.
    - Cấp JWT payload chứa `{ id: user._id, role: user.role }`.
    - Hỗ trợ endpoint `GET /api/auth/me`, `PUT /api/auth/change-password`, `PUT /api/auth/profile`, `POST /api/auth/logout`.
- **4. Frontend Tasks:**
  - Cập nhật `frontend/src/context/AuthContext.jsx`: Nhận diện và lưu trữ 4 vai trò mới; xử lý đăng xuất khi tài khoản bị khóa.
  - Cập nhật `frontend/src/App.jsx`:
    - Cập nhật `ProtectedRoute` hỗ trợ mảng `allowedRoles` theo 4 vai trò mới.
    - Cập nhật hàm điều hướng `getDashboardHome()`:
      - Admin $\rightarrow$ `/admin`
      - Receptionist $\rightarrow$ `/receptionist`
      - Teacher $\rightarrow$ `/teacher`
      - Student $\rightarrow$ `/student`
    - Đổi tuyến đường `/professor/*` thành `/teacher/*`.
    - Thêm tuyến đường `/receptionist/*`.
  - Tạo khung layout `frontend/src/layouts/ReceptionistLayout.jsx`.
  - Tạo khung layout `frontend/src/layouts/TeacherLayout.jsx` (tái cấu trúc từ `ProfessorLayout.jsx`).
  - Tạo trang Read-Only Ma trận Phân quyền `frontend/src/pages/RoleMatrixView.jsx` dành cho Admin tại `/admin/roles`.
- **5. Models Affected:**
  - `User` (`backend/models/User.js`):
    - `role`: `['Admin', 'Receptionist', 'Teacher', 'Student']`
    - `status`: `['active', 'inactive']`
- **6. APIs Affected (Chuẩn theo `04-api-spec.md`):**
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `PUT /api/auth/change-password`
  - `PUT /api/auth/profile`
  - `POST /api/auth/logout`
- **7. Files Affected:**
  - `FILES TO MODIFY`:
    - `backend/models/User.js`
    - `backend/middleware/authMiddleware.js`
    - `backend/controllers/authController.js`
    - `frontend/src/App.jsx`
    - `frontend/src/context/AuthContext.jsx`
  - `FILES TO CREATE`:
    - `frontend/src/layouts/ReceptionistLayout.jsx`
    - `frontend/src/layouts/TeacherLayout.jsx`
    - `frontend/src/pages/RoleMatrixView.jsx`
  - `FILES TO DEPRECATE LATER`:
    - `frontend/src/layouts/ProfessorLayout.jsx`
- **8. Dependencies:**
  - Hoàn thành Phase 0.
- **9. Risks:**
  - Token cũ trong LocalStorage của trình duyệt chứa role `Professor` sẽ gặp lỗi `403 Forbidden`.
  - *Biện pháp:* Thêm logic tự động xóa token và chuyển hướng về `/login` nếu phát hiện role cũ không nằm trong danh mục 4 role mới.
- **10. Test Cases:**
  - `TC1.1`: Đăng nhập với tài khoản Admin $\rightarrow$ Chuyển hướng thành công tới `/admin`.
  - `TC1.2`: Đăng nhập với tài khoản Receptionist $\rightarrow$ Chuyển hướng thành công tới `/receptionist`.
  - `TC1.3`: Đăng nhập với tài khoản Teacher $\rightarrow$ Chuyển hướng thành công tới `/teacher`.
  - `TC1.4`: Đăng nhập với tài khoản Student $\rightarrow$ Chuyển hướng thành công tới `/student`.
  - `TC1.5`: Tài khoản có `status: 'inactive'` đăng nhập $\rightarrow$ Nhận lỗi `401 Unauthorized`.
  - `TC1.6`: Receptionist truy cập trái phép tuyến đường `/admin` $\rightarrow$ Bị chặn và chuyển hướng an toàn.
- **11. Acceptance Criteria:**
  - 4 Role đăng nhập thành công và được dẫn hướng tới đúng layout của vai trò đó.
  - Thuật ngữ `Professor` được thay thế bằng `Teacher` trong toàn bộ luồng Auth.
  - Backend bảo vệ chặt chẽ các endpoint theo quyền hạn của từng Role.
- **12. Definition of Done:**
  - Xác thực 4 role hoạt động thông suốt; middleware chặn đúng các truy cập trái quyền; không còn phụ thuộc vào role `Professor`.
- **13. Suggested Git Commit:**
  - `feat: migrate auth foundation to vlearn 4 roles and status management`

---

### PHASE 2 — USER / STUDENT / TEACHER PROFILE MIGRATION (TÁCH BIỆT AUTH VÀ DOMAIN PROFILES)

- **1. Objective (Mục tiêu):**
  - Tách rời tài khoản đăng nhập (`User`) khỏi hồ sơ nghiệp vụ học viên (`Student`) và giáo viên (`Teacher`). Cưỡng chế quy tắc: `users.email` là nguồn chân lý duy nhất (Authoritative Source of Truth) cho đăng nhập.
  - Cấu trúc trường và Enum học vụ khớp 100% với `03-data-model-spec.md`.
  - Sử dụng MongoDB Transaction khi khởi tạo đồng thời `User` và Profile để đảm bảo tính toàn vẹn dữ liệu.
- **2. Existing Code Reused (Mã nguồn tái sử dụng):**
  - Cấu trúc hiển thị bảng danh sách và modal form người dùng từ `frontend/src/pages/AdminUsers.jsx`.
- **3. Backend Tasks:**
  - Tạo model `backend/models/Student.js` (Khớp chính xác `03-data-model-spec.md`):
    - `userId`: `ObjectId`, `ref: 'User'`, `unique: true`, bắt buộc.
    - `studentCode`: `String`, `unique: true`, bắt buộc (VD: `VL-HV2026001`).
    - `fullName`: `String`, bắt buộc.
    - `dateOfBirth`: `Date`, tùy chọn.
    - `gender`: `String`, `enum: ['male', 'female', 'other']`, mặc định `'other'`.
    - `phone`: `String`, bắt buộc (Regex 10 chữ số).
    - `email`: `String`, bắt buộc (Derived / Read-only từ `User.email`).
    - `address`: `Object`, `{ street: String, district: String, city: String }`.
    - `emergencyContact`: `Object`, `{ name: String, phone: String, relationship: String }`.
    - `academicStatus`: `String`, `enum: ['waiting', 'active', 'paused', 'completed', 'inactive']`, mặc định `'active'`.
    - `notes`: `String`, ghi chú tư vấn/đặc điểm học viên.
    *(Lưu ý: Không dùng `parentName`, `parentPhone`, `reserved`, hay `dropped` trong Student model; trạng thái thôi học/chuyển lớp do Enrollment xử lý).*
  - Tạo model `backend/models/Teacher.js` (Khớp chính xác `03-data-model-spec.md`):
    - `userId`: `ObjectId`, `ref: 'User'`, `unique: true`, bắt buộc.
    - `teacherCode`: `String`, `unique: true`, bắt buộc (VD: `VL-GV001`).
    - `fullName`: `String`, bắt buộc.
    - `email`: `String`, bắt buộc (Derived / Read-only từ `User.email`).
    - `phone`: `String`, bắt buộc.
    - `gender`: `String`, `enum: ['male', 'female', 'other']`, mặc định `'other'`.
    - `address`: `String`.
    - `specialization`: `[String]`, `['listening', 'speaking', 'reading', 'writing', 'ielts']`.
    - `status`: `String`, `enum: ['active', 'inactive']`, mặc định `'active'`.
    - `notes`: `String`.
  - Xây dựng `backend/controllers/studentController.js` & `backend/controllers/teacherController.js`:
    - **Áp dụng MongoDB Transaction (`session.withTransaction()`):** Khi tạo Student hoặc Teacher, khởi tạo đồng thời `User` và Profile trong một Transaction để loại trừ 100% rủi ro tài khoản mồ côi (orphaned account).
    - Tự động sinh mã học viên `VL-HV...` và mã giáo viên `VL-GV...`.
    - Cập nhật Email tập trung: Cập nhật `User.email` và đồng bộ trường `email` trên Profile.
  - Xây dựng `backend/controllers/accountController.js` dành cho Admin quản trị tài khoản nội bộ.
  - Cấu hình routes khớp chuẩn `04-api-spec.md`:
    - `backend/routes/studentRoutes.js`
    - `backend/routes/teacherRoutes.js`
    - `backend/routes/accountRoutes.js`
  - Mount routes vào `backend/server.js`.
- **4. Frontend Tasks:**
  - Xây dựng trang `frontend/src/pages/StudentList.jsx`: Bảng danh sách học viên, tìm kiếm theo mã/tên/sđt/email, bộ lọc `academicStatus` (`waiting`, `active`, `paused`, `completed`, `inactive`).
  - Xây dựng trang `frontend/src/pages/StudentDetail.jsx`: Giao diện Hybrid tabbed layout (Tổng quan, Lớp học, Điểm danh, Kết quả, Học phí).
  - Xây dựng trang `frontend/src/pages/TeacherList.jsx`: Danh sách giáo viên, kỹ năng giảng dạy, trạng thái hoạt động.
  - Xây dựng trang `frontend/src/pages/TeacherDetail.jsx`: Thông tin giáo viên, lớp đang phụ trách.
  - Xây dựng trang `frontend/src/pages/AccountManagement.jsx`: Dành riêng cho Admin quản lý tài khoản và gán Role.
- **5. Models Affected:**
  - Tạo mới: `Student` (`backend/models/Student.js`), `Teacher` (`backend/models/Teacher.js`).
  - Sử dụng: `User` (`backend/models/User.js`).
- **6. APIs Affected (Khớp 100% `04-api-spec.md`):**
  - **Student APIs (`/api/students`):**
    - `GET /api/students` (Phân trang, tìm kiếm, lọc theo `academicStatus`, `classId`)
    - `POST /api/students` (Tạo User + Student profile qua Transaction)
    - `GET /api/students/:id`
    - `PUT /api/students/:id`
    - `PATCH /api/students/:id/status` (Đổi `academicStatus`)
    - `GET /api/students/:id/enrollments`
    - `GET /api/students/:id/attendance`
    - `GET /api/students/:id/results`
    - `GET /api/students/:id/invoices`
    - `GET /api/students/:id/payments`
  - **Teacher APIs (`/api/teachers` & `/api/teacher/me`):**
    - `GET /api/teachers`
    - `POST /api/teachers` (Tạo User + Teacher profile qua Transaction)
    - `GET /api/teachers/:id`
    - `PUT /api/teachers/:id`
    - `PATCH /api/teachers/:id/status`
    - `GET /api/teacher/me`
    - `GET /api/teacher/me/classes`
    - `GET /api/teacher/me/schedule`
  - **Account APIs (`/api/accounts` - Admin Only):**
    - `GET /api/accounts`
    - `POST /api/accounts`
    - `GET /api/accounts/:id`
    - `PUT /api/accounts/:id`
    - `PATCH /api/accounts/:id/status`
    - `PATCH /api/accounts/:id/role`
- **7. Files Affected:**
  - `FILES TO MODIFY`:
    - `backend/server.js`
    - `frontend/src/layouts/AdminLayout.jsx`
    - `frontend/src/layouts/ReceptionistLayout.jsx`
  - `FILES TO CREATE`:
    - `backend/models/Student.js`
    - `backend/models/Teacher.js`
    - `backend/controllers/teacherController.js`
    - `backend/controllers/accountController.js`
    - `backend/routes/teacherRoutes.js`
    - `backend/routes/accountRoutes.js`
    - `frontend/src/pages/StudentList.jsx`
    - `frontend/src/pages/StudentDetail.jsx`
    - `frontend/src/pages/TeacherList.jsx`
    - `frontend/src/pages/TeacherDetail.jsx`
    - `frontend/src/pages/AccountManagement.jsx`
  - `FILES TO DEPRECATE LATER`:
    - `frontend/src/pages/AdminUsers.jsx`
- **8. Dependencies:**
  - Hoàn thành Phase 1.
- **9. Risks:**
  - Trùng lặp email hoặc mã học viên khi tạo bản ghi mới.
  - *Biện pháp:* Sử dụng MongoDB Transaction bọc tác vụ tạo `User` và `Student`/`Teacher`; đánh chỉ mục `unique: true` cho `users.email`, `students.studentCode`, `teachers.teacherCode`.
- **10. Test Cases:**
  - `TC2.1`: Tạo học viên mới với thông tin hợp lệ qua `POST /api/students` $\rightarrow$ Sinh đồng thời `User` và `Student` liên kết qua `userId`.
  - `TC2.2`: Đăng nhập bằng email và mật khẩu vừa tạo của học viên $\rightarrow$ Đăng nhập thành công với vai trò `Student`.
  - `TC2.3`: Cập nhật email học viên $\rightarrow$ Email trong `User` và `Student` đều được đồng bộ.
  - `TC2.4`: Cập nhật `academicStatus` thành `paused` hoặc `completed` qua `PATCH /api/students/:id/status` $\rightarrow$ Lưu thành công.
  - `TC2.5`: Admin đổi role của tài khoản trong trang Quản lý Tài khoản $\rightarrow$ Quyền hạn thay đổi chính xác.
- **11. Acceptance Criteria:**
  - Tách rời hoàn toàn dữ liệu Auth và Profile nghiệp vụ.
  - Tự động sinh mã học viên/giáo viên duy nhất.
  - `users.email` luôn là nguồn chân lý duy nhất.
  - Sử dụng transaction tạo Profile + User an toàn.
- **12. Definition of Done:**
  - API và giao diện quản lý Học viên, Giáo viên, Tài khoản hoạt động trơn tru; dữ liệu liên kết chuẩn xác không lỗi mồ côi.
- **13. Suggested Git Commit:**
  - `feat: decouple auth users from student and teacher domain profiles`

---

### PHASE 3 — CLASS & ENROLLMENT (LỚP HỌC KỸ NĂNG & GHI DANH NHIỀU - NHIỀU)

- **1. Objective (Mục tiêu):**
  - Thay thế mô hình ngành học đại học (`Course`/`Subject`) bằng mô hình Lớp học kỹ năng VLearn (`Class`) với 4 kỹ năng (`listening`, `speaking`, `reading`, `writing`). Xây dựng quan hệ Nhiều - Nhiều thông qua `Enrollment` có Partial Unique Index để chặn ghi danh trùng lặp nhưng vẫn bảo toàn lịch sử.
  - Chuẩn hóa Enum trạng thái Lớp học khớp 100% với `03-data-model-spec.md`.
  - **Lưu ý phụ thuộc Học phí:** Phase 3 **CHỈ tạo Enrollment**, chưa tạo TuitionInvoice (TuitionInvoice sẽ được kích hoạt tại Phase 7).
- **2. Existing Code Reused (Mã nguồn tái sử dụng):**
  - Logic modal form và xử lý phân trang từ `frontend/src/pages/AdminCourses.jsx`.
- **3. Backend Tasks:**
  - Tạo model `backend/models/Class.js` (Khớp chính xác `03-data-model-spec.md`):
    - `classCode`: `String`, `unique: true`, bắt buộc (VD: `VL-SPK-K12`).
    - `className`: `String`, bắt buộc.
    - `skill`: `String`, `enum: ['listening', 'speaking', 'reading', 'writing']`, bắt buộc.
    - `teacher`: `ObjectId`, `ref: 'Teacher'`, bắt buộc.
    - `maxCapacity`: `Number`, mặc định 15 (tối thiểu 1, tối đa 30).
    - `startDate`: `Date`, bắt buộc.
    - `endDate`: `Date`, bắt buộc (`endDate >= startDate`).
    - `tuitionFee`: `Number`, mặc định 0 ($\ge 0$).
    - `room`: `String`, bắt buộc.
    - `status`: `String`, `enum: ['upcoming', 'active', 'completed', 'cancelled', 'archived']`, mặc định `'upcoming'`.
    *(Lưu ý: Tuyệt đối không dùng `scheduled` hay `in_progress` cho Class status).*
  - Tạo model `backend/models/Enrollment.js` (Khớp chính xác `03-data-model-spec.md`):
    - `student`: `ObjectId`, `ref: 'Student'`, bắt buộc.
    - `class`: `ObjectId`, `ref: 'Class'`, bắt buộc.
    - `enrolledAt`: `Date`, mặc định `Date.now`.
    - `status`: `String`, `enum: ['active', 'completed', 'dropped', 'transferred']`, mặc định `'active'`.
    - `transferredFrom`: `ObjectId`, `ref: 'Class'`, tùy chọn.
    - `droppedAt`: `Date`, tùy chọn.
    - `note`: `String`.
    - **Partial Unique Index bắt buộc:**
      ```javascript
      enrollmentSchema.index(
        { student: 1, class: 1 },
        { unique: true, partialFilterExpression: { status: 'active' } }
      );
      ```
  - Xây dựng `backend/controllers/classController.js`:
    - CRUD lớp học; tính toán sĩ số thực tế (`enrolledCount`) thông qua truy vấn số bản ghi `Enrollment` có `status === 'active'`.
  - Xây dựng `backend/controllers/enrollmentController.js`:
    - `POST /api/classes/:classId/enrollments`: Ghi danh học viên vào lớp.
      - Kiểm tra sĩ số: Nếu `activeEnrollments >= class.maxCapacity` $\rightarrow$ Trả về `409 Conflict` ("Lớp học đã đạt sĩ số tối đa").
      - Kiểm tra trùng lặp: Nếu học viên đã có bản ghi `active` tại lớp này $\rightarrow$ Trả về `409 Conflict`.
      - > [!NOTE]
        > **GHI CHÚ PHỤ THUỘC HỌC PHÍ (TUITION DEPENDENCY NOTE):**  
        > Trong Phase 3, API ghi danh **CHỈ tạo bản ghi Enrollment**.  
        > Cơ chế tự động phát hành Hóa đơn học phí (`TuitionInvoice`) khi ghi danh sẽ được kích hoạt tại **Phase 7** sau khi các Model và Service `TuitionInvoice` và `Payment` đã được tạo lập và kiểm thử.
    - `GET /api/classes/:classId/enrollments`: Lấy danh sách học viên trong lớp.
    - `GET /api/students/:studentId/enrollments`: Lấy danh sách lớp của một học viên.
    - `POST /api/enrollments/:id/transfer`: Chuyển lớp học viên (chuyển bản ghi cũ sang `transferred`, tạo bản ghi mới `active` ở lớp đích nếu lớp đích còn chỗ).
    - `POST /api/enrollments/:id/drop`: Rút tên / bảo lưu học viên (chuyển trạng thái sang `dropped`, lưu `droppedAt` và `note`).
  - Cấu hình routes khớp chuẩn `04-api-spec.md`:
    - `backend/routes/classRoutes.js`
    - `backend/routes/enrollmentRoutes.js`
  - Mount routes vào `backend/server.js`.
- **4. Frontend Tasks:**
  - Xây dựng trang `frontend/src/pages/ClassList.jsx`:
    - Card Grid hoặc Table; hiển thị huy hiệu kỹ năng (`SkillBadge`).
    - Thanh tiến trình sĩ số lớp (ví dụ: `12/15 học viên`).
    - Bộ lọc theo kỹ năng (`listening`, `speaking`, `reading`, `writing`), trạng thái (`upcoming`, `active`, `completed`).
  - Xây dựng trang `frontend/src/pages/ClassDetail.jsx`: Chi tiết thông tin lớp, danh sách học viên đang theo học.
  - Xây dựng component `frontend/src/components/EnrollmentModal.jsx`: Modal ghi danh học viên vào lớp có kiểm tra trực quan sĩ số.
- **5. Models Affected:**
  - Tạo mới: `Class` (`backend/models/Class.js`), `Enrollment` (`backend/models/Enrollment.js`).
- **6. APIs Affected (Khớp 100% `04-api-spec.md`):**
  - **Class APIs (`/api/classes`):**
    - `GET /api/classes`
    - `POST /api/classes`
    - `GET /api/classes/:id`
    - `PUT /api/classes/:id`
    - `PATCH /api/classes/:id/status` (`upcoming`, `active`, `completed`, `cancelled`, `archived`)
  - **Enrollment APIs:**
    - `POST /api/classes/:classId/enrollments`
    - `GET /api/classes/:classId/enrollments`
    - `GET /api/students/:studentId/enrollments`
    - `POST /api/enrollments/:id/transfer`
    - `POST /api/enrollments/:id/drop`
- **7. Files Affected:**
  - `FILES TO MODIFY`:
    - `backend/server.js`
    - `frontend/src/layouts/AdminLayout.jsx`
    - `frontend/src/layouts/ReceptionistLayout.jsx`
  - `FILES TO CREATE`:
    - `backend/models/Class.js`
    - `backend/models/Enrollment.js`
    - `backend/controllers/classController.js`
    - `backend/controllers/enrollmentController.js`
    - `backend/routes/classRoutes.js`
    - `backend/routes/enrollmentRoutes.js`
    - `frontend/src/pages/ClassList.jsx`
    - `frontend/src/pages/ClassDetail.jsx`
    - `frontend/src/components/EnrollmentModal.jsx`
  - `FILES TO DEPRECATE LATER`:
    - `backend/models/Course.js`
    - `backend/models/Subject.js`
    - `frontend/src/pages/AdminCourses.jsx`
    - `frontend/src/pages/AdminSubjects.jsx`
- **8. Dependencies:**
  - Hoàn thành Phase 2 (Cần `Student` và `Teacher` profiles).
- **9. Risks:**
  - Ghi danh vượt quá sĩ số tối đa nếu hai yêu cầu ghi danh đồng thời (concurrency condition).
  - *Biện pháp:* Đếm lại sĩ số trực tiếp từ database trước khi lưu bản ghi ghi danh mới.
- **10. Test Cases:**
  - `TC3.1`: Tạo lớp học kỹ năng Speaking với `maxCapacity = 2` $\rightarrow$ Lưu thành công với trạng thái `upcoming`.
  - `TC3.2`: Ghi danh học viên A vào lớp qua `POST /api/classes/:classId/enrollments` $\rightarrow$ Sĩ số đạt 1/2.
  - `TC3.3`: Cố tình ghi danh học viên A thêm một lần nữa vào chính lớp đó khi đang `active` $\rightarrow$ Nhận lỗi `409 Conflict` (Chặn bởi Partial Unique Index).
  - `TC3.4`: Ghi danh học viên B vào lớp $\rightarrow$ Sĩ số đạt 2/2.
  - `TC3.5`: Ghi danh học viên C vào lớp $\rightarrow$ Nhận lỗi `409 Conflict` do lớp đã đầy sĩ số.
  - `TC3.6`: Thực hiện `POST /api/enrollments/:id/drop` cho học viên A $\rightarrow$ Bản ghi chuyển sang `dropped`. Sau đó ghi danh lại học viên A $\rightarrow$ Cho phép thành công vì bản ghi cũ không còn `active`.
- **11. Acceptance Criteria:**
  - Một học viên có thể ghi danh vào nhiều lớp kỹ năng khác nhau.
  - Không thể tồn tại 2 bản ghi `active` cho cùng một cặp (học viên, lớp).
  - Lịch sử ghi danh (`transferred`, `dropped`) được bảo toàn trọn vẹn.
- **12. Definition of Done:**
  - Quản lý Lớp học và Ghi danh Nhiều - Nhiều hoạt động chuẩn xác với quy tắc ràng buộc sĩ số và tính toàn vẹn dữ liệu.
- **13. Suggested Git Commit:**
  - `feat: implement classes with 4 skills and enrollment many-to-many model`

---

### PHASE 4 — SCHEDULE & CLASS SESSION (THỜI KHÓA BIỂU & XÁC THỰC XUNG ĐỘT)

- **1. Objective (Mục tiêu):**
  - Xây dựng thời khóa biểu hàng tuần (`Schedule`) và cơ chế sinh tự động các buổi học thực tế (`ClassSession`). Cài đặt thuật toán phát hiện xung đột lịch ở tầng Service (Teacher, Room, Student).
  - Chuẩn hóa Enum trạng thái Buổi học: `['scheduled', 'completed', 'cancelled']`.
- **2. Existing Code Reused (Mã nguồn tái sử dụng):**
  - Không có module thời khóa biểu phù hợp trong mã nguồn cũ; xây dựng mới theo chuẩn VLearn.
- **3. Backend Tasks:**
  - Tạo model `backend/models/Schedule.js` (Khớp chính xác `03-data-model-spec.md`):
    - `class`: `ObjectId`, `ref: 'Class'`, bắt buộc.
    - `dayOfWeek`: `Number`, `2` (Thứ Hai) $\rightarrow$ `8` (Chủ Nhật), bắt buộc.
    - `startTime`: `String`, định dạng `"HH:mm"`, bắt buộc (VD: `"17:30"`).
    - `endTime`: `String`, định dạng `"HH:mm"`, bắt buộc (VD: `"19:00"`).
    - `room`: `String`, bắt buộc.
    - `teacher`: `ObjectId`, `ref: 'Teacher'`, tùy chọn (nếu có giáo viên dạy riêng ca này).
  - Tạo model `backend/models/ClassSession.js` (Khớp chính xác `03-data-model-spec.md`):
    - `class`: `ObjectId`, `ref: 'Class'`, bắt buộc.
    - `schedule`: `ObjectId`, `ref: 'Schedule'`, tùy chọn.
    - `sessionNumber`: `Number`, bắt buộc (Buổi 1, Buổi 2...).
    - `sessionDate`: `Date`, bắt buộc (chỉ tính phần ngày).
    - `startTime`: `String`, bắt buộc (VD: `"17:30"`).
    - `endTime`: `String`, bắt buộc (VD: `"19:00"`).
    - `teacher`: `ObjectId`, `ref: 'Teacher'`, bắt buộc.
    - `room`: `String`, bắt buộc.
    - `status`: `String`, `enum: ['scheduled', 'completed', 'cancelled']`, mặc định `'scheduled'`.
    - `note`: `String`.
    - Compound Index: `{ class: 1, sessionDate: 1, startTime: 1 }`.
  - Viết Service kiểm tra xung đột thời gian (`checkScheduleConflict`):
    - Công thức toán học:
      $$\text{Conflict} \iff (\text{existing.startTime} < \text{new.endTime}) \land (\text{existing.endTime} > \text{new.startTime})$$
    - Áp dụng kiểm tra 3 chiều:
      1. **Giáo viên:** Giáo viên có đang dạy lớp khác trong cùng khung giờ và cùng ngày không?
      2. **Phòng học:** Phòng học có đang được lớp khác sử dụng trong cùng khung giờ không?
      3. **Học viên:** Các học viên trong lớp có bị trùng lịch với lớp kỹ năng khác mà họ đang theo học không?
    - Nếu xung đột $\rightarrow$ Ném lỗi `409 Conflict` kèm thông báo rõ đối tượng bị trùng.
  - Viết endpoint `POST /api/classes/:classId/sessions/generate`: Tự động tính toán các ngày trong tuần giữa `startDate` và `endDate` của lớp để sinh danh sách `ClassSession`.
  - Cấu hình routes khớp chuẩn `04-api-spec.md`:
    - `backend/routes/scheduleRoutes.js`
    - `backend/routes/sessionRoutes.js`
  - Mount routes vào `backend/server.js`.
- **4. Frontend Tasks:**
  - Xây dựng trang `frontend/src/pages/SchedulePage.jsx`:
    - Chế độ xem **Table View** rõ ràng: Lọc theo Lớp, Giáo viên, Phòng học.
    - Hiển thị thông báo lỗi xung đột trực quan (chỉ rõ tên giáo viên/phòng học bị trùng giờ).
  - Tích hợp nút **[Sinh buổi học tự động]** trong trang Chi tiết Lớp học (`ClassDetail.jsx`).
- **5. Models Affected:**
  - Tạo mới: `Schedule` (`backend/models/Schedule.js`), `ClassSession` (`backend/models/ClassSession.js`).
- **6. APIs Affected (Khớp 100% `04-api-spec.md`):**
  - **Schedule APIs:**
    - `GET /api/classes/:classId/schedules`
    - `POST /api/classes/:classId/schedules`
    - `PUT /api/schedules/:id`
    - `DELETE /api/schedules/:id`
  - **ClassSession APIs:**
    - `GET /api/classes/:classId/sessions`
    - `POST /api/classes/:classId/sessions/generate`
    - `GET /api/sessions/:id`
    - `PATCH /api/sessions/:id/status` (`scheduled`, `completed`, `cancelled`)
    - `PUT /api/sessions/:id`
- **7. Files Affected:**
  - `FILES TO MODIFY`:
    - `backend/server.js`
    - `frontend/src/layouts/AdminLayout.jsx`
    - `frontend/src/pages/ClassDetail.jsx`
  - `FILES TO CREATE`:
    - `backend/models/Schedule.js`
    - `backend/models/ClassSession.js`
    - `backend/controllers/scheduleController.js`
    - `backend/controllers/sessionController.js`
    - `backend/routes/scheduleRoutes.js`
    - `backend/routes/sessionRoutes.js`
    - `frontend/src/pages/SchedulePage.jsx`
  - `FILES TO DEPRECATE LATER`: Không có.
- **8. Dependencies:**
  - Hoàn thành Phase 3 (Cần `Class` và `Enrollment`).
- **9. Risks:**
  - Sai lệch ngày sinh buổi học do chênh lệch múi giờ giữa UTC và Local Time.
  - *Biện pháp:* Lưu trữ `sessionDate` chuẩn phần ngày và tính toán cộng ngày dựa trên lịch địa phương không lệch giờ.
- **10. Test Cases:**
  - `TC4.1`: Tạo Schedule cho Giáo viên A vào Thứ 2 (17:30 - 19:00) tại Phòng 101 $\rightarrow$ Thành công.
  - `TC4.2`: Tạo Schedule khác cho Giáo viên A vào Thứ 2 (18:00 - 19:30) $\rightarrow$ Nhận lỗi `409 Conflict` (Xung đột lịch giáo viên).
  - `TC4.3`: Tạo Schedule cho Giáo viên B vào Thứ 2 (18:30 - 20:00) tại cùng Phòng 101 $\rightarrow$ Nhận lỗi `409 Conflict` (Xung đột phòng học).
  - `TC4.4`: Gọi API `POST /api/classes/:classId/sessions/generate` $\rightarrow$ Sinh đúng số lượng buổi học tương ứng các ngày Thứ 2 trong khoảng thời gian của lớp.
- **11. Acceptance Criteria:**
  - Thuật toán Service chặn chính xác các xung đột thời gian của Giáo viên, Phòng học và Học viên.
  - Sinh đầy đủ các buổi học thực tế của khóa học.
- **12. Definition of Done:**
  - Hệ thống thời khóa biểu và buổi học hoạt động ổn định; không cho phép xếp trùng lịch.
- **13. Suggested Git Commit:**
  - `feat: implement weekly schedules class sessions and conflict detection service`

---

### PHASE 5 — ATTENDANCE MIGRATION (ĐIỂM DANH THEO BUỔI HỌC CHUẨN XÁC)

- **1. Objective (Mục tiêu):**
  - Chuyển đổi mô hình điểm danh cũ của trường đại học (`Student + Course + Date`) sang mô hình trung tâm Anh ngữ chuẩn (`Student + ClassSession`). Cưỡng chế Compound Unique Index và hỗ trợ thao tác Bulk Upsert 1-click.
  - Chuẩn hóa Enum trạng thái Điểm danh: `['Present', 'Absent', 'Late', 'Excused']`.
- **2. Existing Code Reused (Mã nguồn tái sử dụng):**
  - Giao diện bảng chọn trạng thái điểm danh và tương tác nút bấm từ `frontend/src/pages/ProfAttendance.jsx`.
- **3. Backend Tasks:**
  - Cập nhật model `backend/models/Attendance.js` (Khớp chính xác `03-data-model-spec.md`):
    - `student`: `ObjectId`, `ref: 'Student'`, bắt buộc.
    - `class`: `ObjectId`, `ref: 'Class'`, bắt buộc.
    - `session`: `ObjectId`, `ref: 'ClassSession'`, bắt buộc.
    - `status`: `String`, `enum: ['Present', 'Absent', 'Late', 'Excused']`, mặc định `'Present'`.
    - `note`: `String`.
    - `markedBy`: `ObjectId`, `ref: 'User'`, bắt buộc.
    - `markedAt`: `Date`, mặc định `Date.now`.
    - **Compound Unique Index bắt buộc:**
      ```javascript
      attendanceSchema.index({ session: 1, student: 1 }, { unique: true });
      ```
  - Xây dựng `backend/controllers/attendanceController.js`:
    - `PUT /api/sessions/:sessionId/attendance` (Bulk Upsert):
      - Nhận body: `{ records: [{ studentId, status, note }] }`.
      - Kiểm tra quyền: Giáo viên chỉ được điểm danh buổi học thuộc lớp mình phụ trách.
      - Sử dụng `bulkWrite` với thao tác `updateOne` (kèm `upsert: true`) theo cặp `(session, student)` để lưu nhanh toàn bộ lớp học trong một query an toàn, không lo duplicate.
    - `GET /api/sessions/:sessionId/attendance`: Lấy danh sách điểm danh của buổi học.
    - `GET /api/student/me/attendance`: Dành cho Học viên xem lịch sử điểm danh của cá nhân mình (không nhận `studentId` trên URL).
  - Cấu hình routes khớp chuẩn `04-api-spec.md`: `backend/routes/attendanceRoutes.js`. Mount vào `server.js`.
- **4. Frontend Tasks:**
  - Xây dựng lại màn hình Điểm danh `frontend/src/pages/AttendancePage.jsx` (thay thế `ProfAttendance.jsx`):
    - Quy trình 3 bước trực quan: Chọn Lớp $\rightarrow$ Chọn Buổi học $\rightarrow$ Bảng điểm danh học viên.
    - Nút thao tác nhanh 1-click: **[Điểm danh tất cả Có mặt (Mark All Present)]**.
    - Cảnh báo người dùng khi chuyển trang nếu có thay đổi chưa lưu (`Unsaved Changes Warning`).
  - Cập nhật trang `frontend/src/pages/StudentAttendance.jsx`: Học viên xem lịch sử có mặt/vắng theo từng buổi học.
- **5. Models Affected:**
  - `Attendance` (`backend/models/Attendance.js`).
- **6. APIs Affected (Khớp 100% `04-api-spec.md`):**
  - `GET /api/sessions/:sessionId/attendance`
  - `PUT /api/sessions/:sessionId/attendance` (Bulk Upsert)
  - `GET /api/student/me/attendance`
- **7. Files Affected:**
  - `FILES TO MODIFY`:
    - `backend/models/Attendance.js`
    - `backend/server.js`
    - `frontend/src/pages/StudentAttendance.jsx`
  - `FILES TO CREATE`:
    - `backend/controllers/attendanceController.js`
    - `backend/routes/attendanceRoutes.js`
    - `frontend/src/pages/AttendancePage.jsx`
  - `FILES TO DEPRECATE LATER`:
    - `frontend/src/pages/ProfAttendance.jsx`
- **8. Dependencies:**
  - Hoàn thành Phase 4 (Cần `ClassSession`).
- **9. Risks:**
  - Hai giáo viên cùng lưu điểm danh cho một buổi dẫn đến dữ liệu bị ghi đè không kiểm soát.
  - *Biện pháp:* Kiểm tra quyền giáo viên phụ trách buổi học trước khi thực hiện `bulkWrite`.
- **10. Test Cases:**
  - `TC5.1`: Giáo viên phụ trách mở buổi học và bấm "Điểm danh tất cả Có mặt" $\rightarrow$ Gọi `PUT /api/sessions/:sessionId/attendance` lưu thành công toàn bộ học viên `Present`.
  - `TC5.2`: Bấm lưu lần thứ 2 với cùng dữ liệu $\rightarrow$ Không sinh thêm bản ghi mới nhờ Compound Unique Index.
  - `TC5.3`: Giáo viên không phụ trách lớp gửi request điểm danh $\rightarrow$ Bị chặn lỗi `403 Forbidden`.
  - `TC5.4`: Lễ tân mở màn hình điểm danh $\rightarrow$ Chỉ được xem dạng Read-only, không có nút chỉnh sửa.
  - `TC5.5`: Học viên A gọi `GET /api/student/me/attendance` $\rightarrow$ Chỉ thấy lịch sử của chính mình, không thấy của học viên khác.
- **11. Acceptance Criteria:**
  - Điểm danh gắn chặt với từng buổi học cụ thể.
  - Không thể xảy ra bản ghi trùng lặp cho một học viên trong cùng một buổi học.
  - Tách bạch quyền hạn thao tác giữa Giáo viên phụ trách, Lễ tân và Học viên.
- **12. Definition of Done:**
  - Điểm danh hoàn thành chuyển đổi sang mô hình Buổi học; tính năng Bulk Upsert và kiểm soát quyền hoạt động hoàn hảo.
- **13. Suggested Git Commit:**
  - `feat: migrate attendance module to session based bulk upsert model`

---

### PHASE 6 — LEARNING RESULTS (KẾT QUẢ ĐÁNH GIÁ 4 KỸ NĂNG)

- **1. Objective (Mục tiêu):**
  - Xây dựng phân hệ Quản lý Kết quả Học tập chuyên biệt cho trung tâm Anh ngữ: Đánh giá độc lập 4 kỹ năng (`listeningScore`, `speakingScore`, `readingScore`, `writingScore`) theo chuẩn thang điểm 0 – 100 và tính toán `overallScore`.
  - Chuẩn hóa Enum loại bài test: `['placement', 'midterm', 'final', 'mock']`.
- **2. Existing Code Reused (Mã nguồn tái sử dụng):**
  - Không có module điểm số trong mã nguồn cũ; xây dựng mới theo chuẩn VLearn.
- **3. Backend Tasks:**
  - Tạo model `backend/models/LearningResult.js` (Khớp chính xác `03-data-model-spec.md`):
    - `student`: `ObjectId`, `ref: 'Student'`, bắt buộc.
    - `class`: `ObjectId`, `ref: 'Class'`, bắt buộc.
    - `testType`: `String`, `enum: ['placement', 'midterm', 'final', 'mock']`, mặc định `'midterm'`.
    - `testDate`: `Date`, mặc định `Date.now`.
    - `listeningScore`: `{ type: Number, min: 0, max: 100 }`.
    - `speakingScore`: `{ type: Number, min: 0, max: 100 }`.
    - `readingScore`: `{ type: Number, min: 0, max: 100 }`.
    - `writingScore`: `{ type: Number, min: 0, max: 100 }`.
    - `overallScore`: `{ type: Number, min: 0, max: 100, default: 0 }`.
    - `teacherComment`: `String`.
    - `enteredBy`: `ObjectId`, `ref: 'User'`, bắt buộc.
    - Compound Index: `{ student: 1, class: 1, testType: 1 }`.
  - Xây dựng `backend/controllers/learningResultController.js`:
    - `GET /api/classes/:classId/results`: Xem bảng điểm của lớp theo bài test.
    - `POST /api/classes/:classId/results`: Nhập điểm đợt kiểm tra mới cho học viên trong lớp (kiểm tra quyền giáo viên phụ trách lớp; tự động tính `overallScore = Math.round((L + S + R + W) / 4)`).
    - `PUT /api/results/:id`: Chỉnh sửa điểm số hoặc nhận xét của bài kiểm tra.
    - `GET /api/student/me/results`: Học viên tra cứu toàn bộ bảng điểm của cá nhân mình.
  - Cấu hình routes khớp chuẩn `04-api-spec.md`: `backend/routes/learningResultRoutes.js`. Mount vào `server.js`.
- **4. Frontend Tasks:**
  - Xây dựng trang `frontend/src/pages/ResultsEntryPage.jsx` dành cho Giáo viên:
    - Bảng nhập điểm tương tác nhanh (Spreadsheet-like), tự động tính điểm tổng kết ngay trên giao diện khi giáo viên gõ điểm từng kỹ năng.
    - Kiểm tra tại chỗ (Validation): Báo đỏ nếu nhập điểm $< 0$ hoặc $> 100$.
  - Xây dựng trang `frontend/src/pages/StudentResultsPage.jsx` dành cho Học viên:
    - Thẻ điểm trực quan (Card) hiển thị 4 cột điểm kỹ năng, điểm trung bình và nhận xét chi tiết của giáo viên.
- **5. Models Affected:**
  - Tạo mới: `LearningResult` (`backend/models/LearningResult.js`).
- **6. APIs Affected (Khớp 100% `04-api-spec.md`):**
  - `GET /api/classes/:classId/results`
  - `POST /api/classes/:classId/results`
  - `PUT /api/results/:id`
  - `GET /api/student/me/results`
- **7. Files Affected:**
  - `FILES TO MODIFY`:
    - `backend/server.js`
    - `frontend/src/layouts/TeacherLayout.jsx`
    - `frontend/src/layouts/StudentLayout.jsx`
  - `FILES TO CREATE`:
    - `backend/models/LearningResult.js`
    - `backend/controllers/learningResultController.js`
    - `backend/routes/learningResultRoutes.js`
    - `frontend/src/pages/ResultsEntryPage.jsx`
    - `frontend/src/pages/StudentResultsPage.jsx`
  - `FILES TO DEPRECATE LATER`: Không có.
- **8. Dependencies:**
  - Hoàn thành Phase 3 (Cần `Class` và `Student`).
- **9. Risks:**
  - Người dùng nhập điểm số âm hoặc vượt quá 100 gây sai lệch tính toán học lực.
  - *Biện pháp:* Ràng buộc chặt chẽ cả ở Frontend validation và Mongoose Schema validation (`min: 0, max: 100`); trả về `422 Unprocessable Entity` nếu vi phạm.
- **10. Test Cases:**
  - `TC6.1`: Giáo viên nhập điểm bài kiểm tra: L=80, S=85, R=75, W=90 $\rightarrow$ Điểm `overallScore` tự động tính là 83; lưu thành công qua `POST /api/classes/:classId/results`.
  - `TC6.2`: Cố tình nhập điểm `listeningScore = 105` $\rightarrow$ Backend trả lỗi `422 Unprocessable Entity`.
  - `TC6.3`: Giáo viên lớp khác cố tình gửi request sửa điểm $\rightarrow$ Bị chặn lỗi `403 Forbidden`.
  - `TC6.4`: Học viên gọi `GET /api/student/me/results` $\rightarrow$ Hiển thị chính xác bảng điểm và nhận xét của giáo viên.
- **11. Acceptance Criteria:**
  - Điểm số chuẩn hóa 0 – 100 cho 4 kỹ năng tiếng Anh.
  - Tự động tính điểm tổng kết chính xác.
  - Phân quyền chặt chẽ: Giáo viên chỉ nhập lớp mình dạy; Học viên chỉ xem điểm của bản thân.
- **12. Definition of Done:**
  - Nhập điểm và tra cứu kết quả 4 kỹ năng hoạt động chuẩn xác, an toàn dữ liệu.
- **13. Suggested Git Commit:**
  - `feat: implement learning results module with 4 english skills evaluation`

---

### PHASE 7 — TUITION & PAYMENT (PHÂN HỆ HỌC PHÍ & THANH TOÁN - RỦI RO CAO)

> ⚠️ **PHASE RỦI RO CAO NHẤT:** Tuyệt đối không triển khai chung với module khác. Yêu cầu tuân thủ nghiêm ngặt tính toàn vẹn số liệu tài chính, sử dụng MongoDB Session Transactions và cơ chế Hủy phiếu thu (`voided`), không xóa cứng.

- **1. Objective (Mục tiêu):**
  - Xây dựng phân hệ Hóa đơn học phí (`TuitionInvoice`) và Thu tiền nhiều đợt (`Payment`).
  - **Kích hoạt cơ chế Tự động sinh Hóa đơn khi Ghi danh:** Cập nhật luồng `POST /api/classes/:classId/enrollments` để tự động tạo `TuitionInvoice`.
  - Cưỡng chế số tiền thu $> 0$. Chặn thu thừa. Sử dụng MongoDB Transaction đảm bảo tính toàn vẹn số dư. Chỉ cho phép Admin hủy phiếu thu (`voided`), tuyệt đối không xóa cứng bản ghi thanh toán.
  - Chuẩn hóa Enum phương thức thanh toán khớp chính xác `03-data-model-spec.md`: `['cash', 'bank_transfer', 'card']` (Không đưa `credit_card` hay `other` vào MVP).
  - Chuẩn hóa Enum trạng thái Hóa đơn: `['unpaid', 'partial', 'paid', 'overdue', 'cancelled']`.
- **2. Existing Code Reused (Mã nguồn tái sử dụng):**
  - ToastContext thông báo trạng thái và ConfirmModal từ frontend.
- **3. Backend Tasks:**
  - Tạo model `backend/models/TuitionInvoice.js` (Khớp chính xác `03-data-model-spec.md`):
    - `invoiceCode`: `String`, `unique: true`, bắt buộc (VD: `INV-2026-0001`).
    - `student`: `ObjectId`, `ref: 'Student'`, bắt buộc.
    - `enrollment`: `ObjectId`, `ref: 'Enrollment'`, bắt buộc.
    - `class`: `ObjectId`, `ref: 'Class'`, bắt buộc.
    - `totalAmount`: `Number`, bắt buộc ($\ge 0$).
    - `paidAmount`: `Number`, mặc định 0 ($\ge 0$).
    - `remainingAmount`: `Number`, bắt buộc (`totalAmount - paidAmount`).
    - `status`: `String`, `enum: ['unpaid', 'partial', 'paid', 'overdue', 'cancelled']`, mặc định `'unpaid'`.
    - `dueDate`: `Date`, tùy chọn.
    - `createdBy`: `ObjectId`, `ref: 'User'`, bắt buộc.
    - `note`: `String`.
  - Tạo model `backend/models/Payment.js` (Khớp chính xác `03-data-model-spec.md`):
    - `paymentCode`: `String`, `unique: true`, bắt buộc (VD: `PAY-2026-0001`).
    - `invoice`: `ObjectId`, `ref: 'TuitionInvoice'`, bắt buộc.
    - `student`: `ObjectId`, `ref: 'Student'`, bắt buộc.
    - `amount`: `Number`, bắt buộc (**bắt buộc `amount > 0`**, không có số âm).
    - `paymentDate`: `Date`, mặc định `Date.now`.
    - `paymentMethod`: `String`, `enum: ['cash', 'bank_transfer', 'card']`, mặc định `'cash'`.
    - `transactionCode`: `String` (mã giao dịch ngân hàng / UNC).
    - `status`: `String`, `enum: ['completed', 'voided']`, mặc định `'completed'`.
    - `voidReason`: `String`.
    - `voidedBy`: `ObjectId`, `ref: 'User'` (**Chỉ Admin**).
    - `voidedAt`: `Date`.
    - `note`: `String`.
    - `createdBy`: `ObjectId`, `ref: 'User'`, bắt buộc.
  - **Cập nhật Luồng Ghi danh (Activate Auto Invoice on Enrollment):**
    - Cập nhật `enrollmentController.js`: Khi ghi danh thành công qua `POST /api/classes/:classId/enrollments`, tự động sinh bản ghi `TuitionInvoice` tương ứng với `totalAmount = class.tuitionFee`, `paidAmount = 0`, `remainingAmount = class.tuitionFee`, `status = 'unpaid'`.
  - Xây dựng `backend/controllers/tuitionController.js`:
    - `GET /api/tuition/invoices`: Danh sách hóa đơn (lọc `status`, `studentId`, `classId`).
    - `POST /api/tuition/invoices`: Tạo hóa đơn học phí bổ sung.
    - `GET /api/tuition/invoices/:id`: Chi tiết hóa đơn (kèm danh sách Payments đã thu).
    - `PUT /api/tuition/invoices/:id`: Cập nhật hạn nộp (`dueDate`) hoặc ghi chú (Cấm sửa trực tiếp `paidAmount`/`remainingAmount`).
    - `GET /api/student/me/invoices`: Học viên xem hóa đơn học phí cá nhân.
  - Xây dựng `backend/controllers/paymentController.js`:
    - `POST /api/tuition/invoices/:invoiceId/payments` (Ghi nhận nộp tiền):
      - Bắt buộc dùng `mongoose.startSession()` và `session.withTransaction()`.
      - Khóa và kiểm tra hóa đơn: Nếu `amount > invoice.remainingAmount` $\rightarrow$ Hủy giao dịch, trả về `409 Conflict` ("Số tiền thanh toán vượt quá số dư còn thiếu").
      - Tạo bản ghi `Payment` với `status: 'completed'`.
      - Cập nhật hóa đơn: `paidAmount += amount`, `remainingAmount = totalAmount - paidAmount`.
      - Cập nhật trạng thái: Nếu `remainingAmount === 0` $\rightarrow$ `'paid'`, ngược lại `'partial'`.
    - `POST /api/payments/:id/void` (Hủy giao dịch thu sai - **Admin Only**):
      - Bắt buộc dùng `session.withTransaction()`.
      - Kiểm tra phiếu thu: Nếu đã ở trạng thái `'voided'` $\rightarrow$ Báo lỗi `400 Bad Request`.
      - Yêu cầu bắt buộc nhập `voidReason`.
      - Đổi trạng thái phiếu thu thành `'voided'`, lưu `voidedBy = req.user.id` và `voidedAt = new Date()`.
      - Trừ ngược số tiền khỏi hóa đơn: `paidAmount -= payment.amount`, `remainingAmount = totalAmount - paidAmount`.
      - Cập nhật lại trạng thái hóa đơn: Nếu `paidAmount === 0` $\rightarrow$ `'unpaid'`, ngược lại `'partial'`.
    - `GET /api/tuition/invoices/:invoiceId/payments`: Lấy lịch sử thu tiền của hóa đơn.
    - `GET /api/payments/:id`: Xem chi tiết phiếu thu.
    - `GET /api/student/me/payments`: Học viên xem lịch sử đóng tiền của chính mình.
    - **Tuyệt đối KHÔNG tạo endpoint** `DELETE /api/payments/:id`.
  - Cấu hình routes khớp chuẩn `04-api-spec.md`:
    - `backend/routes/tuitionRoutes.js`
    - `backend/routes/paymentRoutes.js`
  - Mount routes vào `backend/server.js`.
- **4. Frontend Tasks:**
  - Xây dựng trang `frontend/src/pages/TuitionListPage.jsx`: Danh sách hóa đơn học phí, tổng hợp công nợ, tìm kiếm theo mã học viên/hóa đơn.
  - Xây dựng trang `frontend/src/pages/InvoiceDetailPage.jsx`:
    - Thẻ tóm tắt 3 chỉ số tài chính lớn: Tổng học phí - Đã thu - Còn thiếu.
    - Bảng lịch sử các đợt thanh toán (hiển thị rõ phiếu nào đã thu, phiếu nào bị hủy gạch ngang kèm lý do).
  - Xây dựng modal `frontend/src/components/PaymentModal.jsx`: Cho phép nhập số tiền nộp (kiểm tra tức thì $\le$ số tiền còn thiếu, phương thức thanh toán: Tiền mặt, Chuyển khoản, Thẻ).
  - Xây dựng hộp thoại `frontend/src/components/VoidPaymentDialog.jsx`: Dành cho Admin xác nhận hủy phiếu và bắt buộc nhập lý do hủy.
- **5. Models Affected:**
  - Tạo mới: `TuitionInvoice` (`backend/models/TuitionInvoice.js`), `Payment` (`backend/models/Payment.js`).
- **6. APIs Affected (Khớp 100% `04-api-spec.md`):**
  - **Tuition Invoice APIs:**
    - `GET /api/tuition/invoices`
    - `POST /api/tuition/invoices`
    - `GET /api/tuition/invoices/:id`
    - `PUT /api/tuition/invoices/:id`
    - `GET /api/student/me/invoices`
  - **Payment APIs:**
    - `POST /api/tuition/invoices/:invoiceId/payments` (Transaction)
    - `GET /api/tuition/invoices/:invoiceId/payments`
    - `GET /api/payments/:id`
    - `POST /api/payments/:id/void` (Admin Only, Transaction)
    - `GET /api/student/me/payments`
- **7. Files Affected:**
  - `FILES TO MODIFY`:
    - `backend/server.js`
    - `backend/controllers/enrollmentController.js` (Kích hoạt tạo hóa đơn tự động khi ghi danh)
    - `frontend/src/layouts/AdminLayout.jsx`
    - `frontend/src/layouts/ReceptionistLayout.jsx`
  - `FILES TO CREATE`:
    - `backend/models/TuitionInvoice.js`
    - `backend/models/Payment.js`
    - `backend/controllers/tuitionController.js`
    - `backend/controllers/paymentController.js`
    - `backend/routes/tuitionRoutes.js`
    - `backend/routes/paymentRoutes.js`
    - `frontend/src/pages/TuitionListPage.jsx`
    - `frontend/src/pages/InvoiceDetailPage.jsx`
    - `frontend/src/components/PaymentModal.jsx`
    - `frontend/src/components/VoidPaymentDialog.jsx`
  - `FILES TO DEPRECATE LATER`: Không có.
- **8. Dependencies:**
  - Hoàn thành Phase 3 (Cần `Enrollment` và `Class`).
- **9. Risks:**
  - Lỗi bất đồng bộ dữ liệu giữa tổng tiền thanh toán và trạng thái hóa đơn nếu MongoDB không có Transaction.
  - Người dùng nhập số tiền âm hoặc bằng 0 làm sai lệch sổ cái.
  - *Biện pháp:* Bắt buộc dùng `session.withTransaction()` và kiểm tra chặt chẽ `amount > 0`.
- **10. Test Cases (Kịch bản Nghiệm thu Bắt buộc):**
  - `TC7.1`: Học viên ghi danh lớp học phí `4.500.000 VNĐ` $\rightarrow$ Tự động sinh hóa đơn `totalAmount = 4.500.000`, `paidAmount = 0`, `remainingAmount = 4.500.000`, trạng thái `unpaid`.
  - `TC7.2`: Lễ tân thu tiền đợt 1 là `2.000.000 VNĐ` qua `POST /api/tuition/invoices/:invoiceId/payments` $\rightarrow$ Hóa đơn cập nhật `paidAmount = 2.000.000`, `remainingAmount = 2.500.000`, trạng thái chuyển sang `partial`.
  - `TC7.3`: Cố tình thu tiền đợt 2 là `3.000.000 VNĐ` $\rightarrow$ Backend hủy giao dịch và báo lỗi `409 Conflict` (Chặn thu thừa).
  - `TC7.4`: Thu tiền đợt 2 đúng `2.500.000 VNĐ` $\rightarrow$ Hóa đơn cập nhật `paidAmount = 4.500.000`, `remainingAmount = 0`, trạng thái chuyển sang `paid`.
  - `TC7.5`: Lễ tân thử gọi API hủy phiếu thu `POST /api/payments/:id/void` $\rightarrow$ Bị chặn lỗi `403 Forbidden` (Chỉ Admin mới có quyền).
  - `TC7.6`: Admin thực hiện Hủy phiếu thu đợt 2 (`2.500.000 VNĐ`) có kèm lý do $\rightarrow$ Hóa đơn tự động tính lại `paidAmount = 2.000.000`, `remainingAmount = 2.500.000`, trạng thái quay về `partial`. Lịch sử thanh toán vẫn lưu đầy đủ cả 2 phiếu thu (phiếu 2 hiển thị trạng thái `voided`).
- **11. Acceptance Criteria:**
  - Số liệu công nợ và lịch sử thanh toán luôn khớp 100%.
  - Chặn hoàn toàn trường hợp thu thừa tiền.
  - Không có bất kỳ bản ghi thanh toán nào bị xóa vật lý khỏi database.
- **12. Definition of Done:**
  - Phân hệ tài chính chạy hoàn hảo, vượt qua 100% kịch bản kiểm thử toàn vẹn giao dịch và hủy phiếu.
- **13. Suggested Git Commit:**
  - `feat: implement tuition invoices and atomic payment ledger with void support`

---

### PHASE 8 — DASHBOARDS (BẢNG ĐIỀU KHIỂN CHUYÊN BIỆT THEO 4 ROLE)

- **1. Objective (Mục tiêu):**
  - Xây dựng 4 màn hình Dashboard chuyên biệt cho 4 vai trò, tổng hợp dữ liệu thực tế từ các module đã hoàn thiện (không hardcode dữ liệu giả).
  - Sử dụng đúng Enum trạng thái lớp học (`active`) trong tính toán KPI.
- **2. Existing Code Reused (Mã nguồn tái sử dụng):**
  - Cấu trúc layout thẻ thống kê từ `frontend/src/pages/AdminDashboard.jsx`.
- **3. Backend Tasks:**
  - Viết endpoint `GET /api/admin/dashboard`:
    - Tổng số học viên (`totalStudents`), học viên đang hoạt động (`activeStudents` có `academicStatus: 'active'`).
    - Tổng số giáo viên (`totalTeachers`).
    - Số lớp học đang diễn ra (`activeClasses` có `status: 'active'`).
    - Chỉ số tài chính: `totalTuition`, `paidTuition`, `outstandingTuition`.
    - Danh sách lớp học và ca dạy diễn ra hôm nay (`todayClasses`).
  - Viết endpoint `GET /api/receptionist/dashboard`:
    - Học viên mới tiếp nhận trong tuần.
    - Lớp học sắp khai giảng (`status: 'upcoming'`).
    - Danh sách học viên còn nợ học phí quá hạn (`status: 'overdue'` hoặc `'unpaid'`).
    - Các giao dịch thu tiền gần nhất.
  - Viết endpoint `GET /api/teacher/dashboard`:
    - Các lớp học được phân công phụ trách (`assignedClassesCount`).
    - Lịch dạy hôm nay (`todaySchedule`).
    - Thống kê chuyên cần của các lớp mình phụ trách (`attendanceSummary`).
  - Viết endpoint `GET /api/student/dashboard`:
    - Các lớp học đang theo học (`activeClassesCount`).
    - Thời khóa biểu tuần hiện tại (`weeklySchedule`).
    - Tỷ lệ chuyên cần cá nhân (`attendanceSummary`).
    - Kết quả đánh giá kỹ năng gần nhất (`latestTestResults`).
    - Tình trạng học phí cá nhân (`tuitionSummary`).
- **4. Frontend Tasks:**
  - Cập nhật trang `frontend/src/pages/AdminDashboard.jsx`: Hiển thị 6 thẻ KPI tài chính & học vụ, bảng lịch dạy hôm nay.
  - Xây dựng mới `frontend/src/pages/ReceptionistDashboard.jsx`: Tập trung vào công nợ, học viên mới và giao dịch thu tiền.
  - Xây dựng mới `frontend/src/pages/TeacherDashboard.jsx` (thay thế `ProfDashboard.jsx`): Lịch giảng dạy và thống kê chuyên cần.
  - Cập nhật trang `frontend/src/pages/StudentDashboard.jsx`: Cổng thông tin học tập tổng hợp của học viên.
- **5. Models Affected:**
  - Tổng hợp dữ liệu từ: `Student`, `Teacher`, `Class`, `ClassSession`, `Attendance`, `LearningResult`, `TuitionInvoice`.
- **6. APIs Affected (Khớp 100% `04-api-spec.md`):**
  - `GET /api/admin/dashboard`
  - `GET /api/receptionist/dashboard`
  - `GET /api/teacher/dashboard`
  - `GET /api/student/dashboard`
- **7. Files Affected:**
  - `FILES TO MODIFY`:
    - `backend/controllers/adminController.js`
    - `backend/controllers/studentController.js`
    - `frontend/src/pages/AdminDashboard.jsx`
    - `frontend/src/pages/StudentDashboard.jsx`
  - `FILES TO CREATE`:
    - `frontend/src/pages/ReceptionistDashboard.jsx`
    - `frontend/src/pages/TeacherDashboard.jsx`
  - `FILES TO DEPRECATE LATER`:
    - `frontend/src/pages/ProfDashboard.jsx`
- **8. Dependencies:**
  - Hoàn thành các Phase 2, 3, 4, 5, 6, 7.
- **9. Risks:**
  - Tải dữ liệu dashboard bị chậm nếu thực hiện nhiều câu truy vấn đếm (`countDocuments`) không có index.
  - *Biện pháp:* Tận dụng MongoDB Aggregation pipeline và các chỉ mục đã đánh ở các phase trước.
- **10. Test Cases:**
  - `TC8.1`: Admin đăng nhập $\rightarrow$ Thấy đúng doanh thu và công nợ tính từ các hóa đơn thực tế.
  - `TC8.2`: Giáo viên đăng nhập $\rightarrow$ Thấy đúng danh sách ca dạy hôm nay của mình.
  - `TC8.3`: Học viên đăng nhập $\rightarrow$ Thấy đúng thời khóa biểu và trạng thái nộp tiền của mình.
- **11. Acceptance Criteria:**
  - 100% số liệu hiển thị trên cả 4 Dashboard được truy vấn động từ database; không có số liệu tĩnh.
- **12. Definition of Done:**
  - Bảng điều khiển của cả 4 vai trò tải nhanh, hiển thị số liệu chính xác và sinh động.
- **13. Suggested Git Commit:**
  - `feat: implement real time dynamic dashboards for 4 roles`

---

### PHASE 9 — UTILITY MODULE MIGRATION (THÔNG BÁO & TÀI LIỆU HỌC TẬP)

- **1. Objective (Mục tiêu):**
  - Chuyển đổi 2 module phụ trợ hiện có (`Notice` và `StudyMaterial`) để gắn kết trực tiếp với mô hình Lớp học kỹ năng VLearn mới.
  - Chuẩn hóa Enum `audience` cho Notice khớp `03-data-model-spec.md`: `['all', 'teacher', 'student', 'receptionist']`.
- **2. Existing Code Reused (Mã nguồn tái sử dụng):**
  - Bộ điều khiển tải file Multer trong `backend/middleware/uploadMiddleware.js`.
  - Giao diện bảng thông báo trong `frontend/src/pages/NoticeBoard.jsx`.
- **3. Backend Tasks:**
  - Cập nhật model `backend/models/Notice.js` (Khớp chính xác `03-data-model-spec.md`):
    - `title`: `String`, bắt buộc.
    - `content`: `String`, bắt buộc.
    - `audience`: `String`, `enum: ['all', 'teacher', 'student', 'receptionist']`, mặc định `'all'`.
    - `createdBy`: `ObjectId`, `ref: 'User'`, bắt buộc.
  - Cập nhật model `backend/models/StudyMaterial.js` (Khớp chính xác `03-data-model-spec.md`):
    - `title`: `String`, bắt buộc.
    - `description`: `String`.
    - `fileUrl`: `String`, bắt buộc.
    - `class`: `ObjectId`, `ref: 'Class'`, bắt buộc (thay thế `course` cũ).
    - `uploadedBy`: `ObjectId`, `ref: 'User'`, bắt buộc.
  - Xây dựng controllers và routes khớp chuẩn `04-api-spec.md`.
- **4. Frontend Tasks:**
  - Cập nhật trang `frontend/src/pages/NoticeBoard.jsx`: Hiển thị huy hiệu đối tượng nhận thông báo.
  - Xây dựng trang `frontend/src/pages/StudyMaterialsPage.jsx`: Cho phép Giáo viên tải tài liệu lên theo lớp học và Học viên tải tài liệu của lớp mình đang theo học.
- **5. Models Affected:**
  - `Notice` (`backend/models/Notice.js`), `StudyMaterial` (`backend/models/StudyMaterial.js`).
- **6. APIs Affected (Khớp 100% `04-api-spec.md`):**
  - **Notice APIs (`/api/notices`):**
    - `GET /api/notices` (Lọc theo audience của role người dùng)
    - `POST /api/notices`
    - `PUT /api/notices/:id`
    - `DELETE /api/notices/:id`
  - **StudyMaterial APIs:**
    - `GET /api/classes/:classId/materials`
    - `POST /api/classes/:classId/materials` (Multipart/form-data upload)
    - `DELETE /api/materials/:id`
- **7. Files Affected:**
  - `FILES TO MODIFY`:
    - `backend/models/Notice.js`
    - `backend/models/StudyMaterial.js`
    - `frontend/src/pages/NoticeBoard.jsx`
  - `FILES TO CREATE`:
    - `frontend/src/pages/StudyMaterialsPage.jsx`
  - `FILES TO DEPRECATE LATER`:
    - `frontend/src/pages/ProfMaterials.jsx`
    - `frontend/src/pages/StudentMaterials.jsx`
- **8. Dependencies:**
  - Hoàn thành Phase 3 (Cần `Class`).
- **9. Risks:**
  - Lỗi đường dẫn lưu file tải lên trên server.
  - *Biện pháp:* Kiểm tra thư mục `backend/uploads/` đảm bảo quyền ghi file của tiến trình Node.js.
- **10. Test Cases:**
  - `TC9.1`: Admin đăng thông báo với đối tượng `student` $\rightarrow$ Chỉ hiển thị trên bảng tin của học viên.
  - `TC9.2`: Giáo viên tải file PDF bài giảng lên Lớp Listening K10 $\rightarrow$ Học viên thuộc lớp Listening K10 nhìn thấy và tải được file.
- **11. Acceptance Criteria:**
  - Thông báo lọc đúng đối tượng nhận; Tài liệu học tập gắn chặt với từng Lớp học.
- **12. Definition of Done:**
  - Cả 2 module phụ trợ hoạt động trơn tru với mô hình mới.
  - 🎯 **ĐÁNH DẤU CỘT MỐC: TOÀN BỘ LOGIC NGHIỆP VỤ HỆ THỐNG VLEARN MVP FUNCTIONALLY COMPLETE!**
- **13. Suggested Git Commit:**
  - `feat: migrate notice board and study materials to vlearn class structure`

---

### PHASE 10 — UI/UX MIGRATION & POLISH (CHUẨN HÓA GIAO DIỆN SAAS ADMIN)

- **1. Objective (Mục tiêu):**
  - Áp dụng triệt để tài liệu thiết kế `docs/specs/05-ui-ux-spec.md` vào toàn bộ ứng dụng; loại bỏ dứt điểm giao diện thô sơ cũ; chuẩn hóa Design Tokens, màu sắc hiện đại (Modern Education SaaS Admin), Typography, hệ thống Card Grid, Table, Modal và Responsive.
  - ⚠️ **QUY TẮC BẤT DI BẤT DỊCH:** Tuyệt đối không thay đổi bất kỳ dòng logic nghiệp vụ hay API nào trong phase này!
- **2. Existing Code Reused (Mã nguồn tái sử dụng):**
  - Toàn bộ các logic hook và gọi API đã hoàn thành từ Phase 1 đến Phase 9.
- **3. Backend Tasks:**
  - Không có task backend trong phase này.
- **4. Frontend Tasks:**
  - Chuẩn hóa hệ thống Design Tokens tại `frontend/src/index.css`:
    - Primary Color: Blue `#2563EB`, Hover `#1D4ED8`.
    - Success/Finance: Emerald Green `#059669`.
    - Nền: Slate 50 `#F8FAFC`, Bề mặt thẻ: White `#FFFFFF`.
    - Đường viền: Slate 200 `#E2E8F0`, Chữ: Slate 800 `#1E293B` và Slate 500 `#64748B`.
    - Bảng màu 4 kỹ năng: Listening (Blue), Speaking (Purple), Reading (Orange), Writing (Green).
  - Xây dựng thư viện Reusable UI Components tại `frontend/src/components/common/`:
    - `StatCard.jsx`: Thẻ KPI chuẩn hóa icon, số liệu to rõ, badge xu hướng.
    - `DataTable.jsx`: Bảng chuẩn hóa header, hover row, phân trang, trạng thái rỗng.
    - `StatusBadge.jsx`: Huy hiệu trạng thái với màu nền mềm mại (`bg-opacity-10`).
    - `SkillBadge.jsx`: Huy hiệu hiển thị 4 kỹ năng tiếng Anh.
    - `DetailDrawer.jsx`: Ngăn kéo trượt xem nhanh thông tin học viên/giáo viên.
    - `LoadingSkeleton.jsx`: Hiệu ứng skeleton loading mượt mà khi tải dữ liệu.
    - `EmptyState.jsx` & `ErrorState.jsx`: Trạng thái rỗng và lỗi đồng bộ, lịch sự.
  - Tinh chỉnh giao diện các trang:
    - Làm đẹp AppLayout, Sidebar (thu gọn trên Tablet, drawer trên Mobile), TopHeader.
    - Làm đẹp ClassList dạng Grid Card trực quan; Attendance 3-step; Invoice Detail 3 thẻ chỉ số lớn.
- **5. Models Affected:** Không có.
- **6. APIs Affected:** Không có.
- **7. Files Affected:**
  - `FILES TO MODIFY`:
    - `frontend/src/index.css`
    - `frontend/src/App.css`
    - Toàn bộ các trang và layouts trong `frontend/src/pages/` và `frontend/src/layouts/`.
  - `FILES TO CREATE`:
    - `frontend/src/components/common/StatCard.jsx`
    - `frontend/src/components/common/DataTable.jsx`
    - `frontend/src/components/common/StatusBadge.jsx`
    - `frontend/src/components/common/SkillBadge.jsx`
    - `frontend/src/components/common/DetailDrawer.jsx`
    - `frontend/src/components/common/LoadingSkeleton.jsx`
    - `frontend/src/components/common/EmptyState.jsx`
  - `FILES TO DEPRECATE LATER`: Không có.
- **8. Dependencies:**
  - Hoàn thành Phase 9 (Dữ liệu và tính năng phải chạy ổn định trước).
- **9. Risks:**
  - Thay đổi CSS làm vỡ bố cục một số form hoặc modal cũ.
  - *Biện pháp:* Kiểm tra trực quan trên các độ phân giải màn hình phổ biến: 1920x1080, 1366x768, Tablet (768px), Mobile (375px).
- **10. Test Cases:**
  - `TC10.1`: Kiểm tra giao diện trên Desktop ($\ge 1280px$) $\rightarrow$ Bố cục rộng rãi, rõ ràng, card cân đối.
  - `TC10.2`: Thu nhỏ màn hình về Tablet ($768px$) $\rightarrow$ Sidebar tự động thu gọn.
  - `TC10.3`: Kiểm tra bảng dữ liệu khi không có bản ghi $\rightarrow$ Hiển thị `EmptyState` đẹp mắt thay vì bảng trống trơn.
- **11. Acceptance Criteria:**
  - Giao diện đạt chuẩn Modern Education SaaS Admin: Đẹp mắt, sạch sẽ, chuyên nghiệp, không màu mè rườm rà.
  - Không phát sinh lỗi logic nào sau khi làm đẹp giao diện.
- **12. Definition of Done:**
  - Toàn bộ hệ thống được khoác lên bộ nhận diện VLearn SaaS hoàn chỉnh, sẵn sàng cho kiểm toán bảo mật.
- **13. Suggested Git Commit:**
  - `style: apply modern vlearn education saas design system and ui components`

---

### PHASE 11 — SECURITY & AUTHORIZATION AUDIT (KIỂM TOÁN BẢO MẬT & PHÂN QUYỀN)

- **1. Objective (Mục tiêu):**
  - Rà soát thực nghiệm toàn bộ biên giới an ninh và ma trận phân quyền Zero-Trust đã quy định trong `docs/specs/02-role-permission-spec.md`. Đảm bảo không thể vượt quyền qua URL manipulation hay gọi trực tiếp API bằng Postman/curl.
- **2. Existing Code Reused (Mã nguồn tái sử dụng):**
  - Bộ middleware xác thực trong `backend/middleware/authMiddleware.js`.
- **3. Backend Tasks:**
  - Kiểm tra rà soát lại toàn bộ các route backend: Đảm bảo 100% route được bọc bởi `protect` và middleware phân quyền phù hợp (`adminOnly`, `receptionistOnly`, `teacherOnly`, `staffOnly`).
  - Kiểm tra điều kiện cô lập dữ liệu (Data Isolation):
    - Giáo viên không được xem thông tin lớp hoặc điểm danh của giáo viên khác.
    - Học viên không được xem thông tin cá nhân, điểm số, học phí của học viên khác.
  - Kiểm tra kiểm soát tài khoản bị khóa: Nếu `user.status === 'inactive'`, chặn ngay lập tức ở middleware xác thực token (kể cả khi JWT token còn hạn sử dụng).
- **4. Frontend Tasks:**
  - Kiểm tra toàn bộ các nút bấm nhạy cảm (Xóa, Hủy thanh toán, Phân quyền) chỉ hiển thị cho đúng vai trò được phép.
  - Thử nghiệm thao túng `localStorage` trên trình duyệt: Đảm bảo giao diện có thể hiển thị giả mạo nhưng API backend sẽ chặn đứng `403 Forbidden`.
- **5. Models Affected:** Không có.
- **6. APIs Affected:** Toàn bộ API hệ thống.
- **7. Files Affected:**
  - `FILES TO MODIFY`:
    - `backend/middleware/authMiddleware.js` (nếu phát hiện lỗ hổng sót lại)
    - Các file controller cần bổ sung điều kiện truy vấn cô lập dữ liệu.
  - `FILES TO CREATE`: Không có.
  - `FILES TO DEPRECATE LATER`: Không có.
- **8. Dependencies:**
  - Hoàn thành Phase 10.
- **9. Risks:**
  - Một số API nội bộ bị quên không gắn middleware bảo vệ cho phép truy cập nặc danh.
  - *Biện pháp:* Quét tự động toàn bộ file route trong `backend/routes/` để đảm bảo 100% endpoint đều có middleware kiểm tra quyền.
- **10. Test Cases (Kịch bản Kiểm thử Thâm nhập Thực tế):**
  - `TC11.1` (Lễ tân vượt quyền): Dùng token Receptionist gọi trực tiếp API `POST /api/accounts` $\rightarrow$ Backend chặn đứng với lỗi `403 Forbidden`.
  - `TC11.2` (Giáo viên xem tài chính): Dùng token Teacher gọi API `GET /api/tuition/invoices` hoặc `POST /api/tuition/invoices/:invoiceId/payments` $\rightarrow$ Backend chặn với lỗi `403 Forbidden`.
  - `TC11.3` (Giáo viên thao tác chéo lớp): Teacher A gửi request điểm danh cho buổi học của lớp do Teacher B phụ trách $\rightarrow$ Bị từ chối với lỗi `403 Forbidden`.
  - `TC11.4` (Học viên xem dữ liệu bạn học): Học viên A gọi API `GET /api/students/:id` truyền ID của Học viên B $\rightarrow$ Backend từ chối với lỗi `403 Forbidden`.
  - `TC11.5` (Khóa tài khoản tức thì): Admin chuyển trạng thái tài khoản của Teacher sang `inactive`. Teacher gửi request tiếp theo với token cũ còn hạn $\rightarrow$ Bị chặn ngay với lỗi `401 Unauthorized` ("Tài khoản đã bị vô hiệu hóa").
- **11. Acceptance Criteria:**
  - Vượt qua 100% kịch bản kiểm thử bảo mật thâm nhập; không có rò rỉ dữ liệu giữa các vai trò.
- **12. Definition of Done:**
  - Hệ thống đạt chuẩn bảo mật Zero-Trust, phân quyền cưỡng chế ở cả tầng Client và Server.
- **13. Suggested Git Commit:**
  - `test: verify strict zero trust authorization and data isolation boundaries`

---

### PHASE 12 — SEED DATA (KHỞI TẠO DỮ LIỆU MẪU VLEARN THỰC TẾ)

- **1. Objective (Mục tiêu):**
  - Xây dựng script `seedVLearn.js` tạo lập bộ dữ liệu mẫu trung tâm Anh ngữ VLearn phong phú, chân thực, chuẩn nghiệp vụ để phục vụ trình diễn và nghiệm thu trọn vẹn các màn hình Dashboard, Table, Chart.
  - > [!WARNING]
    > **CẢNH BÁO AN NINH DỮ LIỆU SEED (SECURITY WARNING):**  
    > **Tất cả tên đăng nhập và mật khẩu mẫu trong script seed CHỈ DÙNG CHO MÔI TRƯỜNG CỤC BỘ / DEMO (Local / Demo Environments Only) và TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP SỬ DỤNG TRÊN MÔI TRƯỜNG PRODUCTION.**
- **2. Existing Code Reused (Mã nguồn tái sử dụng):**
  - Cấu trúc kết nối Mongoose từ `backend/seedData.js`.
- **3. Backend Tasks:**
  - Xây dựng script `backend/scripts/seedVLearn.js`:
    - Tạo 4 tài khoản mẫu chuẩn để đăng nhập dễ nhớ cho môi trường demo:
      1. **Admin:** `admin@vlearn.edu.vn` / `admin123`
      2. **Receptionist:** `letan@vlearn.edu.vn` / `letan123`
      3. **Teacher:** `teacher@vlearn.edu.vn` / `teacher123` (TS. David Nguyễn - Kỹ năng Speaking)
      4. **Student:** `student@vlearn.edu.vn` / `student123` (Nguyễn Văn An - HV2026001)
    - Tạo 6 Giáo viên với đầy đủ chuyên môn các kỹ năng tiếng Anh (`listening`, `speaking`, `reading`, `writing`, `ielts`).
    - Tạo 30 Học viên với thông tin liên hệ và phụ huynh thực tế.
    - Tạo 8 Lớp học kỹ năng: Listening Foundation, IELTS Speaking Master, Speed Reading K12, Academic Writing K08... với trạng thái `active` hoặc `upcoming`.
    - Tạo Thời khóa biểu và tự động sinh các Buổi học diễn ra trong tháng với trạng thái `scheduled` hoặc `completed`.
    - Tạo dữ liệu Điểm danh mẫu với tỷ lệ thực tế (`Present`, `Absent`, `Late`, `Excused`).
    - Tạo Bảng điểm 4 kỹ năng (0 – 100) cho các đợt kiểm tra Midterm và Final.
    - Tạo Hóa đơn học phí và các đợt nộp tiền (`cash`, `bank_transfer`, `card`) (gồm cả hóa đơn đã hoàn thành, nộp một phần và chưa nộp).
    - Tạo các thông báo trên bảng tin và tài liệu học tập mẫu.
  - Thêm script chạy vào `backend/package.json`: `"seed:vlearn": "node scripts/seedVLearn.js"`.
- **4. Frontend Tasks:** Không có.
- **5. Models Affected:**
  - Nạp dữ liệu vào toàn bộ 11 Core Models và 2 Utility Models.
- **6. APIs Affected:** Không có.
- **7. Files Affected:**
  - `FILES TO MODIFY`:
    - `backend/package.json`
  - `FILES TO CREATE`:
    - `backend/scripts/seedVLearn.js`
  - `FILES TO DEPRECATE LATER`:
    - `backend/seed.js`
    - `backend/seedData.js`
    - `backend/seedFresh.js`
- **8. Dependencies:**
  - Hoàn thành các Phase 1 đến 9.
- **9. Risks:**
  - Dữ liệu seed bị trùng lặp khóa duy nhất nếu chạy nhiều lần.
  - *Biện pháp:* Bắt đầu script bằng lệnh xóa sạch các collection VLearn tương ứng trước khi nạp dữ liệu mới.
- **10. Test Cases:**
  - `TC12.1`: Chạy `npm run seed:vlearn` $\rightarrow$ Script chạy thành công không báo lỗi; in tóm tắt số lượng bản ghi đã tạo.
  - `TC12.2`: Đăng nhập thử lần lượt bằng cả 4 tài khoản demo mẫu $\rightarrow$ Đăng nhập trơn tru.
- **11. Acceptance Criteria:**
  - Dữ liệu phong phú, liên kết chuẩn xác giữa các collection, số liệu KPI trên dashboard hiển thị đầy đủ, đẹp mắt.
- **12. Definition of Done:**
  - Script seed hoàn tất và tạo ra môi trường demo hoàn hảo cho việc kiểm thử E2E.
- **13. Suggested Git Commit:**
  - `chore: add realistic vlearn center demo seed data script`

---

### PHASE 13 — END-TO-END VERIFICATION (KIỂM THỬ TOÀN DIỆN 8 LUỒNG NGHIỆP VỤ)

- **1. Objective (Mục tiêu):**
  - Thực hiện kiểm thử toàn diện 8 luồng nghiệp vụ khép kín từ đầu đến cuối trên trình duyệt thực tế, đảm bảo sự phối hợp nhịp nhàng giữa 4 vai trò người dùng trong hệ thống VLearn theo đúng các API paths đã đặc tả.
- **2. Existing Code Reused (Mã nguồn tái sử dụng):**
  - Toàn bộ hệ thống hoàn chỉnh sau Phase 12.
- **3. Backend Tasks:**
  - Giám sát log server để phát hiện các request lỗi trong quá trình thực nghiệm.
- **4. Frontend Tasks:**
  - Thực hiện tuần tự 8 luồng thao tác trực tiếp trên giao diện:
    - **FLOW 1 (Quản trị Nhân sự):** Admin đăng nhập $\rightarrow$ Tạo Giáo viên mới qua `POST /api/teachers` $\rightarrow$ Tạo Lễ tân mới qua `POST /api/accounts` $\rightarrow$ Đăng xuất.
    - **FLOW 2 (Tuyển sinh & Ghi danh):** Lễ tân đăng nhập $\rightarrow$ Tạo Học viên mới qua `POST /api/students` $\rightarrow$ Ghi danh vào lớp học qua `POST /api/classes/:classId/enrollments` $\rightarrow$ Hóa đơn học phí tự động sinh ra ở trạng thái `unpaid`.
    - **FLOW 3 (Quản trị Lớp & Xếp lịch):** Admin đăng nhập $\rightarrow$ Tạo Lớp học mới qua `POST /api/classes` $\rightarrow$ Phân công Giáo viên $\rightarrow$ Thiết lập Thời khóa biểu qua `POST /api/classes/:classId/schedules` $\rightarrow$ Bấm sinh các Buổi học tự động qua `POST /api/classes/:classId/sessions/generate`.
    - **FLOW 4 (Giảng dạy & Điểm danh):** Giáo viên đăng nhập $\rightarrow$ Vào "Lớp của tôi" $\rightarrow$ Chọn buổi học $\rightarrow$ Bấm "Điểm danh tất cả Có mặt" gọi `PUT /api/sessions/:sessionId/attendance` $\rightarrow$ Lưu thành công.
    - **FLOW 5 (Đánh giá Kỹ năng):** Giáo viên vào màn hình Nhập điểm $\rightarrow$ Nhập điểm 4 kỹ năng (0 – 100) và nhận xét bài kiểm tra gọi `POST /api/classes/:classId/results` $\rightarrow$ Lưu bảng điểm thành công.
    - **FLOW 6 (Thu phí & Tài chính):** Lễ tân mở Hóa đơn học viên $\rightarrow$ Thu đợt 1 gọi `POST /api/tuition/invoices/:invoiceId/payments` (chuyển sang `partial`) $\rightarrow$ Thu đợt 2 (chuyển sang `paid`, dư nợ về 0).
    - **FLOW 7 (Cổng thông tin Học viên):** Học viên đăng nhập $\rightarrow$ Kiểm tra thấy đầy đủ: Lớp học (`/api/classes`), thời khóa biểu (`/api/classes/:id/schedules`), lịch sử điểm danh (`/api/student/me/attendance`), bảng điểm 4 kỹ năng (`/api/student/me/results`) và lịch sử nộp tiền (`/api/student/me/payments`).
    - **FLOW 8 (Báo cáo Tổng quan):** Admin đăng nhập $\rightarrow$ Kiểm tra Bảng điều khiển (`/api/admin/dashboard`) thấy các KPI tài chính và học vụ tự động cập nhật khớp với các thao tác vừa diễn ra.
- **5. Models Affected:** Toàn bộ.
- **6. APIs Affected:** Toàn bộ.
- **7. Files Affected:**
  - Không tạo mới hay sửa đổi file nào (chỉ ghi nhận kết quả kiểm thử).
- **8. Dependencies:**
  - Hoàn thành Phase 12.
- **9. Risks:**
  - Phát sinh lỗi tiềm ẩn ở các điểm tiếp giáp giữa các module trong quy trình nghiệp vụ thực tế.
  - *Biện pháp:* Khắc phục triệt để lỗi tại chỗ trước khi cho phép nghiệm thu phase.
- **10. Test Cases:**
  - Khớp với 8 luồng nghiệp vụ trên; tỷ lệ pass bắt buộc 100%.
- **11. Acceptance Criteria:**
  - Cả 8 luồng nghiệp vụ chạy trơn tru, không gặp lỗi console, không crash ứng dụng.
- **12. Definition of Done:**
  - 8 luồng nghiệp vụ đã được kiểm chứng thực tế và sẵn sàng chuyển sang dọn dẹp mã nguồn.
- **13. Suggested Git Commit:**
  - `test: verify complete end to end business workflows across 4 roles`

---

### PHASE 14 — FINAL CLEANUP & PRODUCTION READINESS (DỌN DẸP MÃ NGUỒN CŨ)

- **1. Objective (Mục tiêu):**
  - Gỡ bỏ triệt để toàn bộ các file, model, route, controller và thuật ngữ trường đại học cũ sau khi hệ thống VLearn đã hoạt động hoàn hảo. Đảm bảo mã nguồn tinh gọn, sạch sẽ, chuẩn nhận diện thương hiệu **VLearn English Center**.
- **2. Existing Code Reused (Mã nguồn tái sử dụng):**
  - Toàn bộ mã nguồn VLearn mới đã được kiểm thử ở Phase 13.
- **3. Backend Tasks:**
  - Xóa bỏ các Model đại học cũ: `Course.js`, `Subject.js`, `Leave.js`.
  - Xóa bỏ các Controller đại học cũ: `adminController.js` (phần liên quan course/subject/leave), `professorController.js`.
  - Xóa bỏ các Route đại học cũ: `professorRoutes.js`.
  - Xóa bỏ các script seed cũ: `seed.js`, `seedData.js`, `seedFresh.js`, `migrateToNewDb.js`.
  - Chuẩn hóa thông báo khởi động trong `backend/server.js`: `"VLearn English Center API is running"`.
- **4. Frontend Tasks:**
  - Xóa bỏ các Trang giao diện đại học cũ:
    - `AdminCourses.jsx`, `AdminSubjects.jsx`, `ManageLeaves.jsx`, `AdminUsers.jsx`.
    - `ProfAttendance.jsx`, `ProfDashboard.jsx`, `ProfMaterials.jsx`, `ProfProfile.jsx`, `ProfStudents.jsx`.
    - `StudentLeaves.jsx`, `StudentMaterials.jsx`.
  - Xóa bỏ Layout cũ: `ProfessorLayout.jsx`.
  - Dọn dẹp các import thừa và các dead routes trong `frontend/src/App.jsx`.
  - Rà soát toàn bộ dự án: Đảm bảo không còn sót lại các thuật ngữ trường đại học cũ (`Professor`, `Semester`, `Faculty`, `Nexus University`).
- **5. Models Affected:**
  - Xóa bỏ: `Course`, `Subject`, `Leave`.
- **6. APIs Affected:**
  - Gỡ bỏ các route cũ: `/api/professor/*`, `/api/admin/courses/*`, `/api/admin/subjects/*`, `/api/admin/leaves/*`.
- **7. Files Affected:**
  - `FILES TO MODIFY`:
    - `backend/server.js`
    - `frontend/src/App.jsx`
  - `FILES TO CREATE`: Không có.
  - `FILES TO DEPRECATE & REMOVE PERMANENTLY`:
    - `backend/models/Course.js`
    - `backend/models/Subject.js`
    - `backend/models/Leave.js`
    - `backend/controllers/professorController.js`
    - `backend/routes/professorRoutes.js`
    - `backend/seed.js`
    - `backend/seedData.js`
    - `backend/seedFresh.js`
    - `backend/migrateToNewDb.js`
    - `frontend/src/layouts/ProfessorLayout.jsx`
    - `frontend/src/pages/AdminCourses.jsx`
    - `frontend/src/pages/AdminSubjects.jsx`
    - `frontend/src/pages/AdminUsers.jsx`
    - `frontend/src/pages/ManageLeaves.jsx`
    - `frontend/src/pages/ProfAttendance.jsx`
    - `frontend/src/pages/ProfDashboard.jsx`
    - `frontend/src/pages/ProfMaterials.jsx`
    - `frontend/src/pages/ProfProfile.jsx`
    - `frontend/src/pages/ProfStudents.jsx`
    - `frontend/src/pages/StudentLeaves.jsx`
    - `frontend/src/pages/StudentMaterials.jsx`
- **8. Dependencies:**
  - Nghiệm thu hoàn tất Phase 13.
- **9. Risks:**
  - Xóa nhầm file đang có import ẩn trong các component còn lại.
  - *Biện pháp:* Chạy lệnh `npm run build` ở Frontend và khởi động lại Backend sau khi xóa để xác nhận 0 lỗi compile.
- **10. Test Cases:**
  - `TC14.1`: Chạy `npm run build` ở frontend $\rightarrow$ Build thành công không có cảnh báo import lỗi.
  - `TC14.2`: Khởi động backend $\rightarrow$ Không có lỗi thiếu module.
  - `TC14.3`: Tìm kiếm toàn bộ dự án chuỗi `"Nexus"` hoặc `"Professor"` $\rightarrow$ Không còn kết quả nào sót lại trong mã nguồn chính.
- **11. Acceptance Criteria:**
  - Mã nguồn sạch sẽ, không còn file thừa, không còn dead code; thương hiệu chuẩn hóa thành **VLearn English Center**.
- **12. Definition of Done:**
  - Quá trình di trú hoàn tất 100%; hệ thống đạt chuẩn sẵn sàng đưa vào vận hành thực tế.
- **13. Suggested Git Commit:**
  - `chore: remove legacy university modules and finalize vlearn codebase`

---

## 5. BẢNG ÁNH XẠ TOÀN DIỆN TẬP TIN TOÀN HỆ THỐNG (FILE-BY-FILE IMPACT MAP)

Bảng dưới đây thống kê chính xác toàn bộ các tập tin trong dự án hiện tại và trạng thái xử lý kỹ thuật tương ứng:

| STT | Đường dẫn tập tin (Exact File Path) | Trạng thái kỹ thuật | Phase tác động | Giải thích xử lý |
| :---: | :--- | :---: | :---: | :--- |
| **I** | **BACKEND CORE & CONFIG** | | | |
| 1 | `backend/server.js` | MODIFY | Phase 1, 2, 3, 4, 5, 6, 7, 14 | Mount các router mới, cập nhật thông báo VLearn |
| 2 | `backend/package.json` | MODIFY | Phase 12 | Thêm script `seed:vlearn` |
| 3 | `backend/.env` | KEEP | Phase 0 | Giữ nguyên cấu hình kết nối MongoDB & JWT |
| 4 | `backend/middleware/authMiddleware.js` | MODIFY | Phase 1, 11 | Cập nhật 4 role mới, hasRole, kiểm tra active status |
| 5 | `backend/middleware/uploadMiddleware.js` | KEEP | Phase 9 | Giữ nguyên bộ upload Multer cho tài liệu học tập |
| **II** | **BACKEND MODELS** | | | |
| 6 | `backend/models/User.js` | MODIFY | Phase 1 | Cập nhật enum role VLearn và status active/inactive |
| 7 | `backend/models/Student.js` | CREATE | Phase 2 | Hồ sơ học viên độc lập, mã `VL-HV...`, ref User |
| 8 | `backend/models/Teacher.js` | CREATE | Phase 2 | Hồ sơ giáo viên độc lập, mã `VL-GV...`, ref User |
| 9 | `backend/models/Class.js` | CREATE | Phase 3 | Lớp học kỹ năng (L/S/R/W), sĩ số, học phí |
| 10 | `backend/models/Enrollment.js` | CREATE | Phase 3 | Ghi danh Nhiều - Nhiều, Partial Unique Index |
| 11 | `backend/models/Schedule.js` | CREATE | Phase 4 | Thời khóa biểu định kỳ tuần của lớp học |
| 12 | `backend/models/ClassSession.js` | CREATE | Phase 4 | Buổi học thực tế được sinh theo lịch |
| 13 | `backend/models/Attendance.js` | MODIFY | Phase 5 | Chuyển sang mô hình Student + Session, Bulk Upsert |
| 14 | `backend/models/LearningResult.js` | CREATE | Phase 6 | Điểm 4 kỹ năng thang điểm 0–100, overallScore |
| 15 | `backend/models/TuitionInvoice.js` | CREATE | Phase 7 | Hóa đơn học phí, theo dõi công nợ nộp nhiều đợt |
| 16 | `backend/models/Payment.js` | CREATE | Phase 7 | Sổ cái thanh toán, số tiền $> 0$, hỗ trợ void |
| 17 | `backend/models/Notice.js` | MODIFY | Phase 9 | Thêm trường đối tượng nhận `audience` |
| 18 | `backend/models/StudyMaterial.js` | MODIFY | Phase 9 | Đổi liên kết từ `course` sang `class` |
| 19 | `backend/models/Course.js` | DEPRECATE | Phase 3 $\rightarrow$ 14 | Gỡ bỏ dứt điểm ở Phase 14 |
| 20 | `backend/models/Subject.js` | DEPRECATE | Phase 3 $\rightarrow$ 14 | Gỡ bỏ dứt điểm ở Phase 14 |
| 21 | `backend/models/Leave.js` | DEPRECATE | Phase 14 | Gỡ bỏ dứt điểm ở Phase 14 |
| **III** | **BACKEND CONTROLLERS & ROUTES** | | | |
| 22 | `backend/controllers/authController.js` | MODIFY | Phase 1 | Cập nhật login, kiểm tra khóa tài khoản |
| 23 | `backend/routes/authRoutes.js` | KEEP | Phase 1 | Giữ nguyên các route xác thực |
| 24 | `backend/controllers/accountController.js` | CREATE | Phase 2 | Quản lý tài khoản, gán Role, khóa tài khoản |
| 25 | `backend/routes/accountRoutes.js` | CREATE | Phase 2 | Tuyến đường `/api/accounts` |
| 26 | `backend/controllers/studentController.js` | MODIFY | Phase 2 | Viết lại theo resource Student VLearn |
| 27 | `backend/routes/studentRoutes.js` | MODIFY | Phase 2 | Định nghĩa các route `/api/students` |
| 28 | `backend/controllers/teacherController.js` | CREATE | Phase 2 | CRUD hồ sơ giáo viên VLearn |
| 29 | `backend/routes/teacherRoutes.js` | CREATE | Phase 2 | Tuyến đường `/api/teachers` |
| 30 | `backend/controllers/classController.js` | CREATE | Phase 3 | Quản lý lớp học kỹ năng, kiểm tra sĩ số |
| 31 | `backend/routes/classRoutes.js` | CREATE | Phase 3 | Tuyến đường `/api/classes` |
| 32 | `backend/controllers/enrollmentController.js`| CREATE | Phase 3 | Xếp lớp, chuyển lớp, rút tên |
| 33 | `backend/routes/enrollmentRoutes.js` | CREATE | Phase 3 | Tuyến đường `/api/enrollments` và nested |
| 34 | `backend/controllers/scheduleController.js` | CREATE | Phase 4 | Xếp thời khóa biểu, kiểm tra xung đột |
| 35 | `backend/routes/scheduleRoutes.js` | CREATE | Phase 4 | Tuyến đường `/api/schedules` và nested |
| 36 | `backend/controllers/sessionController.js` | CREATE | Phase 4 | Sinh buổi học tự động, quản lý buổi |
| 37 | `backend/routes/sessionRoutes.js` | CREATE | Phase 4 | Tuyến đường `/api/sessions` và nested |
| 38 | `backend/controllers/attendanceController.js`| CREATE | Phase 5 | Bulk Upsert điểm danh theo buổi |
| 39 | `backend/routes/attendanceRoutes.js` | CREATE | Phase 5 | Tuyến đường `/api/sessions/:id/attendance` |
| 40 | `backend/controllers/learningResultController.js`| CREATE | Phase 6 | Nhập bảng điểm 4 kỹ năng và tra cứu |
| 41 | `backend/routes/learningResultRoutes.js` | CREATE | Phase 6 | Tuyến đường `/api/results` |
| 42 | `backend/controllers/tuitionController.js` | CREATE | Phase 7 | Quản lý hóa đơn công nợ học phí |
| 43 | `backend/routes/tuitionRoutes.js` | CREATE | Phase 7 | Tuyến đường `/api/tuition/invoices` |
| 44 | `backend/controllers/paymentController.js` | CREATE | Phase 7 | Thu tiền, Hủy phiếu thu có Transaction |
| 45 | `backend/routes/paymentRoutes.js` | CREATE | Phase 7 | Tuyến đường `/api/payments` |
| 46 | `backend/controllers/adminController.js` | MODIFY | Phase 8, 14 | Tinh gọn controller admin, gỡ code đại học cũ |
| 47 | `backend/routes/adminRoutes.js` | MODIFY | Phase 8, 14 | Cập nhật router admin |
| 48 | `backend/controllers/professorController.js`| DEPRECATE | Phase 14 | Gỡ bỏ dứt điểm ở Phase 14 |
| 49 | `backend/routes/professorRoutes.js` | DEPRECATE | Phase 14 | Gỡ bỏ dứt điểm ở Phase 14 |
| **IV** | **FRONTEND LAYOUTS & CONTEXT** | | | |
| 50 | `frontend/src/App.jsx` | MODIFY | Phase 1, 14 | Cập nhật routing 4 roles, gỡ dead routes |
| 51 | `frontend/src/context/AuthContext.jsx` | MODIFY | Phase 1 | Quản lý state 4 vai trò mới và active status |
| 52 | `frontend/src/context/ToastContext.jsx` | KEEP | - | Giữ nguyên context thông báo toast |
| 53 | `frontend/src/layouts/AdminLayout.jsx` | MODIFY | Phase 1, 2, 3, 10 | Cập nhật menu điều hướng admin |
| 54 | `frontend/src/layouts/ReceptionistLayout.jsx`| CREATE | Phase 1 | Layout chuyên biệt cho Lễ tân |
| 55 | `frontend/src/layouts/TeacherLayout.jsx` | CREATE | Phase 1 | Thay thế ProfessorLayout |
| 56 | `frontend/src/layouts/StudentLayout.jsx` | MODIFY | Phase 1, 10 | Cập nhật giao diện học viên |
| 57 | `frontend/src/layouts/ProfessorLayout.jsx` | DEPRECATE | Phase 1 $\rightarrow$ 14 | Gỡ bỏ dứt điểm ở Phase 14 |
| **V** | **FRONTEND PAGES** | | | |
| 58 | `frontend/src/pages/Login.jsx` | MODIFY | Phase 1, 10 | Tinh chỉnh giao diện đăng nhập thương hiệu VLearn |
| 59 | `frontend/src/pages/RoleMatrixView.jsx` | CREATE | Phase 1 | Màn hình Read-Only tra cứu quyền cho Admin |
| 60 | `frontend/src/pages/StudentList.jsx` | CREATE | Phase 2 | Danh sách học viên VLearn |
| 61 | `frontend/src/pages/StudentDetail.jsx` | CREATE | Phase 2 | Hồ sơ học viên Hybrid 5 tabs |
| 62 | `frontend/src/pages/TeacherList.jsx` | CREATE | Phase 2 | Danh sách giáo viên VLearn |
| 63 | `frontend/src/pages/TeacherDetail.jsx` | CREATE | Phase 2 | Hồ sơ giáo viên VLearn |
| 64 | `frontend/src/pages/AccountManagement.jsx` | CREATE | Phase 2 | Quản lý tài khoản và gán Role cho Admin |
| 65 | `frontend/src/pages/ClassList.jsx` | CREATE | Phase 3 | Card Grid danh sách lớp học 4 kỹ năng |
| 66 | `frontend/src/pages/ClassDetail.jsx` | CREATE | Phase 3 | Chi tiết lớp học và danh sách học viên |
| 67 | `frontend/src/pages/SchedulePage.jsx` | CREATE | Phase 4 | Bảng thời khóa biểu tuần |
| 68 | `frontend/src/pages/AttendancePage.jsx` | CREATE | Phase 5 | Điểm danh theo buổi 3 bước, Mark All Present |
| 69 | `frontend/src/pages/ResultsEntryPage.jsx` | CREATE | Phase 6 | Nhập bảng điểm 4 kỹ năng cho giáo viên |
| 70 | `frontend/src/pages/StudentResultsPage.jsx` | CREATE | Phase 6 | Xem kết quả học tập cho học viên |
| 71 | `frontend/src/pages/TuitionListPage.jsx` | CREATE | Phase 7 | Quản lý hóa đơn công nợ học phí |
| 72 | `frontend/src/pages/InvoiceDetailPage.jsx` | CREATE | Phase 7 | Chi tiết hóa đơn và lịch sử thu tiền |
| 73 | `frontend/src/pages/AdminDashboard.jsx` | MODIFY | Phase 8, 10 | Bảng điều khiển quản trị VLearn |
| 74 | `frontend/src/pages/ReceptionistDashboard.jsx`| CREATE | Phase 8, 10 | Bảng điều khiển Lễ tân |
| 75 | `frontend/src/pages/TeacherDashboard.jsx` | CREATE | Phase 8, 10 | Bảng điều khiển Giáo viên |
| 76 | `frontend/src/pages/StudentDashboard.jsx` | MODIFY | Phase 8, 10 | Cổng thông tin học tập cá nhân |
| 77 | `frontend/src/pages/NoticeBoard.jsx` | MODIFY | Phase 9, 10 | Bảng thông báo có lọc đối tượng |
| 78 | `frontend/src/pages/StudyMaterialsPage.jsx` | CREATE | Phase 9, 10 | Tài liệu học tập theo lớp học |
| 79 | `frontend/src/pages/AdminUsers.jsx` | DEPRECATE | Phase 2 $\rightarrow$ 14 | Gỡ bỏ ở Phase 14 |
| 80 | `frontend/src/pages/AdminCourses.jsx` | DEPRECATE | Phase 3 $\rightarrow$ 14 | Gỡ bỏ ở Phase 14 |
| 81 | `frontend/src/pages/AdminSubjects.jsx` | DEPRECATE | Phase 3 $\rightarrow$ 14 | Gỡ bỏ ở Phase 14 |
| 82 | `frontend/src/pages/ManageLeaves.jsx` | DEPRECATE | Phase 14 | Gỡ bỏ ở Phase 14 |
| 83 | `frontend/src/pages/ProfAttendance.jsx` | DEPRECATE | Phase 5 $\rightarrow$ 14 | Gỡ bỏ ở Phase 14 |
| 84 | `frontend/src/pages/ProfDashboard.jsx` | DEPRECATE | Phase 8 $\rightarrow$ 14 | Gỡ bỏ ở Phase 14 |
| 85 | `frontend/src/pages/ProfMaterials.jsx` | DEPRECATE | Phase 9 $\rightarrow$ 14 | Gỡ bỏ ở Phase 14 |
| 86 | `frontend/src/pages/ProfProfile.jsx` | DEPRECATE | Phase 14 | Gỡ bỏ ở Phase 14 |
| 87 | `frontend/src/pages/ProfStudents.jsx` | DEPRECATE | Phase 14 | Gỡ bỏ ở Phase 14 |
| 88 | `frontend/src/pages/StudentLeaves.jsx` | DEPRECATE | Phase 14 | Gỡ bỏ ở Phase 14 |
| 89 | `frontend/src/pages/StudentMaterials.jsx` | DEPRECATE | Phase 9 $\rightarrow$ 14 | Gỡ bỏ ở Phase 14 |

---

## 6. CHIẾN LƯỢC COMMIT GIT (COMMIT STRATEGY)

Tuân thủ nghiêm ngặt chuẩn Conventional Commits với một checkpoint rõ ràng sau khi hoàn thành và nghiệm thu từng Phase:

1. **Phase 0:** `chore: baseline before vlearn migration`
2. **Phase 1:** `feat: migrate auth foundation to vlearn 4 roles and status management`
3. **Phase 2:** `feat: decouple auth users from student and teacher domain profiles`
4. **Phase 3:** `feat: implement classes with 4 skills and enrollment many-to-many model`
5. **Phase 4:** `feat: implement weekly schedules class sessions and conflict detection service`
6. **Phase 5:** `feat: migrate attendance module to session based bulk upsert model`
7. **Phase 6:** `feat: implement learning results module with 4 english skills evaluation`
8. **Phase 7:** `feat: implement tuition invoices and atomic payment ledger with void support`
9. **Phase 8:** `feat: implement real time dynamic dashboards for 4 roles`
10. **Phase 9:** `feat: migrate notice board and study materials to vlearn class structure`
11. **Phase 10:** `style: apply modern vlearn education saas design system and ui components`
12. **Phase 11:** `test: verify strict zero trust authorization and data isolation boundaries`
13. **Phase 12:** `chore: add realistic vlearn center demo seed data script`
14. **Phase 13:** `test: verify complete end to end business workflows across 4 roles`
15. **Phase 14:** `chore: remove legacy university modules and finalize vlearn codebase`

---

## 7. ĐÁNH GIÁ 3 GIAI ĐOẠN CÓ RỦI RO CAO NHẤT (TOP 3 HIGHEST RISK PHASES)

| Xếp hạng | Giai đoạn | Mức độ rủi ro | Phân tích Rủi ro Kỹ thuật & Biện pháp Khắc phục |
| :---: | :--- | :---: | :--- |
| 🥇 **Hạng 1** | **PHASE 7: Tuition & Payment** | **CỰC KỲ CAO** | **Nguyên nhân:** Xử lý trực tiếp số liệu tiền tệ; thao tác ghi nhận thanh toán và hủy giao dịch tác động đồng thời trên cả 2 collection `tuitionInvoices` và `payments`. Nếu xảy ra lỗi mạng hoặc race condition giữa chừng mà không có transaction thì số liệu công nợ sẽ bị sai lệch vĩnh viễn.<br>**Biện pháp:** Bắt buộc sử dụng `mongoose.startSession()` và `session.withTransaction()`. Ràng buộc `amount > 0` và chặn thu thừa. Phương thức thanh toán chuẩn hóa (`cash`, `bank_transfer`, `card`). Tuyệt đối không cung cấp endpoint xóa cứng `DELETE`, chỉ cho phép Admin chuyển `status = 'voided'` kèm lý do. |
| 🥈 **Hạng 2** | **PHASE 4: Schedule & Class Session** | **CAO** | **Nguyên nhân:** Thuật toán phát hiện xung đột lịch học 3 chiều (Giáo viên, Phòng học, Học viên) không thể thực hiện bằng MongoDB Index đơn thuần mà phải xử lý ở tầng Service logic. Nếu so sánh thời gian bị lỗi do múi giờ hoặc định dạng chuỗi, hệ thống sẽ xếp trùng phòng hoặc trùng ca dạy của giáo viên.<br>**Biện pháp:** Chuẩn hóa thời gian sang chuỗi `"HH:mm"` và ngày sang `"YYYY-MM-DD"`. Cài đặt chính xác công thức toán học: `(existing.startTime < new.endTime && existing.endTime > new.startTime)`. Viết unit test riêng cho logic so sánh. |
| 🥉 **Hạng 3** | **PHASE 3: Class & Enrollment** | **CAO** | **Nguyên nhân:** Chuyển đổi kiến trúc cốt lõi từ quan hệ đại học 1-Khóa học sang quan hệ Nhiều - Nhiều của trung tâm Anh ngữ. Cần vừa chặn học viên ghi danh trùng vào 1 lớp, vừa cho phép lưu giữ lịch sử các lần chuyển lớp (`transferred`) hoặc rút tên (`dropped`).<br>**Biện pháp:** Cưỡng chế Partial Unique Index `{ student: 1, class: 1 }` với `{ status: 'active' }`. Kiểm tra sĩ số `maxCapacity` trực tiếp từ database trước khi ghi bản ghi mới. Tách biệt rõ ràng việc tạo Hóa đơn học phí sang Phase 7. |

---

## 8. GIAI ĐOẠN ĐẦU TIÊN NÊN TRIỂN KHAI

👉 **LỘ TRÌNH BẮT ĐẦU:**
1. **Bước 1:** Bắt đầu ngay với **PHASE 0 (Baseline & Safety)**: Kiểm tra khởi động cả Backend và Frontend, xác nhận chuỗi kết nối `MONGO_URI` thành công và tạo commit checkpoint an toàn.
2. **Bước 2:** Sau khi Phase 0 đạt chuẩn, tiến hành **PHASE 1 (Auth Foundation & Role Migration)** để xây dựng nền móng 4 vai trò chuẩn cho VLearn (`Admin`, `Receptionist`, `Teacher`, `Student`).

---

> 🛑 **DỪNG LẠI THEO QUY ĐỊNH:**  
> Toàn bộ tài liệu Implementation Plan đã được hiệu chỉnh chuẩn xác tại [docs/specs/06-implementation-plan.md](file:///D:/BE/University-Management-System/docs/specs/06-implementation-plan.md).  
> Không có bất kỳ dòng mã nguồn nào bị thay đổi.  
> Tạm dừng và chờ bạn phê duyệt trước khi bắt đầu code!
