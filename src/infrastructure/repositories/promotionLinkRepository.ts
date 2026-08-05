import {
  collection,
  doc,
  getDocs,
  updateDoc,
  serverTimestamp,
  query,
  where,
  limit,
  increment,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { PromotionLink } from "@/domain/entities";

/**
 * 홍보물 QR 링크 Repository (공개 리디렉트용)
 */
export class PromotionLinkRepository {
  private collectionRef = collection(db, COLLECTIONS.PROMOTION_LINKS);

  /**
   * 키워드로 링크를 조회합니다.
   *
   * @param {string} keyword - 정규화된 키워드
   * @returns {Promise<PromotionLink | null>} 링크. 없으면 null
   */
  async getByKeyword(keyword: string): Promise<PromotionLink | null> {
    const q = query(
      this.collectionRef,
      where("keyword", "==", keyword),
      limit(1)
    );
    const snapshot = await getDocs(q);
    const found = snapshot.docs[0];
    if (!found) return null;
    return { id: found.id, ...found.data() } as PromotionLink;
  }

  /**
   * 스캔 수를 1 증가시킵니다.
   *
   * 통계 기록이 실패해도 리디렉트 자체는 성공해야 하므로,
   * 호출하는 쪽에서 에러를 삼키고 진행합니다.
   *
   * @param {string} id - 링크 문서 ID
   */
  async increaseScanCount(id: string): Promise<void> {
    await updateDoc(doc(this.collectionRef, id), {
      scanCount: increment(1),
      lastScannedAt: serverTimestamp(),
    });
  }
}

export const promotionLinkRepository = new PromotionLinkRepository();
