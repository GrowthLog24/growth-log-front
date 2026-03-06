import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { Member } from "@/domain/entities";

/**
 * 멤버 Repository (읽기 전용)
 */
export class MemberRepository {
  private collectionRef = collection(db, COLLECTIONS.MEMBERS);

  /**
   * 기수와 이름으로 멤버 조회
   */
  async findByGenerationAndName(
    generation: number,
    memberName: string
  ): Promise<Member | null> {
    const q = query(
      this.collectionRef,
      where("generation", "==", generation),
      where("memberName", "==", memberName)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Member;
  }
}

export const memberRepository = new MemberRepository();
