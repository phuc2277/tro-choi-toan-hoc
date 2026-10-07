/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Khởi tạo Firebase Admin SDK ở backend (server.ts) để upload file (video AI, ảnh AI...)
 * lên Firebase Storage và trả về URL tải xuống — khác với `firebaseClient.ts` (cấu hình
 * phía trình duyệt, dùng cho đăng nhập Google + Firestore client-side).
 *
 * LƯU Ý: nếu dự án đã có sẵn 1 file khởi tạo Firebase Admin ở nơi khác (ví dụ tính năng
 * "Tạo Ảnh 3D AI" đã tự làm rồi), hãy XOÁ file này và sửa lại các import
 * `from './firebaseAdmin'` trong `server.ts` để trỏ tới file đó, tránh khởi tạo
 * Admin App 2 lần (Firebase sẽ báo lỗi "already exists").
 *
 * Biến môi trường cần có (xem .env.example):
 * - FIREBASE_SERVICE_ACCOUNT_JSON: toàn bộ nội dung JSON của Service Account key
 *   (Firebase Console → Project settings → Service accounts → Generate new private key),
 *   dán nguyên văn làm giá trị 1 biến môi trường (dạng chuỗi JSON).
 * - FIREBASE_STORAGE_BUCKET: tên bucket, ví dụ "ai-truyen-tranh-thcs.firebasestorage.app"
 *   (lấy từ firebaseConfig.storageBucket, giống giá trị VITE_FIREBASE_STORAGE_BUCKET).
 */
import admin from 'firebase-admin';

let initialized = false;

function ensureInitialized() {
  if (initialized) return;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const bucket = process.env.FIREBASE_STORAGE_BUCKET;

  if (!raw || !bucket) {
    throw new Error(
      'Thiếu FIREBASE_SERVICE_ACCOUNT_JSON hoặc FIREBASE_STORAGE_BUCKET trong biến môi trường server — ' +
        'xem README-CLOUD-SYNC.md mục "Upload ảnh/video AI lên Storage" để thiết lập.'
    );
  }

  let serviceAccount: admin.ServiceAccount;
  try {
    serviceAccount = JSON.parse(raw);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON không phải JSON hợp lệ. Dán nguyên văn nội dung file key Firebase tải về.');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: bucket,
  });
  initialized = true;
}

export const isFirebaseAdminConfigured = Boolean(
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON && process.env.FIREBASE_STORAGE_BUCKET
);

// Upload 1 buffer (ảnh/video...) lên Firebase Storage và trả về URL đọc được lâu dài
// (signed URL hết hạn năm 2500 — coi như vĩnh viễn cho mục đích của ứng dụng này).
export async function uploadBufferToStorage(buffer: Buffer, destPath: string, contentType: string): Promise<string> {
  ensureInitialized();
  const bucket = admin.storage().bucket();
  const file = bucket.file(destPath);
  await file.save(buffer, {
    metadata: { contentType },
    resumable: false,
  });
  const [url] = await file.getSignedUrl({ action: 'read', expires: '01-01-2500' });
  return url;
}