import { Capacitor } from '@capacitor/core';
import { updateSurveyStatus } from './db';
import type { QueuedSurvey } from '../types';

export const DEFAULT_SERVER_URL =
  Capacitor.isNativePlatform()
    ? 'http://13.250.26.54'
    : (typeof window !== 'undefined'
        ? (window.location.port === '5173' || window.location.port === '4173'
            ? `${window.location.protocol}//${window.location.hostname}:5000`
            : window.location.origin)
        : 'http://localhost:5000');

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
 * Gửi tuần tự các bản ghi lên Backend Server
 * Hỗ trợ forceAll để đẩy toàn bộ danh sách (kể cả bản ghi từng bị đánh dấu nhầm)
 */
export async function syncPendingSurveys(
  serverUrl: string = DEFAULT_SERVER_URL,
  onProgress?: SyncProgressCallback,
  forceAll: boolean = false
): Promise<SyncResult> {
  const allRecords = await (await import('./db')).getAllQueuedSurveys();
  const pendingRecords = forceAll
    ? allRecords
    : allRecords.filter((r) => r.status === 'PENDING_SYNC' || r.status === 'FAILED');

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
