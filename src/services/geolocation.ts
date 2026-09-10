import { Geolocation, type Position } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

/**
 * Lấy tọa độ GPS chính xác sử dụng @capacitor/geolocation
 * Tự động Graceful Fallback về Web Geolocation API trên trình duyệt máy tính
 */
export async function getCurrentCoordinates(): Promise<GpsCoordinates | null> {
  // 1. Kiểm tra và sử dụng Capacitor Native Geolocation nếu có thể
  try {
    if (Capacitor.isNativePlatform()) {
      const permission = await Geolocation.checkPermissions();
      if (permission.location !== 'granted') {
        const requested = await Geolocation.requestPermissions();
        if (requested.location !== 'granted') {
          console.warn('[Geolocation] Quyền vị trí bị từ chối');
          return null;
        }
      }

      const position: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
    }
  } catch (nativeError) {
    console.warn('[Geolocation] Lỗi Capacitor Geolocation, chuyển sang Web Fallback:', nativeError);
  }

  // 2. Web Browser Fallback qua navigator.geolocation
  if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => {
          console.warn('[Geolocation] Web Geolocation thất bại hoặc bị chặn:', err.message);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }

  return null;
}
