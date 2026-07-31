import {
  collection,
  doc,
  getDoc,
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
    const found = snapshot.docs[0];
    return { id: found.id, ...found.data() } as Member;
  }

  /**
   * 문서 ID로 멤버 조회
   */
  async findById(id: string): Promise<Member | null> {
    const snapshot = await getDoc(doc(this.collectionRef, id));
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Member;
  }
}

export const memberRepository = new MemberRepository();
