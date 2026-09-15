/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hook đăng nhập Google cho giáo viên, dùng riêng cho tính năng đồng bộ
 * đám mây của "AI Truyện Tranh Bài Học". Nếu dự án đã có hệ thống auth
 * dùng chung (ví dụ TeacherAuthBar hiện tại), có thể thay hook này bằng
 * hook/context auth có sẵn — chỉ cần đảm bảo trả về cùng shape { user, loading }
 * với `user.uid` là khoá dùng để lưu dữ liệu trên Firestore.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebaseClient';

export interface TeacherAuthState {
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutTeacher: () => Promise<void>;
}

export function useTeacherAuth(): TeacherAuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!auth) {
      setError('Firebase chưa được cấu hình (thiếu biến môi trường VITE_FIREBASE_*). Xem README-CLOUD-SYNC.md.');
      return;
    }
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.');
      }
    }
  }, []);

  const signOutTeacher = useCallback(async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
  }, []);

  return { user, loading, isConfigured: isFirebaseConfigured, error, signInWithGoogle, signOutTeacher };
}