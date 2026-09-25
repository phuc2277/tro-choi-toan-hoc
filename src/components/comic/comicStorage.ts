/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Upload ảnh/video (nhận về dạng base64 từ các route Gemini/Veo trong server.ts)
 * lên Firebase Storage, trả về download URL để lưu vào state/Firestore thay vì
 * giữ nguyên chuỗi base64 khổng lồ.
 *
 * VÌ SAO: mỗi khung truyện có thể có cả ảnh 3D AI lẫn video Veo (base64 video vài
 * MB/khung). Với 14-20 khung, giữ base64 trực tiếp trong state React hoặc trong
 * document Firestore sẽ: (1) làm giao diện giật lag khi re-render, (2) dễ vượt giới
 * hạn 1MB/document của Firestore, (3) vượt giới hạn payload ~4.5MB của Vercel nếu
 * deploy serverless. Chuyển sang Storage + chỉ lưu URL giải quyết cả 3.
 *
 * Cấu trúc đường dẫn trên Storage (khớp với storage.rules đi kèm):
 *   comic-projects/{projectId}/frames/{frameId}/image.{ext}
 *   comic-projects/{projectId}/frames/{frameId}/video.{ext}
 *   comic-projects/{projectId}/characters/{characterId}/reference.{ext}
 */
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebaseClient';

function requireStorage() {
  if (!storage) {
    throw new Error('Firebase Storage chưa được cấu hình (thiếu biến môi trường VITE_FIREBASE_STORAGE_BUCKET).');
  }
  return storage;
}

function extFromMimeType(mimeType: string): string {
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  if (mimeType.includes('webp')) return 'webp';
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('webm')) return 'webm';
  return 'bin';
}

// Upload 1 chuỗi base64 (KHÔNG có tiền tố "data:...;base64,") lên 1 đường dẫn Storage
// bất kỳ, trả về download URL công khai (vẫn được kiểm soát bởi storage.rules).
async function uploadBase64(path: string, base64: string, mimeType: string): Promise<string> {
  const st = requireStorage();
  const fileRef = ref(st, path);
  await uploadString(fileRef, base64, 'base64', { contentType: mimeType });
  return getDownloadURL(fileRef);
}

export async function uploadFrameImage(
  projectId: string,
  frameId: string,
  imageBase64: string,
  mimeType: string
): Promise<string> {
  const path = `comic-projects/${projectId}/frames/${frameId}/image.${extFromMimeType(mimeType)}`;
  return uploadBase64(path, imageBase64, mimeType);
}

export async function uploadFrameVideo(
  projectId: string,
  frameId: string,
  videoBase64: string,
  mimeType: string
): Promise<string> {
  const path = `comic-projects/${projectId}/frames/${frameId}/video.${extFromMimeType(mimeType)}`;
  return uploadBase64(path, videoBase64, mimeType);
}

export async function uploadCharacterReference(
  projectId: string,
  characterId: string,
  imageBase64: string,
  mimeType: string
): Promise<string> {
  const path = `comic-projects/${projectId}/characters/${characterId}/reference.${extFromMimeType(mimeType)}`;
  return uploadBase64(path, imageBase64, mimeType);
}

// Xoá file cũ trước khi ghi đè bằng file mới (ví dụ khi giáo viên bấm "Tạo lại") —
// không bắt buộc (uploadString ghi đè đúng path là đủ), nhưng dọn dẹp nếu đổi định
// dạng file (vd. ảnh cũ .jpg, ảnh mới .png) sẽ để lại file rác nếu không xoá.
// An toàn khi gọi trên path không tồn tại: bỏ qua lỗi 'object-not-found'.
// Ngược lại với uploadBase64: server (route generate-frame-image) cần base64 để gửi
// làm ảnh tham chiếu cho Gemini, nhưng client giờ chỉ giữ URL (không giữ base64) —
// nên cần tải lại ảnh từ URL và đổi sang base64 ngay trước khi gọi API.
export async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Không tải được ảnh tham chiếu từ Storage (HTTP ${res.status}).`);
  const blob = await res.blob();
  const mimeType = blob.type || 'image/png';
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || ''); // bỏ tiền tố "data:...;base64,"
    };
    reader.onerror = () => reject(new Error('Không đọc được dữ liệu ảnh tham chiếu.'));
    reader.readAsDataURL(blob);
  });
  return { base64, mimeType };
}

export async function deleteStorageAssetSafe(path: string): Promise<void> {
  try {
    const st = requireStorage();
    await deleteObject(ref(st, path));
  } catch (err: any) {
    if (err?.code !== 'storage/object-not-found') {
      console.warn('Không xoá được file cũ trên Storage:', path, err?.message);
    }
  }
}