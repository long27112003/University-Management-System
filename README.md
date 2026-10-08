# 📘 VLearn English Center - Hệ Thống Quản Lý Trung Tâm Anh Ngữ

> **Hệ thống Quản lý Trung tâm Anh ngữ Toàn diện (VLearn English Center Management System)** xây dựng trên nền tảng **MERN Stack** (MongoDB, Express.js, React, Node.js), đáp ứng trọn vẹn nghiệp vụ quản lý đào tạo, giáo viên, học viên, lịch học, điểm danh, kết quả học tập và tài chính học phí.

---

## 📑 Mục Lục
1. [Giới thiệu & Kiến trúc Công nghệ](#-kiến-trúc-công-nghệ)
2. [Yêu cầu Môi trường Tiên quyết](#-yêu-cầu-môi-trường-tiên-quyết)
3. [Hướng dẫn Cài đặt MongoDB (A-Z)](#-hướng-dẫn-cài-đặt-mongodb-từ-a-z)
   - [Cách 1: Cài đặt MongoDB Community Server & Compass (Khuyến nghị trên máy Local)](#cách-1-cài-đặt-mongodb-community-server--compass-local)
   - [Cách 2: Sử dụng MongoDB Atlas (Cloud Database)](#cách-2-sử-dụng-mongodb-atlas-cloud-miễn-phí)
4. [Hướng dẫn Cài đặt Dự án Từ A-Z](#-hướng-dẫn-cài-đặt-dự-án-từ-a-z)
   - [Bước 1: Clone hoặc tải mã nguồn](#bước-1-tải--mở-mã-nguồn)
   - [Bước 2: Cài đặt và cấu hình Backend](#bước-2-cài-đặt-và-cấu-hình-backend)
   - [Bước 3: Cài đặt và cấu hình Frontend](#bước-3-cài-đặt-và-cấu-hình-frontend)
   - [Bước 4: Nạp dữ liệu mẫu chuẩn hóa (Seed Database)](#bước-4-nạp-dữ-liệu-mẫu-chuẩn-hóa-seed-database)
5. [Các Câu Lệnh Chạy Dự Án Chuẩn](#-các-câu-lệnh-chạy-dự-án-chuẩn)
6. [Tài Khoản Đăng Nhập & Phân Quyền (Demo)](#-tài-khoản-đăng-nhập--phân-quyền)
7. [Hướng Dẫn Sử Dụng Theo Từng Vai Trò](#-hướng-dẫn-sử-dụng-theo-từng-vai-trò)
8. [Kiểm Thử Tự Động (Automated E2E Tests)](#-kiểm-thử-tự-động-automated-e2e-tests)
9. [Tổng Hợp Các Lỗi Thường Gặp & Cách Khắc Phục (Troubleshooting)](#-tổng-hợp-các-lỗi-thường-gặp--cách-khắc-phục)
10. [Cấu Trúc Thư Mục Dự Án](#-cấu-trúc-thư-mục-dự-án)
11. [Giải Thích Toàn Diện Mã Nguồn & Logic Code Từ A-Z](CODE_EXPLANATION.md)

---

## 🛠️ Kiến Trúc Công Nghệ

- **Frontend**: 
  - React 19, Vite 8, React Router DOM v7
  - Lucide React Icons, Recharts (Biểu đồ phân tích)
  - Hệ thống giao diện Modern Vanilla CSS (Design Tokens, Hero Banners, Dark/Light Mode, Card Shadows, Glassmorphism)
- **Backend**: 
  - Node.js (v18+ hoặc v20+ LTS), Express.js 5
  - Mongoose 9 (MongoDB ODM), Bcrypt (Mã hóa mật khẩu)
  - JWT (JSON Web Tokens) Phân quyền RBAC bảo mật
  - Multer (Xử lý upload tài liệu, giáo trình)
- **Database**: 
  - MongoDB Community Server Local hoặc MongoDB Atlas Cloud

---

## 💻 Yêu Cầu Môi Trường Tiên Quyết

Trước khi cài đặt dự án, máy tính cần cài sẵn các công cụ sau:

| Công cụ | Phiên bản tối thiểu | Khuyến nghị | Tải về chính thức |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>= 18.0.0` | `20.x LTS` hoặc `22.x LTS` | [nodejs.org](https://nodejs.org/) |
| **npm** | `>= 9.0.0` | Kèm theo Node.js | Đi kèm Node.js |
| **Git** | `>= 2.30.0` | Bản mới nhất | [git-scm.com](https://git-scm.com/) |
| **MongoDB** | `>= 6.0` | `MongoDB Community 7.0+` & `Compass` | [mongodb.com](https://www.mongodb.com/try/download/community) |

Kiểm tra trên Terminal / PowerShell xem đã có chưa:
```powershell
node -v
npm -v
git --version
```

---

## 🍃 Hướng Dẫn Cài Đặt MongoDB Từ A-Z

Hệ thống cần cơ sở dữ liệu MongoDB để lưu trữ dữ liệu. Bạn có thể chọn **1 trong 2 cách** sau:

### Cách 1: Cài đặt MongoDB Community Server & Compass (Local)

1. **Tải bộ cài đặt**:
   - Truy cập: [MongoDB Community Server Download](https://www.mongodb.com/try/download/community).
   - Chọn phiên bản hiện tại (ví dụ: `7.0.x`), Package: `MSI` (trên Windows).
   - Tải về và mở file `.msi` cài đặt.

2. **Các bước khi chạy trình cài đặt (Windows)**:
   - Chọn loại cài đặt: **Complete**.
   - Tại màn hình **Service Configuration**:
     - Tích chọn: **"Install MongoD as a Service"** (Tự động chạy cùng Windows).
     - Chọn **"Run service as Network Service user"**.
   - Tại màn hình tiếp theo:
     - Tích chọn **"Install MongoDB Compass"** (Giao diện quản lý trực quan đồ họa cho MongoDB).
   - Nhấn **Install** và chờ hoàn tất.

3. **Kiểm tra và Khởi động dịch vụ MongoDB trên Windows**:
   - Mở **PowerShell (Run as Administrator)** hoặc **Command Prompt (CMD)**:
     ```powershell
     # Bật service MongoDB (nếu chưa chạy)
     net start MongoDB
     
     # Hoặc kiểm tra trạng thái bằng PowerShell:
     Get-Service MongoDB
     ```
   - Mở ứng dụng **MongoDB Compass**:
     - Chuỗi kết nối mặc định: `mongodb://127.0.0.1:27017`
     - Nhấn **Connect**. Nếu kết nối thành công là MongoDB đã sẵn sàng.

---

### Cách 2: Sử dụng MongoDB Atlas (Cloud miễn phí)

Nếu bạn không muốn cài đặt MongoDB trực tiếp vào máy:

1. Đăng ký tài khoản miễn phí tại: [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Tạo một **Cluster** miễn phí (M0 Free Tier).
3. Vào phần **Database Access**: Tạo 1 tài khoản database (ví dụ: username `vlearn_user`, password `YourPassword123`).
4. Vào phần **Network Access**: Chọn **Add IP Address** -> Chọn **Allow Access from Anywhere (`0.0.0.0/0`)** để máy của bạn kết nối được.
5. Vào **Clusters** -> Nhấn **Connect** -> Chọn **Drivers (Node.js)**:
   - Sao chép chuỗi kết nối dạng:
     ```text
     mongodb+srv://vlearn_user:<password>@cluster0.xxxxx.mongodb.net/university_db?retryWrites=true&w=majority
     ```
   - Dán chuỗi này vào biến `MONGO_URI` trong file `backend/.env`.

---

## 🚀 Hướng Dẫn Cài Đặt Dự Án Từ A-Z

### Bước 1: Tải & Mở Mã Nguồn

Mở Terminal / PowerShell và trỏ đến thư mục dự án:
```powershell
cd d:\BE\University-Management-System
```

*(Nếu clone từ GitHub lần đầu)*:
```powershell
git clone https://github.com/long27112003/University-Management-System.git
cd University-Management-System
```

---

### Bước 2: Cài Đặt Và Cấu Hình Backend

1. **Di chuyển vào thư mục backend và cài đặt thư viện**:
   ```powershell
   cd backend
   npm install
   ```

2. **Cấu hình file môi trường `.env`**:
   Kiểm tra hoặc tạo file `.env` nằm trong thư mục `backend/` với nội dung chuẩn:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/university_db
   JWT_SECRET=my_super_secret_jwt_key_2026
   NODE_ENV=development
   ```
   > *Ghi chú:* 
   > - Nếu dùng MongoDB Atlas, thay `MONGO_URI` bằng connection string Atlas của bạn.
   > - `PORT=5000` là cổng chạy API backend.
   > - `JWT_SECRET` là chuỗi bí mật mã hóa phiên đăng nhập.

---

### Bước 3: Cài Đặt Và Cấu Hình Frontend

1. **Mở terminal hoặc chuyển vào thư mục frontend và cài đặt thư viện**:
   ```powershell
   cd ../frontend
   npm install
   ```

2. **Cấu hình file môi trường `.env`**:
   Kiểm tra hoặc tạo file `.env` nằm trong thư mục `frontend/`:
   ```env
   VITE_API_URL=http://localhost:5000
   ```
   > *Ghi chú:* Biến này chỉ định cho React kết nối chính xác tới cổng API của Backend.

---

### Bước 4: Nạp Dữ Liệu Mẫu Chuẩn Hóa (Seed Database)

Hệ thống được trang bị bộ script khởi tạo dữ liệu thông minh toàn diện `seedVLearn.js`, tạo sẵn:
- 4 loại tài khoản người dùng theo 4 phân quyền (Admin, Receptionist, Teacher, Student).
- Các giáo viên và học viên kèm thông tin chi tiết (chuyên môn, chứng chỉ IELTS/CELTA, liên hệ).
- Các lớp học mẫu (IELTS Foundation, IELTS Intensive, TOEIC 650+, Giao tiếp phản xạ).
- Lịch học, phòng học, các buổi học (sessions).
- Dữ liệu điểm danh thực tế, bảng điểm 4 kỹ năng (Nghe, Nói, Đọc, Viết).
- Danh sách hóa đơn học phí, các đợt thanh toán (phiếu thu) và thông báo trung tâm.

**Chạy lệnh nạp dữ liệu**:
```powershell
cd d:\BE\University-Management-System\backend
npm run seed:vlearn
```
> Khi màn hình hiển thị `✅ Seed VLearn database completed successfully!` là dữ liệu đã được nạp hoàn tất 100%.

---

## ⚡ Các Câu Lệnh Chạy Dự Án Chuẩn

Để chạy toàn bộ hệ thống, bạn cần mở **2 cửa sổ Terminal** riêng biệt:

### Terminal 1: Khởi Chạy Backend Server
```powershell
cd d:\BE\University-Management-System\backend
npm run dev
```
- Khi chạy thành công terminal sẽ báo:
  ```text
  Connected to MongoDB
  Server running on port 5000
  ```
- Backend API hoạt động tại: `http://localhost:5000`

### Terminal 2: Khởi Chạy Frontend Client
```powershell
cd d:\BE\University-Management-System\frontend
npm run dev
```
- Khi chạy thành công terminal sẽ hiển thị:
  ```text
  VITE v8.0.4  ready in ... ms
  ➜  Local:   http://localhost:5173/
  ```
- Mở trình duyệt web và truy cập: **`http://localhost:5173`**

---

### Bảng Tổng Hợp Tất Cả Lệnh Thường Dùng:

| Phân hệ | Mục đích | Lệnh chạy (PowerShell / Terminal) |
| :--- | :--- | :--- |
| **Backend** | Chạy chế độ phát triển (Auto reload) | `cd backend` sau đó `npm run dev` |
| **Backend** | Chạy chế độ chuẩn Node.js | `cd backend` sau đó `npm start` |
| **Backend** | Nạp dữ liệu mẫu VLearn chuẩn | `cd backend` sau đó `npm run seed:vlearn` |
| **Backend** | Chạy kiểm thử tự động E2E | `cd backend` sau đó `node scripts/run_phase13_e2e.js` |
| **Frontend** | Khởi chạy giao diện Dev | `cd frontend` sau đó `npm run dev` |
| **Frontend** | Đóng gói sản phẩm (Production build) | `cd frontend` sau đó `npm run build` |
| **Frontend** | Xem trước bản build | `cd frontend` sau đó `npm run preview` |

---

## 👥 Tài Khoản Đăng Nhập & Phân Quyền

Sau khi nạp dữ liệu bằng lệnh `npm run seed:vlearn`, bạn có thể đăng nhập bằng các tài khoản kiểm thử sau:

| Vai trò (Role) | Email đăng nhập | Mật khẩu mặc định | Quyền hạn chính |
| :--- | :--- | :--- | :--- |
| **Admin** *(Quản trị viên)* | `admin@vlearn.edu.vn` | `VLearnAdmin123!` | Quản trị toàn hệ thống, tạo tài khoản người dùng, phân quyền, cấu hình lớp học, theo dõi doanh thu, duyệt/hủy phiếu thu thanh toán, quản lý giáo viên & học viên. |
| **Receptionist** *(Lễ tân / Tuyển sinh)* | `letan@vlearn.edu.vn` | `VLearnReception123!` | Tiếp nhận học viên mới, ghi danh học viên vào lớp, tạo hóa đơn học phí, ghi nhận thanh toán tiền mặt/chuyển khoản, theo dõi công nợ, quản lý thông báo. |
| **Teacher** *(Giáo viên)* | `teacher@vlearn.edu.vn` | `VLearnTeacher123!` | Xem lịch dạy và lớp phụ trách, thực hiện điểm danh học viên từng buổi học, nhập bảng điểm đánh giá 4 kỹ năng, đăng tải tài liệu học tập. |
| **Student** *(Học viên)* | `student@vlearn.edu.vn` | `VLearnStudent123!` | Xem lịch học cá nhân, theo dõi chuyên cần (điểm danh), xem bảng điểm kiểm tra, xem trạng thái học phí/hóa đơn cá nhân, tải tài liệu học tập của lớp. |

---

## 📖 Hướng Dẫn Sử Dụng Theo Từng Vai Trò

### 1. Quy Trình Tuyển Sinh & Thu Học Phí (Lễ Tân - Receptionist)
1. Đăng nhập tài khoản `letan@vlearn.edu.vn`.
2. Vào **Học viên** -> Nhấn **Thêm học viên mới** (điền thông tin, số điện thoại phụ huynh).
3. Vào **Ghi danh** -> Chọn học viên và chọn Lớp học muốn đăng ký -> Hệ thống tự động khởi tạo **Hóa đơn học phí (Tuition Invoice)** tương ứng.
4. Vào phân hệ **Học phí / Thu học phí**:
   - Chọn hóa đơn của học viên.
   - Nhấn **Thu học phí** (chọn hình thức: Tiền mặt, Chuyển khoản, Thẻ).
   - Hệ thống tự động xuất mã phiếu thu và cập nhật trạng thái thanh toán (Một phần / Hoàn tất).

### 2. Quy Trình Quản Trị & Hủy Phiếu Thu (Admin)
1. Đăng nhập tài khoản `admin@vlearn.edu.vn`.
2. Truy cập **Dashboard**: Xem các biểu đồ trực quan về doanh thu tháng, tỷ lệ ghi danh, số lượng lớp đang mở.
3. Quản trị tài khoản: Vào mục **Tài khoản** để cấp quyền mới hoặc khóa tài khoản.
4. Quản lý tài chính nâng cao: Trong trường hợp lễ tân thu nhầm hoặc có sai sót, chỉ Admin mới có quyền nhấn **Hủy phiếu thu (Void Payment)** kèm theo lý do bắt buộc để phục vụ kiểm toán tài chính.

### 3. Quy Trình Giảng Dạy & Đánh Giá (Giáo Viên - Teacher)
1. Đăng nhập tài khoản `teacher@vlearn.edu.vn`.
2. Vào **Lớp phụ trách** hoặc **Lịch dạy**: Xem danh sách buổi học trong tuần.
3. **Điểm danh**: Chọn buổi học cần điểm danh -> Đánh dấu trạng thái từng học viên (`Có mặt`, `Đi trễ`, `Nghỉ phép`, `Vắng mặt`) -> Nhấn **Lưu điểm danh**.
4. **Bảng điểm**: Vào chi tiết lớp -> Mục **Kết quả học tập** -> Nhập điểm chi tiết 4 kỹ năng (Listening, Speaking, Reading, Writing) cho các kỳ thi (Quiz, Giữa kỳ, Cuối kỳ).
5. **Tài liệu**: Tải lên bài giảng hoặc bài tập dạng file PDF, Word hoặc Slide.

### 4. Quy Trình Dành Cho Học Viên (Học Viên - Student)
1. Đăng nhập tài khoản `student@vlearn.edu.vn`.
2. **Dashboard Học viên**: Xem nhanh lịch học tiếp theo, số buổi đã tham gia, cảnh báo chuyên cần.
3. **Lịch học & Điểm danh**: Tra cứu ngày giờ học, phòng học, giảng viên phụ trách.
4. **Bảng điểm**: Xem kết quả các bài kiểm tra định kỳ và đánh giá tiến bộ.
5. **Tài liệu học tập**: Xem và tải về các tài liệu do giáo viên chia sẻ.

---

## 🧪 Kiểm Thử Tự Động (Automated E2E Tests)

Hệ thống tích hợp bộ kịch bản kiểm thử End-to-End toàn diện kiểm tra tính đúng đắn của logic nghiệp vụ (Auth, CRUD, Xếp lớp, Điểm danh, Tính toán học phí, Hủy phiếu thu):

```powershell
cd d:\BE\University-Management-System\backend
node scripts/run_phase13_e2e.js
```
Kết quả kiểm thử sẽ in chi tiết từng case trên terminal.

---

## 🛠️ Tổng Hợp Các Lỗi Thường Gặp & Cách Khắc Phục

### Lỗi 1: `MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`
* **Hiện tượng**: Backend báo lỗi đỏ và không thể kết nối tới cơ sở dữ liệu.
* **Nguyên nhân**: Dịch vụ MongoDB trên máy của bạn chưa được khởi động.
* **Cách khắc phục**:
  1. Mở **Command Prompt (CMD) với quyền Administrator** hoặc **PowerShell**:
     ```powershell
     net start MongoDB
     ```
  2. Hoặc nhấn tổ hợp phím `Windows + R`, gõ `services.msc`, tìm dịch vụ **MongoDB Server**, bấm chuột phải chọn **Start**.
  3. Nếu sử dụng MongoDB Atlas, kiểm tra lại chuỗi `MONGO_URI` trong file `backend/.env` xem đã điền đúng tài khoản và mật khẩu chưa, đồng thời đảm bảo đã mở IP `0.0.0.0/0` trên Atlas.

---

### Lỗi 2: `Error: listen EADDRINUSE: address already in use :::5000` (hoặc Port 5173)
* **Hiện tượng**: Báo lỗi cổng 5000 (Backend) hoặc 5173 (Frontend) đã bị chiếm dụng.
* **Nguyên nhân**: Một tiến trình Node.js trước đó chưa được đóng hẳn và vẫn đang chạy ngầm.
* **Cách khắc phục**:
  - **Cách 1: Tắt tiến trình đang chiếm port bằng PowerShell**:
    ```powershell
    # Tìm tiến trình đang chiếm port 5000:
    Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
    
    # Đối với port 5173 (nếu bị kẹt):
    Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process -Force
    ```
  - **Cách 2: Đổi cổng khác trong `.env`**:
    - Vào file `backend/.env`, đổi `PORT=5001`.
    - Vào file `frontend/.env`, đổi `VITE_API_URL=http://localhost:5001`.

---

### Lỗi 3: PowerShell báo lỗi `running scripts is disabled on this system` (Execution Policy)
* **Hiện tượng**: Khi gõ lệnh `npm run dev` hoặc `vite`, PowerShell hiển thị chữ đỏ báo lỗi chính sách bảo mật không cho phép chạy script.
* **Nguyên nhân**: Windows PowerShell mặc định chặn thực thi các script bên ngoài.
* **Cách khắc phục**:
  1. Mở **PowerShell (Run as Administrator)**.
  2. Chạy lệnh sau:
     ```powershell
     Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
     ```
  3. Nhập `Y` rồi nhấn `Enter`. Sau đó khởi động lại terminal và chạy lại lệnh bình thường.

---

### Lỗi 4: Lỗi Network Error / Không gọi được API từ Frontend (`AxiosError: Network Error`)
* **Hiện tượng**: Giao diện đăng nhập hoặc tải dữ liệu xoay mãi hoặc báo "Network Error".
* **Nguyên nhân**:
  1. Backend chưa được bật (kiểm tra Terminal Backend xem đã chạy chưa).
  2. Cấu hình file `frontend/.env` sai cổng hoặc thiếu tiền tố `http://`.
* **Cách khắc phục**:
  - Đảm bảo Backend đang chạy ổn định ở terminal riêng.
  - Mở file `frontend/.env` và kiểm tra chính xác:
    ```env
    VITE_API_URL=http://localhost:5000
    ```
  - Lưu ý: Sau khi sửa file `.env`, **bắt buộc phải nhấn `Ctrl + C` ở terminal frontend và chạy lại `npm run dev`** thì Vite mới nạp giá trị mới.

---

### Lỗi 5: Đăng nhập báo "Sai email hoặc mật khẩu" hoặc Dữ liệu trống trơn
* **Hiện tượng**: Đăng nhập tài khoản demo không vào được hoặc vào được nhưng không có danh sách lớp/học viên.
* **Nguyên nhân**: Bạn chưa chạy script nạp dữ liệu vào MongoDB.
* **Cách khắc phục**:
  ```powershell
  cd d:\BE\University-Management-System\backend
  npm run seed:vlearn
  ```
  Sau đó đăng nhập lại với mật khẩu: `VLearnAdmin123!` (lưu ý chữ hoa chữ thường).

---

### Lỗi 6: Lỗi Token xác thực hết hạn / Lỗi quyền hạn (401 Unauthorized / 403 Forbidden)
* **Hiện tượng**: Sau khi tắt mở lại server, giao diện báo không có quyền hoặc bị văng ra ngoài.
* **Nguyên nhân**: Token JWT cũ đã lưu trong trình duyệt bị hết hạn hoặc không khớp với database mới tạo lại.
* **Cách khắc phục**:
  1. Mở trình duyệt web, nhấn phím `F12` (Developer Tools).
  2. Chọn tab **Application** (hoặc **Bộ nhớ / Ứng dụng**).
  3. Chọn mục **Local Storage** -> `http://localhost:5173`.
  4. Nhấn nút **Clear All** (xóa hết `token` và `user`).
  5. Tải lại trang (`F5`) và tiến hành đăng nhập lại.

---

### Lỗi 7: Lỗi cài đặt thư viện (`node-gyp` hoặc `bcrypt` build failed trên Windows)
* **Hiện tượng**: Khi chạy `npm install` ở backend báo lỗi đỏ liên quan đến python hoặc build-tools.
* **Cách khắc phục**:
  - Dự án đã sử dụng phiên bản `bcrypt` mới nhất có sẵn prebuilt binary cho Windows x64.
  - Đảm bảo bạn đang sử dụng Node.js bản LTS (`v20.x`).
  - Nếu gặp sự cố, chạy:
    ```powershell
    cd backend
    npm rebuild bcrypt --build-from-resource
    ```

---

### Lỗi 8: Lỗi khi tải tài liệu hoặc upload file
* **Hiện tượng**: Upload giáo trình báo lỗi hoặc không mở xem được file tài liệu.
* **Nguyên nhân**: Thư mục lưu trữ `uploads` chưa được tạo hoặc chưa cấp quyền ghi.
* **Cách khắc phục**:
  - Kiểm tra xem thư mục `backend/uploads` đã tồn tại chưa. Nếu chưa có, tạo thư mục này:
    ```powershell
    mkdir d:\BE\University-Management-System\backend\uploads\materials
    ```

---

## 📁 Cấu Trúc Thư Mục Dự Án

```text
University-Management-System/
├── backend/                        # Backend Server (Node.js & Express)
│   ├── controllers/                # Điều khiển logic nghiệp vụ (Auth, Class, Student, Tuition...)
│   ├── middleware/                 # Middleware xác thực JWT, RBAC, Multer upload
│   ├── models/                     # Mongoose Schemas (User, Student, Teacher, Class, Payment...)
│   ├── routes/                     # Định tuyến API RESTful
│   ├── scripts/                    # Scripts nạp dữ liệu mẫu (seedVLearn) & E2E Tests
│   ├── services/                   # Business Services logic
│   ├── uploads/                    # Thư mục chứa tài liệu học tập tải lên
│   ├── .env                        # Biến môi trường Backend (PORT, MONGO_URI, JWT_SECRET)
│   ├── package.json                # Dependencies & script Backend
│   └── server.js                   # Điểm khởi chạy chính của Backend API
│
├── frontend/                       # Frontend Web App (React 19 & Vite)
│   ├── public/                     # Tài nguyên tĩnh (Logos, Icons, Favicon)
│   ├── src/
│   │   ├── assets/                 # Hình ảnh, icons nội bộ
│   │   ├── components/             # Components giao diện dùng chung (Modal, StatCard, Badge...)
│   │   ├── context/                # Context API (AuthContext quản lý phiên đăng nhập)
│   │   ├── layouts/                # Bố cục giao diện theo vai trò (Admin, Receptionist, Teacher, Student)
│   │   ├── pages/                  # Các trang chức năng (Dashboard, Classes, Invoices, Attendance...)
│   │   ├── services/               # API Callers (Axios instance & endpoint methods)
│   │   ├── App.jsx                 # Routing chính của ứng dụng
│   │   ├── index.css               # Hệ thống CSS Design Tokens & Styling toàn diện
│   │   └── main.jsx                # Điểm khởi chạy React DOM
│   ├── .env                        # Biến môi trường Frontend (VITE_API_URL)
│   ├── index.html                  # File HTML chính
│   ├── package.json                # Dependencies & script Frontend
│   └── vite.config.js              # Cấu hình Vite bundler
│
├── docs/                           # Tài liệu thiết kế hệ thống & hướng dẫn
└── README.md                       # Tài liệu hướng dẫn cài đặt & sử dụng từ A-Z
```

---

## 🤝 Hỗ Trợ & Đóng Góp

- Dự án được phát triển nhằm phục vụ công tác quản lý đào tạo trung tâm Anh ngữ chuyên nghiệp.
- Mọi thắc mắc hoặc báo lỗi, vui lòng tạo **Issue** hoặc liên hệ trực tiếp đội ngũ phát triển qua repository GitHub.
