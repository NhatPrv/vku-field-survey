import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import type { SurveyFormData, QueuedSurvey, SyncStatus } from '../types';

const DB_NAME = 'vku_survey_db';
const DB_VERSION = 1;
const DRAFT_STORE = 'draft_store';
const QUEUE_STORE = 'survey_queue';
const CURRENT_DRAFT_KEY = 'current_draft';

interface VkuSurveyDB extends DBSchema {
  [DRAFT_STORE]: {
    key: string;
    value: Partial<SurveyFormData>;
  };
  [QUEUE_STORE]: {
    key: string;
    value: QueuedSurvey;
    indexes: { 'by-status': SyncStatus };
  };
}

let dbPromise: Promise<IDBPDatabase<VkuSurveyDB>> | null = null;

export function getDatabase(): Promise<IDBPDatabase<VkuSurveyDB>> {
  if (!dbPromise) {
    dbPromise = openDB<VkuSurveyDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Store 1: Lưu bản nháp đang nhập (real-time draft persistence)
        if (!db.objectStoreNames.contains(DRAFT_STORE)) {
          db.createObjectStore(DRAFT_STORE);
        }

        // Store 2: Hàng đợi khảo sát (offline sync queue)
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          const queueStore = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
          queueStore.createIndex('by-status', 'status');
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Tự động lưu bản nháp theo thời gian thực (Auto-Save Draft)
 */
export async function saveDraft(data: Partial<SurveyFormData>): Promise<void> {
  const db = await getDatabase();
  await db.put(DRAFT_STORE, data, CURRENT_DRAFT_KEY);
}

/**
 * Lấy bản nháp đã lưu khi mở lại ứng dụng hoặc reload trang
 */
export async function getDraft(): Promise<Partial<SurveyFormData> | undefined> {
  const db = await getDatabase();
  const draft = await db.get(DRAFT_STORE, CURRENT_DRAFT_KEY);
  return draft;
}

/**
 * Xóa bản nháp sau khi submit thành công
 */
export async function clearDraft(): Promise<void> {
  const db = await getDatabase();
  await db.delete(DRAFT_STORE, CURRENT_DRAFT_KEY);
}

/**
 * Đóng gói và thêm một phiếu khảo sát vào hàng đợi Offline
 */
export async function enqueueSurvey(
  data: SurveyFormData,
  initialStatus: SyncStatus = 'PENDING_SYNC'
): Promise<QueuedSurvey> {
  const db = await getDatabase();
  const record: QueuedSurvey = {
    id: `survey-${uuidv4()}`,
    createdAt: new Date().toISOString(),
    status: initialStatus,
    payload: data,
  };
  await db.put(QUEUE_STORE, record);
  return record;
}

/**
 * Lấy toàn bộ các bản ghi trong hàng đợi (sắp xếp mới nhất lên đầu)
 */
export async function getAllQueuedSurveys(): Promise<QueuedSurvey[]> {
  const db = await getDatabase();
  const all = await db.getAll(QUEUE_STORE);
  return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Lấy danh sách các bản ghi đang chờ đồng bộ (PENDING_SYNC)
 */
export async function getPendingSurveys(): Promise<QueuedSurvey[]> {
  const db = await getDatabase();
  return db.getAllFromIndex(QUEUE_STORE, 'by-status', 'PENDING_SYNC');
}

/**
 * Cập nhật trạng thái và thời điểm máy chủ tiếp nhận bản ghi
 */
export async function updateSurveyStatus(
  id: string,
  status: SyncStatus,
  serverReceivedAt?: string
): Promise<void> {
  const db = await getDatabase();
  const item = await db.get(QUEUE_STORE, id);
  if (item) {
    item.status = status;
    if (serverReceivedAt) {
      item.serverReceivedAt = serverReceivedAt;
    }
    await db.put(QUEUE_STORE, item);
  }
}

/**
 * Xóa một bản ghi khỏi hàng đợi
 */
export async function deleteQueuedSurvey(id: string): Promise<void> {
  const db = await getDatabase();
  await db.delete(QUEUE_STORE, id);
}

// --------------------------------------------------------
// CÁC HÀM ALIAS TƯƠNG THÍCH VỚI MÃ NGUỒN HIỆN CÓ
// --------------------------------------------------------
export const addToQueue = enqueueSurvey;
export const getAllSurveys = getAllQueuedSurveys;
export const deleteSurvey = deleteQueuedSurvey;
export async function markAsSynced(id: string, serverReceivedAt?: string): Promise<void> {
  await updateSurveyStatus(id, 'SYNCED', serverReceivedAt);
}
export async function markAsFailed(id: string): Promise<void> {
  await updateSurveyStatus(id, 'FAILED');
}
