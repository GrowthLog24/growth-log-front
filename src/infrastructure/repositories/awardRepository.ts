import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { Award } from "@/domain/entities";

/**
 * Award Repository (읽기 전용)
 * 공개 페이지에서 수상 내역 표시에 사용
 */
export class AwardRepository {
  private collectionRef = collection(db, COLLECTIONS.AWARDS);

  /**
   * 활성화된 수상 내역 목록 조회
   * 정렬: order 오름차순
   *
   * Note: 복합 인덱스 없이 작동하도록 전체 조회 후 클라이언트에서 필터링/정렬
   */
  async getActiveAwards(): Promise<Award[]> {
    try {
      const snapshot = await getDocs(this.collectionRef);
      const awards = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Award[];

      // 활성화된 것만 필터링하고 order로 정렬
      return awards
        .filter((award) => award.isActive)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    } catch (error) {
      console.error("Failed to fetch awards:", error);
      return [];
    }
  }
}

export const awardRepository = new AwardRepository();
