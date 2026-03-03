import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { FAQCategoryItem } from "@/domain/entities";

/**
 * FAQ 카테고리 관리 Repository
 */
export const faqCategoryAdminRepository = {
  /**
   * 모든 카테고리 조회
   */
  async getCategories(): Promise<FAQCategoryItem[]> {
    const q = query(
      collection(db, COLLECTIONS.FAQ_CATEGORIES),
      orderBy("order", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FAQCategoryItem[];
  },

  /**
   * 카테고리 추가
   */
  async addCategory(name: string, order: number): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.FAQ_CATEGORIES), {
      name,
      order,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /**
   * 카테고리 수정
   */
  async updateCategory(id: string, name: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.FAQ_CATEGORIES, id);
    await updateDoc(docRef, { name });
  },

  /**
   * 카테고리 순서 변경
   */
  async updateCategoryOrder(id: string, order: number): Promise<void> {
    const docRef = doc(db, COLLECTIONS.FAQ_CATEGORIES, id);
    await updateDoc(docRef, { order });
  },

  /**
   * 카테고리 삭제
   */
  async deleteCategory(id: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.FAQ_CATEGORIES, id);
    await deleteDoc(docRef);
  },
};
