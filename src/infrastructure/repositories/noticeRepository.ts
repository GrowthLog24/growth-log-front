import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { INoticeRepository } from "@/domain/repositories";
import type { Notice } from "@/domain/entities";

/**
 * 공지사항 Repository Firestore 구현체
 */
export class NoticeRepository implements INoticeRepository {
  private noticesRef = collection(db, COLLECTIONS.NOTICES);

  async getNotices(limit?: number): Promise<Notice[]> {
    const snapshot = await getDocs(this.noticesRef);
    const notices = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notice[];

    // 정렬 순서: 1) isPinned (고정 공지 우선) 2) publishedAt 내림차순 (최신순)
    notices.sort((a, b) => {
      // 고정 공지가 항상 위로
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      // publishedAt 내림차순 (최신이 위로)
      const aTime = a.publishedAt?.toMillis?.() ?? (typeof a.publishedAt === 'number' ? a.publishedAt : 0);
      const bTime = b.publishedAt?.toMillis?.() ?? (typeof b.publishedAt === 'number' ? b.publishedAt : 0);
      return bTime - aTime;
    });

    if (limit) {
      return notices.slice(0, limit);
    }

    return notices;
  }

  async getNoticeById(id: string): Promise<Notice | null> {
    const docRef = doc(this.noticesRef, id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as Notice;
  }

  async getPinnedNotices(): Promise<Notice[]> {
    const q = query(
      this.noticesRef,
      where("isPinned", "==", true),
      orderBy("publishedAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notice[];
  }
}

export const noticeRepository = new NoticeRepository();
