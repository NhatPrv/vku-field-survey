import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

/**
 * Lưu ảnh khảo sát Base64 trực tiếp vào bộ nhớ tệp Native của thiết bị
 * Giảm thiểu áp lực bộ nhớ RAM và bảo toàn file ảnh ngoại tuyến an toàn
 */
export async function savePhotoToFilesystem(
  base64Data: string,
  prefix: string = 'survey_photo'
): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) {
    // Trên môi trường Web, trả về null (lưu trực tiếp Base64 trong IndexedDB)
    return null;
  }

  try {
    const fileName = `${prefix}_${Date.now()}.jpg`;
    // Loại bỏ tiền tố data:image/...;base64, nếu có
    const rawBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

    const result = await Filesystem.writeFile({
      path: `photos/${fileName}`,
      data: rawBase64,
      directory: Directory.Data,
      recursive: true,
    });

    console.log('[Storage] Đã lưu file ảnh vào thiết bị native:', result.uri);
    return result.uri;
  } catch (error) {
    console.warn('[Storage] Không thể lưu ảnh vào Filesystem native, fallback sang Base64:', error);
    return null;
  }
}
