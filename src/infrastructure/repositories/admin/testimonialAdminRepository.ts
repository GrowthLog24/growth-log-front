import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { Testimonial } from "@/domain/entities";

type TestimonialInput = Omit<Testimonial, "id" | "createdAt" | "updatedAt">;

/**
 * 멤버 후기 관리자 Repository
 */
export class TestimonialAdminRepository {
  private testimonialsRef = collection(db, COLLECTIONS.TESTIMONIALS);

  /**
   * 모든 멤버 후기 조회 (관리자용 - 비활성화 포함)
   */
  async getAllTestimonials(): Promise<Testimonial[]> {
    const q = query(this.testimonialsRef, orderBy("order"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Testimonial[];
  }

  /**
   * 멤버 후기 생성
   */
  async createTestimonial(data: TestimonialInput): Promise<string> {
    const now = serverTimestamp();
    const docRef = await addDoc(this.testimonialsRef, {
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  }

  /**
   * 멤버 후기 수정
   */
  async updateTestimonial(
    id: string,
    data: Partial<TestimonialInput>
  ): Promise<void> {
    const docRef = doc(this.testimonialsRef, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * 멤버 후기 삭제
   */
  async deleteTestimonial(id: string): Promise<void> {
    const docRef = doc(this.testimonialsRef, id);
    await deleteDoc(docRef);
  }

  /**
   * 활성 상태 토글
   */
  async toggleActive(id: string, isActive: boolean): Promise<void> {
    await this.updateTestimonial(id, { isActive });
  }
}

export const testimonialAdminRepository = new TestimonialAdminRepository();
