import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { Award } from "@/domain/entities";

/**
 * 수상 내역 입력 데이터 (id, 시스템 필드 제외)
 */
type AwardInput = Omit<Award, "id" | "createdAt" | "updatedAt" | "awardDate"> & {
  awardDate: Date;
};

/**
 * 수상 내역 수정 데이터
 */
type AwardUpdateInput = Partial<Omit<AwardInput, "awardDate"> & { awardDate?: Date }>;

/**
 * Award Admin Repository
 * 관리자 페이지에서 수상 내역 CRUD에 사용
 */
export class AwardAdminRepository {
  private collectionRef = collection(db, COLLECTIONS.AWARDS);

  /**
   * 전체 수상 내역 목록 조회 (관리자용)
   */
  async getAllAwards(): Promise<Award[]> {
    const q = query(this.collectionRef, orderBy("order", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Award[];
  }

  /**
   * 수상 내역 상세 조회
   */
  async getAward(id: string): Promise<Award | null> {
    const docRef = doc(this.collectionRef, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Award;
  }

  /**
   * 수상 내역 추가
   */
  async addAward(data: AwardInput): Promise<string> {
    const docRef = await addDoc(this.collectionRef, {
      ...data,
      awardDate: Timestamp.fromDate(data.awardDate),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  /**
   * 수상 내역 수정
   */
  async updateAward(
    id: string,
    data: Partial<Omit<AwardInput, "awardDate"> & { awardDate?: Date }>
  ): Promise<void> {
    const docRef = doc(this.collectionRef, id);
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: serverTimestamp(),
    };
    if (data.awardDate) {
      updateData.awardDate = Timestamp.fromDate(data.awardDate);
    }
    await updateDoc(docRef, updateData);
  }

  /**
   * 수상 내역 삭제
   */
  async deleteAward(id: string): Promise<void> {
    const docRef = doc(this.collectionRef, id);
    await deleteDoc(docRef);
  }

  /**
   * 활성화/비활성화 토글
   */
  async toggleActive(id: string, isActive: boolean): Promise<void> {
    const docRef = doc(this.collectionRef, id);
    await updateDoc(docRef, {
      isActive,
      updatedAt: serverTimestamp(),
    });
  }
}

export const awardAdminRepository = new AwardAdminRepository();
