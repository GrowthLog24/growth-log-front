import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { Meeting } from "@/domain/entities";

/**
 * 정기모임 회차 Repository (읽기 전용)
 */
export class MeetingRepository {
  private collectionRef = collection(db, COLLECTIONS.MEETINGS);

  /**
   * 기수별 정기모임 회차 목록 조회 (집계 대상만, 회차 오름차순)
   */
  async getByGeneration(generation: number): Promise<Meeting[]> {
    try {
      const q = query(
        this.collectionRef,
        where("generation", "==", generation),
        where("isActive", "==", true),
        orderBy("round", "asc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Meeting[];
    } catch (error) {
      console.error(`Failed to fetch meetings for generation ${generation}:`, error);
      return [];
    }
  }
}

export const meetingRepository = new MeetingRepository();
