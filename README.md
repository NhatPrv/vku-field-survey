# VKU Field Survey — Offline Data Collection (PWA & Capacitor)

> **Học phần:** Lập trình Đa Nền tảng (Cross-Platform Mobile App Development)  
> **Khoa:** Công nghệ Thông tin & Truyền thông — Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn (VKU)  
> **Đồ án:** Mini-Project #1 (Tuần 3 – Tuần 4) — Trọng số điểm: **10%**  
> **Giảng viên hướng dẫn:** TS. Nguyễn Thanh Tuấn  
> **Repository chính thức:** [https://github.com/NhatPrv/vku-field-survey](https://github.com/NhatPrv/vku-field-survey)

---

## 1. Bối cảnh & Mục tiêu Đề tài (Problem Scenario)

Tại Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn (VKU), công tác kiểm định và thanh tra cơ sở vật chất (phòng học lý thuyết, giảng đường, phòng thực hành máy tính, hệ thống điều hòa, máy chiếu, thiết bị điện, bàn ghế) thường xuyên phải thực hiện tại các khu vực **mất sóng hoàn toàn** (như tầng hầm các khu nhà, hội trường kín, hoặc các dãy phòng nằm ngoài vùng phủ sóng Wi-Fi/4G/5G).

Ứng dụng **VKU Field Survey** được phát triển theo triết lý **Offline-First**, đảm bảo:
- Hoạt động ổn định 100% khi không có kết nối mạng internet.
- Tuyệt đối không làm gián đoạn trải nghiệm hoặc mất dữ liệu biểu mẫu của thanh tra viên/sinh viên kiểm định.
- Tự động lưu bản nháp theo thời gian thực (Auto-save draft) vào cơ sở dữ liệu nội bộ thiết bị.
- Đóng gói dữ liệu khảo sát vào hàng đợi ngoại tuyến (`PENDING_SYNC`) và tự động đồng bộ (Background/Online Sync) lên máy chủ ngay khi thiết bị tái lập kết nối mạng.

---

## 2. Bảng Tính năng Cốt lõi (Core Features Checklist)

- [x] **PWA Standalone:** Khai báo tệp `manifest.webmanifest` với `display: "standalone"`, màu chủ đạo `theme_color: "#0284c7"`, tích hợp icon tiêu chuẩn `192x192` và `512x512`.
- [x] **Service Worker Cache-First:** Lưu trữ tĩnh toàn bộ App Shell (HTML, CSS, JavaScript, Web Fonts, SVG Icons), đảm bảo ứng dụng tải tức thì (< 1 giây) khi hoàn toàn mất mạng.
- [x] **Multi-step Inspection Form:** Biểu mẫu phân tầng trực quan tối ưu cho thiết bị di động:
  - *Bước 1:* Vị trí kiểm tra (Tòa nhà: Nhà K, Nhà V, Khu KTX, Thư viện; Tầng: B1, 1, 2, 3...; Số phòng).
  - *Bước 2:* Phân loại thiết bị & Đánh giá (Category: Hardware, Projector, AC, Electrical, Furniture; Star Rating 1–5 sao; Trạng thái hoạt động).
  - *Bước 3:* Chi tiết lỗi & Minh chứng hình ảnh (Mô tả hư hỏng; Chụp ảnh hiện trường thực tế).
  - *Bước 4:* Xác nhận dữ liệu & Gửi khảo sát.
- [x] **Real-time Draft Persistence (IndexedDB qua `idb`):** Lưu trữ tự động từng thao tác nhập liệu của người dùng vào IndexedDB, bảo toàn bản nháp kể cả khi vô tình reload trang hoặc tắt ứng dụng đột ngột.
- [x] **Offline Sync Queue Orchestrator:**
  - Tạo bản ghi khảo sát với mã định danh duy nhất `UUID`, mốc thời gian `timestamp`, trạng thái ban đầu `PENDING_SYNC`.
  - Tự động lắng nghe sự kiện mạng qua `window.addEventListener('online')` và `@capacitor/network`.
  - Tuần tự gửi các bản ghi đang chờ lên REST API endpoint, đánh dấu `SYNCED` khi thành công hoặc cập nhật thử lại nếu thất bại.
- [x] **Native Android Integration (Capacitor Bridge):**
  - Tích hợp plugin `@capacitor/camera` hỗ trợ chụp ảnh hiện trường trực tiếp từ phần cứng camera điện thoại.
  - Tích hợp plugin `@capacitor/network` theo dõi chính xác trạng thái kết nối mạng trên hệ điều hành Android.
  - Sẵn sàng đồng bộ và đóng gói ra file cài đặt `app-debug.apk` qua Android Studio.

---

## 3. Kiến trúc Phân tầng (3-Layer Architecture)

Dự án áp dụng chặt chẽ mô hình phân tách 3 tầng độc lập, đảm bảo khả năng bảo trì, mở rộng và kiểm thử:

```
vku-field-survey/
├── android/                   # Native Android Project (Capacitor Bridge)
├── public/
│   ├── icons/                 # PWA Icons (192x192, 512x512)
│   ├── manifest.webmanifest   # Cấu hình PWA Web App Manifest
│   └── sw.js                  # Service Worker chiến lược Cache-First cho App Shell
├── src/
│   ├── components/            # 1. PRESENTATION LAYER
│   │   ├── CameraCapture.tsx  # Giao diện chụp ảnh (Capacitor Camera + Fallback)
│   │   ├── Navbar.tsx         # Thanh tiêu đề, chuyển Dark/Light mode
│   │   ├── NetworkStatusBadge.tsx # Huy hiệu báo trạng thái Online/Offline theo thời gian thực
│   │   ├── SurveyForm.tsx     # Biểu mẫu khảo sát nhiều bước (Multi-step Form)
│   │   └── SurveyList.tsx     # Danh sách & trình theo dõi hàng đợi đồng bộ (Sync Queue)
│   ├── hooks/                 # 2. BUSINESS LOGIC LAYER
│   │   ├── useDraftSurvey.ts  # Tự động lưu và khôi phục nháp biểu mẫu
│   │   └── useNetworkStatus.ts# Hook đồng bộ trạng thái mạng giữa Web và Capacitor Native
│   ├── services/              # 2. BUSINESS LOGIC & SYNC ORCHESTRATION
│   │   ├── cameraService.ts   # Xử lý phần cứng camera và tối ưu kích thước ảnh
│   │   └── syncService.ts     # Điều phối hàng đợi, retry gửi API khi phục hồi mạng
│   ├── types/                 # Type Definitions (TypeScript Strict)
│   │   └── survey.ts          # Định nghĩa kiểu dữ liệu SurveyItem, DraftData, SyncStatus
│   ├── services/db.ts         # 3. DATA LAYER (IndexedDB Engine)
│   │                          # Quản trị Database Schema ('surveys', 'drafts' qua idb)
│   ├── App.tsx                # Container chính điều phối giao diện
│   ├── index.css              # Design System CSS, Theme Variables (#0284c7)
│   └── main.tsx               # Khởi tạo React 19 & Đăng ký Service Worker PWA
├── capacitor.config.ts        # Cấu hình định danh Capacitor (App ID, WebDir)
├── package.json
└── vite.config.ts
```

### Chi tiết 3 tầng kiến trúc:
1. **Presentation Layer (Tầng Giao diện):** Tiếp nhận tương tác người dùng, hiển thị các bước form trực quan, thông báo trạng thái đồng bộ, hỗ trợ Dark/Light Theme với màu chủ đạo `#0284c7`.
2. **Business Logic Layer (Tầng Nghiệp vụ):** Giám sát trạng thái mạng, kiểm định tính hợp lệ của dữ liệu (validation), tự động kích hoạt tiến trình đồng bộ dữ liệu chạy ngầm khi có mạng internet.
3. **Data Layer (Tầng Dữ liệu Ngoại tuyến):** Làm việc trực tiếp với IndexedDB của trình duyệt/WebView thông qua wrapper `idb`, quản trị lưu trữ cục bộ cho bản nháp (`drafts`) và hàng đợi gửi tin (`surveys`).

---

## 4. Bảng Công nghệ Sử dụng (Tech Stack)

| Thành phần | Công nghệ / Thư viện | Vai trò & Mục đích |
| :--- | :--- | :--- |
| **Core Framework** | React 19 + TypeScript | Xây dựng giao diện người dùng theo component hóa, kiểm soát kiểu dữ liệu nghiêm ngặt. |
| **Build Tool** | Vite | Tối ưu hóa quá trình biên dịch, Hot Module Replacement (HMR) cực nhanh. |
| **Styling** | Modern CSS Mobile-First | Tùy biến biến màu thương hiệu VKU (`#0284c7`), tối ưu giao diện điện thoại, Dark/Light Mode. |
| **Client Storage** | `idb` (IndexedDB Wrapper) | Lưu trữ NoSQL ngoại tuyến dung lượng lớn (dữ liệu khảo sát, hình ảnh Base64/Blob, bản nháp). |
| **PWA Engine** | Service Worker + Manifest | Cung cấp khả năng chạy độc lập (Standalone), cài đặt lên màn hình chính và Cache-First App Shell. |
| **Native Bridge** | Capacitor Core & CLI | Cầu nối đa nền tảng đóng gói Web App thành ứng dụng Android thuần. |
| **Native Hardware**| `@capacitor/camera` | Kích hoạt phần cứng Camera của điện thoại để ghi lại bằng chứng hư hỏng. |
| **Network Monitor**| `@capacitor/network` | Lắng nghe chính xác sự thay đổi trạng thái mạng trên cả Android Native và Web. |

---

## 5. Hướng dẫn Cài đặt & Chạy Dự án (Step-by-step Setup)

### Yêu cầu môi trường:
- Node.js version 18.x hoặc 20.x trở lên.
- Android Studio (kèm Android SDK API 33+) nếu muốn build APK.

### Bước 1: Clone mã nguồn & Cài đặt dependencies
```bash
git clone https://github.com/NhatPrv/vku-field-survey.git
cd vku-field-survey
npm install
```

### Bước 2: Chạy môi trường phát triển (Development Server)
```bash
npm run dev
```
Mở trình duyệt truy cập: `http://localhost:5173` để thao tác với ứng dụng.

### Bước 3: Build phiên bản Production & Kiểm thử PWA
```bash
npm run build
npm run preview
```
- Mở **Chrome DevTools** (`F12`) -> Thẻ **Application** -> Kiểm tra **Manifest** và **Service Workers**.
- Chọn tab **Network** -> Chuyển sang chế độ **Offline** để kiểm tra tính năng nạp ứng dụng và nhập liệu ngoại tuyến.

### Bước 4: Đồng bộ mã nguồn sang Native Android
```bash
# Tạo bản build tĩnh mới nhất
npm run build

# Đồng bộ tài nguyên Web và plugin vào thư mục Android
npx cap sync android
```

### Bước 5: Mở Android Studio và Xuất file APK
```bash
# Mở project Android trong Android Studio
npx cap open android
```
- Trong Android Studio:
  1. Đợi Gradle hoàn tất quá trình sync.
  2. Chọn thiết bị giả lập (Android Emulator) hoặc cắm điện thoại Android bật tính năng *USB Debugging*.
  3. Nhấn nút **Run** (biểu tượng tam giác xanh) để chạy trực tiếp trên máy.
  4. Để xuất file cài đặt: Vào menu **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**. File kết quả sẽ nằm tại `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 6. Bộ Sản phẩm Nộp bài (Deliverables)

Dự án Mini-Project #1 được nghiệm thu với đầy đủ 3 thành phần theo quy định:

1. **Live PWA Demo URL:** [https://vku-field-survey.pages.dev](https://vku-field-survey.pages.dev) (Triển khai trên nền tảng Cloudflare Pages hỗ trợ HTTPS bắt buộc cho Service Worker).
2. **GitHub Repository:** [https://github.com/NhatPrv/vku-field-survey](https://github.com/NhatPrv/vku-field-survey) (Đầy đủ mã nguồn, lịch sử commit chuẩn mực theo Conventional Commits).
3. **Báo cáo Kỹ thuật (Technical Report PDF):** Soạn thảo đầy đủ từ tệp mẫu [docs/REPORT_TEMPLATE.md](file:///c:/mydata/Semester6/LapTrinhDaNenTang/vku-field-survey/docs/REPORT_TEMPLATE.md) kèm ảnh minh chứng thực tế trên thiết bị di động/máy ảo Android.
