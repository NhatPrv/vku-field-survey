# Kế hoạch Triển khai & Lộ trình Học phần (Project Roadmap)

> **Học phần:** Lập trình Đa Nền tảng (Cross-Platform Mobile App Development)  
> **Trường:** Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn (VKU)  
> **Giảng viên hướng dẫn:** TS. Nguyễn Thanh Tuấn

---

## 1. Lộ trình Chi tiết Mini-Project #1: VKU Field Survey (Tuần 3 – Tuần 4)

Dự án Mini-Project #1 được chia nhỏ thành 6 giai đoạn (Phases) bài bản, đảm bảo tiến độ triển khai và chất lượng phần mềm theo mô hình kỹ thuật phần mềm di động hiện đại.

```mermaid
gantt
    title TIẾN ĐỘ THỰC HIỆN MINI-PROJECT #1 (TUẦN 3 - TUẦN 4)
    dateFormat  YYYY-MM-DD
    section Tuần 3: Foundation & Offline Storage
    Phase 1: Setup React-TS, Mobile UI & Star Rating      :done,    p1, 2026-09-01, 2d
    Phase 2: Triển khai Data Layer (IndexedDB via idb)    :active,  p2, 2026-09-03, 3d
    Phase 3: Cấu hình PWA Standalone & Cache-First SW      :         p3, 2026-09-05, 3d
    section Tuần 4: Sync Orchestrator & Native Android
    Phase 4: Xây dựng cơ chế Auto Sync Queue               :         p4, 2026-09-08, 2d
    Phase 5: Tích hợp Capacitor Native (Camera, Network)   :         p5, 2026-09-10, 3d
    Phase 6: Deploy Cloudflare, Test Offline & Viết Report :         p6, 2026-09-13, 2d
```

---

### Chi tiết các Giai đoạn (Phases):

### **Phase 1: Setup React-TS, Mobile UI multi-step form & Star rating component**
- **Nội dung:**
  - Khởi tạo kiến trúc dự án với Vite + React 19 + TypeScript.
  - Xây dựng hệ thống Design System chuẩn di động: Bảng biến CSS, Typography hiện đại, Dark/Light theme, mã màu nhận diện thương hiệu VKU (`#0284c7`).
  - Thiết kế thành phần `SurveyForm` dạng Multi-step (4 bước tuần tự) kèm thanh tiến trình trực quan (`Step Progress Bar`).
  - Xây dựng component chọn đánh giá sao `StarRating` (1 đến 5 sao) phản hồi mượt mà với cảm ứng chạm trên điện thoại.

### **Phase 2: Triển khai Data Layer với `idb` (IndexedDB schema cho drafts và surveys)**
- **Nội dung:**
  - Cài đặt thư viện `idb` bọc ngoài IndexedDB của trình duyệt.
  - Thiết kế Schema cơ sở dữ liệu `vku_field_survey_db` với 2 object stores:
    1. `drafts`: Lưu trữ duy nhất một bản nháp đang nhập dở, tự động ghi nhận thay đổi mỗi khi người dùng điền trường thông tin (Auto-save draft).
    2. `surveys`: Lưu trữ các phiếu khảo sát đã hoàn tất với khóa chính là chuỗi ngẫu nhiên `UUID` cùng các chỉ mục `status` (`PENDING_SYNC`, `SYNCED`, `FAILED`).
  - Viết Custom Hook `useDraftSurvey` đóng gói logic tự động phục hồi bản nháp khi mở lại ứng dụng.

### **Phase 3: Cấu hình PWA, `manifest.json`, Service Worker caching App Shell (Cache-First)**
- **Nội dung:**
  - Thiết lập tệp định nghĩa `manifest.webmanifest`: `display: "standalone"`, `theme_color: "#0284c7"`, cấu hình đầy đủ icon các độ phân giải `192x192` và `512x512`.
  - Viết tệp Service Worker `sw.js` áp dụng chiến lược **Cache-First**:
    - Giai đoạn `install`: Nạp sẵn toàn bộ tài nguyên App Shell (HTML, CSS, JS, fonts, icons) vào Cache Storage.
    - Giai đoạn `activate`: Tự động dọn dẹp các cache phiên bản cũ.
    - Giai đoạn `fetch`: Trả về tài nguyên tĩnh từ Cache ngay lập tức giúp ứng dụng khởi động tức thì (< 1 giây) khi hoàn toàn không có mạng.

### **Phase 4: Xây dựng cơ chế Auto Sync Queue khi mạng phục hồi**
- **Nội dung:**
  - Xây dựng module điều phối `syncService.ts` (Sync Queue Orchestrator).
  - Lắng nghe trạng thái mạng thông qua sự kiện `window.addEventListener('online')` kết hợp với `@capacitor/network`.
  - Khi phát hiện mạng khả dụng:
    - Quét toàn bộ bản ghi có cờ `status === 'PENDING_SYNC'` trong IndexedDB.
    - Tuần tự gửi từng bản ghi lên API endpoint (hỗ trợ mô phỏng phản hồi máy chủ với độ trễ thực tế).
    - Cập nhật trạng thái thành `SYNCED` khi gửi thành công; nếu gặp lỗi mạng đột ngột thì giữ nguyên trạng thái để chờ đợt đồng bộ kế tiếp.

### **Phase 5: Tích hợp Capacitor Native Plugins (`@capacitor/camera`, `@capacitor/network`)**
- **Nội dung:**
  - Tích hợp `@capacitor/camera` để người dùng chụp ảnh minh chứng hiện trường bằng camera vật lý trên điện thoại, hỗ trợ chuẩn nén ảnh Base64 giảm tải bộ nhớ.
  - Tích hợp `@capacitor/network` giúp ứng dụng đọc trạng thái kết nối phần cứng chính xác khi chạy trong môi trường WebView của Android.
  - Khởi tạo thư mục gốc Android qua lệnh `npx cap add android` và đồng bộ qua `npx cap sync android`.
  - Cấu hình quyền truy cập Camera và Internet trong `AndroidManifest.xml`.
  - Mở Android Studio, chạy ứng dụng trên máy ảo Android Emulator và build file cài đặt `app-debug.apk`.

### **Phase 6: Deploy lên Cloudflare Pages (HTTPS), Test Offline & Viết Báo cáo**
- **Nội dung:**
  - Triển khai ứng dụng Web lên Cloudflare Pages (hoặc Vercel) để có giao thức bảo mật `https://` (yêu cầu bắt buộc để Service Worker hoạt động trên các thiết bị thật).
  - Thực hiện kiểm thử toàn diện: Bật chế độ máy bay (Airplane Mode) trên điện thoại thật hoặc kích hoạt Offline trong Chrome DevTools -> Thực hiện điền khảo sát, chụp ảnh -> Bật lại mạng để xác thực tính năng tự động đồng bộ.
  - Chụp ảnh màn hình minh chứng và hoàn thiện báo cáo kỹ thuật theo tệp mẫu `docs/REPORT_TEMPLATE.md`.

---

## 2. Bản đồ Tổng thể Học phần 15 Tuần (Cross-Platform Curriculum)

Lộ trình học phần Lập trình Đa Nền tảng tại VKU trang bị cho sinh viên năng lực làm chủ các công nghệ phát triển ứng dụng di động đa nền tảng hiện đại nhất trên thị trường:

| Giai đoạn | Tuần | Nội dung Trọng tâm & Dự án (Projects) | Đầu ra Đánh giá |
| :--- | :--- | :--- | :--- |
| **Giai đoạn 1** | **Tuần 1 – 2** | **Nền tảng & Thiết lập Môi trường (Foundations & Toolchain)**<br>- Tổng quan hệ sinh thái đa nền tảng (Native vs Hybrid vs Cross-platform).<br>- Cài đặt Node.js, Android Studio, VS Code, Git CLI.<br>- Ôn tập TypeScript nâng cao và React Modern Hooks. | Hoàn thành môi trường phát triển cục bộ. |
| **Giai đoạn 2** | **Tuần 3 – 5** | **PWA & Capacitor Bridge**<br>- Service Worker, Web Manifest, IndexedDB Offline-first.<br>- Capacitor Native Hardware Bridge (Camera, Network, Geolocation).<br>- **Mini-Project #1: VKU Field Survey (Thu thập dữ liệu ngoại tuyến).** | **Nộp Mini-Project 1 (10%)**<br>- PWA Live URL<br>- Mã nguồn GitHub<br>- Technical Report & APK |
| **Giai đoạn 3** | **Tuần 6 – 8** | **React Native & Mobile Architecture**<br>- React Native Core Components, Flexbox Mobile Layout.<br>- Navigation (React Navigation Native Stack & Bottom Tabs).<br>- State Management (Zustand / Redux Toolkit).<br>- **Mini-Project #2: VKU Campus Room Booking (Đặt phòng học & họp).** | **Nộp Mini-Project 2 (15%)** |
| **Giai đoạn 4** | **Tuần 9 – 11**| **Flutter Framework & Dart**<br>- Ngôn ngữ Dart, Widget Tree (Stateless vs Stateful).<br>- Quản lý trạng thái với Provider / Riverpod.<br>- Tích hợp Native ML Kit / OCR nhận diện văn bản.<br>- **Mini-Project #3: Expense Tracker with Receipt OCR (Quản lý thu chi).** | **Nộp Mini-Project 3 (15%)** |
| **Giai đoạn 5** | **Tuần 12 – 15**| **Nâng cao, Tích hợp AI & Bảo vệ Đồ án Tốt nghiệp Môn học**<br>- Tối ưu hóa hiệu năng (Profiling, Memory Leaks, Bundle Size).<br>- Tích hợp Trợ lý AI / LLM API vào Mobile Client.<br>- Đóng gói hoàn chỉnh, ký số ứng dụng (Keystore signing) chuẩn bị phát hành.<br>- **Bảo vệ Đồ án Tổng hợp (Capstone Project Defense).** | **Bảo vệ Đồ án Cuối kỳ (60%)** |
