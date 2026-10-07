# REST API SPECIFICATION
# VLEARN ENGLISH CENTER STUDENT MANAGEMENT SYSTEM (VLEARN EC-SMS)
### Tài liệu Đặc tả Thiết kế RESTful API Chuẩn hóa & Quy tắc Giao tiếp Client - Server

---

## 1. OVERVIEW (TỔNG QUAN)

- **Đơn vị áp dụng:** VLearn English Center (Hệ thống Quản lý Học viên Trung tâm Anh ngữ VLearn).
- **Mục tiêu tài liệu:** Thiết kế tài liệu đặc tả toàn diện hệ thống RESTful API kết nối giữa Frontend (React Vite) và Backend (Node.js/Express.js + MongoDB/Mongoose).
- **Các tài liệu làm căn cứ:**
  - `docs/specs/01-product-spec.md` (Đặc tả Nghiệp vụ sản phẩm)
  - `docs/specs/02-role-permission-spec.md` (Đặc tả Phân quyền & Ma trận RBAC)
  - `docs/specs/03-data-model-spec.md` (Đặc tả Mô hình Dữ liệu & Mongoose Schemas)
- **Công nghệ nền tảng:**
  - **Runtime & Web Framework:** Node.js + Express.js
  - **Cơ sở dữ liệu:** MongoDB với Mongoose ODM
  - **Cơ chế xác thực:** JSON Web Token (JWT) trong HTTP Header `Authorization: Bearer <token>`
  - **Định dạng dữ liệu trao đổi:** JSON (MIME Type: `application/json`)

---

## 2. API DESIGN CONVENTIONS (QUY ƯỚC THIẾT KẾ API)

1. **Resource-Oriented URLs (Định danh Hướng Tài nguyên):**
   - Sử dụng danh từ số nhiều làm tên endpoint: `/api/students`, `/api/classes`, `/api/enrollments`.
   - Sử dụng quan hệ lồng nhau có cấp bậc hợp lý: `/api/classes/:classId/sessions`, `/api/tuition/invoices/:invoiceId/payments`.
   - Tránh dùng động từ trong URI (ngoại trừ các endpoint hành động nghiệp vụ đặc thù: `/transfer`, `/drop`, `/void`, `/generate`).
2. **HTTP Methods chuẩn REST:**
   - `GET`: Truy vấn tài nguyên (Read-only, Idempotent).
   - `POST`: Tạo mới tài nguyên hoặc kích hoạt hành động nghiệp vụ phức tạp.
   - `PUT`: Cập nhật toàn bộ hoặc thay thế tài nguyên.
   - `PATCH`: Cập nhật cục bộ một phần tài nguyên (thay đổi trạng thái `status`).
   - `DELETE`: Xóa tài nguyên (chỉ áp dụng cho tài nguyên cho phép Hard Delete).
3. **Backend Authorization là Single Source of Truth:**
   - Mọi request đều được xác thực qua Middleware: `protect` $\rightarrow$ `hasRole([...])` $\rightarrow$ `verifyOwnership`.
4. **Quy chuẩn Mã lỗi HTTP (HTTP Status Codes):**
   - `200 OK`: Thao tác đọc, sửa, xóa thành công.
   - `201 Created`: Tạo mới tài nguyên thành công.
   - `400 Bad Request`: Định dạng dữ liệu lỗi, ObjectId không hợp lệ.
   - `401 Unauthorized`: Chưa đăng nhập, token thiếu, sai chữ ký, hết hạn hoặc tài khoản bị khóa (`inactive`).
   - `403 Forbidden`: Đã đăng nhập nhưng không đủ quyền hạn (Role hoặc Resource Ownership vi phạm).
   - `404 Not Found`: Không tìm thấy tài nguyên (hoặc ẩn tài nguyên ngoài phạm vi sở hữu).
   - `409 Conflict`: Xung đột trạng thái nghiệp vụ (Lịch học giao thoa, Trùng lặp ghi danh active, Lớp đã đầy sĩ số, Thu tiền vượt quá số nợ).
   - `422 Unprocessable Entity`: Dữ liệu vi phạm ràng buộc schema (Điểm ngoài 0–100, SĐT sai regex, Số tiền $\le 0$).
   - `500 Internal Server Error`: Lỗi hệ thống hoặc lỗi cơ sở dữ liệu không mong muốn.

---

## 3. STANDARD RESPONSE FORMAT (CHUẨN HÓA CẤU TRÚC PHẢN HỒI)

Toàn bộ API VLearn sử dụng cấu trúc JSON đồng nhất:

### 3.1. Phản hồi Thành công - Đơn bản ghi (Success Single Item)
```json
{
  "success": true,
  "message": "Thực hiện thao tác thành công",
  "data": {
    "_id": "67a3f8901234567890abcdef",
    "createdAt": "2026-10-07T14:00:00.000Z"
  }
}
```

### 3.2. Phản hồi Thành công - Danh sách có Phân trang (Success Paginated List)
```json
{
  "success": true,
  "data": [
    { "_id": "67a3f8901234567890abcdef" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 105,
    "totalPages": 6
  }
}
```

### 3.3. Phản hồi Thất bại / Lỗi (Error Response)
```json
{
  "success": false,
  "message": "Mô tả lỗi tổng quan dễ hiểu cho người dùng",
  "errors": [
    {
      "field": "listeningScore",
      "message": "Điểm Nghe phải nằm trong khoảng từ 0 đến 100"
    }
  ]
}
```

---

## 4. AUTHENTICATION APIS (XÁC THỰC & TÀI KHOẢN CÁ NHÂN)

Base Path: `/api/auth`

| Method | Endpoint | Allowed Roles | Data Scope | Mô tả chức năng |
| :--- | :--- | :---: | :---: | :--- |
| `POST` | `/login` | Public | None | Đăng nhập hệ thống, kiểm tra `status === 'active'`, trả JWT |
| `GET` | `/me` | All Roles | Self | Lấy thông tin user hiện tại + tóm tắt profile liên kết |
| `PUT` | `/change-password` | All Roles | Self | Đổi mật khẩu cá nhân (yêu cầu mật khẩu cũ) |
| `PUT` | `/profile` | All Roles | Self | Cập nhật thông tin liên hệ cơ bản của chính mình |
| `POST` | `/logout` | All Roles | Self | Đăng xuất (xóa phiên phía client / ghi log) |

### Chi tiết Request / Response mẫu:

#### `POST /api/auth/login`
- **Body:**
  ```json
  {
    "email": "receptionist@vlearn.edu.vn",
    "password": "password123"
  }
  ```
- **Response 200 OK:**
  ```json
  {
    "success": true,
    "message": "Đăng nhập thành công",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
      "user": {
        "_id": "67a3fa01234567890abcdef1",
        "email": "receptionist@vlearn.edu.vn",
        "role": "Receptionist",
        "status": "active"
      },
      "profile": {
        "fullName": "Nguyễn Thị Lễ Tân"
      }
    }
  }
  ```
- **Error 401 Unauthorized:** Mật khẩu không đúng hoặc tài khoản có `status === 'inactive'`.

#### `PUT /api/auth/change-password`
- **Body:**
  ```json
  {
    "currentPassword": "oldPassword123",
    "newPassword": "newSecurePassword456"
  }
  ```
- **Response 200 OK:** `{ "success": true, "message": "Đổi mật khẩu thành công" }`.

---

## 5. ACCOUNT MANAGEMENT APIS (QUẢN TRỊ TÀI KHOẢN NỘI BỘ)

Base Path: `/api/accounts`  
*Quyền truy cập: Chỉ dành riêng cho **ADMIN**.*

| Method | Endpoint | Allowed Roles | Data Scope | Mô tả chức năng |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/` | Admin | All | Lấy danh sách tài khoản (lọc theo role, status, search email) |
| `POST` | `/` | Admin | All | Khởi tạo tài khoản nội bộ (Admin, Receptionist, Teacher) |
| `GET` | `/:id` | Admin | All | Xem thông tin chi tiết một tài khoản |
| `PUT` | `/:id` | Admin | All | Cập nhật email / thông tin tài khoản |
| `PATCH` | `/:id/status` | Admin | All | Khóa / Kích hoạt tài khoản (`status: 'active' \| 'inactive'`) |
| `PATCH` | `/:id/role` | Admin | All | Phân lại vai trò cho tài khoản |

### Chi tiết Request mẫu:
#### `POST /api/accounts`
- **Body:**
  ```json
  {
    "email": "teacher.david@vlearn.edu.vn",
    "password": "InitialPassword123",
    "role": "Teacher",
    "status": "active"
  }
  ```
- **Response 201 Created:** Trả về đối tượng `User` đã tạo (loại bỏ trường `passwordHash`).

---

## 6. STUDENT APIS (QUẢN LÝ HỌC VIÊN)

Base Path: `/api/students`

| Method | Endpoint | Allowed Roles | Data Scope | Mô tả chức năng |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/` | Admin, Receptionist | All | Danh sách học viên có phân trang, tìm kiếm, lọc |
| `POST` | `/` | Admin, Receptionist | All | Tạo mới học viên (Tự động sinh `studentCode` và tài khoản `User`) |
| `GET` | `/:id` | Admin, Receptionist, Teacher | Scoped | Xem hồ sơ chi tiết học viên (Teacher chỉ xem nếu học lớp mình) |
| `PUT` | `/:id` | Admin, Receptionist | All | Cập nhật thông tin học viên |
| `PATCH` | `/:id/status` | Admin, Receptionist | All | Đổi trạng thái học vụ (`academicStatus`) |
| `GET` | `/:id/enrollments` | Admin, Receptionist | All | Lấy danh sách lớp đã/đang học của học viên |
| `GET` | `/:id/attendance` | Admin, Receptionist | All | Xem lịch sử chuyên cần của học viên |
| `GET` | `/:id/results` | Admin, Receptionist | All | Xem bảng điểm 4 kỹ năng của học viên |
| `GET` | `/:id/invoices` | Admin, Receptionist | All | Xem các hóa đơn học phí của học viên |
| `GET` | `/:id/payments` | Admin, Receptionist | All | Xem lịch sử thanh toán của học viên |

> **KIẾN TRÚC STUDENT DETAIL (HYBRID TABBED ENDPOINTS):**  
> - `GET /api/students/:id`: Trả về thông tin cá nhân cơ bản kèm **chỉ số tóm tắt nhanh (Quick Metrics)**: số lớp active, tổng nợ học phí, tỷ lệ chuyên cần %.  
> - Các tab chi tiết (Lớp học, Điểm danh, Kết quả, Hóa đơn, Thanh toán) được tải qua các sub-endpoints độc lập ở trên.  
> - *Lý do:* Giảm tải kích thước payload, tăng tốc độ render ban đầu và hỗ trợ lazy loading tối ưu trên giao diện Frontend.

### Chi tiết Endpoint:
#### `GET /api/students`
- **Query Parameters:**
  - `page` (default: 1), `limit` (default: 20)
  - `search` (tìm theo Họ tên, SĐT, Email, `studentCode`)
  - `academicStatus` (`waiting`, `active`, `paused`, `completed`, `inactive`)
  - `classId` (lọc học viên đang học lớp cụ thể)
  - `sort` (default: `-createdAt`)

#### `POST /api/students`
- **Body:**
  ```json
  {
    "fullName": "Trần Minh Quân",
    "email": "quan.tran@gmail.com",
    "phone": "0987654321",
    "dateOfBirth": "2006-08-15",
    "gender": "male",
    "address": { "street": "123 Cầu Giấy", "district": "Cầu Giấy", "city": "Hà Nội" },
    "emergencyContact": { "name": "Trần Văn Nam", "phone": "0912345678", "relationship": "Bố" },
    "academicStatus": "active",
    "notes": "Học viên mục tiêu IELTS 6.5"
  }
  ```

---

## 7. TEACHER APIS (QUẢN LÝ GIÁO VIÊN)

Base Path: `/api/teachers` và `/api/teacher/me`

| Method | Endpoint | Allowed Roles | Data Scope | Mô tả chức năng |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/api/teachers` | Admin, Receptionist | All | Danh sách giáo viên (tìm kiếm, lọc chuyên môn, status) |
| `POST` | `/api/teachers` | Admin | All | Tạo mới giáo viên (Tự động sinh `teacherCode` và tài khoản User) |
| `GET` | `/api/teachers/:id` | Admin, Receptionist | All | Xem chi tiết hồ sơ giáo viên |
| `PUT` | `/api/teachers/:id` | Admin | All | Cập nhật thông tin giáo viên |
| `PATCH` | `/api/teachers/:id/status`| Admin | All | Khóa / Kích hoạt giáo viên |
| `GET` | `/api/teacher/me` | Teacher | Self | Giáo viên xem thông tin cá nhân của mình |
| `GET` | `/api/teacher/me/classes` | Teacher | Assigned Only | Danh sách các lớp học mình được phân công giảng dạy |
| `GET` | `/api/teacher/me/schedule`| Teacher | Assigned Only | Lịch giảng dạy trong tuần / thời khóa biểu cá nhân |

---

## 8. CLASS APIS (QUẢN LÝ LỚP HỌC THEO KỸ NĂNG)

Base Path: `/api/classes`

| Method | Endpoint | Allowed Roles | Data Scope | Mô tả chức năng |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/` | All Roles | Scoped | Danh sách lớp (Admin/Recep: All; Teacher: Assigned; Student: Enrolled) |
| `POST` | `/` | Admin | All | Tạo mới lớp học theo kỹ năng |
| `GET` | `/:id` | All Roles | Scoped | Xem chi tiết lớp học (sĩ số hiện tại, giáo viên, phòng, học phí) |
| `PUT` | `/:id` | Admin | All | Cập nhật thông tin lớp học |
| `PATCH` | `/:id/status` | Admin | All | Đổi trạng thái lớp (`upcoming`, `active`, `completed`, `cancelled`, `archived`) |

#### Query Parameters cho `GET /api/classes`:
- `skill`: `listening`, `speaking`, `reading`, `writing`
- `status`: `upcoming`, `active`, `completed`
- `teacherId`: lọc theo giáo viên phụ trách
- `search`: tìm theo tên lớp hoặc mã lớp `classCode`

#### `POST /api/classes`
- **Body:**
  ```json
  {
    "className": "IELTS Speaking Intensive K15",
    "skill": "speaking",
    "teacher": "67a3f8901234567890abcd01",
    "maxCapacity": 15,
    "startDate": "2026-11-01",
    "endDate": "2027-01-15",
    "tuitionFee": 4500000,
    "room": "Phòng 302"
  }
  ```

---

## 9. ENROLLMENT APIS (GHI DANH, XẾP LỚP & CHUYỂN LỚP)

Base Path: `/api/enrollments` và Nested Endpoints

| Method | Endpoint | Allowed Roles | Data Scope | Mô tả chức năng |
| :--- | :--- | :---: | :---: | :--- |
| `POST` | `/api/classes/:classId/enrollments` | Admin, Receptionist | All | Ghi danh học viên vào lớp (Tự động sinh Hóa đơn học phí) |
| `GET` | `/api/classes/:classId/enrollments` | Admin, Receptionist, Teacher | Scoped | Xem danh sách học viên đang ghi danh trong lớp |
| `GET` | `/api/students/:studentId/enrollments`| Admin, Receptionist | All | Xem danh sách các lớp học của một học viên |
| `POST` | `/api/enrollments/:id/transfer` | Admin, Receptionist | All | Chuyển học viên sang lớp mới (Kiểm tra sĩ số, lịch học) |
| `POST` | `/api/enrollments/:id/drop` | Admin, Receptionist | All | Thôi học / Bảo lưu lớp học (Giữ lịch sử, không xóa cứng) |

### Ràng buộc & Kiểm tra Nghiệp vụ (Business Validations):
1. **Chặn ghi danh trùng lặp (No Duplicate Active):** Nếu học viên đã có bản ghi `enrollment` có `status === 'active'` tại lớp này $\rightarrow$ Trả về `409 Conflict`.
2. **Kiểm tra Sĩ số tối đa (Capacity Check):** Nếu số lượng `active enrollments >= class.maxCapacity` $\rightarrow$ Trả về `409 Conflict` (Thông báo: *"Lớp học đã đạt sĩ số tối đa"*).
3. **Kiểm tra Xung đột Lịch học (Schedule Conflict):** Kiểm tra xem lịch học của lớp mới có giao thoa giờ với bất kỳ lớp nào học viên đang theo học hay không $\rightarrow$ Trả về `409 Conflict`.
4. **Tự động Khởi tạo Hóa đơn học phí (Auto TuitionInvoice):** Khi ghi danh thành công, hệ thống tự động khởi tạo bản ghi `TuitionInvoice` tương ứng với `totalAmount = class.tuitionFee`, `paidAmount = 0`, `status = 'unpaid'`.

#### `POST /api/enrollments/:id/transfer`
- **Body:**
  ```json
  {
    "newClassId": "67a3f8901234567890abcd99",
    "reason": "Học viên đổi ca làm việc nên chuyển lớp tối 3-5-7"
  }
  ```

---

## 10. SCHEDULE APIS (THỜI KHÓA BIỂU & LỊCH HỌC LẶP)

Base Path: `/api/schedules` và Nested Endpoints

| Method | Endpoint | Allowed Roles | Data Scope | Mô tả chức năng |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/api/classes/:classId/schedules` | All Roles | Scoped | Xem lịch học trong tuần của lớp |
| `POST` | `/api/classes/:classId/schedules` | Admin | All | Thiết lập lịch học hàng tuần cho lớp |
| `PUT` | `/api/schedules/:id` | Admin | All | Chỉnh sửa ca học / phòng học |
| `DELETE`| `/api/schedules/:id` | Admin | All | Xóa ca học (nếu chưa sinh ClassSessions) |

### Kiểm tra Xung đột Lịch học (Service-Level Validation):
Trước khi lưu, Backend chạy thuật toán kiểm tra giao thoa:
$$\text{Conflict} \iff (\text{existing.startTime} < \text{new.endTime}) \land (\text{existing.endTime} > \text{new.startTime})$$
- Kiểm tra trùng giờ phòng học (`room`).
- Kiểm tra trùng giờ giáo viên (`teacher`).
- Nếu phát hiện trùng lặp $\rightarrow$ Trả về `409 Conflict` kèm thông tin chi tiết lớp học bị xung đột.

---

## 11. CLASS SESSION APIS (BUỔI HỌC CỤ THỂ)

Base Path: `/api/sessions` và Nested Endpoints

| Method | Endpoint | Allowed Roles | Data Scope | Mô tả chức năng |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/api/classes/:classId/sessions` | All Roles | Scoped | Lấy danh sách các buổi học của lớp |
| `POST`| `/api/classes/:classId/sessions/generate`| Admin | All | Tự động sinh danh sách buổi học theo `startDate`, `endDate` và `schedules` |
| `GET` | `/api/sessions/:id` | All Roles | Scoped | Xem chi tiết 1 buổi học |
| `PATCH`| `/api/sessions/:id/status` | Admin, Teacher | Scoped | Đổi trạng thái buổi học (`scheduled`, `completed`, `cancelled`) |
| `PUT` | `/api/sessions/:id` | Admin | All | Cập nhật phòng học, đổi giáo viên dạy buổi này |

---

## 12. ATTENDANCE APIS (ĐIỂM DANH THEO BUỔI HỌC)

Base Path: `/api/sessions/:sessionId/attendance` và `/api/student/me/attendance`

| Method | Endpoint | Allowed Roles | Data Scope | Mô tả chức năng |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/api/sessions/:sessionId/attendance` | Admin, Receptionist, Teacher | Scoped | Xem danh sách điểm danh của buổi học (Teacher chỉ xem lớp mình) |
| `PUT` | `/api/sessions/:sessionId/attendance` | Admin, Teacher | Assigned Only | **Lưu điểm danh hàng loạt (Bulk Upsert Attendance)** |
| `GET` | `/api/student/me/attendance` | Student | Self Only | Học viên xem lịch sử chuyên cần cá nhân (Không nhận `studentId`) |

### Bulk Attendance Payload mẫu:
#### `PUT /api/sessions/:sessionId/attendance`
- **Body:**
  ```json
  {
    "records": [
      {
        "studentId": "67a3f8901234567890abcd11",
        "status": "Present",
        "note": ""
      },
      {
        "studentId": "67a3f8901234567890abcd22",
        "status": "Late",
        "note": "Đi muộn 15 phút do kẹt xe"
      },
      {
        "studentId": "67a3f8901234567890abcd33",
        "status": "Excused",
        "note": "Phụ huynh xin phép trước vì sốt"
      }
    ]
  }
  ```
- **Xử lý Backend:**
  - Xác thực Teacher đăng nhập có phải giáo viên phụ trách lớp học của buổi này hay không.
  - Sử dụng `bulkWrite` với `upsert: true` theo cặp `(student, session)`.
  - Compound Unique Index `{ student: 1, session: 1 }` đảm bảo tính toàn vẹn 100%.

---

## 13. LEARNING RESULTS APIS (KẾT QUẢ HỌC TẬP 4 KỸ NĂNG)

Base Path: `/api/results` và `/api/student/me/results`

| Method | Endpoint | Allowed Roles | Data Scope | Mô tả chức năng |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/api/classes/:classId/results` | Admin, Receptionist, Teacher | Scoped | Xem bảng điểm của lớp theo bài test (Recep: Read-only) |
| `POST` | `/api/classes/:classId/results` | Admin, Teacher | Assigned Only | Nhập điểm đợt kiểm tra mới cho học viên trong lớp |
| `PUT` | `/api/results/:id` | Admin, Teacher | Assigned Only | Chỉnh sửa điểm số hoặc nhận xét của bài kiểm tra |
| `GET` | `/api/student/me/results` | Student | Self Only | Học viên xem toàn bộ kết quả học tập của chính mình |

### Ràng buộc dữ liệu Điểm số:
- Tất cả các trường: `listeningScore`, `speakingScore`, `readingScore`, `writingScore`, `overallScore` bắt buộc **từ 0 đến 100** (`min: 0, max: 100`).
- Nếu vi phạm $\rightarrow$ Trả về `422 Unprocessable Entity`.

---

## 14. TUITION INVOICE APIS (HÓA ĐƠN HỌC PHÍ & CÔNG NỢ)

Base Path: `/api/tuition/invoices` và `/api/student/me/invoices`

| Method | Endpoint | Allowed Roles | Data Scope | Mô tả chức năng |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/api/tuition/invoices` | Admin, Receptionist | All | Danh sách hóa đơn (lọc theo `status`, `studentId`, `classId`, quá hạn) |
| `POST` | `/api/tuition/invoices` | Admin, Receptionist | All | Tạo hóa đơn học phí bổ sung (ngoài ghi danh tự động) |
| `GET` | `/api/tuition/invoices/:id` | Admin, Receptionist | All | Chi tiết hóa đơn (kèm danh sách Payments đã thu) |
| `PUT` | `/api/tuition/invoices/:id` | Admin, Receptionist | All | Cập nhật hạn nộp (`dueDate`) hoặc ghi chú (Cấm sửa `paidAmount`) |
| `GET` | `/api/student/me/invoices` | Student | Self Only | Học viên xem hóa đơn học phí cá nhân |

> **RÀNG BUỘC TOÀN VẸN TÀI CHÍNH:**  
> Client **tuyệt đối không được gửi payload cập nhật trực tiếp** 2 trường `paidAmount` và `remainingAmount`. Backend luôn tự động tính toán hai trường này dựa trên lịch sử thanh toán thực tế.

---

## 15. PAYMENT APIS (LỊCH SỬ THU TIỀN & HỦY GIAO DỊCH)

Base Path: `/api/payments` và Nested Endpoints

| Method | Endpoint | Allowed Roles | Data Scope | Mô tả chức năng |
| :--- | :--- | :---: | :---: | :--- |
| `POST` | `/api/tuition/invoices/:invoiceId/payments` | Admin, Receptionist | All | **Ghi nhận thanh toán (Thu tiền)** - Sử dụng MongoDB Transaction |
| `GET` | `/api/tuition/invoices/:invoiceId/payments` | Admin, Receptionist | All | Lịch sử các lần đóng tiền của hóa đơn |
| `GET` | `/api/payments/:id` | Admin, Receptionist | All | Xem chi tiết phiếu thu |
| `POST` | `/api/payments/:id/void` | **Admin Only** | All | **Hủy giao dịch thu sai (Void)** - Sử dụng MongoDB Transaction |
| `GET` | `/api/student/me/payments` | Student | Self Only | Học viên xem lịch sử đóng tiền của chính mình |

> **QUY TẮC BẢO TOÀN GIAO DỊCH:**  
> - **KHÔNG CÓ METHOD `DELETE /api/payments/:id`**.  
> - Mọi thao tác `POST payment` và `POST void` đều bắt buộc phải chạy trong **MongoDB Session Transaction** (`session.withTransaction`).  
> - Số tiền thanh toán bắt buộc dương (`amount > 0`) và không vượt quá số nợ (`amount <= remainingAmount`).

#### `POST /api/tuition/invoices/:invoiceId/payments`
- **Body:**
  ```json
  {
    "amount": 2000000,
    "paymentMethod": "bank_transfer",
    "transactionCode": "FT2628091823",
    "note": "Nộp học phí đợt 1 qua Vietcombank"
  }
  ```
- **Response 201 Created:** Trả về đối tượng `Payment` mới kèm số dư hóa đơn cập nhật.

#### `POST /api/payments/:id/void` (Admin Only)
- **Body:**
  ```json
  {
    "voidReason": "Lễ tân nhập nhầm số tiền của học viên khác"
  }
  ```
- **Response 200 OK:** Cập nhật `payment.status = 'voided'`, trừ ngược `paidAmount` của hóa đơn tương ứng.

---

## 16. DASHBOARD APIS (BẢNG ĐIỀU KHIỂN THEO 4 ROLE)

| Method | Endpoint | Allowed Roles | Data Scope | Chỉ số tổng hợp trả về (Metrics Summary) |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/api/admin/dashboard` | Admin | All | `totalStudents`, `activeStudents`, `totalTeachers`, `activeClasses`, `todayClasses`, `totalTuition`, `paidTuition`, `outstandingTuition`, danh sách lớp học hôm nay |
| `GET` | `/api/receptionist/dashboard`| Receptionist | Operational | Các chỉ số vận hành tương tự Admin phục vụ tiếp đón học viên và thu hồi công nợ |
| `GET` | `/api/teacher/dashboard` | Teacher | Assigned Only| `assignedClassesCount`, `todaySchedule` (Lịch dạy hôm nay), `attendanceSummary` của các lớp mình phụ trách |
| `GET` | `/api/student/dashboard` | Student | Self Only | `activeClassesCount`, `weeklySchedule`, `attendanceSummary` cá nhân, `latestTestResults`, `tuitionSummary` |

---

## 17. NOTICE APIS (BẢNG TIN THÔNG BÁO)

Base Path: `/api/notices`

| Method | Endpoint | Allowed Roles | Data Scope | Mô tả chức năng |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/` | All Roles | Scoped by Audience | Xem thông báo (Lọc theo role người dùng: `all`, `teacher`, `student`, `receptionist`) |
| `POST` | `/` | Admin, Receptionist | All | Đăng thông báo mới |
| `PUT` | `/:id` | Admin, Receptionist | All | Chỉnh sửa nội dung thông báo |
| `DELETE`| `/:id` | Admin | All | Xóa thông báo |

---

## 18. STUDY MATERIAL APIS (TÀI LIỆU HỌC TẬP THEO LỚP)

Base Path: `/api/materials` và `/api/classes/:classId/materials`

| Method | Endpoint | Allowed Roles | Data Scope | Mô tả chức năng |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/api/classes/:classId/materials` | All Roles | Scoped | Danh sách tài liệu của lớp (Student chỉ xem lớp mình học, Teacher chỉ xem lớp mình dạy) |
| `POST` | `/api/classes/:classId/materials` | Admin, Teacher | Assigned Only | Upload tài liệu bài giảng mới cho lớp (Multipart/form-data) |
| `DELETE`| `/api/materials/:id` | Admin, Teacher | Assigned Only | Xóa tài liệu khỏi lớp học |

---

## 19. VALIDATION & ERROR CODES MATRIX (MA TRẬN MÃ LỖI & RÀNG BUỘC)

| Mã lỗi HTTP | Tên chuẩn | Tình huống nghiệp vụ phát sinh | Cấu trúc phản hồi mẫu |
| :---: | :--- | :--- | :--- |
| **`400`** | Bad Request | - ID không phải định dạng MongoDB ObjectId hợp lệ.<br>- Payload JSON bị lỗi cú pháp. | `{"success": false, "message": "Mã định danh không hợp lệ"}` |
| **`401`** | Unauthorized | - Không có Header `Authorization: Bearer <token>`.<br>- Token hết hạn hoặc sai chữ ký bí mật.<br>- Tài khoản bị khóa (`status === 'inactive'`). | `{"success": false, "message": "Phiên đăng nhập không hợp lệ hoặc đã hết hạn"}` |
| **`403`** | Forbidden | - Receptionist cố truy cập Quản trị tài khoản/Phân quyền.<br>- Teacher cố truy cập Học phí/Thu tiền.<br>- Teacher cố điểm danh/nhập điểm lớp của đồng nghiệp.<br>- Student cố xem dữ liệu của Student khác. | `{"success": false, "message": "Bạn không có quyền thực hiện hành động này"}` |
| **`404`** | Not Found | - Không tìm thấy bản ghi trong Database.<br>- Hoặc áp dụng để che giấu ID tài nguyên ngoài phạm vi sở hữu. | `{"success": false, "message": "Không tìm thấy tài nguyên yêu cầu"}` |
| **`409`** | Conflict | - Học viên đã có ghi danh `active` trong lớp này.<br>- Lớp học đã đạt sĩ số tối đa `maxCapacity`.<br>- Xung đột lịch học (Trùng giờ Giáo viên, Phòng, hoặc Học viên).<br>- Số tiền thanh toán vượt quá số nợ còn lại (`Overpayment`). | `{"success": false, "message": "Xung đột lịch học: Giáo viên đã có ca dạy khác vào thời gian này"}` |
| **`422`** | Unprocessable | - Điểm kỹ năng ngoài phạm vi 0 – 100.<br>- Số tiền thanh toán $\le 0$.<br>- Số điện thoại không đúng chuẩn 10 chữ số VN. | `{"success": false, "message": "Dữ liệu không hợp lệ", "errors": [...]}` |
| **`500`** | Server Error | - Lỗi kết nối MongoDB, lỗi transaction rollback ngoài ý muốn. | `{"success": false, "message": "Lỗi hệ thống nội bộ, vui lòng thử lại sau"}` |

---

## 20. AUTHORIZATION MATRIX (MA TRẬN PHÂN QUYỀN ENDPOINT TOÀN DIỆN)

| Nhóm API Endpoint | ADMIN | RECEPTIONIST | TEACHER | STUDENT | Điều kiện Kiểm soát Sở hữu (Ownership Gate) |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `/api/auth/*` | ✅ | ✅ | ✅ | ✅ | Cá nhân thao tác trên token chính mình |
| `/api/accounts/*` | ✅ | ❌ | ❌ | ❌ | Chặn ở Middleware `adminOnly` |
| `/api/students` (CRUD) | ✅ | ✅ | 🟡 (View only) | ❌ | Teacher chỉ xem học viên thuộc lớp mình dạy |
| `/api/teachers` (CRUD) | ✅ | 🟡 (View only) | 🟡 (Self view) | ❌ | Receptionist chỉ đọc, Teacher chỉ xem profile mình |
| `/api/classes` (CRUD) | ✅ | 🟡 (View only) | 🟡 (Assigned) | 🟡 (Enrolled)| Teacher/Student chỉ truy cập lớp có liên kết |
| `/api/enrollments/*` | ✅ | ✅ | ❌ | ❌ | Receptionist/Admin thực hiện nghiệp vụ ghi danh |
| `/api/schedules/*` | ✅ | 🟡 (View only) | 🟡 (View only) | 🟡 (View only)| Chỉ Admin được sửa lịch học |
| `/api/sessions/*` | ✅ | 🟡 (View only) | 🟡 (Assigned) | 🟡 (Enrolled)| Teacher điểm danh/hoàn thành buổi học lớp mình |
| `/api/sessions/:id/attendance`| ✅ | 🟡 (View only) | 🟡 (Assigned) | ❌ | Teacher chỉ được điểm danh lớp mình phụ trách |
| `/api/results/*` | ✅ | 🟡 (View only) | 🟡 (Assigned) | ❌ | Teacher chỉ nhập điểm lớp mình; Recep chỉ xem |
| `/api/tuition/invoices/*`| ✅ | ✅ | ❌ | ❌ | Teacher hoàn toàn bị cách ly khỏi module học phí |
| `/api/payments/*` | ✅ | ✅ (No void) | ❌ | ❌ | Chỉ Admin có quyền Void payment; Recep chỉ thu tiền |
| `/api/student/me/*` | ❌ | ❌ | ❌ | 🟡 (Self only)| Dữ liệu truy vấn cố định bằng `req.user._id` |
| `/api/teacher/me/*` | ❌ | ❌ | 🟡 (Self only)| ❌ | Dữ liệu truy vấn cố định bằng `req.user._id` |

---

## 21. EXISTING ROUTE MIGRATION MAPPING (KẾ HOẠCH CHUYỂN DỊCH ĐỊNH TUYẾN)

Source code hiện tại đang tổ chức định tuyến theo Role cứng nhắc (`/api/admin`, `/api/professor`, `/api/student`). Khi chuyển dịch sang VLearn, hệ thống chuyển sang **Kiến trúc Hướng Tài nguyên (Resource-Oriented Architecture)** kết hợp với Self-routes:

| Nhóm Route Cũ (University) | Nhóm Route Mới (VLearn) | Hành động | Hướng dẫn Kỹ thuật Chuyển dịch |
| :--- | :--- | :---: | :--- |
| `/api/auth` | `/api/auth` | **REUSE & ENHANCE** | Giữ nguyên JWT flow, cập nhật payload role mới, thêm check `status === 'active'`. |
| `/api/admin/users` | `/api/accounts`, `/api/students`, `/api/teachers` | **REPLACE & TÁCH RỜI** | Tách riêng endpoint quản lý tài khoản nội bộ và hồ sơ học viên, giáo viên. |
| `/api/admin/courses` | `/api/classes` | **RENAME & MODIFY** | Đổi tên sang Class, bổ sung logic kiểm tra sĩ số, học phí, kỹ năng. |
| `/api/admin/subjects` | *Bị loại bỏ* | **DEPRECATED** | Gộp trực tiếp thuộc tính `skill` vào Lớp học (`classes.skill`). |
| `/api/admin/leaves` | *Bị loại bỏ* | **DEPRECATED** | Tinh gọn khỏi MVP, thay bằng trạng thái điểm danh `Excused`. |
| `/api/professor/*` | `/api/teacher/me/*` & `/api/classes/:id/*` | **REPLACE & REFACTOR**| Chuyển từ `/professor` sang `/teacher/me` và các endpoint lớp học theo quyền sở hữu. |
| `/api/student/*` | `/api/student/me/*` | **REFACTOR** | Chuẩn hóa toàn bộ thành `/api/student/me/*`, tuyệt đối không truyền `studentId` trên URL. |
| *Chưa có* | `/api/enrollments` | **ADD MỚI** | Xây dựng mới hoàn toàn: Ghi danh, Xếp lớp, Chuyển lớp, Thôi học. |
| *Chưa có* | `/api/schedules`, `/api/sessions`| **ADD MỚI** | Xây dựng mới: Quản lý thời khóa biểu tuần và sinh danh sách buổi học cụ thể. |
| *Chưa có* | `/api/tuition/invoices`, `/api/payments`| **ADD MỚI** | Xây dựng mới: Quản lý hóa đơn công nợ và thu tiền nhiều đợt với MongoDB Transaction. |
| *Chưa có* | `/api/receptionist/dashboard` | **ADD MỚI** | Xây dựng Dashboard riêng cho phân hệ Lễ tân / Vận hành. |

---

## 22. API ACCEPTANCE CRITERIA (TIÊU CHÍ NGHIỆM THU ĐẶC TẢ API)

Đặc tả REST API được nghiệm thu đạt chuẩn khi đáp ứng đầy đủ 12 tiêu chí:

- [x] **Bao phủ toàn diện Core Modules:** Tất cả 11 Core Modules và 2 Utility Modules đều có định nghĩa endpoint đầy đủ.
- [x] **Kiểm soát Phân quyền tường minh:** Mỗi endpoint đều chỉ định rõ Allowed Roles, Data Scope và điều kiện kiểm tra quyền sở hữu (Ownership Gate).
- [x] **Cô lập Lớp học của Giáo viên:** Teacher tuyệt đối không thể xem, điểm danh hoặc nhập điểm cho lớp của giáo viên khác.
- [x] **Cách ly Học viên an toàn:** Các API `/api/student/me/*` truy vấn dữ liệu cố định qua danh tính JWT (`req.user._id`), không nhận tham số `studentId` tự do.
- [x] **Bảo vệ Vùng cấm Lễ tân:** Receptionist không thể truy cập bất kỳ endpoint nào thuộc `/api/accounts` hoặc quản lý phân quyền Admin.
- [x] **Điểm danh Hàng loạt Tối ưu:** Cung cấp endpoint Bulk Upsert `PUT /api/sessions/:sessionId/attendance`, hỗ trợ lưu danh sách cả lớp trong 1 request an toàn.
- [x] **Ràng buộc Xếp lớp Chặt chẽ:** API ghi danh kiểm tra tự động sĩ số tối đa (`maxCapacity`), trùng lặp active và xung đột thời khóa biểu trước khi tạo hóa đơn.
- [x] **Giao dịch Thu tiền Nguyên tử:** API tạo thanh toán (`POST payment`) và hủy thanh toán (`POST void`) bắt buộc thực thi trong MongoDB Session Transaction, không cho phép xóa cứng.
- [x] **Bảo vệ Tính toán Học phí:** Hóa đơn học phí tự động quản lý số dư; chặn hoàn toàn client gửi payload sửa trực tiếp `paidAmount` hay `remainingAmount`.
- [x] **Phân trang Chuẩn mực:** Tất cả các endpoint trả về danh sách đều hỗ trợ `page`, `limit` và cấu trúc `pagination` đồng nhất.
- [x] **Mã lỗi Nhất quán:** Sử dụng chính xác các mã `400`, `401`, `403`, `404`, `409`, `422`, `500` theo đúng ngữ cảnh nghiệp vụ.
- [x] **Lộ trình Chuyển dịch Mã nguồn Rõ ràng:** Cung cấp bảng ánh xạ chi tiết để chuyển đổi các route đại học cũ sang kiến trúc RESTful mới mà không làm gián đoạn hệ thống.

---

> 🛑 **KẾT THÚC TÀI LIỆU REST API SPECIFICATION.**  
> Dự án tạm dừng tại đây. Không có mã nguồn nào bị thay đổi. Chờ phê duyệt của bạn trước khi bước sang giai đoạn tiếp theo!
