import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { IFAQRepository } from "@/domain/repositories";
import type { FAQ } from "@/domain/entities";

/**
 * FAQ Repository Firestore 구현체
 */
export class FAQRepository implements IFAQRepository {
  private faqsRef = collection(db, COLLECTIONS.FAQS);

  async getFAQs(): Promise<FAQ[]> {
    const q = query(
      this.faqsRef,
      where("isActive", "==", true),
      orderBy("category"),
      orderBy("order", "asc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FAQ[];
  }

  async getFAQsByCategory(category: string): Promise<FAQ[]> {
    const q = query(
      this.faqsRef,
      where("category", "==", category),
      where("isActive", "==", true),
      orderBy("order", "asc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FAQ[];
  }
}

export const faqRepository = new FAQRepository();
