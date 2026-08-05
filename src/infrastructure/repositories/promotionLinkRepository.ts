import {
  collection,
  doc,
  addDoc,
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
  private scansRef = collection(db, COLLECTIONS.PROMOTION_LINK_SCANS);

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
   * 스캔 1회를 기록합니다.
   *
   * 링크 문서의 누적 수치(빠른 조회용)와 스캔 이벤트 문서(기간별 추이 집계용)를
   * 함께 남깁니다. 통계 기록이 실패해도 리디렉트 자체는 성공해야 하므로,
   * 호출하는 쪽에서 에러를 삼키고 진행합니다.
   *
   * @param {Pick<PromotionLink, "id" | "keyword">} link - 스캔된 링크
   */
  async recordScan(link: Pick<PromotionLink, "id" | "keyword">): Promise<void> {
    await Promise.all([
      updateDoc(doc(this.collectionRef, link.id), {
        scanCount: increment(1),
        lastScannedAt: serverTimestamp(),
      }),
      addDoc(this.scansRef, {
        linkId: link.id,
        keyword: link.keyword,
        scannedAt: serverTimestamp(),
      }),
    ]);
  }
}

export const promotionLinkRepository = new PromotionLinkRepository();
