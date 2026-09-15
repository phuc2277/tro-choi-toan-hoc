/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Lớp truy cập dữ liệu Firestore cho tính năng "AI Truyện Tranh Bài Học".
 *
 * CẤU TRÚC DỮ LIỆU:
 * - comicProjects/{projectId}            → dự án truyện tranh (collection TOP-LEVEL,
 *   không lồng theo uid, để hỗ trợ chia sẻ cho đồng nghiệp). Mỗi document có:
 *     ownerUid, ownerEmail, ownerName    → giáo viên tạo ra dự án (toàn quyền)
 *     collaboratorEmails: string[]        → email các giáo viên khác được xem/sửa cùng
 * - users/{uid}/characterBank/{id}       → kho nhân vật CÁ NHÂN của từng giáo viên
 *   (không chia sẻ, chỉ để tái sử dụng nhân vật xuyên nhiều bài học của chính mình).
 *
 * Xem firestore.rules để biết quy tắc bảo mật tương ứng.
 *
 * LƯU Ý QUAN TRỌNG: các hàm lưu định kỳ (`saveProjectToCloud`) KHÔNG được đụng vào
 * các trường ownerUid/ownerEmail/ownerName/collaboratorEmails — nếu không, một
 * giáo viên được chia sẻ (collaborator) tự động lưu bài sẽ vô tình ghi đè quyền sở
 * hữu. Các trường đó chỉ được set khi tạo mới (`createCloudProject`) hoặc qua
 * `addCollaborator`/`removeCollaborator`.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from './firebaseClient';
import { ComicLessonProject, CharacterProfile } from '../../types/comicLesson';

export interface CloudProjectSummary {
  id: string;
  title: string;
  subject: string;
  grade: string;
  updatedAt: string;
  ownerUid: string;
  ownerName?: string;
  ownerEmail?: string;
  isOwner: boolean;
  collaboratorEmails: string[];
}

function requireDb() {
  if (!db) throw new Error('Firestore chưa được cấu hình (thiếu biến môi trường VITE_FIREBASE_*).');
  return db;
}

const projectsCol = () => collection(requireDb(), 'comicProjects');
const bankCol = (uid: string) => collection(requireDb(), 'users', uid, 'characterBank');

function toSummary(id: string, data: any, currentUid: string): CloudProjectSummary {
  return {
    id,
    title: data.title || 'Không tên',
    subject: data.knowledgeProfile?.subject || '',
    grade: data.knowledgeProfile?.grade || '',
    updatedAt: data.updatedAt || '',
    ownerUid: data.ownerUid,
    ownerName: data.ownerName,
    ownerEmail: data.ownerEmail,
    isOwner: data.ownerUid === currentUid,
    collaboratorEmails: data.collaboratorEmails || [],
  };
}

// Tạo mới 1 dự án trên đám mây — CHỈ gọi 1 lần lúc dự án chưa từng tồn tại trên Firestore.
// Thiết lập quyền sở hữu ban đầu (chỉ chủ sở hữu mới xoá được dự án hay quản lý cộng tác viên).
export async function createCloudProject(
  uid: string,
  ownerEmail: string | null,
  ownerName: string | null,
  project: ComicLessonProject
): Promise<void> {
  const ref = doc(projectsCol(), project.id);
  await setDoc(ref, {
    ...project,
    ownerUid: uid,
    ownerEmail: ownerEmail || '',
    ownerName: ownerName || ownerEmail || 'Giáo viên',
    collaboratorEmails: [],
    updatedAt: new Date().toISOString(),
  });
}

// Lưu định kỳ (auto-save) nội dung dự án — KHÔNG đụng tới các trường quyền sở hữu.
export async function saveProjectToCloud(project: ComicLessonProject): Promise<void> {
  const ref = doc(projectsCol(), project.id);
  await setDoc(ref, { ...project, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function loadProjectFromCloud(projectId: string): Promise<ComicLessonProject | null> {
  const snap = await getDoc(doc(projectsCol(), projectId));
  return snap.exists() ? (snap.data() as ComicLessonProject) : null;
}

// Danh sách dự án của tôi: gồm dự án tôi sở hữu + dự án đồng nghiệp chia sẻ cho tôi.
// Không dùng orderBy trên Firestore để tránh phải tạo composite index — sắp xếp ở client.
export async function listCloudProjects(uid: string, userEmail: string | null): Promise<CloudProjectSummary[]> {
  const ownedQ = query(projectsCol(), where('ownerUid', '==', uid), limit(50));
  const ownedSnap = await getDocs(ownedQ);
  const owned = ownedSnap.docs.map((d) => toSummary(d.id, d.data(), uid));

  let shared: CloudProjectSummary[] = [];
  if (userEmail) {
    const sharedQ = query(projectsCol(), where('collaboratorEmails', 'array-contains', userEmail.toLowerCase()), limit(50));
    const sharedSnap = await getDocs(sharedQ);
    shared = sharedSnap.docs.map((d) => toSummary(d.id, d.data(), uid));
  }

  const merged = [...owned, ...shared.filter((s) => !owned.some((o) => o.id === s.id))];
  merged.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  return merged;
}

// Chỉ chủ sở hữu mới xoá được (Firestore rules kiểm tra lại một lần nữa ở server).
export async function deleteCloudProject(projectId: string): Promise<void> {
  await deleteDoc(doc(projectsCol(), projectId));
}

// Thêm / gỡ đồng nghiệp khỏi danh sách được xem-sửa chung một dự án.
export async function addCollaborator(projectId: string, email: string): Promise<void> {
  const ref = doc(projectsCol(), projectId);
  await updateDoc(ref, { collaboratorEmails: arrayUnion(email.trim().toLowerCase()) });
}

export async function removeCollaborator(projectId: string, email: string): Promise<void> {
  const ref = doc(projectsCol(), projectId);
  await updateDoc(ref, { collaboratorEmails: arrayRemove(email.trim().toLowerCase()) });
}

// ---- Kho nhân vật cá nhân (không chia sẻ) ----
export async function saveCharacterToCloudBank(uid: string, character: CharacterProfile): Promise<void> {
  await setDoc(doc(bankCol(uid), character.id), character, { merge: true });
}

export async function saveCharactersToCloudBank(uid: string, characters: CharacterProfile[]): Promise<void> {
  await Promise.all(characters.map((c) => saveCharacterToCloudBank(uid, c)));
}

export async function loadCloudCharacterBank(uid: string): Promise<CharacterProfile[]> {
  const snap = await getDocs(bankCol(uid));
  return snap.docs.map((d) => d.data() as CharacterProfile);
}