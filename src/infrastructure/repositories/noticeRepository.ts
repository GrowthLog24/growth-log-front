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

/** Firestore Timestamp 또는 직렬화된 number를 밀리초로 변환 */
function toMillis(value: Notice["eventDate"] | number | undefined): number {
  if (!value) return 0;
  return typeof value === "number" ? value : value.toMillis();
}

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

    // 정렬 순서: 1) isPinned (고정 공지 우선) 2) eventDate 내림차순 (행사일이 최신인 순)
    notices.sort((a, b) => {
      // 고정 공지가 항상 위로
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      // eventDate 내림차순, 마이그레이션 이전 데이터는 publishedAt으로 대체
      const aTime = toMillis(a.eventDate ?? a.publishedAt);
      const bTime = toMillis(b.eventDate ?? b.publishedAt);
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
      orderBy("eventDate", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notice[];
  }
}

export const noticeRepository = new NoticeRepository();
