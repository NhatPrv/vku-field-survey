import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware cấu hình CORS và giới hạn dung lượng tải ảnh Base64 lên đến 10MB
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Đường dẫn thư mục
const serverPublicPath = path.join(__dirname, 'public');
const distPath = path.join(__dirname, '../dist');

// Phục vụ giao diện Server Dashboard riêng tại route /server-gui
app.use('/server-gui', express.static(serverPublicPath));

// Phục vụ Frontend PWA từ thư mục dist (nếu đã build) hoặc fallback về Server GUI
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
} else {
  app.use(express.static(serverPublicPath));
}

// Route phục vụ tải trực tiếp file APK Android
app.get('/download/vku-field-survey.apk', (req, res) => {
  const localApkPath = path.join(__dirname, 'downloads/vku-field-survey.apk');
  const androidBuildApkPath = path.join(__dirname, '../android/app/build/outputs/apk/debug/app-debug.apk');

  if (fs.existsSync(localApkPath)) {
    return res.download(localApkPath, 'vku-field-survey.apk');
  }
  if (fs.existsSync(androidBuildApkPath)) {
    return res.download(androidBuildApkPath, 'vku-field-survey.apk');
  }
  return res.redirect('https://github.com/NhatPrv/vku-field-survey/releases');
});

// In-memory data store cho danh sách các phiếu khảo sát nhận được từ các thiết bị ngoại tuyến
let surveysStore = [];

/**
 * Health Check Endpoint
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    totalSurveysReceived: surveysStore.length,
  });
});

/**
 * Endpoint tiếp nhận phiếu khảo sát từ Client PWA / Android Native
 * Đảm bảo tính Idempotency: Nếu ID đã tồn tại thì cập nhật, nếu chưa thì thêm mới vào đầu danh sách
 */
app.post('/api/surveys', (req, res) => {
  try {
    const surveyData = req.body;

    if (!surveyData || !surveyData.id) {
      return res.status(400).json({ error: 'Payload không hợp lệ: Yêu cầu mã ID duy nhất của khảo sát.' });
    }

    const receivedAt = new Date().toISOString();
    const processedRecord = {
      ...surveyData,
      status: 'SYNCED',
      serverReceivedAt: receivedAt,
    };

    const existingIndex = surveysStore.findIndex((item) => item.id === surveyData.id);

    if (existingIndex !== -1) {
      surveysStore[existingIndex] = processedRecord;
      console.log(`[Server] Đã cập nhật bản ghi có sẵn ID: ${surveyData.id}`);
    } else {
      surveysStore.unshift(processedRecord);
      console.log(`[Server] Đã tiếp nhận phiếu khảo sát mới ID: ${surveyData.id} [${surveyData.payload?.building} - ${surveyData.payload?.room}]`);
    }

    return res.status(200).json({
      success: true,
      message: 'Đã lưu và đồng bộ thành công trên máy chủ VKU Field Survey',
      data: processedRecord,
    });
  } catch (error) {
    console.error('[Server Error] Lỗi xử lý tiếp nhận phiếu:', error);
    return res.status(500).json({ error: 'Lỗi nội bộ máy chủ khi lưu trữ khảo sát.' });
  }
});

/**
 * Endpoint phục vụ trang Admin Dashboard lấy toàn bộ danh sách khảo sát tập trung
 */
app.get('/api/admin/surveys', (req, res) => {
  res.status(200).json({
    success: true,
    total: surveysStore.length,
    surveys: surveysStore,
  });
});

/**
 * Endpoint xóa một bản ghi khảo sát theo ID trên máy chủ
 */
app.delete('/api/admin/surveys/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = surveysStore.length;
  surveysStore = surveysStore.filter((item) => item.id !== id);

  if (surveysStore.length === initialLength) {
    return res.status(404).json({ error: `Không tìm thấy phiếu khảo sát với ID: ${id}` });
  }

  console.log(`[Server] Đã xóa bản ghi ID: ${id}`);
  return res.status(200).json({
    success: true,
    message: `Đã xóa thành công bản ghi ID: ${id}`,
  });
});

// Single Page Application (SPA) Fallback (Tương thích chuẩn Express 5)
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.url.startsWith('/api') || req.url.startsWith('/server-gui')) {
    return next();
  }
  if (fs.existsSync(path.join(distPath, 'index.html'))) {
    return res.sendFile(path.join(distPath, 'index.html'));
  }
  if (fs.existsSync(path.join(serverPublicPath, 'index.html'))) {
    return res.sendFile(path.join(serverPublicPath, 'index.html'));
  }
  next();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 VKU Field Survey Central Backend Server Running`);
  console.log(`📡 URL: http://0.0.0.0:${PORT}`);
  console.log(`📋 API Post Surveys: http://0.0.0.0:${PORT}/api/surveys`);
  console.log(`📊 Server GUI:       http://0.0.0.0:${PORT}/server-gui`);
  console.log(`====================================================`);
});
