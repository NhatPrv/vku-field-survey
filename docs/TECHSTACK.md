# Đặc tả Công nghệ & Quyết định Kiến trúc (Technology Stack & Architectural Decisions)

> **Dự án:** VKU Field Survey — Offline Data Collection  
> **Học phần:** Lập trình Đa Nền tảng (Cross-Platform Mobile App Development) — VKU  
> **Giảng viên hướng dẫn:** TS. Nguyễn Thanh Tuấn

---

## 1. Tại sao Lựa chọn PWA + Capacitor thay vì Native thuần (Kotlin/Swift)?

Trong bối cảnh bài toán nghiệp vụ kiểm tra cơ sở vật chất tại VKU, đội ngũ phát triển cần cân nhắc giữa ba hướng tiếp cận chính: **Native thuần (Kotlin/Swift)**, **Cross-platform UI (Flutter/React Native)** và **PWA + Native Bridge (Capacitor)**. 

Bảng phân tích quyết định kiến trúc:

| Tiêu chí | Native thuần (Kotlin/Swift) | Cross-Platform (React Native/Flutter) | PWA + Capacitor (Lựa chọn dự án) |
| :--- | :--- | :--- | :--- |
| **Chi phí phát triển** | Rất cao (Cần 2 codebase và 2 đội ngũ chuyên biệt). | Trung bình. | **Thấp nhất** (Chỉ duy nhất 1 codebase chuẩn Web React-TS). |
| **Thời gian ra mắt (Time-to-Market)** | Chậm (Phải code giao diện và logic 2 lần). | Trung bình. | **Cực nhanh (Tối ưu cho MVP và kiểm thử thực địa)**. |
| **Tái sử dụng mã nguồn** | ~0% giữa Android và iOS. | ~70% - 85%. | **~95% - 100%** (Chạy trực tiếp trên Web, Android và iOS). |
| **Khả năng cài đặt & Cập nhật** | Bắt buộc thông qua Google Play / App Store. | Bắt buộc qua Store hoặc OTA phức tạp. | **Cài đặt trực tiếp qua trình duyệt (PWA Add to Home Screen)** hoặc xuất file APK cài đặt nhanh. |
| **Tiếp cận phần cứng thiết bị** | Trực tiếp 100%. | Qua Native Modules. | **Đầy đủ phần cứng cần thiết (Camera, Network, FileSystem) qua Capacitor Plugins**. |

### Kết luận Quyết định:
Với các bài toán thu thập dữ liệu hiện trường (Field Data Collection), giao diện chủ yếu bao gồm Form nhập liệu, danh sách và camera ghi nhận hình ảnh. Mô hình **PWA + Capacitor** mang lại tỷ suất hoàn vốn kỹ thuật (Technical ROI) cao nhất: vừa có thể chia sẻ đường dẫn Web qua mã QR để sinh viên/cán bộ truy cập tức thì bằng điện thoại, vừa có thể đóng gói file APK cài đặt chuyên dụng cho cán bộ thanh tra.

---

## 2. Chiến lược Caching: Phân tách App Shell và Dynamic Data

Một sai lầm phổ biến khi làm ứng dụng Offline-First là cố gắng cache mọi thứ vào cùng một nơi. Trong dự án này, hệ thống áp dụng cơ chế phân tách rõ ràng:

```
                  ┌────────────────────────────────────────┐
                  │          NGƯỜI DÙNG TƯƠNG TÁC          │
                  └───────────────────┬────────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
   [TÀI NGUYÊN TĨNH - APP SHELL]                   [DỮ LIỆU ĐỘNG - SURVEY DATA]
  HTML, CSS, JS, WebFonts, Icons               Bản nháp (Draft), Hàng đợi (Sync Queue)
              │                                               │
              ▼                                               ▼
    [SERVICE WORKER ENGINE]                         [INDEXEDDB ENGINE (idb)]
    Chiến lược: Cache-First                       Lưu trữ NoSQL có cấu trúc (ACID)
              │                                               │
              ▼                                               ▼
  Khởi động tức thì < 1 giây                      An toàn tuyệt đối, không mất dữ liệu
   (Không phụ thuộc mạng)                           (Hỗ trợ chuỗi ảnh Base64 lớn)
```

### Chi tiết Chiến lược Cache-First cho App Shell:
1. **Mục tiêu:** Đảm bảo khi người dùng mở ứng dụng tại tầng hầm mất sóng hoàn toàn, giao diện ứng dụng (khung xương trang, các nút bấm, CSS bố cục) phải hiển thị tức thì mà không hề xuất hiện màn hình báo lỗi mất mạng của trình duyệt ("No internet connection / Khủng long T-Rex").
2. **Cơ chế:** Khi Service Worker chặn sự kiện `fetch` đối với các tài nguyên tĩnh:
   - Kiểm tra ngay trong `CacheStorage`. Nếu đã có bản cache tương ứng, trả về ngay lập tức (**Cache Hit**).
   - Nếu chưa có trong cache, mới gửi request ra mạng bên ngoài (**Network Fallback**), sau đó tự động lưu tài nguyên đó vào cache cho những lần sử dụng sau.

---

## 3. So sánh Giải pháp Lưu trữ Offline: Tại sao chọn IndexedDB (`idb`) thay vì `localStorage`?

Bảng so sánh kỹ thuật giữa hai giải pháp lưu trữ trên trình duyệt di động:

| Tiêu chuẩn Kỹ thuật | `localStorage` | `IndexedDB` (sử dụng thư viện `idb`) | Đánh giá kiến trúc |
| :--- | :--- | :--- | :--- |
| **Cơ chế xử lý (I/O)** | **Đồng bộ (Synchronous)** — Chặn luồng thực thi chính (Main Thread UI). | **Bất đồng bộ (Asynchronous)** — Sử dụng Promises/Web Worker. | `localStorage` gây giật/khựng giao diện (UI freezing) khi lưu dữ liệu lớn. `IndexedDB` mượt mà 60 FPS. |
| **Giới hạn dung lượng** | Thường bị giới hạn ở **~5MB** trên mỗi domain. | **Hàng trăm MB đến hàng GB** (tùy thuộc vào dung lượng trống của ổ cứng thiết bị). | Khi người dùng chụp 5-10 bức ảnh hiện trường (mỗi ảnh ~500KB-1MB), `localStorage` sẽ lập tức báo lỗi `QuotaExceededError`. |
| **Kiểu dữ liệu hỗ trợ** | Chỉ hỗ trợ duy nhất **String** (phải `JSON.stringify`/`parse`). | Hỗ trợ **Object, Array, Blob, TypedArray, File**. | `IndexedDB` cho phép lưu trực tiếp các đối tượng JavaScript phức tạp và ảnh chụp mà không tốn công chuyển đổi. |
| **Khả năng truy vấn** | Chỉ tìm kiếm theo một `key` đơn giản. | Hỗ trợ **Index, Range, Transaction (ACID)**. | Cho phép lọc nhanh các bản ghi theo trạng thái `PENDING_SYNC` hay `SYNCED` thông qua chỉ mục. |

### Lợi ích của thư viện `idb`:
`idb` là một thư viện siêu nhẹ do Jake Archibald (Google Chrome Team) phát triển. Nó bao bọc API gốc đầy phức tạp dựa trên sự kiện (Event-based `onsuccess`/`onerror`) của IndexedDB thành giao diện **Promise / async-await** hiện đại, thân thiện tuyệt đối với TypeScript.

---

## 4. Giao tiếp Phần cứng: Cơ chế hoạt động của Capacitor Bridge

Capacitor đóng vai trò như một lớp trừu tượng trung gian kết nối giữa WebView (môi trường chạy mã JavaScript của React) và Native Android OS:

```
┌────────────────────────────────────────────────────────┐
│             WEB APPLICATION (React 19 / TS)            │
│       import { Camera } from '@capacitor/camera';      │
│       import { Network } from '@capacitor/network';    │
└───────────────────────────┬────────────────────────────┘
                            │
              Capacitor JavaScript Bridge
              (Message Passing qua JSON)
                            │
┌───────────────────────────▼────────────────────────────┐
│              CAPACITOR ANDROID RUNTIME                 │
│         (Thư viện Java / Kotlin trong Android)         │
└───────────────────────────┬────────────────────────────┘
                            │
   ┌────────────────────────┴────────────────────────┐
   ▼                                                 ▼
[CAMERA HARDWARE]                           [CONNECTIVITY MANAGER]
Android CameraX API                         Android NetworkCapabilities
(Chụp ảnh, nén ảnh, trả về chuỗi Base64)    (Lắng nghe Wi-Fi, 4G, Chế độ máy bay)
```

### 1. Plugin `@capacitor/camera`:
- **Trên thiết bị Android:** Gọi intent native `MediaStore.ACTION_IMAGE_CAPTURE` hoặc thư viện CameraX, mở camera nguyên bản của điện thoại với đầy đủ tính năng lấy nét và đèn flash, sau đó tối ưu kích thước ảnh và trả về dữ liệu hình ảnh dưới dạng chuỗi Base64 (`CameraResultType.Base64`).
- **Trên trình duyệt Web (Fallback):** Nếu chạy trên trình duyệt máy tính không có phần cứng native, hệ thống tự động kích hoạt thẻ `<input type="file" accept="image/*" capture="environment">` giúp người dùng vẫn có thể tải ảnh lên bình thường.

### 2. Plugin `@capacitor/network`:
- Cung cấp phương thức `Network.getStatus()` và sự kiện `Network.addListener('networkStatusChange', status => ...)`.
- Đảm bảo việc nhận biết ngắt kết nối mạng diễn ra chính xác ngay cả khi điện thoại chuyển sang chế độ tiết kiệm pin hoặc kết nối Wi-Fi bị giới hạn đường truyền (Captive Portal / No Internet Access).
