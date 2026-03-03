import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db, COLLECTIONS, getSubCollection, DOCUMENT_IDS } from "@/infrastructure/firebase";
import type { Activity, ActivityBody } from "@/domain/entities";

type ActivityInput = Omit<Activity, "id" | "createdAt" | "updatedAt">;

/**
 * 활동 관리자 Repository
 */
export class ActivityAdminRepository {
  private activitiesRef = collection(db, COLLECTIONS.ACTIVITIES);

  /**
   * 모든 활동 조회 (관리자용)
   */
  async getAllActivities(): Promise<Activity[]> {
    const q = query(this.activitiesRef, orderBy("publishedAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Activity[];
  }

  /**
   * 활동 생성
   */
  async createActivity(
    data: ActivityInput,
    body?: string
  ): Promise<string> {
    const now = serverTimestamp();
    const docRef = await addDoc(this.activitiesRef, {
      ...data,
      createdAt: now,
      updatedAt: now,
    });

    // 본문이 있으면 서브컬렉션에 저장
    if (body) {
      const bodyRef = doc(
        db,
        getSubCollection.activityBody(docRef.id),
        DOCUMENT_IDS.BODY_MAIN
      );
      await setDoc(bodyRef, {
        contentMd: body,
        updatedAt: now,
      });
    }

    return docRef.id;
  }

  /**
   * 활동 수정
   */
  async updateActivity(
    id: string,
    data: Partial<ActivityInput>,
    body?: string
  ): Promise<void> {
    const docRef = doc(this.activitiesRef, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    // 본문이 있으면 서브컬렉션 업데이트
    if (body !== undefined) {
      const bodyRef = doc(
        db,
        getSubCollection.activityBody(id),
        DOCUMENT_IDS.BODY_MAIN
      );
      await setDoc(
        bodyRef,
        {
          contentMd: body,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  }

  /**
   * 활동 삭제
   */
  async deleteActivity(id: string): Promise<void> {
    const docRef = doc(this.activitiesRef, id);
    await deleteDoc(docRef);
    // Note: 서브컬렉션(body)은 자동으로 삭제되지 않음
    // 필요시 Cloud Function으로 처리
  }

  /**
   * Featured 토글
   */
  async toggleFeatured(id: string, isFeatured: boolean): Promise<void> {
    await this.updateActivity(id, { isFeatured });
  }
}

export const activityAdminRepository = new ActivityAdminRepository();
