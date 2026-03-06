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
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { Member, MemberType } from "@/domain/entities";

/**
 * 회원 구분 계산
 * 현재기수 - 가입기수 >= 1 이면 정회원, 아니면 신입회원
 */
export function calculateMemberType(
  currentGeneration: number,
  generation: number
): MemberType {
  return currentGeneration - generation >= 1 ? "정회원" : "신입회원";
}

/**
 * 멤버 관리자 Repository
 */
export class MemberAdminRepository {
  private collectionRef = collection(db, COLLECTIONS.MEMBERS);

  /**
   * 전체 멤버 목록 조회
   */
  async getAll(): Promise<Member[]> {
    const q = query(this.collectionRef, orderBy("generation", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Member[];
  }

  /**
   * 멤버 추가
   */
  async create(data: {
    memberName: string;
    generation: number;
    memberType: MemberType;
    isActive: boolean;
    redirectUrl?: string;
  }): Promise<string> {
    const docRef = await addDoc(this.collectionRef, {
      memberName: data.memberName,
      generation: data.generation,
      memberType: data.memberType,
      isActive: data.isActive,
      redirectUrl: data.redirectUrl || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  /**
   * 멤버 수정
   */
  async update(
    id: string,
    data: {
      memberName?: string;
      generation?: number;
      memberType?: MemberType;
      isActive?: boolean;
      redirectUrl?: string;
    }
  ): Promise<void> {
    const docRef = doc(this.collectionRef, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * 멤버 삭제
   */
  async delete(id: string): Promise<void> {
    const docRef = doc(this.collectionRef, id);
    await deleteDoc(docRef);
  }
}

export const memberAdminRepository = new MemberAdminRepository();
