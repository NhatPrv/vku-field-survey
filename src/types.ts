export interface SurveyFormData {
  building: string;
  floor: string;
  room: string;
  category: "Hardware" | "Projector" | "AC" | "Electrical" | "Furniture" | "";
  rating: number;
  notes: string;
  photoUrl: string | null;
}

export type SyncStatus = 'PENDING_SYNC' | 'SYNCED' | 'FAILED';

export interface QueuedSurvey {
  id: string; // UUID
  createdAt: string; // ISO Timestamp
  status: SyncStatus;
  payload: SurveyFormData;
}

// Alias tương thích với UI components
export interface OfflineRecord {
  id: string;
  data: SurveyFormData;
  status: SyncStatus;
  timestamp: string;
}
