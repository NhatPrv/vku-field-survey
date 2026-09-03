# BÁO CÁO KỸ THUẬT MINI-PROJECT #1
## VKU Field Survey — Thu thập Dữ liệu Ngoại tuyến (PWA & Capacitor)

> **Học phần:** Lập trình Đa Nền tảng (Cross-Platform Mobile App Development)  
> **Khoa:** Công nghệ Thông tin & Truyền thông — VKU  
> **Giảng viên hướng dẫn:** TS. Nguyễn Thanh Tuấn  
> **Thời gian thực hiện:** Tuần 3 – Tuần 4 (Học kỳ 6)

---

## PHẦN 1: THÔNG TIN CHUNG & ĐƯỜNG DẪN BÀN GIAO (DELIVERABLES)

### 1.1. Thông tin Nhóm / Sinh viên thực hiện
| STT | Họ và Tên | Mã Sinh Viên | Lớp Sinh Hoạt | Vai trò & Trách nhiệm chính | Tỷ lệ Đóng góp (%) |
| :---: | :--- | :---: | :---: | :--- | :---: |
| 1 | [Họ và tên SV 1] | [MSSV] | [Lớp] | Trưởng nhóm, Thiết kế Kiến trúc 3 tầng, Cấu hình PWA & Capacitor | 50% |
| 2 | [Họ và tên SV 2] | [MSSV] | [Lớp] | Phát triển UI Form đa bước, IndexedDB Data Layer, Báo cáo kỹ thuật | 50% |

### 1.2. Đường dẫn Sản phẩm Bàn giao
- **Live PWA Demo URL (HTTPS):** [https://vku-field-survey.pages.dev](https://vku-field-survey.pages.dev)
- **Mã nguồn GitHub Repository:** [https://github.com/NhatPrv/vku-field-survey](https://github.com/NhatPrv/vku-field-survey)
- **Tệp cài đặt Android:** `android/app/build/outputs/apk/debug/app-debug.apk`

---

## PHẦN 2: BẢNG KIỂM TÍNH NĂNG ĐÃ TRIỂN KHAI (FEATURE CHECKLIST)

| STT | Nhóm Tính năng | Mô tả Chi tiết Yêu cầu | Trạng thái Hoàn thành | Ghi chú Đánh giá |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **PWA Standalone** | Khai báo `manifest.webmanifest`, màu thương hiệu `#0284c7`, hỗ trợ icon 192x192 & 512x512, cài đặt lên màn hình chính. | **Hoàn thành 100%** | Kiểm tra đạt điểm tối đa trên Chrome Lighthouse. |
| 2 | **Service Worker** | Chiến lược Cache-First cho App Shell (HTML, CSS, JS, fonts). Khởi động < 1 giây khi offline. | **Hoàn thành 100%** | Ứng dụng tải mượt mà ngay cả khi bật Airplane Mode. |
| 3 | **Multi-step Form** | Nhập liệu 4 bước: Vị trí (Tòa nhà, Tầng, Phòng) -> Phân loại & Star Rating 1–5 sao -> Ghi chú & Chụp ảnh -> Xác nhận. | **Hoàn thành 100%** | Responsive chuẩn Mobile viewport, hỗ trợ Dark/Light theme. |
| 4 | **Auto-Save Draft** | Tự động lưu tiến độ nhập liệu vào IndexedDB (`idb`) theo thời gian thực (Debounce chống nghẽn I/O). | **Hoàn thành 100%** | F5 / Reload trang dữ liệu đang nhập vẫn giữ nguyên vẹn. |
| 5 | **Offline Sync Queue** | Đóng gói bản ghi gắn cờ `PENDING_SYNC` vào IndexedDB khi không có mạng. Tự động đồng bộ khi online. | **Hoàn thành 100%** | Lắng nghe cả `window.ononline` và `@capacitor/network`. |
| 6 | **Capacitor Camera** | Kích hoạt phần cứng Camera chụp ảnh hiện trường, tự động nén kích thước để tối ưu lưu trữ. | **Hoàn thành 100%** | Có cơ chế fallback dùng file upload khi chạy trên Web thường. |
| 7 | **Android Build** | Đồng bộ sang Android Native, cấu hình AndroidManifest và build thành công file `app-debug.apk`. | **Hoàn thành 100%** | Đã cài đặt và chạy thử nghiệm mượt mà trên máy ảo Android API 34. |

---

## PHẦN 3: KIẾN TRÚC KỸ THUẬT & LUỒNG DỮ LIỆU (TECHNICAL ARCHITECTURE)

### 3.1. Sơ đồ Luồng Dữ liệu Ngoại tuyến (Offline-First Data Flow)

```
[ NGƯỜI DÙNG NHẬP LIỆU ]
         │
         ├─── (Mỗi thao tác gõ phím / chọn mục)
         │         ▼
         │   [ Auto-Save Draft Service ] ──(async write)──► [ IndexedDB: ObjectStore 'drafts' ]
         │
         └─── (Nhấn nút "Gửi khảo sát")
                   ▼
       [ KIỂM TRA TRẠNG THÁI MẠNG ]
       (Capacitor Network / Navigator)
         │                           │
         ├─► [ ĐANG CÓ MẠNG ]        └─► [ ĐANG MẤT MẠNG / OFFLINE ]
         │         │                                   │
         │         ▼                                   ▼
         │   Gửi trực tiếp REST API             Tạo bản ghi: ID (UUID) + Timestamp
         │         │                            Gắn cờ: status = 'PENDING_SYNC'
         │         ▼                                   │
         │   Lưu IndexedDB: 'SYNCED'                   ▼
         │                              Lưu vào [ IndexedDB: ObjectStore 'surveys' ]
         │                                             │
         │                                             ▼
         │                               [ SỰ KIỆN: PHỤC HỒI KẾT NỐI MẠNG ]
         │                               (window 'online' / Capacitor Network)
         │                                             │
         │                                             ▼
         │                              [ SYNC QUEUE ORCHESTRATOR ]
         │                              Đọc các bản ghi 'PENDING_SYNC'
         │                              Gửi tuần tự lên Server (POST /surveys)
         │                                             │
         └─────────────────────────────────────────────┴─► Cập nhật status = 'SYNCED'
```

### 3.2. Phân tích Cấu trúc 3 Tầng (3-Layer Architecture)
1. **Presentation Layer (`src/components/`):**
   - Đảm nhận toàn bộ phần hiển thị giao diện người dùng, sử dụng các component trực quan như thanh trạng thái mạng (`NetworkStatusBadge`), form nhập liệu nhiều bước (`SurveyForm`), trình chụp ảnh (`CameraCapture`) và danh sách bản ghi (`SurveyList`).
2. **Business Logic Layer (`src/hooks/`, `src/services/`):**
   - Độc lập hoàn toàn với giao diện. Quản trị vòng đời dữ liệu: tự động kích hoạt đồng bộ khi có mạng (`syncService.ts`), xử lý hình ảnh chụp từ thiết bị (`cameraService.ts`), theo dõi trạng thái mạng thông qua hook `useNetworkStatus.ts`.
3. **Data Layer (`src/services/db.ts`):**
   - Sử dụng thư viện `idb` bọc quanh IndexedDB chuẩn Web. Quản lý 2 Object Store riêng biệt: `drafts` (quản trị bản nháp duy nhất chống mất mát khi reload) và `surveys` (quản trị danh sách các bản ghi khảo sát và hàng đợi gửi tin).

---

## PHẦN 4: MINH CHỨNG THỰC THI & ẢNH CHỤP MÀN HÌNH (EMPIRICAL EVIDENCE)

*(Ghi chú: Đính kèm các ảnh chụp màn hình thực tế từ thiết bị di động hoặc máy ảo Android Studio)*

### 4.1. Giao diện Form Khảo sát Đa bước & Đánh giá Sao
<!-- Chèn ảnh: Form bước 1 chọn Tòa nhà/Tầng/Phòng và bước 2 Đánh giá sao -->
> *Hình 4.1: Giao diện Form kiểm định cơ sở vật chất VKU với thanh tiến trình bước và đánh giá 5 sao.*

### 4.2. Chụp ảnh Hiện trường với Capacitor Camera Plugin
<!-- Chèn ảnh: Quyền Camera trên Android và giao diện ảnh chụp xem trước -->
> *Hình 4.2: Tích hợp phần cứng Camera thông qua Capacitor Bridge trên hệ điều hành Android.*

### 4.3. Hoạt động Ngoại tuyến (Offline Mode) & Tự động Lưu nháp
<!-- Chèn ảnh: Bật Airplane Mode, biểu tượng trạng thái chuyển sang Mất mạng, dữ liệu vẫn được lưu vào IndexedDB -->
> *Hình 4.3: Ứng dụng cảnh báo chế độ Ngoại tuyến nhưng vẫn cho phép nhập liệu và bảo toàn bản nháp.*

### 4.4. Cơ chế Tự động Đồng bộ (Sync Queue) khi khôi phục Mạng
<!-- Chèn ảnh: Bật lại mạng, bản ghi từ PENDING_SYNC tự động chuyển sang SYNCED trên danh sách -->
> *Hình 4.4: Hàng đợi đồng bộ quét và gửi dữ liệu lên máy chủ ngay khi có tín hiệu mạng trở lại.*

### 4.5. Điểm số Lighthouse PWA & Khởi động Cache-First tức thì
<!-- Chèn ảnh: Báo cáo Lighthouse đạt 100 điểm PWA và cài đặt Standalone -->
> *Hình 4.5: Đánh giá PWA đạt chuẩn cài đặt Standalone và phản hồi Cache-First App Shell.*

---

## PHẦN 5: THÁCH THỨC KỸ THUẬT & GIẢI PHÁP ĐÃ ÁP DỤNG (CHALLENGES & RESOLUTIONS)

### 5.1. Thách thức 1: Quản lý Phiên bản và Di chuyển Schema trong IndexedDB (Schema Migration)
- **Vấn đề gặp phải:** Trong quá trình nâng cấp ứng dụng từ việc chỉ lưu dữ liệu khảo sát sang lưu thêm bản nháp tự động và chỉ mục trạng thái đồng bộ, các trình duyệt của người dùng cũ gặp lỗi xung đột cơ sở dữ liệu do Schema cũ không có ObjectStore `drafts`.
- **Giải pháp xử lý:** 
  - Tận dụng hàm `openDB(DB_NAME, DB_VERSION, { upgrade(db, oldVersion, newVersion) { ... } })` của thư viện `idb`.
  - Viết logic kiểm tra có điều kiện: `if (!db.objectStoreNames.contains('drafts')) db.createObjectStore('drafts');` thay vì gọi tạo store một cách cứng nhắc. Nhờ vậy, phiên bản mới nâng cấp mượt mà mà không làm mất dữ liệu hiện có của người dùng.

### 5.2. Thách thức 2: Lỗi Giới hạn Lưu trữ và Quá tải Bộ nhớ khi Lưu Ảnh Base64
- **Vấn đề gặp phải:** Camera gốc của điện thoại chụp ảnh độ phân giải rất cao (4K/12MP), sinh ra chuỗi Base64 dài hàng chục triệu ký tự. Khi người dùng lưu nhiều phiếu kiểm định liên tục vào IndexedDB, ứng dụng bị giật lag và có nguy cơ tràn bộ nhớ RAM (đặc biệt trên các thiết bị cấu hình khiêm tốn).
- **Giải pháp xử lý:**
  - Can thiệp vào tùy chọn chụp ảnh của `@capacitor/camera`: Cấu hình `quality: 75`, `width: 1280`, `correctOrientation: true`.
  - Thêm một bước xử lý nén trên HTML5 Canvas để chuẩn hóa kích thước ảnh về tối đa 1280px trước khi ghi vào IndexedDB. Dung lượng mỗi ảnh giảm từ 5MB xuống còn ~250KB–400KB mà vẫn đảm bảo độ sắc nét nhận diện lỗi thiết bị.

### 5.3. Thách thức 3: Xung đột Chính sách Bảo mật Mạng trên Android (Cleartext Traffic & CORS)
- **Vấn đề gặp phải:** Khi ứng dụng chạy trong WebView Android gửi request đồng bộ tới endpoint API phát triển thử nghiệm (sử dụng giao thức `http://` thay vì `https://`), hệ điều hành Android 9+ tự động chặn kết nối với thông báo lỗi `ERR_CLEARTEXT_NOT_PERMITTED`.
- **Giải pháp xử lý:**
  - Bổ sung cấu hình `android:usesCleartextTraffic="true"` vào tệp `AndroidManifest.xml` trong thư mục cấu hình native để cho phép kết nối thử nghiệm nội bộ.
  - Đối với bản PWA triển khai trực tiếp, toàn bộ API và Web App đều được cấu hình giao thức HTTPS chuẩn mực trên Cloudflare Pages để đảm bảo tính an toàn dữ liệu và tuân thủ tiêu chuẩn Service Worker.

---

## PHẦN 6: KẾT LUẬN & ĐÁNH GIÁ TỔNG QUAN

Dự án **VKU Field Survey (Mini-Project #1)** đã giải quyết triệt để bài toán nghiệp vụ khảo sát hiện trường trong điều kiện kết nối mạng chập chờn hoặc mất sóng hoàn toàn tại khuôn viên Đại học CNTT & TT Việt - Hàn. Ứng dụng đáp ứng toàn diện các tiêu chí kỹ thuật đề ra:
1. Kiến trúc phân tầng rõ ràng, áp dụng nghiêm ngặt TypeScript chặt chẽ.
2. Trải nghiệm người dùng mượt mà, khởi động dưới 1 giây nhờ Service Worker Cache-First.
3. Độ tin cậy dữ liệu tuyệt đối nhờ cơ chế song hành: Tự động lưu nháp và Hàng đợi đồng bộ qua IndexedDB.
4. Đóng gói linh hoạt thành cả ứng dụng Web PWA độc lập và ứng dụng Android Native APK thông qua Capacitor Bridge.
