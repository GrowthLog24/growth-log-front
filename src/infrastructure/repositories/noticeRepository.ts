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
    let q = query(
      this.noticesRef,
      orderBy("isPinned", "desc"),
      orderBy("publishedAt", "desc")
    );

    if (limit) {
      q = query(q, firestoreLimit(limit));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notice[];
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
