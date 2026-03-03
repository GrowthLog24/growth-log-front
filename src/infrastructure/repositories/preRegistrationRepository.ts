import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { IPreRegistrationRepository } from "@/domain/repositories";
import type { PreRegistrationConfig, PreRegistration, PreRegistrationField } from "@/domain/entities";

/**
 * 사전등록 Repository Firestore 구현체
 */
export class PreRegistrationRepository implements IPreRegistrationRepository {
  private preRegistrationsRef = collection(db, COLLECTIONS.PRE_REGISTRATIONS);
  private formFieldsRef = collection(db, COLLECTIONS.PRE_REGISTRATION_FORM_FIELDS);

  /**
   * 폼 필드 목록 조회
   */
  async getFormFields(): Promise<PreRegistrationField[]> {
    try {
      const q = query(this.formFieldsRef, orderBy("order", "asc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PreRegistrationField[];
    } catch (error) {
      console.error("Failed to fetch form fields:", error);
      return [];
    }
  }

  async getConfigByGeneration(generation: number): Promise<PreRegistrationConfig | null> {
    try {
      const docRef = doc(db, COLLECTIONS.PRE_REGISTRATION_CONFIG, String(generation));
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return null;
      }

      return {
        id: snapshot.id,
        ...snapshot.data(),
      } as PreRegistrationConfig;
    } catch (error) {
      console.error("Failed to fetch pre-registration config:", error);
      return null;
    }
  }

  /**
   * 다음 순번 조회
   */
  private async getNextSeq(): Promise<number> {
    const q = query(
      this.preRegistrationsRef,
      orderBy("seq", "desc"),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return 1;
    const lastDoc = snapshot.docs[0].data() as PreRegistration;
    return (lastDoc.seq || 0) + 1;
  }

  async submitPreRegistration(
    data: { generation: number; name: string; formData: Record<string, string> }
  ): Promise<string> {
    try {
      const nextSeq = await this.getNextSeq();

      const docRef = await addDoc(this.preRegistrationsRef, {
        seq: nextSeq,
        generation: data.generation,
        name: data.name,
        formData: data.formData,
        submittedAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      console.error("Failed to submit pre-registration:", error);
      throw new Error("사전등록 제출에 실패했습니다.");
    }
  }
}

export const preRegistrationRepository = new PreRegistrationRepository();
