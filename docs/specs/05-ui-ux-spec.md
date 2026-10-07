# UI/UX SPECIFICATION
# VLEARN ENGLISH CENTER STUDENT MANAGEMENT SYSTEM (VLEARN EC-SMS)
### Tài liệu Đặc tả Thiết kế Giao diện Người dùng, Hệ thống Design Tokens & Trải nghiệm Tương tác

---

## 1. DESIGN VISION (ĐỊNH HƯỚNG THIẾT KẾ)

- **Sản phẩm:** VLearn English Center Student Management System (Hệ thống Quản lý Học viên Trung tâm Anh ngữ VLearn).
- **Phân loại sản phẩm:** Ứng dụng Quản trị Nội bộ (Internal Education SaaS Admin Portal).
- **Phong cách chủ đạo:** **Modern Education SaaS Admin**  
  - **Sạch sẽ & Hiện đại (Clean & Modern):** Giao diện phẳng tối giản, bố cục thoáng đãng, cấu trúc lưới nghiêm ngặt, loại bỏ hoàn toàn các hiệu ứng rườm rà (không gradient màu mè, không hoạt họa cartoon, không lạm dụng hiệu ứng kính mờ glassmorphism).
  - **Ưu tiên Dữ liệu (Data-Dense & Readable):** Đặt trọng tâm vào khả năng đọc, tìm kiếm, lọc và đối soát dữ liệu nhanh của nhân sự vận hành (Lễ tân, Quản trị viên, Giáo viên).
  - **Thẩm mỹ Chuyên nghiệp (Professional Palette):** Tone màu chủ đạo là Xanh dương (Trust & Intelligence), điểm xuyết Xanh ngọc/Lá cây (Success & Energy) trên nền xám sáng thanh lịch.

---

## 2. DESIGN TOKENS (HỆ THỐNG QUY CHUẨN THIẾT KẾ)

Hệ thống Design Tokens chuẩn hóa dưới dạng biến CSS (CSS Custom Properties) để áp dụng toàn diện:

### 2.1. Bảng màu Chuẩn (Color Palette)

| Phân loại | Tên Token | Mã Hex | Ứng dụng thực tế |
| :--- | :--- | :--- | :--- |
| **Primary** | `--color-primary-600` | `#2563EB` | Nút bấm chính (CTA), mục menu active, link |
| | `--color-primary-700` | `#1D4ED8` | Trạng thái Hover của Primary button |
| | `--color-primary-50` | `#EFF6FF` | Nền menu active, chip badge active |
| **Accent / Secondary**| `--color-accent-600` | `#059669` | Điểm nhấn tăng trưởng, hoàn thành học phí, điểm cao |
| | `--color-accent-50` | `#ECFDF5` | Nền badge thành công |
| **Background & Surface**| `--color-bg-app` | `#F8FAFC` | Nền toàn bộ ứng dụng (Slate 50) |
| | `--color-surface` | `#FFFFFF` | Nền Card, Table, Modal, Drawer, Sidebar |
| | `--color-surface-hover` | `#F1F5F9` | Nền hover dòng bảng, hover list item |
| **Borders & Dividers** | `--color-border-subtle`| `#E2E8F0` | Đường kẻ bảng, viền thẻ card, viền input |
| | `--color-border-strong`| `#CBD5E1` | Viền focus input, divider nổi bật |
| **Typography Colors** | `--color-text-main` | `#0F172A` | Tiêu đề, chữ chính, số liệu KPI (Slate 900) |
| | `--color-text-muted` | `#64748B` | Nhãn phụ, placeholder, timestamp (Slate 500) |
| | `--color-text-inverse`| `#FFFFFF` | Chữ trên nền màu tối hoặc nút primary |
| **Feedback Colors** | `--color-success` | `#10B981` | Trạng thái Paid, Present, Active |
| | `--color-warning` | `#F59E0B` | Trạng thái Partial, Late, Upcoming |
| | `--color-danger` | `#EF4444` | Trạng thái Overdue, Absent, Cancelled, Lỗi |
| | `--color-info` | `#3B82F6` | Trạng thái Excused, Thông báo, Lớp học |

### 2.2. Thang Typography (Type Scale)
- **Font Family:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `'Segoe UI'`, `Roboto`, sans-serif.

| Cấp bậc | Font Size | Line Height | Font Weight | Ứng dụng |
| :--- | :---: | :---: | :---: | :--- |
| **Page Title (H1)** | 24px (`1.5rem`) | 32px | 700 (Bold) | Tiêu đề đầu trang (Dashboard, Danh sách học viên) |
| **Section Title (H2)**| 18px (`1.125rem`)| 26px | 600 (Semibold)| Tiêu đề tab, nhóm thông tin, tiêu đề modal |
| **Card Title (H3)** | 15px (`0.9375rem`)| 22px | 600 (Semibold)| Tiêu đề thẻ thống kê KPI, tên cột bảng |
| **Body Text** | 14px (`0.875rem`)| 20px | 400 (Regular) | Nội dung bảng, ô nhập liệu form, văn bản chính |
| **Body Medium** | 14px (`0.875rem`)| 20px | 500 (Medium) | Tên người dùng, mã học viên, số liệu quan trọng |
| **Small / Caption** | 12px (`0.75rem`) | 16px | 500 (Medium) | Nhãn trường form, badge trạng thái, timestamp |

### 2.3. Hệ thống Khoảng cách (8px Spacing Grid)
Sử dụng bội số của 8px:  
`--space-1`: 4px | `--space-2`: 8px | `--space-3`: 12px | `--space-4`: 16px | `--space-5`: 20px | `--space-6`: 24px | `--space-8`: 32px | `--space-10`: 40px

### 2.4. Bo góc (Border Radius) & Đổ bóng (Elevation / Shadow)
- **Radius:**
  - Badges / Chips: 4px (`--radius-sm`)
  - Inputs / Buttons: 6px (`--radius-md`)
  - Cards / Tables / Modals: 8px (`--radius-lg`)
  - Drawer / Dropdown Menus: 10px (`--radius-xl`)
- **Shadow:**
  - Card Shadow: `0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)` (Rất nhẹ, tạo chiều sâu tinh tế).
  - Modal / Drawer Shadow: `0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)`.

---

## 3. GLOBAL LAYOUT (BỐ CỤC KHUNG TOÀN CỤC)

Kiến trúc giao diện Desktop-first chuẩn SaaS Admin:

```
┌─────────────────┬──────────────────────────────────────────────────────────────┐
│  VLearn Logo    │ Top Header (Height: 64px)                                    │
│                 │ Search bar | Notifications (Bell) | User Avatar & Role       │
├─────────────────┼──────────────────────────────────────────────────────────────┤
│ Left Sidebar    │ Main Content Area (Padding: 24px, Background: #F8FAFC)       │
│ (Width: 250px)  │                                                              │
│                 │ ┌──────────────────────────────────────────────────────────┐ │
│ - Dashboard     │ │ Page Header (H1 Title + Subtitle + Action CTA Button)    │ │
│ - Học viên      │ └──────────────────────────────────────────────────────────┘ │
│ - Lớp học       │ ┌──────────────────────────────────────────────────────────┐ │
│ - Điểm danh     │ │ Top KPI Stat Cards (Grid 4 cột)                          │ │
│ - Học phí       │ └──────────────────────────────────────────────────────────┘ │
│ ...             │ ┌──────────────────────────────────────────────────────────┐ │
│                 │ │ Main Data Panel (Filters Toolbar + Data Table / Cards)   │ │
│                 │ └──────────────────────────────────────────────────────────┘ │
└─────────────────┴──────────────────────────────────────────────────────────────┘
```

### Kích thước Khung tiêu chuẩn:
- **Sidebar Desktop:** Chiều rộng cố định 250px, cố định bên trái (sticky full-height), nền trắng tinh khôi viền phải `#E2E8F0`.
- **Top Header:** Chiều cao 64px, cố định phía trên, chứa thanh tìm kiếm nhanh, icon thông báo, dropdown hồ sơ người dùng.
- **Main Content:** Vùng cuộn độc lập, lề trong chuẩn `padding: 24px`, chiều rộng co giãn theo màn hình.
- **Responsive Breakpoints:**
  - Desktop Lớn ($\ge 1280px$): Hiển thị đầy đủ Sidebar (250px) + Data Table đa cột.
  - Tablet ($768px - 1279px$): Sidebar thu gọn dạng mini-icons (68px) hoặc đóng/mở qua nút hamburger, Data Table cho phép cuộn ngang (overflow-x).
  - Mobile ($< 768px$): Sidebar chuyển thành Drawer trượt từ cạnh trái, bảng chuyển sang dạng Card list di động.

---

## 4. ROLE-BASED NAVIGATION (ĐIỀU HƯỚNG THEO VAI TRÒ)

Mỗi vai trò sở hữu cấu trúc Menu Sidebar riêng biệt, đảm bảo tính gọn gàng và không để lộ các chức năng ngoài phạm vi:

```
[ADMIN SIDEBAR]
 ├── Tổng quan
 │    └── Bảng điều khiển (Dashboard)
 ├── Đào tạo & Học vụ
 │    ├── Quản lý Học viên
 │    ├── Quản lý Giáo viên
 │    ├── Quản lý Lớp học
 │    ├── Lịch học & Thời khóa biểu
 │    ├── Điểm danh buổi học
 │    └── Kết quả học tập (4 kỹ năng)
 ├── Tài chính
 │    ├── Hóa đơn Học phí
 │    └── Lịch sử Thanh toán
 ├── Tiện ích
 │    ├── Bảng tin Thông báo
 │    └── Tài liệu Lớp học
 └── Hệ thống
      ├── Quản lý Tài khoản
      └── Phân quyền & Bảo mật

[RECEPTIONIST SIDEBAR]
 ├── Tổng quan
 │    └── Bảng điều khiển (Dashboard)
 ├── Học vụ & Tuyển sinh
 │    ├── Quản lý Học viên
 │    ├── Quản lý Lớp học
 │    ├── Lịch học trung tâm
 │    ├── Theo dõi Điểm danh (Read-only)
 │    └── Xem Kết quả học tập
 ├── Thu ngân & Tài chính
 │    ├── Hóa đơn Học phí
 │    └── Ghi nhận Thanh toán
 └── Tiện ích
      └── Bảng tin Thông báo

[TEACHER SIDEBAR]
 ├── Tổng quan
 │    └── Bảng điều khiển (Dashboard)
 ├── Giảng dạy
 │    ├── Lớp của tôi (My Classes)
 │    ├── Lịch giảng dạy (Schedule)
 │    ├── Điểm danh (Attendance)
 │    └── Nhập kết quả học tập
 └── Học liệu
      ├── Tài liệu môn học
      └── Bảng tin Thông báo

[STUDENT PORTAL - TOP NAVBAR HOẶC SIDEBAR GỌN]
 ├── Bảng điều khiển cá nhân
 ├── Lớp học của tôi
 ├── Thời khóa biểu tuần
 ├── Chuyên cần cá nhân
 ├── Bảng điểm 4 kỹ năng
 ├── Học phí & Lịch sử đóng tiền
 ├── Tài liệu bài giảng
 └── Thông báo trung tâm
```

---

## 5. ROUTE / PAGE MAP (DANH SÁCH 22 MÀN HÌNH CHUẨN)

| STT | Tên màn hình (Page Name) | URL Route | Vai trò truy cập (Allowed Roles) |
| :---: | :--- | :--- | :--- |
| 1 | **Login** | `/login` | Public (Chưa đăng nhập) |
| 2 | **Admin Dashboard** | `/admin/dashboard` | Admin |
| 3 | **Receptionist Dashboard** | `/receptionist/dashboard` | Receptionist |
| 4 | **Teacher Dashboard** | `/teacher/dashboard` | Teacher |
| 5 | **Student Dashboard** | `/student/dashboard` | Student |
| 6 | **Student List** | `/students` | Admin, Receptionist |
| 7 | **Student Detail** | `/students/:id` | Admin, Receptionist, Teacher (Học viên lớp mình) |
| 8 | **Teacher List** | `/teachers` | Admin, Receptionist (Read-only) |
| 9 | **Teacher Detail** | `/teachers/:id` | Admin, Receptionist, Teacher (Chính mình) |
| 10 | **Class List** | `/classes` | Admin, Receptionist, Teacher, Student (Xem lớp mình) |
| 11 | **Class Detail** | `/classes/:id` | All Roles (Scoped theo phân quyền) |
| 12 | **Enrollment Management** | `/enrollments` | Admin, Receptionist |
| 13 | **Schedule Timetable** | `/schedules` | Admin, Receptionist, Teacher, Student |
| 14 | **Attendance Marking** | `/attendance` | Admin, Teacher (Điểm danh), Receptionist/Student (Xem) |
| 15 | **Learning Results** | `/results` | Admin, Teacher (Nhập điểm), Receptionist/Student (Xem) |
| 16 | **Tuition Invoices** | `/tuition/invoices` | Admin, Receptionist |
| 17 | **Invoice Detail** | `/tuition/invoices/:id` | Admin, Receptionist, Student (Hóa đơn của mình) |
| 18 | **Payment History** | `/payments` | Admin, Receptionist |
| 19 | **Account Management** | `/accounts` | Admin Only |
| 20 | **Role & Permissions** | `/roles` | Admin Only |
| 21 | **Notice Board** | `/notices` | All Roles (Lọc theo Audience) |
| 22 | **Study Materials** | `/materials` | All Roles (Lọc theo Lớp học) |

---

## 6. DASHBOARD DESIGNS (THIẾT KẾ BẢNG ĐIỀU KHIỂN THEO 4 ROLE)

### 6.1. Admin Dashboard
- **Hàng 1 - 4 Thẻ KPI Học vụ (Stat Cards):**
  - *Tổng học viên:* Số liệu lớn (VD: `348`), badge xu hướng `+12% tháng này`, icon Users màu xanh dương.
  - *Học viên đang học:* `295 học viên`, tỷ lệ hoạt động 85%.
  - *Đội ngũ giáo viên:* `24 giáo viên`, icon GraduationCap.
  - *Lớp học đang mở:* `18 lớp active`, icon BookOpen.
- **Hàng 2 - 3 Thẻ KPI Tài chính:**
  - *Tổng học phí cần thu:* `1.250.000.000 đ`
  - *Đã thực thu:* `980.000.000 đ` (Thanh tiến trình 78.4%, màu xanh lá)
  - *Công nợ còn thiếu:* `270.000.000 đ` (Badge cảnh báo màu hổ phách/đỏ)
- **Hàng 3 - Biểu đồ & Bảng giám sát:**
  - *Biểu đồ cột (Bar Chart):* Doanh thu học phí 6 tháng gần nhất.
  - *Biểu đồ tròn (Donut Chart):* Phân bổ học viên theo 4 Kỹ năng (Nghe, Nói, Đọc, Viết).
  - *Bảng "Lớp học diễn ra hôm nay":* Tên lớp, Kỹ năng, Ca học, Phòng học, Giáo viên, Trạng thái điểm danh (Đã điểm danh / Chưa).

### 6.2. Receptionist Dashboard
- Đặt trọng tâm vào việc tiếp đón và thu hồi công nợ:
  - *Thẻ KPI:* Học viên mới tháng này | Lớp sắp khai giảng tuần tới | Học phí chưa thu | Tổng thu hôm nay.
  - *Danh sách "Học viên cần nhắc học phí":* Tên học viên, Lớp học, Số tiền còn nợ, Hạn nộp, Nút nhanh: *"Ghi nhận thanh toán"*.
  - *Bảng "Lớp học hôm nay":* Xem phòng học để chỉ dẫn học viên đến lớp.

### 6.3. Teacher Dashboard
- Đặt trọng tâm vào ca dạy và chuyên cần:
  - *Thẻ KPI:* Số lớp phụ trách (`4 lớp`) | Tổng học viên đang dạy (`62 học viên`) | Tỷ lệ chuyên cần trung bình (`94.5%`).
  - *Widget "Lịch dạy hôm nay":* Thẻ ca học nổi bật: Giờ học (`17:30 - 19:00`), Phòng (`302`), Lớp (`IELTS Speaking K12`). Nút hành động nổi bật: **[Điểm danh buổi này]**.
  - *Lối tắt:* Nhập điểm bài kiểm tra giữa kỳ / cuối kỳ.

### 6.4. Student Dashboard
- Giao diện thân thiện, trực quan:
  - *Thẻ tiến độ cá nhân:* Lớp đang học, Tỷ lệ chuyên cần cá nhân (`92% - Tốt`), Điểm trung bình kiểm tra gần nhất (`78/100`).
  - *Thời khóa biểu trong tuần:* Lịch học các ngày Thứ 2 - 4 - 6 hoặc Thứ 3 - 5 - 7.
  - *Trạng thái học phí cá nhân:* Badge `Đã hoàn thành` hoặc hiển thị số tiền còn thiếu kèm hạn nộp.

---

## 7. STUDENT UI (GIAO DIỆN PHÂN HỆ HỌC VIÊN)

### 7.1. Student List (Danh sách Học viên)
- **Header:**
  - Tiêu đề: `Học viên`
  - Mô tả phụ: `Quản lý hồ sơ, lớp học và quá trình đào tạo học viên trung tâm`
  - Nút Primary: `+ Thêm học viên` (Mở modal tạo mới)
- **Thanh công cụ lọc (Toolbar):**
  - Ô tìm kiếm Search input: Placeholder *"Tìm theo tên, SĐT, email, mã HV..."* với icon kính lúp.
  - Bộ lọc Trạng thái học vụ (Dropdown): *Tất cả*, *Đang học*, *Chờ lớp*, *Bảo lưu*, *Hoàn thành*.
  - Bộ lọc Lớp học (Dropdown): Danh sách các lớp active.
  - Nút Reset bộ lọc.
- **Bảng dữ liệu (Data Table):**

| Cột | Hiển thị mẫu | Ghi chú thiết kế |
| :--- | :--- | :--- |
| **Mã HV** | `VL-HV2026001` | Font monospace / Body medium, màu Primary |
| **Họ và tên** | `Nguyễn Văn An` | Avatar chữ cái + Họ tên in đậm |
| **Số điện thoại** | `0912 345 678` | Text phụ |
| **Lớp đang học** | `IELTS Speaking K12` | Chip badge có link chuyển sang lớp |
| **Trạng thái** | `Đang học` | Badge xanh lá (`active`) |
| **Chuyên cần** | `95%` | Text hiển thị kèm mini progress bar |
| **Học phí** | `Đã đóng đủ` / `Còn nợ 1.5M` | Badge xanh lá (`Paid`) hoặc hổ phách (`Partial`) |
| **Thao tác** | Icon `⋮` (Three-dot menu) | Dropdown: *Xem chi tiết, Sửa hồ sơ, Xếp lớp, Thu học phí* |

### 7.2. Student Detail (Hồ sơ Chi tiết Học viên)
- **Kiến trúc Hybrid:**
  - Hỗ trợ **Trang chi tiết chuyên sâu (`/students/:id`)** kết hợp **Right-side Quick Drawer** khi bấm xem nhanh từ danh sách bảng.
- **Khung thông tin đầu trang (Header Summary Card):**
  - Avatar lớn, Họ tên, Mã học viên, Badge trạng thái.
  - 4 Thẻ chỉ số nhanh (Quick Metrics):
    - *Lớp đang học:* `2 lớp`
    - *Chuyên cần:* `94%`
    - *Công nợ:* `0 đ` (Đã hoàn tất)
    - *Điểm gần nhất:* `85/100`
- **Hệ thống 6 Tabs nội dung:**
  1. `Tổng quan (Overview)`: Thông tin liên hệ, Ngày sinh, Địa chỉ, Người liên hệ khẩn cấp, Ghi chú tư vấn.
  2. `Lớp học (Classes)`: Danh sách các lớp đã và đang học, ngày ghi danh, trạng thái hoàn thành.
  3. `Thời khóa biểu (Schedule)`: Lịch học các ca trong tuần.
  4. `Điểm danh (Attendance)`: Bảng lịch sử các buổi học, ngày học, trạng thái Có mặt/Vắng/Muộn.
  5. `Kết quả học tập (Results)`: Bảng điểm 4 kỹ năng (Nghe, Nói, Đọc, Viết) qua các đợt thi.
  6. `Học phí & Thanh toán (Tuition & Payments)`: Hóa đơn lớp học, tổng tiền, số tiền đã đóng, lịch sử phiếu thu.

---

## 8. TEACHER UI (GIAO DIỆN PHÂN HỆ GIÁO VIÊN)

- **Đánh giá Card View vs Table View:**
  - *Khuyến nghị:* Sử dụng **Table View** làm mặc định cho Danh sách Giáo viên (`/teachers`) vì nhân sự trung tâm cần quản lý danh bạ, số điện thoại, email và trạng thái hợp đồng dạng dòng dữ liệu sạch sẽ; cung cấp nút chuyển đổi sang Card View nếu muốn xem ảnh đại diện giảng viên.
- **Các cột Table Giáo viên:** Mã GV, Họ tên, Số điện thoại, Email, Chuyên môn chính (Kỹ năng Speaking/Writing), Số lớp đang phụ trách, Trạng thái (Đang dạy / Nghỉ), Nút thao tác `⋮`.
- **Trang Chi tiết Giáo viên (`/teachers/:id`):**
  - Tab 1: Hồ sơ & Liên hệ
  - Tab 2: Lớp học đang phụ trách (Danh sách kèm sĩ số)
  - Tab 3: Lịch giảng dạy trong tuần (Weekly Schedule)
  - Tab 4: Thống kê chuyên cần của các lớp giáo viên dạy

---

## 9. CLASS UI (GIAO DIỆN PHÂN HỆ LỚP HỌC)

### 9.1. Class List (Danh sách Lớp học - Card Grid Layout)
Bố cục thẻ lưới (Grid 3 cột Desktop) mang lại trải nghiệm thị giác trực quan nhất:

```
┌────────────────────────────────────────────────────────┐
│ [SPK-K12]  IELTS Speaking Intensive K12                │
│ Kỹ năng: [SPEAKING] (Badge Tím)      Trạng thái: [ACTIVE]│
├────────────────────────────────────────────────────────┤
│ 👨‍🏫 Giáo viên: TS. David Nguyễn                         │
│ 🗓 Lịch học: Thứ 2 - 4 - 6  (17:30 - 19:00)           │
│ 🚪 Phòng học: Phòng 302                                │
│ 👥 Sĩ số: 12 / 15 học viên [██████████░░] 80%          │
│ 📅 Thời gian: 01/11/2026 - 15/01/2027                 │
├────────────────────────────────────────────────────────┤
│ Học phí: 4.500.000 đ          [Chi tiết] [Điểm danh]   │
└────────────────────────────────────────────────────────┘
```

### Bảng màu Kỹ năng Chuẩn (Skill Badges):
- **Listening:** Nền xanh dương nhạt (`#EFF6FF`), Chữ xanh đậm (`#1D4ED8`)
- **Speaking:** Nền tím nhạt (`#F5F3FF`), Chữ tím đậm (`#6D28D9`)
- **Reading:** Nền cam nhạt (`#FFF7ED`), Chữ cam đậm (`#C2410C`)
- **Writing:** Nền xanh lá nhạt (`#ECFDF5`), Chữ xanh lá đậm (`#047857`)

### 9.2. Class Detail (Chi tiết Lớp học)
Bao gồm 7 Tabs quản lý toàn diện:
`Tổng quan` | `Học viên trong lớp` | `Thời khóa biểu tuần` | `Danh sách buổi học` | `Điểm danh` | `Bảng điểm` | `Tài liệu lớp`

---

## 10. ENROLLMENT UI (GIAO DIỆN GHI DANH & XẾP LỚP)

- **Modal Ghi danh Học viên (Enroll Modal):**
  - Bước 1: Chọn Học viên (Autocomplete search tên/SĐT).
  - Bước 2: Chọn Lớp học muốn xếp vào.
  - Hệ thống tự động kiểm tra và cảnh báo theo thời gian thực:
    - *Cảnh báo sĩ số:* Nếu lớp đã đủ 15/15 $\rightarrow$ Hiện thông báo đỏ *"Lớp đã đầy sĩ số"*, vô hiệu hóa nút Xác nhận.
    - *Cảnh báo xung đột:* Nếu học viên bị trùng giờ với lớp khác $\rightarrow$ Hiện thông báo hổ phách rõ ràng: *"Xung đột: Học viên đang có lớp Reading K10 vào Thứ 2 lúc 18:00"*.
  - Bước 3: Xác nhận ghi danh $\rightarrow$ Toast thông báo: *"Ghi danh thành công! Đã tự động tạo hóa đơn học phí cho học viên"*.
- **Modal Chuyển lớp (Transfer Modal):**
  - Hiển thị lớp hiện tại $\rightarrow$ Chọn lớp mới chuyển sang $\rightarrow$ Nhập lý do chuyển lớp $\rightarrow$ Cập nhật sĩ số cả hai lớp.

---

## 11. SCHEDULE UI (GIAO DIỆN THỜI KHÓA BIỂU & LỊCH HỌC)

- **Chế độ Lịch Tuần (Weekly Timetable View):**
  - Trục ngang: Thứ Hai $\rightarrow$ Chủ Nhật.
  - Trục dọc: Các khung giờ (08:00 $\rightarrow$ 21:30).
  - Các khối sự kiện (Event blocks) màu sắc theo kỹ năng, thể hiện rõ: *Tên lớp, Phòng học, Giáo viên*.
- **Chế độ Bảng danh sách (Table Fallback View):** Phù hợp đối soát trên màn hình nhỏ.
- **Xử lý Xung đột UI (Conflict Alert Modal):**
  - Khi API trả về `409 Conflict`, giao diện hiển thị Dialog cảnh báo màu đỏ với thông điệp tường minh:
    *"Không thể xếp lịch: Phòng 302 đã có lớp IELTS Writing K11 học từ 17:30 đến 19:00 cùng ngày."*

---

## 12. ATTENDANCE UI (GIAO DIỆN ĐIỂM DANH THEO BUỔI HỌC)

### Luồng tương tác 3 bước:
1. **Bước 1:** Chọn Lớp học $\rightarrow$ Hệ thống tự động chọn Buổi học hôm nay (hoặc cho phép chọn buổi học khác từ danh sách drop-down).
2. **Bước 2:** Bảng điểm danh tải danh sách học viên của lớp với trạng thái mặc định là `Có mặt (Present)`.
3. **Bước 3:** Thao tác điểm danh:
   - Nút hành động nhanh: **[Điểm danh tất cả Có mặt]** (1-click).
   - Radio buttons / Button pills trên từng dòng: `Có mặt` (Xanh) | `Vắng` (Đỏ) | `Muộn` (Vàng) | `Có phép` (Xanh biển).
   - Ô nhập ghi chú ngắn (VD: *Đến muộn 15p*).
4. **Bước 4:** Bấm **[Lưu kết quả điểm danh]**:
   - Có cơ chế cảnh báo nếu giáo viên chuyển trang khi chưa bấm lưu (*Unsaved Changes Warning*).
   - Sau khi lưu: Hiển thị Toast thông báo xanh và khóa lại trạng thái.

---

## 13. LEARNING RESULTS UI (GIAO DIỆN KẾT QUẢ HỌC TẬP 4 KỸ NĂNG)

- **Màn hình Giáo viên nhập điểm:**
  - Chọn Lớp học $\rightarrow$ Chọn Đợt kiểm tra (`Placement Test`, `Midterm`, `Final`, `Mock Test`) $\rightarrow$ Chọn Ngày kiểm tra.
  - Bảng nhập điểm tương tác nhanh (Spreadsheet-like Input):
    - Cột 1: Mã HV & Họ tên
    - Cột 2: Listening (Input số, kiểm tra `0 - 100`)
    - Cột 3: Speaking (Input số, kiểm tra `0 - 100`)
    - Cột 4: Reading (Input số, kiểm tra `0 - 100`)
    - Cột 5: Writing (Input số, kiểm tra `0 - 100`)
    - Cột 6: Overall (Tự động tính trung bình cộng hoặc cho phép nhập)
    - Cột 7: Lời nhận xét của giáo viên
  - Kiểm tra ràng buộc trực tiếp: Nếu nhập số $> 100$ hoặc số âm $\rightarrow$ Ô input viền đỏ và báo lỗi ngay dưới ô nhập.
- **Màn hình Học viên xem điểm:**
  - Hiển thị dạng Thẻ kết quả bài thi với biểu đồ radar 4 kỹ năng trực quan, điểm số rõ ràng và lời khuyên của giáo viên.

---

## 14. TUITION & PAYMENTS UI (GIAO DIỆN HỌC PHÍ & THU TIỀN)

### 14.1. Tuition List (Danh sách Hóa đơn Học phí)
- Bộ lọc theo: Trạng thái hóa đơn (`Chưa đóng`, `Đóng 1 phần`, `Đã đóng đủ`, `Quá hạn`), Lớp học, Học viên.
- Các cột: Mã Hóa đơn (`INV-2026-0001`), Học viên, Lớp học, Tổng học phí, Đã đóng, Còn thiếu, Hạn nộp, Trạng thái (Badge), Nút thao tác `[Thu tiền]`.

### 14.2. Invoice Detail & Payment History
- Khung tóm tắt số dư (Financial Balance Summary):
  - *Tổng học phí:* `4.500.000 đ`
  - *Đã thanh toán:* `2.000.000 đ`
  - *Còn nợ:* `2.500.000 đ` (Nổi bật màu cam)
- Nút hành động chính: **[+ Ghi nhận Thanh toán]**
- Bảng lịch sử các lần đóng tiền: Mã phiếu thu (`PAY-2026-0001`), Ngày thu, Số tiền, Hình thức (Tiền mặt/Chuyển khoản), Mã giao dịch ngân hàng, Người thu, Trạng thái (`Hợp lệ` / `Đã hủy - Voided`).

### 14.3. Payment Modal (Hộp thoại Thu tiền)
- Hiển thị rõ số dư còn nợ: *"Số tiền còn phải nộp: 2.500.000 đ"*
- Ô nhập: Số tiền nộp lần này (Input number, gợi ý nút bấm: *[Nộp toàn bộ số dư]*).
- Ràng buộc trực tiếp:
  - Bắt buộc $> 0$.
  - Nếu nhập số tiền lớn hơn số nợ $\rightarrow$ Báo lỗi đỏ: *"Số tiền không được vượt quá số dư còn nợ"*.
- Chọn hình thức: Tiền mặt, Chuyển khoản, Quẹt thẻ.
- Nhập mã giao dịch / ghi chú.

### 14.4. Void Payment Dialog (Hộp thoại Hủy giao dịch - Admin Only)
- Chỉ hiển thị với vai trò **Admin**.
- Bắt buộc hiển thị Confirm Dialog màu đỏ cảnh báo:
  *"Bạn có chắc chắn muốn hủy phiếu thu PAY-2026-0001 số tiền 2.000.000 đ? Hành động này sẽ trừ ngược số tiền đã đóng của học viên."*
- Bắt buộc nhập trường `Lý do hủy giao dịch` (Tối thiểu 10 ký tự).

---

## 15. ACCOUNT & ROLE UI (QUẢN TRỊ TÀI KHOẢN & PHÂN QUYỀN - ADMIN ONLY)

- Giao diện dạng Data Table quản lý danh sách nhân sự nội bộ (Admin, Receptionist, Teacher).
- Các cột: Email đăng nhập, Vai trò (Role badge), Ngày tạo, Trạng thái (`active` / `inactive`), Lần đăng nhập cuối.
- Thao tác: Nút gạt Toggle khóa/mở tài khoản, nút Đổi vai trò, nút Đặt lại mật khẩu.
- Chặn triệt để trên UI: Nhân viên Lễ tân và Giáo viên không nhìn thấy menu này trên Sidebar.

---

## 16. NOTICE & MATERIALS UI (BẢNG TIN & TÀI LIỆU LỚP HỌC)

- **Notice Board:**
  - Danh sách thông báo dạng Feed Card sạch sẽ.
  - Badge đối tượng nhận: `Tất cả` (Xanh dương), `Giáo viên` (Tím), `Học viên` (Xanh lá), `Lễ tân` (Cam).
  - Admin/Lễ tân có nút: `+ Đăng thông báo mới`.
- **Study Materials:**
  - Quản lý tài liệu theo từng Lớp học.
  - Danh sách tệp đính kèm: Icon loại tệp (PDF/Slide), Tên tài liệu, Lớp học, Giáo viên đăng tải, Dung lượng, Nút `[Tải về]`.

---

## 17. REUSABLE COMPONENTS (KIẾN TRÚC THÀNH PHẦN TÁI SỬ DỤNG)

| Tên Component | Mục đích sử dụng | Props chính |
| :--- | :--- | :--- |
| **`AppLayout`** | Khung bao ngoài toàn hệ thống | `sidebarRoutes`, `user`, `children` |
| **`Sidebar`** | Thanh điều hướng trái theo vai trò | `routes`, `activePath`, `isCollapsed` |
| **`TopHeader`** | Thanh tiêu đề trên, avatar, notifications | `user`, `onMenuToggle`, `onLogout` |
| **`PageHeader`** | Tiêu đề trang, mô tả phụ, nút hành động CTA | `title`, `subtitle`, `actionButton`, `breadcrumbs` |
| **`StatCard`** | Thẻ thống kê KPI với icon và xu hướng | `title`, `value`, `icon`, `trend`, `color` |
| **`DataTable`** | Bảng dữ liệu đa năng hỗ trợ phân trang | `columns`, `data`, `loading`, `pagination`, `onPageChange` |
| **`SearchInput`** | Ô tìm kiếm với debounce và icon | `placeholder`, `value`, `onChange` |
| **`FilterSelect`** | Dropdown chọn bộ lọc | `label`, `options`, `value`, `onChange` |
| **`StatusBadge`** | Huy hiệu trạng thái màu chuẩn | `status`, `type` ('academic', 'invoice', 'attendance') |
| **`SkillBadge`** | Huy hiệu 4 kỹ năng tiếng Anh | `skill` ('listening', 'speaking', 'reading', 'writing') |
| **`DetailDrawer`** | Ngăn kéo trượt từ phải sang xem nhanh hồ sơ | `isOpen`, `onClose`, `title`, `children` |
| **`FormModal`** | Hộp thoại nhập liệu form chuẩn | `isOpen`, `onClose`, `title`, `onSubmit`, `children` |
| **`ConfirmDialog`** | Hộp thoại xác nhận hành động nguy hiểm | `isOpen`, `onClose`, `onConfirm`, `title`, `message`, `type` |
| **`Tabs`** | Điều hướng tab nội dung | `tabs`, `activeTab`, `onTabChange` |
| **`Toast`** | Thông báo kết quả toàn cục | `type` ('success', 'error', 'info'), `message` |
| **`LoadingSkeleton`**| Khung xương chờ tải dữ liệu | `type` ('table', 'card', 'text'), `count` |
| **`EmptyState`** | Giao diện trống khi không có dữ liệu | `icon`, `title`, `description`, `actionButton` |
| **`ErrorState`** | Giao diện báo lỗi kết nối kèm nút thử lại | `message`, `onRetry` |

---

## 18. TABLE PATTERNS (CHUẨN MỰC THIẾT KẾ BẢNG DỮ LIỆU)

1. **Độ thoáng & Dễ đọc:** Chiều cao dòng chuẩn `52px` (Standard Row Height), padding ô `12px 16px`.
2. **Hiệu ứng dòng:** Nền đổi sang `#F1F5F9` khi hover chuột qua dòng; không sử dụng viền dọc giữa các cột.
3. **Cố định tiêu đề (Sticky Header):** Hàng tiêu đề giữ cố định khi người dùng cuộn xem danh sách dài.
4. **Cột Thao tác Tinh gọn (Three-dot Menu):** Không đặt 4-5 nút bấm trực tiếp gây rối mắt; gom toàn bộ hành động vào nút icon `⋮` góc phải mở Action Menu.
5. **Trạng thái Trống (Empty State) trong bảng:** Nếu không tìm thấy kết quả, bảng hiển thị minh họa rỗng: *"Không có dữ liệu học viên phù hợp với bộ lọc"*.

---

## 19. FORM PATTERNS (CHUẨN MỰC THIẾT KẾ FORM NHẬP LIỆU)

1. **Nhãn trường rõ ràng:** Luôn hiển thị nhãn (Label) phía trên ô nhập liệu kèm dấu sao đỏ `*` nếu bắt buộc.
2. **Thông báo lỗi tức thì:** Thông báo lỗi màu đỏ (12px) hiển thị ngay dưới ô nhập khi người dùng nhập sai hoặc bỏ trống trường bắt buộc.
3. **Bố cục lưới:**
   - Desktop: Form chia lưới 2 cột cân đối cho các trường ngắn (Họ tên, SĐT, Ngày sinh).
   - Mobile: Tự động co về 1 cột dọc duy nhất.
4. **Quy chuẩn Nút bấm trong Form:**
   - Nút **[Lưu / Xác nhận]**: Màu Primary (`#2563EB`), nằm bên phải.
   - Nút **[Hủy bỏ]**: Nền xám nhạt (`#F1F5F9`), chữ xám đậm, nằm bên trái nút lưu.
   - Nút hành động nguy hiểm (Hủy thanh toán, Thôi học): Màu Đỏ (`#EF4444`).

---

## 20. STATUS SYSTEM (HỆ THỐNG MÀU SẮC TRẠNG THÁI NHẤT QUÁN)

Toàn bộ hệ thống áp dụng bảng màu trạng thái đồng bộ:

```
┌──────────────────┬─────────────────┬─────────────────┬──────────────────┐
│ Nhóm trạng thái  │ Tên trạng thái  │ Màu nền (Badge) │ Màu chữ (Badge)  │
├──────────────────┼─────────────────┼─────────────────┼──────────────────┤
│ Học vụ & Lớp     │ Active (Đang học│ #ECFDF5 (Green) │ #047857          │
│                  │ Upcoming (Sắp mở│ #EFF6FF (Blue)  │ #1D4ED8          │
│                  │ Completed (Xong)│ #F1F5F9 (Slate) │ #475569          │
│                  │ Cancelled (Hủy) │ #FEF2F2 (Red)   │ #B91C1C          │
├──────────────────┼─────────────────┼─────────────────┼──────────────────┤
│ Điểm danh        │ Present (Có mặt)│ #ECFDF5 (Green) │ #047857          │
│                  │ Late (Đi muộn)  │ #FFFBEB (Amber) │ #B45309          │
│                  │ Excused (Phép)  │ #EFF6FF (Blue)  │ #1D4ED8          │
│                  │ Absent (Vắng)   │ #FEF2F2 (Red)   │ #B91C1C          │
├──────────────────┼─────────────────┼─────────────────┼──────────────────┤
│ Học phí          │ Paid (Đã đóng đủ│ #ECFDF5 (Green) │ #047857          │
│                  │ Partial (1 phần)│ #FFFBEB (Amber) │ #B45309          │
│                  │ Unpaid (Chưa thu│ #FEF2F2 (Red)   │ #B91C1C          │
│                  │ Overdue (Quá hạn│ #FEE2E2 (Red)   │ #991B1B          │
│                  │ Voided (Hủy thu)│ #F1F5F9 (Slate) │ #475569          │
└──────────────────┴─────────────────┴─────────────────┴──────────────────┘
```

---

## 21. LOADING / EMPTY / ERROR STATES (TRẠNG THÁI ĐẶC BIỆT)

- **Trạng thái Đang tải (Loading State):**
  - Tuyệt đối không để màn hình trắng hoặc dùng spinner toàn trang gây khó chịu.
  - Sử dụng **Skeleton Screens** (Khung xương xám nhấp nháy động) mô phỏng chính xác cấu trúc bảng hoặc thẻ card sắp hiển thị.
- **Trạng thái Trống (Empty State):**
  - Hiển thị khi danh sách chưa có dữ liệu hoặc không khớp từ khóa tìm kiếm.
  - Cấu trúc: Icon minh họa phẳng + Tiêu đề ngắn gọn + Lời giải thích phụ + Nút CTA hành động (Ví dụ: *"Chưa có học viên nào trong lớp này. [+ Xếp học viên vào lớp]"*).
- **Trạng thái Lỗi (Error State):**
  - Hiển thị khi mất kết nối mạng hoặc server trả về lỗi 500.
  - Cấu trúc: Icon cảnh báo đỏ + Thông báo lỗi thân thiện + Nút **[Thử lại (Retry)]**.

---

## 22. RESPONSIVE RULES (QUY TẮC HIỂN THỊ ĐA THIẾT BỊ)

| Thành phần UI | Desktop ($\ge 1280px$) | Tablet ($768px - 1279px$) | Mobile ($< 768px$) |
| :--- | :--- | :--- | :--- |
| **Sidebar** | Cố định 250px | Thu gọn mini-bar (68px) | Ẩn hoàn toàn, mở qua Drawer trượt |
| **Top Header** | Thanh tìm kiếm dài + User profile | Thu gọn thanh tìm kiếm | Chỉ icon kính lúp + Menu burger |
| **Bảng dữ liệu** | Data Table đầy đủ tất cả các cột | Data Table cho phép cuộn ngang | Chuyển thành danh sách Card di động |
| **Lưới Form** | Grid 2 cột cân đối | Grid 2 cột | Grid 1 cột dọc xếp chồng |
| **Thẻ KPI** | Hàng ngang 4 cột | Hàng ngang 2 cột x 2 dòng | 1 cột xếp chồng dọc |

---

## 23. ACCESSIBILITY (TIÊU CHUẨN TIẾP CẬN CƠ BẢN)

1. **Độ tương phản màu (Color Contrast):** Toàn bộ tỷ lệ tương phản giữa chữ và nền đạt chuẩn tối thiểu **WCAG AA** ($4.5:1$ cho chữ thông thường, $3:1$ cho chữ in đậm/tiêu đề lớn).
2. **Trạng thái Focus bàn phím:** Mọi nút bấm, link và ô input đều có viền focus ring rõ ràng (`outline: 2px solid #2563EB; outline-offset: 2px`) phục vụ người dùng sử dụng phím Tab.
3. **Thân thiện với Trình đọc màn hình (Screen Readers):**
   - Các nút chỉ chứa icon (như icon `⋮`, icon đóng `X`, chuông thông báo) bắt buộc phải có thuộc tính `aria-label` mô tả hành động.
   - Sử dụng thẻ ngữ nghĩa HTML5 chuẩn: `<header>`, `<nav>`, `<main>`, `<aside>`, `<section>`, `<table>`.

---

## 24. EXISTING FRONTEND MIGRATION MAPPING (BẢNG ÁNH XẠ DI TRÚ FRONTEND)

Đánh giá chi tiết các Component/Trang hiện có của trường đại học cũ và phương án chuyển đổi sang hệ thống VLearn:

| File Frontend cũ (University) | Thành phần mục tiêu (VLearn) | Hành động | Hướng dẫn Kỹ thuật Chuyển dịch |
| :--- | :--- | :---: | :--- |
| `src/layouts/AdminLayout.jsx` | `AdminLayout` | **MODIFY** | Cập nhật bộ menu Sidebar 13 mục chuẩn của VLearn Admin. |
| `src/layouts/ProfessorLayout.jsx` | `TeacherLayout` | **REPLACE** | Đổi tên sang `TeacherLayout`, cấu trúc lại menu giảng dạy VLearn. |
| `src/layouts/StudentLayout.jsx` | `StudentLayout` | **MODIFY** | Cập nhật điều hướng chuyên cần, 4 kỹ năng và học phí cá nhân. |
| *Chưa có* | `ReceptionistLayout` | **ADD MỚI** | Xây dựng Layout riêng cho nhân viên Lễ tân / Tuyển sinh. |
| `src/pages/AdminDashboard.jsx` | `AdminDashboard` | **REPLACE** | Thay thế số liệu đại học cũ bằng 7 KPI học vụ & tài chính trung tâm. |
| `src/pages/ProfDashboard.jsx` | `TeacherDashboard` | **REPLACE** | Tối ưu hiển thị ca dạy hôm nay và tỷ lệ chuyên cần các lớp. |
| `src/pages/StudentDashboard.jsx` | `StudentDashboard` | **REPLACE** | Hiển thị thời khóa biểu tuần, kết quả 4 kỹ năng và công nợ. |
| `src/pages/AdminUsers.jsx` | `StudentList` & `TeacherList` | **REPLACE & TÁCH RỜI** | Tách màn hình quản lý học viên và giáo viên riêng biệt theo phong cách bảng SaaS. |
| `src/pages/AdminCourses.jsx` | `ClassList` & `ClassDetail` | **REPLACE** | Chuyển thành Card Grid lớp học theo 4 kỹ năng (`skill`), sĩ số và phòng học. |
| `src/pages/AdminSubjects.jsx` | *Bị loại bỏ* | **REMOVE** | Bỏ hoàn toàn màn hình môn học đại học cũ. |
| `src/pages/ManageLeaves.jsx` | *Bị loại bỏ* | **REMOVE** | Bỏ màn hình duyệt nghỉ phép; thay bằng điểm danh `Excused`. |
| `src/pages/ProfAttendance.jsx` | `AttendancePage` | **MODIFY** | Nâng cấp luồng: Chọn Lớp $\rightarrow$ Chọn Buổi học $\rightarrow$ Bảng điểm danh Bulk Upsert. |
| `src/pages/NoticeBoard.jsx` | `NoticeBoard` | **MODIFY** | Giữ lại, cập nhật phân loại đối tượng nhận (`audience`). |
| `src/pages/ProfMaterials.jsx` | `StudyMaterials` | **MODIFY** | Giữ lại, chuyển đổi liên kết tài liệu từ `Course` sang `Class`. |
| *Chưa có* | `TuitionPage` & `PaymentModal` | **ADD MỚI** | Xây dựng giao diện Hóa đơn học phí, Thu tiền nhiều đợt và Hủy phiếu thu. |
| *Chưa có* | `SchedulePage` | **ADD MỚI** | Xây dựng giao diện Thời khóa biểu tuần và Cảnh báo xung đột lịch. |
| *Chưa có* | `ResultsPage` | **ADD MỚI** | Xây dựng bảng nhập và xem điểm số 4 kỹ năng (0 – 100). |
| *Chưa có* | `AccountPage` & `RolePage` | **ADD MỚI** | Xây dựng màn hình quản trị tài khoản nội bộ cho Admin. |

---

## 25. UI ACCEPTANCE CRITERIA (TIÊU CHÍ NGHIỆM THU GIAO DIỆN)

Đặc tả UI/UX được nghiệm thu đạt chuẩn khi đáp ứng đầy đủ các tiêu chí:

- [x] **Phong cách Modern Education SaaS Admin:** Tối giản, chuyên nghiệp, tone màu Blue/Green/Slate, loại bỏ gradient màu mè và glassmorphism cũ.
- [x] **4 Bộ Menu Phân quyền Độc lập:** Admin, Receptionist, Teacher, Student sở hữu cấu trúc điều hướng riêng biệt, không để lộ chức năng ngoài phạm vi.
- [x] **Bám sát Visual Reference Screenshot:** Cấu trúc Top KPI cards, Toolbar tìm kiếm/bộ lọc, Data Table tinh gọn với nút `⋮` (three-dot menu).
- [x] **Hồ sơ Học viên Đa tầng (Tabbed Detail):** Kết hợp Trang chi tiết chuyên sâu 6 tabs (`Overview`, `Classes`, `Schedule`, `Attendance`, `Results`, `Tuition & Payments`) và Quick Drawer.
- [x] **Lớp học Card Layout với 4 Kỹ năng:** Thẻ lớp hiển thị đầy đủ giáo viên, lịch học, thanh tiến trình sĩ số và huy hiệu màu chuẩn cho 4 kỹ năng tiếng Anh.
- [x] **Luồng Điểm danh Tối ưu:** Quy trình 3 bước tường minh: Chọn Lớp $\rightarrow$ Chọn Buổi $\rightarrow$ Bảng điểm danh hàng loạt với nút *"Điểm danh tất cả Có mặt"*.
- [x] **Phân hệ Tài chính Trực quan:** Hóa đơn thể hiện rõ 3 con số (Tổng, Đã đóng, Còn thiếu); Hộp thoại nộp tiền tự động kiểm tra số dư nợ; Hộp thoại Void payment bảo vệ bằng Confirm Dialog và bắt buộc nhập lý do.
- [x] **Kiến trúc Thành phần Tái sử dụng (Reusable Components):** Định nghĩa đầy đủ 18 components dùng chung.
- [x] **Trạng thái Toàn diện:** Quy định rõ ràng Skeleton Loading, Empty State có CTA và Error State có nút Thử lại.
- [x] **Kế hoạch Chuyển dịch Frontend Cụ thể:** Bảng ánh xạ 18 màn hình từ source code cũ sang hệ thống mới không làm gián đoạn luồng phát triển.

---

> 🛑 **KẾT THÚC TÀI LIỆU UI/UX SPECIFICATION.**  
> Dự án tạm dừng tại đây. Không có mã nguồn React nào bị thay đổi. Chờ phê duyệt của bạn trước khi bước sang giai đoạn tiếp theo!
