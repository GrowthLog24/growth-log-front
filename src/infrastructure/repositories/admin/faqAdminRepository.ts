import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { FAQ } from "@/domain/entities";

type FAQInput = Omit<FAQ, "id" | "updatedAt">;
type FAQCreateInput = Omit<FAQInput, "order">;

/**
 * FAQ 관리자 Repository
 */
export class FAQAdminRepository {
  private faqsRef = collection(db, COLLECTIONS.FAQS);

  /**
   * 모든 FAQ 조회 (관리자용 - 비활성화 포함)
   */
  async getAllFAQs(): Promise<FAQ[]> {
    const q = query(this.faqsRef, orderBy("category"), orderBy("order"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FAQ[];
  }

  /**
   * FAQ 생성
   */
  async createFAQ(data: FAQInput): Promise<string> {
    const docRef = await addDoc(this.faqsRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  /**
   * FAQ 수정
   */
  async updateFAQ(id: string, data: Partial<FAQInput>): Promise<void> {
    const docRef = doc(this.faqsRef, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * FAQ 삭제
   */
  async deleteFAQ(id: string): Promise<void> {
    const docRef = doc(this.faqsRef, id);
    await deleteDoc(docRef);
  }

  /**
   * 활성 상태 토글
   */
  async toggleActive(id: string, isActive: boolean): Promise<void> {
    await this.updateFAQ(id, { isActive });
  }

  /**
   * 카테고리별 FAQ 조회
   */
  async getFAQsByCategory(category: string): Promise<FAQ[]> {
    const q = query(
      this.faqsRef,
      where("category", "==", category),
      orderBy("order", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FAQ[];
  }

  /**
   * 해당 카테고리의 다음 순서 반환
   */
  async getNextOrder(category: string): Promise<number> {
    const faqs = await this.getFAQsByCategory(category);
    if (faqs.length === 0) return 0;
    const maxOrder = Math.max(...faqs.map((f) => f.order));
    return maxOrder + 1;
  }

  /**
   * FAQ 생성 (순서 자동 지정)
   */
  async createFAQWithAutoOrder(data: FAQCreateInput): Promise<string> {
    const nextOrder = await this.getNextOrder(data.category);
    const docRef = await addDoc(this.faqsRef, {
      ...data,
      order: nextOrder,
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  /**
   * FAQ 순서 일괄 업데이트
   */
  async updateFAQsOrder(faqOrders: { id: string; order: number }[]): Promise<void> {
    await Promise.all(
      faqOrders.map(({ id, order }) => {
        const docRef = doc(this.faqsRef, id);
        return updateDoc(docRef, { order, updatedAt: serverTimestamp() });
      })
    );
  }
}

export const faqAdminRepository = new FAQAdminRepository();
