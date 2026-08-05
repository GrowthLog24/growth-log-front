import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  query,
  orderBy,
  where,
  limit,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { PromotionLink, PromotionLinkScan } from "@/domain/entities";

/** 홍보물 QR 링크 생성·수정 입력값 */
export interface PromotionLinkInput {
  name: string;
  keyword: string;
  note: string;
  targetUrl: string;
  isActive: boolean;
}

/**
 * 홍보물 QR 링크 관리자 Repository
 */
export class PromotionLinkAdminRepository {
  private collectionRef = collection(db, COLLECTIONS.PROMOTION_LINKS);
  private scansRef = collection(db, COLLECTIONS.PROMOTION_LINK_SCANS);

  /**
   * 전체 링크 목록 조회 (최근 등록순)
   */
  async getAll(): Promise<PromotionLink[]> {
    const q = query(this.collectionRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PromotionLink[];
  }

  /**
   * 지정한 시각 이후의 스캔 기록을 조회합니다.
   *
   * 대시보드의 기간별 추이 집계에 사용합니다.
   *
   * @param {Date} from - 조회 시작 시각 (이 시각 포함)
   * @returns {Promise<PromotionLinkScan[]>} 오래된 순으로 정렬된 스캔 기록
   */
  async getScansSince(from: Date): Promise<PromotionLinkScan[]> {
    const q = query(
      this.scansRef,
      where("scannedAt", ">=", Timestamp.fromDate(from)),
      orderBy("scannedAt", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PromotionLinkScan[];
  }

  /**
   * 키워드가 이미 사용 중인지 확인합니다.
   *
   * 키워드는 QR 주소 그 자체이므로 중복되면 어느 홍보물의 링크인지
   * 구분할 수 없습니다. 저장 전에 반드시 확인합니다.
   *
   * @param {string} keyword - 정규화된 키워드
   * @param {string} [excludeId] - 검사에서 제외할 문서 ID (수정 중인 자기 자신)
   * @returns {Promise<boolean>} 사용 중이면 true
   */
  async isKeywordTaken(keyword: string, excludeId?: string): Promise<boolean> {
    const q = query(
      this.collectionRef,
      where("keyword", "==", keyword),
      limit(2)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.some((doc) => doc.id !== excludeId);
  }

  /**
   * 링크 생성
   */
  async create(data: PromotionLinkInput): Promise<string> {
    const docRef = await addDoc(this.collectionRef, {
      ...data,
      scanCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  /**
   * 링크 수정
   */
  async update(id: string, data: Partial<PromotionLinkInput>): Promise<void> {
    await updateDoc(doc(this.collectionRef, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * 링크 삭제
   */
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.collectionRef, id));
  }

  /**
   * 활성 상태 토글
   */
  async toggleActive(id: string, isActive: boolean): Promise<void> {
    await this.update(id, { isActive });
  }
}

export const promotionLinkAdminRepository = new PromotionLinkAdminRepository();
