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

    // sortOrder 기준 정렬 (없는 경우 publishedAt desc 기준으로 뒤에 배치)
    notices.sort((a, b) => {
      const aOrder = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const bOrder = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      // sortOrder 동일 시 publishedAt 내림차순
      const aTime = a.publishedAt?.toMillis() ?? 0;
      const bTime = b.publishedAt?.toMillis() ?? 0;
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
