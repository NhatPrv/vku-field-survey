# MINI-PROJECT SHORT TECHNICAL REPORT
**Course:** Cross-Platform Mobile App Development (VKU)  
**Instructor:** TS. Nguyễn Thanh Tuấn  
**Mini-Project Title:** Mini-Project #1 — VKU Field Survey: Offline Data Collection (PWA & Capacitor)  
**Student Name:** Đặng Long Nhật — **Class:** 23JIT  
**Submission Date:** 03/09/2026  

---

## 1. GENERAL INFORMATION & DELIVERABLE LINKS
* **Student Information:**
  * **Full Name:** Đặng Long Nhật
  * **Student ID (MSSV):** 23IT196
  * **Class:** 23JIT
  * **Role:** Full-Stack Architecture, Frontend PWA & Mobile Native, Backend REST API & Cloud Deployment
  * **Contribution:** 100% (Individual Project)
* **🔗 Live Demo Client (Web App & PWA):** [http://13.250.26.54/](http://13.250.26.54/)
* **🖥️ Central Server Admin Dashboard:** [http://13.250.26.54/server-gui](http://13.250.26.54/server-gui)
* **💻 GitHub Repository:** [https://github.com/NhatPrv/vku-field-survey](https://github.com/NhatPrv/vku-field-survey)
* **📱 Android APK Package ID:** `com.vku.fieldsurvey` (Tải trực tiếp tại góc dưới giao diện Client)

---

## 2. FEATURE IMPLEMENTATION CHECKLIST

| # | Required Feature | Status | Implementation Details & Acceptance Level |
|:---:|---|:---:|---|
| **1** | **Multi-Device Responsive Shell** | ✅ Hoàn thành (100%) | Giao diện Full-Width Responsive Shell xây dựng bằng Tailwind CSS, hỗ trợ hoàn hảo từ Desktop Monitor (`max-w-7xl`), Tablet/iPad (`md:`) đến Mobile Phone (`sm:`). Hỗ trợ Dark/Light Mode chuẩn thương hiệu VKU (`#0284c7`). |
| **2** | **Multi-Step Survey Wizard** | ✅ Hoàn thành (100%) | Form khảo sát 3 bước trực quan: (1) Vị trí (Tòa nhà, Tầng, Phòng) → (2) Thiết bị & Đánh giá (Máy tính, Máy chiếu, Điều hòa, Điện, Bàn ghế, Đánh giá 1–5 sao) → (3) Bằng chứng ảnh & Ghi chú sự cố. Tự động lưu nháp thời gian thực (Auto-save draft) sau mỗi 400ms. |
| **3** | **Local Offline Persistence (IndexedDB)** | ✅ Hoàn thành (100%) | Sử dụng thư viện `idb` Promise-based quản trị cơ sở dữ liệu `vku_survey_db` với 2 Object Stores: `draft_store` (bảo toàn tiến trình chưa nộp) và `survey_queue` (hàng đợi ngoại tuyến). Dung lượng lưu trữ không giới hạn, lưu ảnh Base64 mượt mà không làm chậm UI. |
| **4** | **Camera Hardware & Web Fallback** | ✅ Hoàn thành (100%) | Cầu nối Capacitor Native Plugin (`@capacitor/camera`) kích hoạt trực tiếp ứng dụng Camera phần cứng trên thiết bị Android, tự động Fallback về HTML5 File Input API (`FileReader` Base64) khi chạy trên môi trường Web/Desktop. |
| **5** | **Reactive Network & Background Sync** | ✅ Hoàn thành (100%) | Lắng nghe mạng lai đa tầng (`@capacitor/network` + sự kiện trình duyệt `online`/`offline`). Khi khôi phục kết nối, hệ thống tự động quét các bản ghi `PENDING_SYNC` và gửi tuần tự lên máy chủ trung tâm, cập nhật trạng thái `SYNCED`. |
| **6** | **PWA Cache-First App Shell** | ✅ Hoàn thành (100%) | Cấu hình Workbox Service Worker (`vite-plugin-pwa`) lưu đệm toàn bộ tài nguyên tĩnh (HTML, CSS, JS, Fonts, Icons). Ứng dụng khởi chạy tức thì và chạy 100% ngoại tuyến khi mất sóng hoàn toàn (nhà xe, tầng hầm). Hỗ trợ Web Manifest Add-to-Home-Screen. |
| **7** | **Central Backend REST Server** | ✅ Hoàn thành (100%) | Máy chủ Node.js Express (cổng 5000 / cổng 80 qua Nginx) độc lập, hỗ trợ CORS, giới hạn Payload 10MB nhận ảnh, xử lý tính chất Idempotency (chống trùng lặp phiếu), cung cấp các API: `POST /api/surveys`, `GET /api/admin/surveys`, `DELETE /api/admin/surveys/:id`, `GET /api/health`. |
| **8** | **Tách biệt Triệt để Client & Server GUI** | ✅ Hoàn thành (100%) | Client thuần túy chỉ có Form Khảo sát và Hàng đợi máy cá nhân. Cổng Quản trị Server là Dashboard độc lập tại `/server-gui` hiển thị thẻ KPI toàn trường, bộ lọc, xem ảnh phóng to, xuất file JSON và xóa dữ liệu máy chủ. |
| **9** | **Triển khai Đám mây AWS EC2 & CI/CD** | ✅ Hoàn thành (100%) | Triển khai trên AWS EC2 (Singapore, IP: `13.250.26.54`), quản lý tiến trình 24/7 bằng PM2, Nginx Reverse Proxy cổng 80. Thiết lập GitHub Actions tự động build và deploy mỗi khi push code lên nhánh `main`. |

---

## 3. TECHNICAL ARCHITECTURE & PROJECT STRUCTURE

### 3.1. Kiến trúc 3 Tầng Phân định Nghiêm ngặt (Strict 3-Layer Architecture)
Hệ thống tuân thủ nguyên tắc phân tách trách nhiệm (Separation of Concerns):
1. **Presentation Layer (Tầng Giao diện - `src/components/`, `server/public/`):**
   - Không thực hiện gọi API trực tiếp hay truy vấn dữ liệu thô.
   - Sử dụng React Hooks quản lý trạng thái, phản hồi thị giác tức thì khi chuyển đổi Online/Offline.
2. **Business Logic Layer (Tầng Nghiệp vụ - `src/services/`):**
   - `network.ts`: Bộ điều phối mạng phản ứng (Reactive Network Manager).
   - `syncService.ts`: Điều phối hàng đợi đồng bộ, thuật toán chống lỗi ngắt quãng và cơ chế lặp an toàn.
   - `camera.ts`: Phân giải môi trường Native Android vs Web Browser để gọi phần cứng thích hợp.
3. **Data Access Layer (Tầng Dữ liệu - `src/services/db.ts`):**
   - Đóng gói toàn bộ thao tác giao dịch với IndexedDB (`draft_store`, `survey_queue`).
   - Đảm bảo tính nhất quán (Atomicity) của dữ liệu khảo sát.

### 3.2. Cấu trúc Thư mục Dự án (Directory Map)
```text
vku-field-survey/
├── .github/workflows/deploy.yml   # CI/CD tự động deploy AWS EC2 khi push main
├── android/                       # Cấu trúc mã nguồn Android Studio (Capacitor Native)
├── capacitor.config.ts            # Cấu hình Capacitor Bridge (appId: com.vku.fieldsurvey)
├── public/manifest.json           # PWA Web Manifest (standalone, theme #0284c7)
├── server/                        # BACKEND SERVER & ADMIN GUI ĐỘC LẬP
│   ├── index.js                   # Node.js Express RESTful Server (ES Module)
│   └── public/index.html          # Central Server GUI Dashboard (phục vụ tại /server-gui)
├── src/                           # CLIENT APP (REACT + TYPESCRIPT + PWA)
│   ├── components/
│   │   ├── FormWizard.tsx         # Bộ điều hướng 3 bước nhập liệu hiện trường
│   │   ├── StepLocation.tsx       # Bước 1: Chọn Tòa nhà, Tầng, Phòng học
│   │   ├── StepCategory.tsx       # Bước 2: Chọn Thiết bị & Đánh giá sao
│   │   ├── StepReviewPhoto.tsx    # Bước 3: Chụp ảnh hiện trường & Ghi chú
│   │   ├── AdminDashboard.tsx     # Quản trị Hàng đợi nội bộ trên máy cá nhân
│   │   └── OfflineQueueModal.tsx  # Hộp thoại chi tiết các phiếu đang chờ đồng bộ
│   ├── hooks/useNetworkStatus.ts  # Hook theo dõi trạng thái mạng thời gian thực
│   ├── services/
│   │   ├── camera.ts              # Hardware Camera Native & Web Fallback
│   │   ├── db.ts                  # Engine IndexedDB CRUD (draft & queue)
│   │   ├── network.ts             # Hybrid Network Listener
│   │   └── syncService.ts         # Thuật toán Background Sync tuần tự
│   ├── types/index.ts             # Chuẩn hóa Data Models & Interfaces
│   ├── App.tsx                    # Điều phối giao diện Client Responsive
│   └── main.tsx                   # Điểm khởi chạy ứng dụng & Đăng ký Service Worker
├── package.json                   # Cấu hình Dependencies & Scripts
├── vite.config.ts                 # Cấu hình Vite & vite-plugin-pwa Workbox
└── README.md                      # Tài liệu tổng quan dự án
```

---

## 4. EMPIRICAL EVIDENCE & SCREENSHOTS

Dự án đã được kiểm thử và xác thực hoạt động thực tế trên cả 3 môi trường: Trình duyệt Máy tính, Thiết bị Di động (Mobile Browser & PWA) và Máy chủ Đám mây AWS EC2.

### 4.1. Minh chứng Giao diện Client Khảo sát Hiện trường (Online & Offline)
- **Truy cập:** `http://13.250.26.54/`
- **Kịch bản Ngoại tuyến:** Ngắt hoàn toàn Wi-Fi/Mạng (hoặc bật chế độ Offline trong DevTools). Ứng dụng hiển thị ngay huy hiệu **`Offline`** màu đỏ. Người dùng vẫn thao tác chuyển 3 bước, chụp ảnh và gửi phiếu bình thường. Phiếu được lưu vào IndexedDB với trạng thái `PENDING_SYNC`.
- **Kịch bản Khôi phục Mạng:** Bật lại kết nối mạng. Hệ thống tự động chuyển sang huy hiệu **`Online`** màu xanh, thanh thông báo kích hoạt đồng bộ ngầm và đẩy toàn bộ phiếu lên máy chủ trung tâm thành công (`SYNCED`).

### 4.2. Minh chứng Cổng Quản trị Máy chủ Độc lập (Central Server GUI)
- **Truy cập:** `http://13.250.26.54/server-gui`
- **Tính năng:**
  - 4 Thẻ KPI: Tổng số phiếu máy chủ tiếp nhận, Tỷ lệ đồng bộ 100%, Số lượng phòng hỏng hóc nặng ($\le$ 2★), Chỉ báo `Server Live`.
  - Bộ lọc tức thì: Lọc theo Tòa nhà (A, B, C, V, KTX) và theo Loại thiết bị (Máy tính, Điều hòa, Máy chiếu...).
  - Bảng dữ liệu có ảnh thumbnail hiện trường, nhấp vào để mở modal phóng to ảnh bằng chứng sắc nét.
  - Hỗ trợ xuất dữ liệu toàn trường sang tệp định dạng JSON và xóa dữ liệu máy chủ.

### 4.3. Minh chứng Triển khai Production & CI/CD
- Ứng dụng chạy liên tục 24/7 trên máy chủ AWS EC2 Ubuntu 24.04 qua **PM2 Process Manager**.
- Nginx đóng vai trò Reverse Proxy nhận cổng 80 chuyển tiếp vào cổng 5000.
- Quy trình CI/CD qua GitHub Actions tự động kéo mã nguồn, build và cập nhật dịch vụ mỗi khi push code lên GitHub.

---

## 5. TECHNICAL CHALLENGES & RESOLUTIONS

### 5.1. Thách thức Giới hạn Bộ nhớ Trình duyệt khi Lưu trữ Ảnh Ngoại tuyến
* **Vấn đề:** Ban đầu sử dụng `localStorage` để lưu phiếu khảo sát kèm ảnh chụp. Khi ảnh hiện trường có độ phân giải cao, kích thước chuỗi Base64 vượt quá giới hạn 5MB của `localStorage`, dẫn đến lỗi nghiêm trọng `QuotaExceededError` làm ứng dụng bị văng khi mất mạng.
* **Giải pháp:** Thay thế toàn bộ bằng cơ sở dữ liệu giao dịch **IndexedDB** thông qua thư viện `idb`. IndexedDB cấp quyền lưu trữ theo dung lượng ổ đĩa khả dụng (hàng trăm MB/GB), kết hợp cấu hình `@capacitor/camera` nén ảnh ở chất lượng `quality: 80` và độ rộng `1280px`. Kết quả: Ứng dụng có thể lưu trữ hàng trăm phiếu khảo sát kèm ảnh mà không hề suy giảm hiệu năng.

### 5.2. Đảm bảo Tính Idempotency khi Đồng bộ Mạng Chập chờn
* **Vấn đề:** Trong môi trường sóng yếu (tầng hầm, nhà xe), client gửi HTTP request lên server thành công nhưng gói tin phản hồi HTTP 200 bị mất (network timeout). Nếu client gửi lại, máy chủ sẽ bị nhân bản trùng lặp nhiều bản ghi của cùng một phòng học.
* **Giải pháp:** Thiết kế mô hình dữ liệu chuẩn với khóa chính `id` là UUID duy nhất sinh ra ngay thời điểm tạo phiếu tại Client. Tại Backend (`server/index.js`), endpoint `POST /api/surveys` kiểm tra ID trước khi ghi: nếu ID đã tồn tại trong bộ nhớ thì cập nhật thông tin (Idempotent Update), nếu chưa có mới thêm mới vào đầu danh sách. Cơ chế này đảm bảo dữ liệu trung tâm luôn chính xác tuyệt đối dù xảy ra retry nhiều lần.

### 5.3. Khả năng Tương thích Đa Môi trường của Phần cứng Camera (Web vs Native)
* **Vấn đề:** Mã nguồn chạy trên cả nền tảng Android Native lẫn trình duyệt Web máy tính/laptop. Plugin `@capacitor/camera` sẽ ném lỗi khi thực thi trên môi trường trình duyệt không có Web Camera phù hợp hoặc thiếu Native Bridge.
* **Giải pháp:** Xây dựng module `src/services/camera.ts` với cơ chế Graceful Fallback: Bọc lời gọi `Camera.getPhoto` trong khối `try-catch`. Khi phát hiện môi trường Web hoặc Native Plugin không khả dụng, hệ thống tự động fallback sang cơ chế HTML5 File Input API (`<input type="file" accept="image/*">`), đọc dữ liệu qua `FileReader.readAsDataURL` trả về chuỗi Base64 đồng nhất.

### 5.4. Vận hành Máy chủ Đám mây & Phục vụ Hợp nhất (Unified SPA & Server GUI)
* **Vấn đề:** Cần phục vụ đồng thời cả ứng dụng Frontend PWA (Single Page Application) và Cổng Server GUI độc lập mà không gây xung đột định tuyến (Routing Conflict).
* **Giải pháp:** Cấu hình Express static route phân tầng: `/server-gui` phục vụ Dashboard máy chủ tĩnh, `/api/*` phục vụ RESTful API, và middleware fallback cuối cùng phục vụ tệp `dist/index.html` của PWA. Kết hợp cấu hình Nginx Reverse Proxy giúp toàn bộ hệ thống hoạt động mượt mà qua một địa chỉ IP duy nhất trên cổng tiêu chuẩn HTTP Port 80.
