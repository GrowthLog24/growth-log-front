import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { Event } from "@/domain/entities";

/**
 * 행사 관리자 Repository
 */
export class EventAdminRepository {
  private collectionRef = collection(db, COLLECTIONS.EVENTS);

  /**
   * 전체 행사 목록 조회
   */
  async getAll(): Promise<Event[]> {
    const q = query(this.collectionRef, orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Event[];
  }

  /**
   * 행사 단건 조회
   */
  async getById(id: string): Promise<Event | null> {
    const docRef = doc(this.collectionRef, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Event;
  }

  /**
   * 행사 생성
   */
  async create(data: Omit<Event, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const docRef = doc(this.collectionRef);
    await setDoc(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  /**
   * 행사 수정
   */
  async update(
    id: string,
    data: Partial<Omit<Event, "id" | "createdAt" | "updatedAt">>
  ): Promise<void> {
    const docRef = doc(this.collectionRef, id);
    await setDoc(
      docRef,
      {
        ...data,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  /**
   * 행사 삭제
   */
  async delete(id: string): Promise<void> {
    const docRef = doc(this.collectionRef, id);
    await deleteDoc(docRef);
  }
}

export const eventAdminRepository = new EventAdminRepository();
