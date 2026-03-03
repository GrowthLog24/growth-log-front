import {
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { FAQCategoryItem } from "@/domain/entities";

/**
 * FAQ 카테고리 공개용 Repository
 */
export const faqCategoryRepository = {
  /**
   * 모든 카테고리 조회 (순서대로)
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
};
