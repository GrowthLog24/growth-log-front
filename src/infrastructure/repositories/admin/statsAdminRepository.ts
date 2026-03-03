import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, COLLECTIONS, DOCUMENT_IDS } from "@/infrastructure/firebase";
import type { Stats } from "@/domain/entities";

/**
 * 통계 관리자 Repository
 * 조회는 기존 statsRepository 사용
 */
export class StatsAdminRepository {
  /**
   * 통계 업데이트
   */
  async updateStats(data: Omit<Stats, "updatedAt">): Promise<void> {
    const docRef = doc(db, COLLECTIONS.STATS, DOCUMENT_IDS.STATS_MAIN);
    await setDoc(
      docRef,
      {
        ...data,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}

export const statsAdminRepository = new StatsAdminRepository();
