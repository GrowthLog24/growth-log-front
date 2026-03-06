import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { Event } from "@/domain/entities";

/**
 * 행사 Repository (읽기 전용)
 */
export class EventRepository {
  private collectionRef = collection(db, COLLECTIONS.EVENTS);

  /**
   * 활성화된 모든 행사 조회 (시작 시간 순)
   */
  async getAllActive(): Promise<Event[]> {
    const q = query(
      this.collectionRef,
      where("isActive", "==", true),
      orderBy("startTime", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Event[];
  }
}

export const eventRepository = new EventRepository();
