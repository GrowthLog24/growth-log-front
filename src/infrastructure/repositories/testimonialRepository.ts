import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { ITestimonialRepository } from "@/domain/repositories";
import type { Testimonial } from "@/domain/entities";

/**
 * 멤버 후기 Repository Firestore 구현체
 */
export class TestimonialRepository implements ITestimonialRepository {
  private testimonialsRef = collection(db, COLLECTIONS.TESTIMONIALS);

  async getActiveTestimonials(limit: number = 3): Promise<Testimonial[]> {
    try {
      const q = query(
        this.testimonialsRef,
        where("isActive", "==", true),
        orderBy("order", "asc"),
        firestoreLimit(limit)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Testimonial[];
    } catch (error) {
      console.error("Failed to fetch testimonials:", error);
      return [];
    }
  }
}

export const testimonialRepository = new TestimonialRepository();
