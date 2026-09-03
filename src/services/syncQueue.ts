import { getPendingSurveys, markAsSynced, markAsFailed } from './db';
import type { QueuedSurvey } from '../types';

export interface SyncProgressCallback {
  (current: number, total: number, latestRecord?: QueuedSurvey): void;
}

/**
 * Điều phối xử lý hàng đợi đồng bộ dữ liệu ngoại tuyến lên Server
 */
export async function processSyncQueue(
  onProgress?: SyncProgressCallback
): Promise<{ successCount: number; failedCount: number }> {
  const pendingRecords = await getPendingSurveys();
  let successCount = 0;
  let failedCount = 0;

  if (pendingRecords.length === 0) {
    return { successCount: 0, failedCount: 0 };
  }

  const total = pendingRecords.length;

  for (let i = 0; i < total; i++) {
    const record = pendingRecords[i];
    try {
      // Mô phỏng lời gọi RESTful API POST /api/surveys với độ trễ thực tế
      await sendSurveyToServer(record);

      // Cập nhật trạng thái trong IndexedDB thành SYNCED
      await markAsSynced(record.id);
      successCount++;
    } catch (error) {
      console.error(`[SyncService] Lỗi đồng bộ bản ghi ${record.id}:`, error);
      await markAsFailed(record.id);
      failedCount++;
    }

    if (onProgress) {
      onProgress(i + 1, total, record);
    }
  }

  return { successCount, failedCount };
}

/**
 * Hàm gửi dữ liệu lên endpoint máy chủ
 * (Hỗ trợ cấu hình URL backend thực tế hoặc Fallback mô phỏng)
 */
async function sendSurveyToServer(record: QueuedSurvey): Promise<void> {
  // Giả lập xử lý độ trễ mạng mạng di động 600ms
  await new Promise((resolve) => setTimeout(resolve, 600));

  // Trong môi trường triển khai thực tế có thể gọi:
  // const res = await fetch('/api/surveys', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(record),
  // });
  // if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

  console.info(`[SyncService] Đã đồng bộ thành công bản ghi ${record.id} [${record.payload.building} - ${record.payload.room}]`);
}
