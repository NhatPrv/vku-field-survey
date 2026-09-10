# MINI-PROJECT SHORT TECHNICAL REPORT
**Course:** Cross-Platform Mobile App Development (VKU)  
**Instructor:** TS. Nguyễn Thanh Tuấn  
**Mini-Project Title:** Mini-Project #1 — VKU Field Survey: Offline Data Collection (PWA & Capacitor)  
**Student Name:** Đặng Long Nhật — **Class:** 23JIT  
**Submission Date:** 10/09/2026  

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
* **📱 Android APK Package ID:** `com.vku.fieldsurvey`
  * 🌐 Tải trực tiếp từ Máy chủ Cloud: [http://13.250.26.54/download/vku-field-survey.apk](http://13.250.26.54/download/vku-field-survey.apk)
  * 📦 Tải bản phát hành chính thức GitHub Release (v1.0.0): [https://github.com/NhatPrv/vku-field-survey/releases/tag/v1.0.0](https://github.com/NhatPrv/vku-field-survey/releases/tag/v1.0.0)

---

## 2. FEATURE IMPLEMENTATION CHECKLIST

| # | Required Feature | Status | Implementation Details & Acceptance Level |
|:---:|---|:---:|---|
| **1** | **Multi-Device Responsive Shell** | ✅ Hoàn thành (100%) | Giao diện Full-Width Responsive Shell xây dựng bằng Tailwind CSS, hỗ trợ hoàn hảo từ Desktop Monitor (`max-w-7xl`), Tablet/iPad (`md:`) đến Mobile Phone (`sm:`). Hỗ trợ Dark/Light Mode chuẩn thương hiệu VKU (`#0284c7`). |
| **2** | **Multi-Step Survey Wizard** | ✅ Hoàn thành (100%) | Form khảo sát 3 bước trực quan: (1) Vị trí (Tòa nhà, Tầng, Phòng) → (2) Thiết bị & Đánh giá (Máy tính, Máy chiếu, Điều hòa, Điện, Bàn ghế, Đánh giá 1–5 sao) → (3) Bằng chứng ảnh, Tọa độ GPS & Ghi chú sự cố. Tự động lưu nháp thời gian thực (Auto-save draft) sau mỗi 400ms. |
| **3** | **Local Offline Persistence (IndexedDB)** | ✅ Hoàn thành (100%) | Sử dụng thư viện `idb` Promise-based quản trị cơ sở dữ liệu `vku_survey_db` với 2 Object Stores: `draft_store` (bảo toàn tiến trình chưa nộp) và `survey_queue` (hàng đợi ngoại tuyến). Dung lượng lưu trữ không giới hạn, lưu ảnh Base64 mượt mà không làm chậm UI. |
| **4** | **Camera Hardware & Web Fallback** | ✅ Hoàn thành (100%) | Cầu nối Capacitor Native Plugin (`@capacitor/camera`) kích hoạt trực tiếp ứng dụng Camera phần cứng trên thiết bị Android, tự động Fallback về HTML5 File Input API (`FileReader` Base64) khi chạy trên môi trường Web/Desktop. |
| **5** | **GPS Geolocation Integration** | ✅ Hoàn thành (100%) | Tích hợp `@capacitor/geolocation` để tự động lấy tọa độ vĩ độ (Latitude) và kinh độ (Longitude) với độ chính xác cao (`enableHighAccuracy: true`), gắn kèm payload khảo sát và hiển thị liên kết Google Maps trực tiếp. Hỗ trợ fallback `navigator.geolocation` trên trình duyệt. |
| **6** | **Native Push / Local Notifications** | ✅ Hoàn thành (100%) | Tích hợp `@capacitor/local-notifications` kích hoạt thông báo rung chuông trên Android thanh hệ thống ngay khi quá trình đồng bộ nền hoàn tất thành công (`sendSyncSuccessNotification`). Tự động yêu cầu cấp quyền và fallback sang Web Notification API. |
| **7** | **Local Filesystem Storage** | ✅ Hoàn thành (100%) | Tích hợp `@capacitor/filesystem` lưu trữ tệp ảnh hiện trường vào thư mục an toàn của thiết bị (`Directory.Data/vku_surveys/`) trước khi đồng bộ, giải phóng áp lực bộ nhớ RAM và bảo vệ chứng cứ khảo sát. |
| **8** | **Reactive Network & Sequential Sync** | ✅ Hoàn thành (100%) | Lắng nghe mạng lai đa tầng (`@capacitor/network` + sự kiện trình duyệt `online`/`offline`). Khi khôi phục kết nối, hệ thống tự động quét các bản ghi `PENDING_SYNC` và gửi tuần tự lên máy chủ trung tâm, cập nhật trạng thái `SYNCED`. |
| **9** | **PWA Cache-First App Shell** | ✅ Hoàn thành (100%) | Cấu hình Workbox Service Worker (`vite-plugin-pwa`) lưu đệm toàn bộ tài nguyên tĩnh (HTML, CSS, JS, Fonts, Icons). Ứng dụng khởi chạy tức thì và chạy 100% ngoại tuyến khi mất sóng hoàn toàn (nhà xe, tầng hầm). Hỗ trợ Web Manifest Add-to-Home-Screen. |
| **10** | **Central Ingestion Backend Server** | ✅ Hoàn thành (100%) | Máy chủ Node.js Express độc lập (Port 5000 / Port 80 qua Nginx), hỗ trợ CORS, giới hạn Payload 15MB nhận ảnh Base64, xử lý tính chất Idempotency (chống trùng lặp phiếu), cung cấp các API: `POST /api/surveys`, `GET /api/admin/surveys`, `DELETE /api/admin/surveys/:id`, `GET /api/health`, `GET /api/admin/events` (SSE). |
| **11** | **Desktop-First Server Admin Portal** | ✅ Hoàn thành (100%) | Tích hợp giao diện quản trị trung tâm `ServerAdminPage.tsx` chuyển đổi tức thì từ Client: 4 Thẻ KPI phân tích, thanh công cụ tìm kiếm và lọc đa tiêu chí (Tòa nhà, Danh mục, Mức độ sao), bảng dữ liệu trung tâm kèm tọa độ GPS Google Maps, modal ảnh phóng to, tính năng xuất dữ liệu CSV / JSON và cơ chế cập nhật tự động 10s kết hợp SSE. |
| **12** | **Triển khai Đám mây AWS EC2 & CI/CD** | ✅ Hoàn thành (100%) | Triển khai trên AWS EC2 (Singapore, IP: `13.250.26.54`), quản lý tiến trình 24/7 bằng PM2, Nginx Reverse Proxy cổng 80. Thiết lập GitHub Actions tự động build và deploy mỗi khi push code lên nhánh `main`. |

---

## 3. TECHNICAL ARCHITECTURE & PROJECT STRUCTURE

### 3.1. Kiến trúc 3 Tầng Phân định Nghiêm ngặt (Strict 3-Layer Architecture)
Hệ thống tuân thủ nguyên tắc phân tách trách nhiệm (Separation of Concerns):
1. **Presentation Layer (Tầng Giao diện - `src/components/`, `src/pages/`, `server/public/`):**
   - Không can thiệp logic dữ liệu cấp thấp hay truy vấn thô.
   - `FormWizard.tsx`, `StepLocation.tsx`, `StepCategory.tsx`, `StepReviewPhoto.tsx`: Bộ điều hướng nhập liệu di động.
   - `AdminDashboard.tsx`, `OfflineQueueModal.tsx`: Xem và quản lý hàng đợi offline cục bộ trên máy người dùng.
   - `ServerAdminPage.tsx`: Cổng quản trị tập trung Desktop-first kết nối trực tiếp RESTful API máy chủ trung tâm.
2. **Business Logic Layer (Tầng Nghiệp vụ - `src/hooks/`, `src/services/`):**
   - `useNetworkStatus.ts`: Hook theo dõi trạng thái mạng phản ứng kết hợp `@capacitor/network`.
   - `syncService.ts`: Điều phối hàng đợi đồng bộ, thuật toán chống lỗi ngắt quãng và cơ chế lặp an toàn.
   - `geolocation.ts`: Xử lý lấy tọa độ GPS từ phần cứng thiết bị và fallback trình duyệt.
   - `notifications.ts`: Quản lý thông báo đẩy/thông báo cục bộ bản địa khi hoàn thành đồng bộ.
   - `storage.ts`: Điều phối lưu trữ tệp tin ảnh vào bộ nhớ thiết bị qua Filesystem API.
   - `camera.ts`: Phân giải môi trường Native Android vs Web Browser để gọi phần cứng camera phù hợp.
3. **Data Access Layer (Tầng Dữ liệu - `src/services/db.ts`):**
   - Đóng gói toàn bộ thao tác giao dịch với IndexedDB (`draft_store`, `survey_queue`).
   - Đảm bảo tính nhất quán (Atomicity) của dữ liệu khảo sát.

### 3.2. Cấu trúc Thư mục Dự án (Directory Map)
```text
vku-field-survey/
├── .github/workflows/deploy.yml   # CI/CD tự động deploy AWS EC2 khi push main
├── android/                       # Cấu trúc mã nguồn Android Studio (Capacitor Native)
│   └── app/src/main/
│       ├── AndroidManifest.xml    # Cấp quyền Camera, Geolocation, Filesystem, Notifications
│       └── res/xml/network_security_config.xml # Cho phép truyền thông tin mạng nội bộ cleartext
├── capacitor.config.ts            # Cấu hình Capacitor Bridge (appId: com.vku.fieldsurvey)
├── public/manifest.json           # PWA Web Manifest (standalone, theme #0284c7)
├── server/                        # BACKEND SERVER & ADMIN GUI ĐỘC LẬP
│   ├── index.js                   # Node.js Express RESTful Server (ES Module, Port 5000, 15MB limit)
│   ├── downloads/                 # Thư mục lưu trữ file APK phục vụ tải trực tiếp
│   └── public/index.html          # Central Server GUI Dashboard (phục vụ tại /server-gui)
├── src/                           # CLIENT APP (REACT + TYPESCRIPT + PWA)
│   ├── components/
│   │   ├── FormWizard.tsx         # Bộ điều hướng 3 bước nhập liệu hiện trường
│   │   ├── StepLocation.tsx       # Bước 1: Chọn Tòa nhà, Tầng, Phòng học
│   │   ├── StepCategory.tsx       # Bước 2: Chọn Thiết bị & Đánh giá sao
│   │   ├── StepReviewPhoto.tsx    # Bước 3: Chụp ảnh hiện trường, tọa độ GPS & Ghi chú
│   │   ├── AdminDashboard.tsx     # Quản trị Hàng đợi nội bộ trên máy cá nhân
│   │   └── OfflineQueueModal.tsx  # Hộp thoại chi tiết các phiếu đang chờ đồng bộ
│   ├── pages/
│   │   └── ServerAdminPage.tsx    # Desktop-first Admin Portal tập trung cho Quản trị viên
│   ├── hooks/useNetworkStatus.ts  # Hook theo dõi trạng thái mạng thời gian thực
│   ├── services/
│   │   ├── camera.ts              # Hardware Camera Native & Web Fallback
│   │   ├── geolocation.ts         # Capacitor Geolocation GPS & Fallback
│   │   ├── notifications.ts       # Capacitor Local Notifications cảnh báo đồng bộ
│   │   ├── storage.ts             # Capacitor Filesystem lưu trữ ảnh bản địa
│   │   ├── db.ts                  # Engine IndexedDB CRUD (draft_store & survey_queue)
│   │   ├── network.ts             # Hybrid Network Listener
│   │   └── syncService.ts         # Thuật toán Background Sync tuần tự
│   ├── types/index.ts             # Chuẩn hóa Data Models & Interfaces
│   ├── App.tsx                    # Điều phối giao diện Client & Chuyển đổi Server Admin Portal
│   └── main.tsx                   # Điểm khởi chạy ứng dụng & Đăng ký Service Worker
├── package.json                   # Cấu hình Dependencies & Scripts
├── vite.config.ts                 # Cấu hình Vite & vite-plugin-pwa Workbox
└── README.md                      # Tài liệu tổng quan dự án
```

---

## 4. EMPIRICAL EVIDENCE & SCREENSHOTS

Dự án đã được kiểm thử và xác thực hoạt động thực tế trên cả 3 môi trường: Trình duyệt Máy tính, Thiết bị Di động (Mobile Browser & PWA) và Ứng dụng Android Native trên điện thoại Vsmart Joy 3.

### 4.1. Minh chứng Giao diện Client Khảo sát Hiện trường (Online & Offline)
- **Truy cập:** `http://13.250.26.54/`
- **Kịch bản Ngoại tuyến:** Ngắt hoàn toàn Wi-Fi/Mạng (hoặc bật chế độ Offline trong DevTools). Ứng dụng hiển thị ngay huy hiệu **`Offline`** màu cam/đỏ. Người dùng vẫn thao tác chuyển 3 bước, chụp ảnh bằng chứng, ghi nhận tọa độ GPS và gửi phiếu bình thường. Phiếu được lưu an toàn vào IndexedDB với trạng thái `PENDING_SYNC`.
- **Kịch bản Khôi phục Mạng:** Bật lại kết nối mạng. Hệ thống tự động chuyển sang huy hiệu **`Online`** màu xanh, thanh thông báo kích hoạt đồng bộ ngầm và đẩy toàn bộ phiếu lên máy chủ trung tâm thành công (`SYNCED`), kích hoạt Native Notification rung chuông trên thiết bị.

### 4.2. Minh chứng Cổng Quản trị Server Độc lập & Tích hợp (Server Admin Portal)
- **Truy cập:** `http://13.250.26.54/server-gui` hoặc bấm nút chuyển đổi "Quản trị Server" trên thanh điều hướng Client.
- **Tính năng vượt trội:**
  - 4 Thẻ KPI: Tổng số phiếu máy chủ tiếp nhận, Tỷ lệ phòng hỏng hóc nặng ($\le$ 2★), Tỷ lệ thiết bị tốt ($\ge$ 4★), Trạng thái máy chủ trực tuyến `Server Live`.
  - Thanh công cụ tìm kiếm và lọc đa tiêu chí: Lọc theo Tòa nhà (A, B, C, V, KTX), theo Loại danh mục thiết bị (Máy tính, Máy chiếu, Điều hòa, Điện, CSVC) và theo Mức độ nghiêm trọng sao (Khẩn cấp $\le$ 2★, Trung bình 3★, Tốt $\ge$ 4★).
  - Cột Tọa độ GPS gắn liên kết mở trực tiếp vị trí khảo sát trên Google Maps.
  - Bảng dữ liệu có ảnh thumbnail hiện trường sắc nét, nhấp vào để mở modal phóng to ảnh bằng chứng.
  - Hỗ trợ xuất dữ liệu toàn trường sang 2 định dạng phổ biến: **CSV** (tương thích Microsoft Excel) và **JSON** cho phân tích dữ liệu.
  - Tự động làm mới dữ liệu sau mỗi 10 giây kết hợp Server-Sent Events (SSE) cập nhật tức thời khi có phiếu mới nộp lên.

### 4.3. Minh chứng Triển khai Production & CI/CD
- Ứng dụng chạy liên tục 24/7 trên máy chủ AWS EC2 Ubuntu 24.04 qua **PM2 Process Manager**.
- Nginx đóng vai trò Reverse Proxy nhận cổng 80 chuyển tiếp vào cổng 5000.
- Quy trình CI/CD qua GitHub Actions tự động kéo mã nguồn, build và cập nhật dịch vụ mỗi khi push code lên GitHub.
- Cung cấp đường dẫn tải trực tiếp file APK Android đã build sẵn: `/download/vku-field-survey.apk`.

---

## 5. TECHNICAL CHALLENGES & RESOLUTIONS

### 5.1. Thách thức Lỗi Mixed Content và Chặn Mạng Android WebView
* **Vấn đề:** Khi ứng dụng chạy trên Android Native với cấu hình `androidScheme: 'https'`, Chromium WebView bảo mật nghiêm ngặt chặn toàn bộ các yêu cầu HTTP gọi về máy chủ EC2 (`http://13.250.26.54/api/surveys`) với lỗi `Mixed Content: The page at 'https://localhost/' was loaded over HTTPS, but requested an insecure XMLHttpRequest endpoint...`.
* **Giải pháp:** Thiết lập cấu hình đồng bộ trong `capacitor.config.ts` với `androidScheme: 'http'` và `server: { cleartext: true }`. Đồng thời tạo tệp `android/app/src/main/res/xml/network_security_config.xml` khai báo cho phép lưu lượng cleartext traffic đối với địa chỉ IP máy chủ và kích hoạt `android:networkSecurityConfig` trong `AndroidManifest.xml`.

### 5.2. Thách thức Service Worker Cũ Lưu Cache Đè trên Android Native
* **Vấn đề:** Khi PWA Service Worker đăng ký trong môi trường Android WebView của Capacitor, Service Worker ghi đệm (cache) vĩnh viễn các file bundle JS cũ, khiến cho dù ứng dụng Android có build lại phiên bản mới thì mã JavaScript thực thi trên điện thoại vẫn là phiên bản cũ.
* **Giải pháp:** Trong `src/main.tsx`, bổ sung bộ lọc kiểm tra nền tảng `Capacitor.isNativePlatform()`. Nếu đang chạy trên Android Native, hệ thống chủ động hủy đăng ký toàn bộ Service Worker (`navigator.serviceWorker.getRegistrations()`) và xóa sạch Cache Storage (`caches.keys()`), chỉ cho phép kích hoạt PWA Cache-First Service Worker khi chạy trên trình duyệt Web thực thụ.

### 5.3. Thách thức Đảm bảo Tính Idempotency khi Đồng bộ Mạng Chập chờn
* **Vấn đề:** Trong môi trường sóng yếu (tầng hầm, nhà xe), client gửi HTTP request lên server thành công nhưng gói tin phản hồi HTTP 200 bị timeout. Nếu client kích hoạt đồng bộ lại, máy chủ sẽ bị nhân bản trùng lặp nhiều bản ghi của cùng một sự cố.
* **Giải pháp:** Thiết kế mô hình dữ liệu chuẩn với khóa chính `id` là UUID duy nhất sinh ra ngay thời điểm tạo phiếu tại Client. Tại Backend (`server/index.js`), endpoint `POST /api/surveys` kiểm tra ID trước khi ghi: nếu ID đã tồn tại trong bộ nhớ thì cập nhật thông tin (Idempotent Update), nếu chưa có mới thêm mới vào đầu danh sách. Cơ chế này đảm bảo tính toàn vẹn dữ liệu tuyệt đối dù xảy ra retry nhiều lần.

### 5.4. Thách thức Giới hạn Bộ nhớ Trình duyệt và Quản lý Tệp Bản địa
* **Vấn đề:** Lưu trữ ảnh Base64 kích thước lớn trong `localStorage` gây lỗi `QuotaExceededError` (giới hạn 5MB). Khi nộp nhiều ảnh trên thiết bị di động, việc giữ quá nhiều chuỗi Base64 trong RAM có thể gây tràn bộ nhớ WebView.
* **Giải pháp:** Tích hợp 2 giải pháp song song: Trên Web, sử dụng **IndexedDB** qua `idb` có dung lượng lưu trữ tính bằng gigabyte; trên Android Native, sử dụng `@capacitor/filesystem` để lưu ảnh nhị phân trực tiếp vào ổ cứng thiết bị (`Directory.Data/vku_surveys/`) và chỉ giữ đường dẫn tham chiếu an toàn, kết hợp nén ảnh ở chất lượng 80% và độ rộng tối ưu 1280px từ `@capacitor/camera`.
