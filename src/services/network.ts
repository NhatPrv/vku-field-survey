import { Network, type ConnectionStatus } from '@capacitor/network';

export type NetworkChangeCallback = (isOnline: boolean, connectionType: string) => void;

/**
 * Lớp dịch vụ quản lý trạng thái kết nối mạng Hybrid
 * Kết hợp Capacitor Network Native và sự kiện window.online / window.offline
 */
class NetworkManager {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private connectionType: string = 'unknown';
  private listeners: Set<NetworkChangeCallback> = new Set();
  private initialized: boolean = false;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const status: ConnectionStatus = await Network.getStatus();
      this.isOnline = status.connected;
      this.connectionType = status.connectionType;
      this.notifyListeners();
    } catch {
      this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    }

    // 1. Lắng nghe qua Capacitor Network plugin
    Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
      this.isOnline = status.connected;
      this.connectionType = status.connectionType;
      this.notifyListeners();
    });

    // 2. Lắng nghe chuẩn trình duyệt (Browser online/offline events)
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notifyListeners();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyListeners();
      });
    }
  }

  public getStatus(): { isOnline: boolean; connectionType: string } {
    return {
      isOnline: this.isOnline,
      connectionType: this.connectionType,
    };
  }

  public addListener(callback: NetworkChangeCallback): () => void {
    this.listeners.add(callback);
    // Kích hoạt ngay giá trị hiện tại
    callback(this.isOnline, this.connectionType);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => {
      try {
        callback(this.isOnline, this.connectionType);
      } catch (err) {
        console.error('[NetworkManager] Error in listener callback:', err);
      }
    });
  }
}

export const networkManager = new NetworkManager();
