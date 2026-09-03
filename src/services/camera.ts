import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

/**
 * Dịch vụ chụp ảnh hiện trường qua Capacitor Camera Plugin
 * Tự động dự phòng và nén ảnh để tối ưu bộ nhớ khi lưu trữ Offline
 */
export async function capturePhoto(): Promise<string | null> {
  try {
    const image = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt, // Cho phép người dùng chọn Chụp ảnh hoặc Chọn từ Thư viện
      width: 1280,
      correctOrientation: true,
      promptLabelHeader: 'Ảnh minh chứng cơ sở vật chất',
      promptLabelPhoto: 'Chọn từ thư viện ảnh',
      promptLabelPicture: 'Chụp ảnh mới',
      promptLabelCancel: 'Hủy bỏ',
    });

    return image.dataUrl || null;
  } catch (error: unknown) {
    const err = error as { message?: string };
    // Bỏ qua nếu người dùng bấm Hủy (User cancelled)
    if (err?.message?.includes('User cancelled') || err?.message?.includes('cancelled')) {
      return null;
    }
    console.warn('[CameraService] Capacitor Camera error or fallback:', error);
    throw error;
  }
}

/**
 * Hàm hỗ trợ đọc File từ thẻ input type="file" thành chuỗi DataURL
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
