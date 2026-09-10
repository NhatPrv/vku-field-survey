import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

/**
 * Đăng ký và hiển thị thông báo Native khi đồng bộ hàng đợi thành công
 */
export async function sendSyncSuccessNotification(count: number): Promise<void> {
  const title = 'Đồng bộ dữ liệu thành công! 🚀';
  const body = `Hệ thống vừa gửi thành công ${count} phiếu khảo sát hiện trường lên máy chủ trung tâm.`;

  try {
    if (Capacitor.isNativePlatform()) {
      const permission = await LocalNotifications.checkPermissions();
      if (permission.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== 'granted') return;
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Math.floor(Date.now() % 100000),
            schedule: { at: new Date(Date.now() + 200) },
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: null,
          },
        ],
      });
      return;
    }
  } catch (err) {
    console.warn('[Notification] Lỗi LocalNotifications native:', err);
  }

  // Fallback trình duyệt Web Desktop Notification
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.svg' });
      } else if (Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          new Notification(title, { body, icon: '/favicon.svg' });
        }
      }
    } catch (e) {
      console.warn('[Notification] Lỗi Web Notification:', e);
    }
  }
}
