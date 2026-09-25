/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Khởi tạo Firebase (Auth + Firestore) — dùng để đăng nhập Google cho giáo viên
 * và đồng bộ dự án truyện tranh / kho nhân vật lên đám mây, thay vì chỉ lưu
 * trong localStorage của một trình duyệt.
 *
 * LƯU Ý: nếu dự án đã có sẵn cấu hình Firebase ở nơi khác (ví dụ đang dùng
 * chung cho toàn app, không riêng phần truyện tranh), hãy XOÁ file này và
 * sửa lại các import `from './firebaseClient'` trong `comicCloudStore.ts`
 * và `useTeacherAuth.ts` để trỏ tới file cấu hình Firebase có sẵn đó, tránh
 * khởi tạo app Firebase 2 lần.
 *
 * Cấu hình lấy từ biến môi trường VITE_FIREBASE_* (xem .env.example).
 * Đây là các giá trị công khai theo thiết kế của Firebase (không phải bí mật)
 * — quyền truy cập dữ liệu thực sự được kiểm soát bởi Firestore Security Rules
 * (xem firestore.rules) chứ không phải bằng cách giấu các giá trị này.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Cho phép app chạy bình thường (chế độ chỉ-lưu-cục-bộ) khi chưa cấu hình Firebase,
// thay vì crash trắng trang — quan trọng vì thầy/cô có thể chưa tạo Firebase project.
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

const app = isFirebaseConfigured ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;

export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app ? getFirestore(app) : null;
export const storage: FirebaseStorage | null = app ? getStorage(app) : null;