export type SurveyCategory =
  | 'Hardware'
  | 'Projector'
  | 'AC'
  | 'Electrical'
  | 'Furniture'
  | '';

export interface SurveyFormData {
  building: string;
  floor: string;
  room: string;
  category: SurveyCategory;
  rating: number; // 1 đến 5 sao
  notes: string;
  photoUrl: string | null;
}

export type SyncStatus = 'PENDING_SYNC' | 'SYNCED' | 'FAILED';

export interface QueuedSurvey {
  id: string; // UUID v4
  createdAt: string; // ISO 8601 string
  status: SyncStatus;
  serverReceivedAt?: string;
  payload: SurveyFormData;
}

// Interface tương thích cho các Component UI hiển thị
export interface OfflineRecord {
  id: string;
  data: SurveyFormData;
  status: SyncStatus;
  timestamp: string;
  serverReceivedAt?: string;
}
