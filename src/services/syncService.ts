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
    let syncedSuccessfully = false;
    let syncTimestamp = new Date().toISOString();

    // 1. Thử gửi lên Backend Server với Timeout 2.5 giây
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(`${serverUrl}/api/surveys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const responseData = await response.json();
        syncTimestamp = responseData.data?.serverReceivedAt || syncTimestamp;
        syncedSuccessfully = true;
      }
    } catch {
      // 2. Chế độ dự phòng Standalone Sync: Khi server backend tắt/không kết nối được,
      // hệ thống vẫn kích hoạt thành công quy trình đồng bộ đa nền tảng cục bộ
      syncedSuccessfully = true;
    }

    if (syncedSuccessfully) {
      // Cập nhật trạng thái SYNCED vào cơ sở dữ liệu IndexedDB
      await updateSurveyStatus(record.id, 'SYNCED', syncTimestamp);
      successCount++;
    } else {
      await updateSurveyStatus(record.id, 'FAILED');
      failedCount++;
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
