import { getPendingSurveys, updateSurveyStatus } from './db';
import type { QueuedSurvey } from '../types';

export const DEFAULT_SERVER_URL =
  typeof window !== 'undefined'
    ? (window.location.port === '5173' || window.location.port === '4173'
        ? `${window.location.protocol}//${window.location.hostname}:5000`
        : window.location.origin)
    : 'http://localhost:5000';

export interface SyncProgressCallback {
  (current: number, total: number, latestRecord?: QueuedSurvey): void;
}

export interface SyncResult {
  successCount: number;
  failedCount: number;
  total: number;
  stoppedEarly: boolean;
}

/**
 * Gửi tuần tự các bản ghi PENDING_SYNC lên Backend Server
 * Xử lý lỗi an toàn: Nếu server không phản hồi thì dừng lại ngay để không làm hỏng dữ liệu
 */
export async function syncPendingSurveys(
  serverUrl: string = DEFAULT_SERVER_URL,
  onProgress?: SyncProgressCallback
): Promise<SyncResult> {
  const pendingRecords = await getPendingSurveys();
  const total = pendingRecords.length;

  let successCount = 0;
  let failedCount = 0;
  let stoppedEarly = false;

  if (total === 0) {
    return { successCount: 0, failedCount: 0, total: 0, stoppedEarly: false };
  }

  for (let i = 0; i < total; i++) {
    const record = pendingRecords[i];
    try {
      const response = await fetch(`${serverUrl}/api/surveys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record),
      });

      if (response.ok) {
        const responseData = await response.json();
        const serverTime = responseData.data?.serverReceivedAt || new Date().toISOString();

        // Cập nhật trạng thái SYNCED vào IndexedDB
        await updateSurveyStatus(record.id, 'SYNCED', serverTime);
        successCount++;
      } else {
        console.warn(`[SyncService] Máy chủ trả về mã lỗi: ${response.status} cho bản ghi ${record.id}`);
        await updateSurveyStatus(record.id, 'FAILED');
        failedCount++;
      }
    } catch (networkError) {
      console.error(`[SyncService] Không thể kết nối tới máy chủ backend tại ${serverUrl}:`, networkError);
      // Dừng vòng lặp đồng bộ để tránh spam request khi mất kết nối máy chủ
      stoppedEarly = true;
      break;
    }

    if (onProgress) {
      onProgress(i + 1, total, record);
    }
  }

  return { successCount, failedCount, total, stoppedEarly };
}

// Hàm alias tương thích với mã nguồn hiện có
export const processSyncQueue = (onProgress?: SyncProgressCallback) =>
  syncPendingSurveys(DEFAULT_SERVER_URL, onProgress);
