import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { Notice } from "@/domain/entities";

type NoticeInput = Omit<Notice, "id" | "createdAt" | "updatedAt">;

/**
 * 공지사항 관리자 Repository
 * 조회는 기존 noticeRepository 사용
 */
export class NoticeAdminRepository {
  private noticesRef = collection(db, COLLECTIONS.NOTICES);

  /**
   * 공지사항 생성
   */
  async createNotice(data: NoticeInput): Promise<string> {
    const now = serverTimestamp();
    const docRef = await addDoc(this.noticesRef, {
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  }

  /**
   * 공지사항 수정
   */
  async updateNotice(id: string, data: Partial<NoticeInput>): Promise<void> {
    const docRef = doc(this.noticesRef, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * 공지사항 삭제
   */
  async deleteNotice(id: string): Promise<void> {
    const docRef = doc(this.noticesRef, id);
    await deleteDoc(docRef);
  }

  /**
   * 고정 상태 토글
   */
  async togglePinned(id: string, isPinned: boolean): Promise<void> {
    await this.updateNotice(id, { isPinned });
  }

  /**
   * 공지사항 순서 일괄 변경
   */
  async updateNoticesOrder(orders: { id: string; sortOrder: number }[]): Promise<void> {
    const batch = writeBatch(db);
    for (const { id, sortOrder } of orders) {
      const docRef = doc(this.noticesRef, id);
      batch.update(docRef, { sortOrder, updatedAt: serverTimestamp() });
    }
    await batch.commit();
  }
}

export const noticeAdminRepository = new NoticeAdminRepository();
