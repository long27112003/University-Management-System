# PRODUCT SPECIFICATION
# ENGLISH CENTER STUDENT MANAGEMENT SYSTEM
### Hệ thống Web Quản lý Học viên Trung tâm Anh ngữ

---

## 1. PROJECT OVERVIEW (TỔNG QUAN DỰ ÁN)

- **Tên dự án:** English Center Student Management System (EC-SMS).
- **Loại ứng dụng:** Hệ thống Web Application quản lý nội bộ (Internal Management Portal).
- **Mục đích:** Số hóa toàn diện quy trình vận hành học vụ và tài chính cơ bản tại một trung tâm Anh ngữ; bao gồm quản lý thông tin học viên, giáo viên, danh mục lớp học theo kỹ năng, lịch học, xếp lớp, điểm danh từng buổi, đánh giá kết quả học tập (4 kỹ năng: Nghe, Nói, Đọc, Viết) và theo dõi công nợ học phí/lịch sử thanh toán.
- **Phạm vi phiên bản:** MVP (Minimum Viable Product).
- **Định hướng kiến trúc:** Kế thừa và nâng cấp trên nền tảng sẵn có (React Vite + Node.js Express + MongoDB) nhằm tối ưu thời gian phát triển và đảm bảo tính ổn định.

---

## 2. PROBLEM STATEMENT (BÀI TOÁN & THỰC TRẠNG)

Hiện tại, nhiều trung tâm Anh ngữ quy mô vừa và nhỏ gặp khó khăn trong công tác quản lý do:
1. **Quản lý phân tán và thủ công:** Điểm danh, thông tin học viên và lịch học thường được lưu trên các bảng tính Excel rời rạc, dẫn đến sai lệch số liệu và khó tra cứu tức thì.
2. **Theo dõi công nợ học phí thiếu minh bạch:** Việc ghi nhận học viên nộp học phí nhiều đợt (trả góp, đặt cọc, đóng bổ sung) dễ bị thất thoát hoặc nhầm lẫn giữa số tiền đã đóng và số tiền còn thiếu.
3. **Đặc thù đào tạo Anh ngữ không được hỗ trợ:** Các hệ thống quản lý đào tạo truyền thống (như trường học/đại học) quản lý theo ngành học 3-4 năm và môn học học kỳ, trong khi trung tâm Anh ngữ vận hành theo các lớp ngắn hạn (2-3 tháng), chia theo ca học (2-4-6, 3-5-7), tập trung vào 4 kỹ năng chuẩn (Listening, Speaking, Reading, Writing).
4. **Thiếu kênh tương tác học vụ:** Học viên khó chủ động nắm bắt lịch học, tình trạng điểm danh, kết quả các bài kiểm tra và tình trạng học phí của bản thân.

---

## 3. GOALS (MỤC TIÊU DỰ ÁN)

1. **Chuẩn hóa dữ liệu học vụ:** Tập trung toàn bộ dữ liệu học viên, giáo viên, lớp học và lịch học trên một cơ sở dữ liệu duy nhất.
2. **Quản lý lớp học linh hoạt theo kỹ năng:** Hỗ trợ mô hình lớp học chuyên sâu theo 4 kỹ năng (Listening, Speaking, Reading, Writing) trong cùng một kiến trúc thống nhất.
3. **Chính xác hóa điểm danh:** Điểm danh chi tiết theo từng Buổi học (Class Session) của từng Lớp học (Class), loại bỏ hoàn toàn việc điểm danh chung chung theo ngày không gắn với lớp.
4. **Theo dõi tài chính minh bạch:** Mỗi lần ghi danh (Enrollment) gắn liền với một Hóa đơn học phí (Tuition Invoice), hỗ trợ thanh toán nhiều lần và tự động tính toán dư nợ (Remaining Balance).
5. **Cổng thông tin riêng biệt cho 4 nhóm đối tượng:** Tối ưu trải nghiệm làm việc cho Quản trị viên, Lễ tân, Giáo viên và Học viên thông qua các Dashboard phù hợp với vai trò.

---

## 4. TARGET USERS (ĐỐI TƯỢNG SỬ DỤNG)

| Nhóm người dùng | Mục đích sử dụng chính |
| :--- | :--- |
| **Chủ trung tâm / Quản trị viên (Admin)** | Quản lý toàn bộ nhân sự, tài chính, lớp học, phân quyền hệ thống và theo dõi báo cáo tổng quan. |
| **Nhân viên Lễ tân / TVTS (Receptionist)** | Tiếp nhận học viên, tư vấn xếp lớp, chuyển lớp, tạo hóa đơn học phí, thu tiền và tra cứu lịch học/điểm danh. |
| **Giáo viên (Teacher)** | Xem lịch dạy, danh sách học viên các lớp mình phụ trách, thực hiện điểm danh từng buổi và nhập điểm đánh giá kỹ năng. |
| **Học viên (Student)** | Xem thời khóa biểu, lịch sử điểm danh cá nhân, bảng điểm 4 kỹ năng và tình trạng đóng học phí. |

---

## 5. ROLES (HỆ THỐNG VAI TRÒ & PHÂN QUYỀN TRUY CẬP)

Hệ thống hỗ trợ chính xác **4 vai trò bắt buộc**:

```
[System Roles]
 ├── 1. Admin (Quản trị viên)
 ├── 2. Receptionist (Lễ tân / Tư vấn tuyển sinh)
 ├── 3. Teacher (Giáo viên)
 └── 4. Student (Học viên)
```

### Bảng phân quyền chi tiết (RBAC Matrix):

| Phân hệ / Chức năng | Admin | Receptionist | Teacher | Student |
| :--- | :---: | :---: | :---: | :---: |
| **Đăng nhập & Quản lý hồ sơ cá nhân** | Toàn quyền | Toàn quyền | Toàn quyền | Chỉ xem/sửa cá nhân |
| **Quản lý Tài khoản & Phân quyền Admin/Staff** | Toàn quyền | Không có quyền | Không có quyền | Không có quyền |
| **Quản lý Hồ sơ Học viên (CRUD)** | Toàn quyền | Toàn quyền | Chỉ xem lớp mình | Chỉ xem cá nhân |
| **Quản lý Hồ sơ Giáo viên (CRUD)** | Toàn quyền | Chỉ xem | Chỉ xem cá nhân | Không có quyền |
| **Quản lý Lớp học (Tạo, sửa, hủy lớp)** | Toàn quyền | Chỉ xem | Chỉ xem lớp mình | Chỉ xem lớp đang học |
| **Ghi danh (Enrollment), Xếp lớp, Chuyển lớp** | Toàn quyền | Toàn quyền | Không có quyền | Không có quyền |
| **Lập Lịch học / Thời khóa biểu (Schedule)** | Toàn quyền | Chỉ xem | Chỉ xem lịch dạy | Chỉ xem lịch học |
| **Điểm danh buổi học (Attendance)** | Toàn quyền | Xem tất cả | Điểm danh lớp mình | Chỉ xem lịch sử cá nhân |
| **Nhập kết quả học tập (Learning Results)** | Toàn quyền | Xem tất cả | Nhập/sửa lớp mình | Chỉ xem điểm cá nhân |
| **Quản lý Học phí & Thu tiền (Tuition & Payments)**| Toàn quyền | Toàn quyền | Không có quyền | Chỉ xem công nợ cá nhân |
| **Dashboard Tổng quan** | Toàn bộ chỉ số | Chỉ số học vụ + thu | Chỉ số lớp + lịch | Lịch + Điểm + Học phí |

---

## 6. CORE MODULES (CÁC PHÂN HỆ CỐT LÕI)

Hệ thống bao gồm **12 Module nghiệp vụ bắt buộc** và 2 module tiện ích phụ trợ kế thừa:

```
[Core Modules]
 ├── 1. Authentication Module (Xác thực & Bảo mật)
 ├── 2. Account & Role Management (Quản lý Tài khoản & Phân quyền)
 ├── 3. Student Management (Quản lý Học viên)
 ├── 4. Teacher Management (Quản lý Giáo viên)
 ├── 5. Class Management (Quản lý Lớp học theo Kỹ năng)
 ├── 6. Enrollment Module (Ghi danh & Xếp lớp)
 ├── 7. Schedule Module (Thời khóa biểu & Lịch học)
 ├── 8. Attendance Module (Điểm danh theo Buổi học)
 ├── 9. Learning Results Module (Đánh giá 4 Kỹ năng)
 ├── 10. Tuition Module (Quản lý Hóa đơn Học phí)
 ├── 11. Payments Module (Ghi nhận Thu tiền & Lịch sử)
 └── 12. Dashboard Module (Bảng điều khiển theo 4 Role)

[Utility Modules - Giữ lại gọn nhẹ từ hệ thống cũ]
 ├── 13. Notice Board (Bảng thông báo trung tâm)
 └── 14. Study Materials (Tài liệu học tập đính kèm theo lớp)
```

---

## 7. FUNCTIONAL REQUIREMENTS (YÊU CẦU CHỨC NĂNG CHI TIẾT)

### 7.1. Authentication (Xác thực)
- **Đăng nhập:** Hỗ trợ đăng nhập bằng `Email` và `Mật khẩu`.
- **Cơ chế:** Cấp phát mã định danh an toàn (JWT Token) kèm thông tin Role.
- **Tự động điều hướng:** Sau khi đăng nhập, hệ thống tự động chuyển hướng người dùng đến Dashboard tương ứng với Role của họ (`/admin`, `/receptionist`, `/teacher`, `/student`).
- **Bảo vệ tuyến đường (Protected Routes):** Chặn truy cập trái phép ở cả Frontend và Backend nếu người dùng không đủ quyền hạn.
- **Đổi mật khẩu & Cập nhật hồ sơ:** Người dùng có thể tự đổi mật khẩu và cập nhật thông tin liên hệ cơ bản của bản thân.

### 7.2. Account & Role Management (Quản lý Tài khoản & Phân quyền)
- Cho phép Admin quản lý danh sách tài khoản nội bộ (Admin, Receptionist, Teacher).
- Kích hoạt / Khóa tài khoản khi nhân sự nghỉ việc.
- Receptionist không được phép xem hoặc chỉnh sửa danh sách tài khoản Admin / cấu hình phân quyền hệ thống.

### 7.3. Student Management (Quản lý Học viên)
- **Đối tượng thao tác:** Admin và Receptionist.
- **Các tính năng bắt buộc:**
  - Tạo mới hồ sơ học viên: Họ tên, Email, Số điện thoại, Ngày sinh, Giới tính, Địa chỉ, Họ tên phụ huynh/người liên hệ, Số điện thoại liên hệ khẩn cấp, Ghi chú.
  - Tự động sinh Mã học viên duy nhất (VD: `HV2026001`).
  - Chỉnh sửa và cập nhật thông tin học viên.
  - Tìm kiếm học viên nhanh theo: Tên, Số điện thoại, Email, Mã học viên.
  - Bộ lọc học viên theo: Trạng thái (Đang học, Chờ lớp, Đã hoàn thành, Tạm ngừng), Lớp học hiện tại.
  - **Trang chi tiết học viên (Student 360 Profile):** Tích hợp xem toàn bộ thông tin trong một màn hình:
    - Danh sách lớp đã và đang học.
    - Lịch học hiện tại.
    - Lịch sử điểm danh tại các lớp.
    - Kết quả học tập và nhận xét qua các đợt thi.
    - Tình trạng học phí, tổng số tiền còn nợ.
    - Lịch sử các lần đóng tiền.

### 7.4. Teacher Management (Quản lý Giáo viên)
- **Đối tượng thao tác:** Admin (Toàn quyền), Receptionist (Chỉ xem).
- **Thông tin quản lý:** Họ tên, Email, Số điện thoại, Giới tính, Địa chỉ, Chuyên môn chính, Trạng thái hoạt động (Đang dạy, Tạm nghỉ).
- **Xem phân công:** Xem danh sách các lớp học mà giáo viên đang phụ trách giảng dạy.
- *Lưu ý MVP:* Không quản lý bảng lương (Payroll), đơn giá theo giờ, hợp đồng lao động hay chứng chỉ bằng cấp chi tiết.

### 7.5. Class Management (Quản lý Lớp học)
- **Cấu trúc lớp học:** Không tạo 4 bảng dữ liệu riêng lẻ cho 4 kỹ năng. Tất cả lớp học dùng chung một mô hình dữ liệu thống nhất với trường định danh kỹ năng:
  - `skill`: hỗ trợ các giá trị `listening`, `speaking`, `reading`, `writing`. (Có thể bổ sung giá trị `general` / `ielts_all` nếu là lớp tổng hợp).
- **Thông tin lớp học:**
  - Tên lớp (VD: *IELTS Speaking Intensive K12*, *Reading & Writing Foundation 03*).
  - Mã lớp (VD: *SPK-K12*, *RW-F03*).
  - Kỹ năng trọng tâm (`skill`).
  - Giáo viên phụ trách chính (`teacher`).
  - Sĩ số tối đa (Max capacity).
  - Ngày bắt đầu (Start Date) và Ngày dự kiến kết thúc (End Date).
  - Học phí chuẩn của lớp (Tuition fee).
  - Phòng học mặc định (Room).
  - Trạng thái lớp: `Upcoming` (Sắp khai giảng), `Active` (Đang học), `Completed` (Đã kết thúc), `Cancelled` (Đã hủy).

### 7.6. Enrollment (Ghi danh, Xếp lớp & Chuyển lớp)
- **Ghi danh (Enroll):** Thêm một học viên vào một lớp học đang mở hoặc sắp mở.
  - Kiểm tra sĩ số tối đa của lớp trước khi ghi danh.
  - Khi ghi danh thành công, tự động khởi tạo **Hóa đơn học phí (Tuition Invoice)** tương ứng cho học viên đó.
- **Chuyển lớp (Transfer Class):** Cho phép Receptionist / Admin chuyển học viên từ Lớp A sang Lớp B (cùng cấp độ/kỹ năng).
  - Cập nhật sĩ số của cả hai lớp.
  - Bảo lưu hoặc điều chuyển thông tin học phí đã nộp sang lớp mới.
- **Rút tên / Hủy ghi danh (Drop):** Đánh dấu trạng thái ghi danh là đã thôi học hoặc bảo lưu.

### 7.7. Schedule (Thời khóa biểu & Lịch học)
- **Định dạng lịch học của lớp:**
  - Các ngày trong tuần (Thứ 2-4-6, Thứ 3-5-7, Thứ 7-CN...).
  - Khung giờ học (VD: 17:30 - 19:00, 19:30 - 21:00).
  - Phòng học (Room).
- **Sinh buổi học (Class Sessions):**
  - Hệ thống dựa vào ngày bắt đầu, ngày kết thúc và lịch học tuần để định hình danh sách các **Buổi học cụ thể** (Class Sessions) với ngày giờ chính xác.
  - Buổi học là đơn vị cơ sở để thực hiện Điểm danh.

### 7.8. Attendance (Điểm danh)
- **Nguyên tắc cốt lõi:**
  - **Attendance = Student + Class + Class Session**.
  - Tuyệt đối không dùng logic cũ (`Student + Course + Date`).
  - Không cho phép trùng lặp bản ghi điểm danh cho cùng một học viên trong cùng một buổi học (`unique: student + session`).
- **Trạng thái điểm danh bắt buộc:**
  - `Present` (Có mặt)
  - `Absent` (Vắng mặt)
  - `Late` (Đi muộn)
  - `Excused` (Nghỉ có phép)
- **Thao tác điểm danh (Giáo viên):**
  - Giáo viên chọn Lớp học $\rightarrow$ Chọn Buổi học hôm nay.
  - Hệ thống hiển thị danh sách tất cả học viên trong lớp với trạng thái mặc định là `Present`.
  - Giáo viên bấm đổi trạng thái nhanh sang `Absent`, `Late` hoặc `Excused`, ghi chú lý do (nếu có) và nhấn Lưu.

### 7.9. Learning Results (Kết quả học tập theo 4 Kỹ năng)
- **Nguyên tắc:** Quản lý kết quả học tập theo từng đợt kiểm tra của lớp, không xây dựng hệ thống thi cử/đề thi phức tạp.
- **Các trường điểm số:**
  - Điểm Nghe (`listeningScore`)
  - Điểm Nói (`speakingScore`)
  - Điểm Đọc (`readingScore`)
  - Điểm Viết (`writingScore`)
  - Điểm Tổng kết / Band điểm chung (`overallScore`)
  - Nhận xét chi tiết của giáo viên (`teacherComment`)
- **Loại bài kiểm tra (`testType`):** Hỗ trợ phân loại đơn giản gồm:
  - `Placement Test` (Kiểm tra đầu vào)
  - `Midterm` (Kiểm tra giữa kỳ)
  - `Final` (Kiểm tra cuối khóa)
  - `Mock Test` (Thi thử)
- **Quyền thao tác:** Giáo viên nhập và cập nhật điểm cho học viên thuộc lớp mình dạy; Học viên chỉ xem kết quả của chính mình; Admin và Receptionist có quyền xem toàn bộ.

### 7.10. Tuition (Quản lý Học phí)
- **Nguyên tắc cốt lõi:**
  - **Tuyệt đối không dùng cờ nhị phân `paid = true/false`**.
  - Mô hình hóa theo dạng Hóa đơn học phí (Tuition Invoice):
    $$\text{Remaining Balance (Còn thiếu)} = \text{Total Amount (Tổng học phí)} - \text{Paid Amount (Đã thanh toán)}$$
- **Trạng thái hóa đơn học phí (`invoiceStatus`):**
  - `Unpaid`: Chưa thanh toán bất kỳ khoản nào (`paidAmount = 0`).
  - `Partial`: Đã thanh toán một phần (`0 < paidAmount < totalAmount`).
  - `Paid`: Đã thanh toán đầy đủ (`paidAmount >= totalAmount`).
  - `Overdue`: Quá hạn thanh toán (nếu có cài đặt hạn nộp).
- **Hạn mức MVP:** Chỉ quản lý số tiền gốc, số tiền đã nộp và số tiền còn thiếu. Các tính năng giảm giá phức tạp (Discount), học bổng (Scholarship) hoặc in hóa đơn đỏ (Printable receipt) được xếp vào phần Mở rộng tương lai (Optional).

### 7.11. Payments (Ghi nhận Thanh toán & Lịch sử)
- **Nguyên tắc cốt lõi:**
  - **Mỗi lần nộp tiền là một bản ghi thanh toán mới (Payment Record)**.
  - Không được phép ghi đè (overwrite) bản ghi cũ khi học viên nộp tiền đợt tiếp theo.
  - Khi một bản ghi Payment được tạo, hệ thống tự động cộng dồn vào `paidAmount` của Invoice tương ứng và tính lại `remainingAmount`.
- **Thông tin bản ghi thanh toán (Payment):**
  - Hóa đơn liên kết (`invoiceId`).
  - Học viên nộp tiền (`studentId`).
  - Số tiền thanh toán lần này (`amount`).
  - Ngày thanh toán (`paymentDate`).
  - Phương thức thanh toán (`paymentMethod`): `Tiền mặt (Cash)`, `Chuyển khoản (Bank Transfer)`, `Thẻ (Card)`.
  - Mã giao dịch / Mã tham chiếu (`transactionCode` - ví dụ: mã ủy nhiệm chi/mã giao dịch ngân hàng).
  - Ghi chú (`note`).
  - Người thu tiền (`createdBy` - Nhân viên Lễ tân hoặc Admin thực hiện).

### 7.12. Dashboard (Bảng điều khiển theo 4 Role)

#### A. Admin & Receptionist Dashboard
- Thẻ thống kê tổng quan (Summary Cards):
  - Tổng số học viên trung tâm.
  - Số lượng học viên đang theo học thực tế.
  - Tổng số giáo viên đang hoạt động.
  - Số lượng lớp học đang mở (`Active`).
  - Số lớp có lịch học trong ngày hôm nay.
- Thống kê tài chính trung tâm:
  - Tổng học phí cần thu (Tổng tiền các hóa đơn).
  - Tổng số tiền thực tế đã thu được.
  - Tổng số tiền học phí còn thiếu (Công nợ cần thu hồi).
- Bảng danh sách các lớp học diễn ra hôm nay kèm phòng học và giáo viên.

#### B. Teacher Dashboard
- Danh sách các lớp học mình đang phụ trách giảng dạy.
- Lịch dạy ngày hôm nay (Lớp nào, Ca nào, Phòng nào).
- Bảng tóm tắt tỷ lệ chuyên cần (Attendance Summary) của các lớp đang phụ trách.
- Lối tắt nhanh đến chức năng Điểm danh buổi học và Nhập kết quả học tập.

#### C. Student Dashboard
- Thẻ thông tin cá nhân và lớp học đang tham gia.
- Lịch học trong tuần của học viên (Thời khóa biểu cá nhân).
- Tỷ lệ chuyên cần cá nhân (Tổng số buổi đã học, số buổi có mặt, vắng, muộn).
- Kết quả học tập bài kiểm tra gần nhất (Điểm 4 kỹ năng & Nhận xét của giáo viên).
- Trạng thái học phí cá nhân: Đã nộp bao nhiêu, còn thiếu bao nhiêu và hạn hoàn thành.

### 7.13. Các phân hệ phụ trợ giữ lại (Notice Board & Study Materials)
- **Notice Board (Bảng thông báo):** Giữ nguyên kiến trúc hiện có. Admin/Receptionist đăng thông báo khai giảng, lịch nghỉ lễ, sự kiện; phân loại đối tượng nhận (`All`, `Teacher`, `Student`).
- **Study Materials (Tài liệu học tập):** Giữ nguyên module upload file hiện tại nhưng chuyển đổi liên kết từ `Course` sang `Class`. Giáo viên upload slide bài giảng/bài tập PDF cho lớp của mình; học viên trong lớp có thể tải về.

---

## 8. MAIN USER FLOWS (LUỒNG NGHIỆP VỤ CHÍNH)

### Luồng 1: Tuyển sinh, Ghi danh & Xếp lớp
```
[Học viên mới đến trung tâm]
       │
       ▼
1. Receptionist tạo hồ sơ học viên mới (Thông tin cá nhân, liên hệ phụ huynh)
       │
       ▼
2. Receptionist chọn Lớp học phù hợp (Kiểm tra lịch học, kỹ năng và sĩ số trống)
       │
       ▼
3. Hệ thống tạo bản ghi Enrollment (Gắn học viên vào lớp)
       │
       ▼
4. Hệ thống tự động khởi tạo Tuition Invoice tương ứng với học phí của lớp
       │
       ▼
5. Học viên xuất hiện trong danh sách lớp và có lịch học trên Dashboard cá nhân
```

### Luồng 2: Thu học phí & Ghi nhận thanh toán nhiều đợt
```
[Học viên thanh toán học phí]
       │
       ▼
1. Receptionist tra cứu học viên -> Xem hóa đơn học phí còn nợ
       │
       ▼
2. Nhập số tiền thu đợt này + Chọn hình thức (Tiền mặt/Chuyển khoản) + Nhập mã giao dịch
       │
       ▼
3. Hệ thống lưu Payment Record mới (Lưu vết người thu, ngày giờ)
       │
       ▼
4. Hệ thống tự động cập nhật:
   - paidAmount += số tiền mới nộp
   - remainingAmount = totalAmount - paidAmount
   - Cập nhật invoiceStatus (Unpaid -> Partial hoặc Paid)
       │
       ▼
5. Học viên và Lễ tân đều kiểm tra được lịch sử đóng tiền minh bạch
```

### Luồng 3: Giáo viên xem lịch & Thực hiện điểm danh buổi học
```
[Giáo viên vào ca dạy]
       │
       ▼
1. Giáo viên đăng nhập -> Teacher Dashboard hiển thị lịch dạy hôm nay
       │
       ▼
2. Bấm "Điểm danh" vào buổi học hiện tại của lớp
       │
       ▼
3. Hệ thống hiển thị danh sách học viên trong lớp (Mặc định: Present)
       │
       ▼
4. Giáo viên chọn học viên vắng/muộn/phép -> Chuyển trạng thái tương ứng -> Bấm "Lưu"
       │
       ▼
5. Dữ liệu điểm danh được chốt cho Session đó (Khóa không cho tạo trùng lặp)
       │
       ▼
6. Dashboard của học viên ngay lập tức cập nhật tỷ lệ chuyên cần
```

### Luồng 4: Nhập & Xem kết quả đánh giá 4 kỹ năng
```
[Đợt kiểm tra định kỳ (Midterm / Final / Mock Test)]
       │
       ▼
1. Giáo viên chọn Lớp học -> Chọn loại bài test (VD: Midterm)
       │
       ▼
2. Nhập điểm: Listening, Speaking, Reading, Writing, Overall + Lời nhận xét
       │
       ▼
3. Bấm "Lưu kết quả"
       │
       ▼
4. Học viên đăng nhập tài khoản cá nhân -> Xem chi tiết điểm số 4 kỹ năng và lời khuyên của giáo viên
```

---

## 9. BUSINESS RULES (QUY TẮC NGHIỆP VỤ BẮT BUỘC)

1. **Quy tắc tính toán Học phí (Financial Integrity):**
   - $\text{Paid Amount} = \sum (\text{Tất cả các bản ghi Payment thuộc Invoice đó})$.
   - $\text{Remaining Amount} = \text{Total Amount} - \text{Paid Amount}$.
   - Nếu $\text{Paid Amount} = 0 \rightarrow \text{Trạng thái} = \text{Unpaid}$.
   - Nếu $0 < \text{Paid Amount} < \text{Total Amount} \rightarrow \text{Trạng thái} = \text{Partial}$.
   - Nếu $\text{Paid Amount} \ge \text{Total Amount} \rightarrow \text{Trạng thái} = \text{Paid}$.
   - Không cho phép xóa hoặc sửa đổi đè lên các Payment đã được ghi nhận trong quá khứ để tránh gian lận tài chính.

2. **Quy tắc Toàn vẹn Điểm danh (Attendance Uniqueness):**
   - Cặp khóa `(student, classSession)` là duy nhất (`unique`). Mỗi học viên chỉ có đúng một trạng thái điểm danh trong một buổi học cụ thể.
   - Khi chỉnh sửa điểm danh, hệ thống thực hiện cập nhật (`update`) bản ghi hiện có, không được tạo thêm bản ghi mới.

3. **Quy tắc Sĩ số Lớp học (Class Capacity Limit):**
   - Không cho phép ghi danh thêm học viên nếu số lượng học viên đang hoạt động trong lớp đã đạt tới `maxCapacity` (trừ khi có xác nhận ghi đè đặc biệt từ Admin).

4. **Quy tắc Bảo mật Dữ liệu Phân quyền (Data Privacy & Authorization):**
   - Học viên tuyệt đối chỉ được xem thông tin cá nhân, lịch học cá nhân, kết quả học tập và hóa đơn học phí của chính mình.
   - Giáo viên tuyệt đối không được truy cập vào module Học phí (Tuition) và Lịch sử thanh toán (Payments) của học viên.
   - Giáo viên chỉ được xem và thao tác dữ liệu trên các lớp học mà mình được phân công giảng dạy.
   - Lễ tân (Receptionist) không có quyền tạo tài khoản Admin hoặc thay đổi quyền quản trị hệ thống.

---

## 10. MVP SCOPE (PHẠM VI THỰC HIỆN MVP)

Các hạng mục bắt buộc phải hoàn thành trong phiên bản MVP:

1. **Nền tảng & Xác thực:**
   - 4 Role: Admin, Receptionist, Teacher, Student.
   - JWT Auth, Phân quyền Protected Route theo 4 Role.
2. **Quản lý Học viên:**
   - CRUD hồ sơ học viên, tìm kiếm, lọc, xem hồ sơ học viên tổng hợp 360 độ.
3. **Quản lý Giáo viên:**
   - CRUD hồ sơ giáo viên cơ bản, phân công lớp dạy.
4. **Quản lý Lớp học:**
   - CRUD lớp học hỗ trợ trường `skill` (Listening, Speaking, Reading, Writing).
5. **Ghi danh & Lịch học:**
   - Xếp lớp cho học viên, chuyển lớp, cấu hình lịch học trong tuần và sinh buổi học (Sessions).
6. **Điểm danh:**
   - Điểm danh theo Student + Class + Class Session với 4 trạng thái (Present, Absent, Late, Excused).
7. **Kết quả học tập:**
   - Nhập và tra cứu điểm số 4 kỹ năng (Nghe, Nói, Đọc, Viết) + Điểm Overall + Lời nhận xét theo bài test.
8. **Học phí & Thanh toán:**
   - Quản lý Hóa đơn học phí (Unpaid, Partial, Paid).
   - Ghi nhận thanh toán nhiều đợt (lưu lịch sử Payment, phương thức, mã giao dịch).
   - Tự động tính số tiền còn nợ.
9. **Dashboard 4 màn hình:**
   - Admin/Receptionist Dashboard, Teacher Dashboard, Student Dashboard.
10. **Tiện ích kế thừa:**
    - Notice Board và Study Materials theo lớp học.

---

## 11. OPTIONAL FUTURE ENHANCEMENTS (TÍNH NĂNG ĐỀ XUẤT MỞ RỘNG SAU MVP)

> **Lưu ý:** Các tính năng dưới đây **KHÔNG** nằm trong MVP để tránh làm phình to dự án. Chỉ xem xét triển khai ở các giai đoạn sau khi MVP đã chạy ổn định:

1. **Quản lý Giảm giá & Học bổng (Discounts & Vouchers):**
   - Mã voucher giảm giá, chính sách giảm giá khi đăng ký combo nhiều kỹ năng, học bổng theo phần trăm.
2. **In Phiếu thu Học phí (Printable Receipt / Invoice PDF):**
   - Xuất file PDF hoặc in trực tiếp phiếu thu học phí có logo và mẫu biểu trung tâm.
3. **Quản lý Lương & Hợp đồng Giáo viên (Teacher Payroll & Contracts):**
   - Cấu hình đơn giá giờ dạy theo cấp độ, tính lương tự động dựa trên số buổi điểm danh thực dạy, quản lý hợp đồng lao động và chứng chỉ TESOL/CELTA.
4. **Hệ thống Thi thử Trực tuyến (Online Test System):**
   - Làm bài thi trắc nghiệm trực tuyến, tính giờ làm bài và chấm điểm tự động cho kỹ năng Listening/Reading.
5. **Cổng thông tin Phụ huynh (Parent Portal):**
   - Ứng dụng/giao diện riêng cho phụ huynh theo dõi tình hình đi học của con em và thông báo điểm danh qua Zalo/SMS.
6. **Bảo lưu & Học bù tự động (Makeup Class Scheduling):**
   - Đăng ký học bù vào lớp khác có cùng trình độ khi học viên nghỉ có phép.

---

## 12. OUT OF SCOPE (HOÀN TOÀN NGOÀI PHẠM VI DỰ ÁN)

Hệ thống kiên quyết **KHÔNG** xây dựng các chức năng sau:
- Thư viện mượn trả sách (Library Management).
- Quản lý xe đưa đón học viên (Transport / School Bus).
- Quản lý ký túc xá / nhà trọ (Hostel Management).
- Quản lý kho hàng & giáo trình vật lý (Inventory Management).
- Hệ thống nhân sự chuyên sâu (Full HRMS) & Tính bảo hiểm xã hội.
- Hệ thống kế toán hoàn chỉnh (Full Accounting System) theo chuẩn mực kế toán nhà nước.
- Hệ thống CRM chuyên sâu với phễu Marketing tự động (Marketing Automation & Lead Nurturing).
- Landing page / Website tin tức tiếp thị bên ngoài.

---

## 13. ACCEPTANCE CRITERIA (TIÊU CHÍ NGHIỆM THU MVP)

| Module | Tiêu chí nghiệm thu cụ thể (Acceptance Criteria) |
| :--- | :--- |
| **Xác thực & Phân quyền** | - Đăng nhập thành công với đúng 4 tài khoản thuộc 4 Role (Admin, Receptionist, Teacher, Student).<br>- Không tài khoản nào có thể truy cập URL hoặc API ngoài quyền hạn được cấp. |
| **Lớp học theo Kỹ năng** | - Tạo được lớp học có định danh kỹ năng: `listening`, `speaking`, `reading`, `writing`.<br>- Lớp học thể hiện rõ giáo viên phụ trách, ngày bắt đầu/kết thúc và học phí. |
| **Ghi danh & Học viên** | - Thêm mới học viên thành công và xếp học viên vào ít nhất 1 lớp học.<br>- Học viên xuất hiện ngay lập tức trong danh sách lớp và trên màn hình điểm danh. |
| **Điểm danh chuẩn Buổi học** | - Giáo viên mở buổi học của lớp mình, thực hiện điểm danh cho danh sách học viên.<br>- Lưu thành công các trạng thái `Present`, `Absent`, `Late`, `Excused`.<br>- Không thể lưu trùng 2 bản ghi điểm danh cho cùng 1 học viên trong 1 buổi. |
| **Kết quả 4 Kỹ năng** | - Giáo viên nhập được điểm cho cả 4 kỹ năng + Overall + Lời nhận xét.<br>- Học viên đăng nhập và xem đúng bảng điểm của chính mình. |
| **Học phí & Thanh toán** | - Khi học viên vào lớp, hệ thống tạo hóa đơn học phí với trạng thái ban đầu là `Unpaid`.<br>- Lễ tân nộp tiền đợt 1 (ví dụ 50%) $\rightarrow$ Trạng thái chuyển thành `Partial`, số dư còn nợ giảm chính xác.<br>- Lễ tân nộp tiền đợt 2 (hoàn tất 100%) $\rightarrow$ Trạng thái chuyển thành `Paid`, số dư còn nợ về 0.<br>- Lịch sử cả 2 lần thanh toán được lưu trữ đầy đủ, không bị đè số liệu. |
| **Dashboard** | - Admin & Receptionist thấy đúng số học viên, số lớp hôm nay và tổng học phí (Cần thu, Đã thu, Còn thiếu).<br>- Teacher thấy đúng lớp và lịch dạy hôm nay.<br>- Student thấy đúng lịch học, chuyên cần và học phí của mình. |

---

> 🛑 **KẾT THÚC TÀI LIỆU PRODUCT SPECIFICATION.**  
> Dự án tạm dừng tại đây. Không có mã nguồn nào bị thay đổi. Chờ phê duyệt của bạn trước khi bước sang giai đoạn tiếp theo.
