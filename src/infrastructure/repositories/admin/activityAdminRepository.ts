import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type {
  Activity,
  ActivityCategory,
  ProjectActivity,
  StudyActivity,
  GrowthLogActivity,
  LectureActivity,
  GrowthTalkActivity,
  ClubActivity,
} from "@/domain/entities";

/**
 * 활동 기록자 Repository
 */
export class ActivityAdminRepository {
  private collectionRef = collection(db, COLLECTIONS.ACTIVITIES);

  /**
   * 전체 활동 목록 조회
   */
  async getAllActivities(): Promise<Activity[]> {
    const q = query(this.collectionRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Activity[];
  }

  /**
   * 카테고리별 활동 목록 조회
   */
  async getActivitiesByCategory(category: ActivityCategory): Promise<Activity[]> {
    const q = query(
      this.collectionRef,
      where("category", "==", category),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Activity[];
  }

  /**
   * 활동 상세 조회
   */
  async getActivity(id: string): Promise<Activity | null> {
    const docRef = doc(this.collectionRef, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Activity;
  }

  // ==================== 프로젝트 ====================

  async addProject(data: Omit<ProjectActivity, "id" | "category" | "createdAt" | "updatedAt">): Promise<string> {
    const docRef = await addDoc(this.collectionRef, {
      ...data,
      category: "project",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async updateProject(id: string, data: Partial<Omit<ProjectActivity, "id" | "category" | "createdAt" | "updatedAt">>): Promise<void> {
    const docRef = doc(this.collectionRef, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  // ==================== 학사 스터디 ====================

  async addStudy(data: Omit<StudyActivity, "id" | "category" | "createdAt" | "updatedAt">): Promise<string> {
    const docRef = await addDoc(this.collectionRef, {
      ...data,
      category: "study",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async updateStudy(id: string, data: Partial<Omit<StudyActivity, "id" | "category" | "createdAt" | "updatedAt">>): Promise<void> {
    const docRef = doc(this.collectionRef, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  // ==================== 성장일지 ====================

  async addGrowthLog(data: Omit<GrowthLogActivity, "id" | "category" | "createdAt" | "updatedAt">): Promise<string> {
    const docRef = await addDoc(this.collectionRef, {
      ...data,
      category: "growth-log",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async updateGrowthLog(id: string, data: Partial<Omit<GrowthLogActivity, "id" | "category" | "createdAt" | "updatedAt">>): Promise<void> {
    const docRef = doc(this.collectionRef, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  // ==================== 전문가 특강 ====================

  async addLecture(data: Omit<LectureActivity, "id" | "category" | "createdAt" | "updatedAt" | "lectureDate"> & { lectureDate: Date }): Promise<string> {
    const docRef = await addDoc(this.collectionRef, {
      ...data,
      lectureDate: Timestamp.fromDate(data.lectureDate),
      category: "lecture",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async updateLecture(id: string, data: Partial<Omit<LectureActivity, "id" | "category" | "createdAt" | "updatedAt" | "lectureDate"> & { lectureDate?: Date }>): Promise<void> {
    const docRef = doc(this.collectionRef, id);
    const updateData: Record<string, unknown> = { ...data, updatedAt: serverTimestamp() };
    if (data.lectureDate) {
      updateData.lectureDate = Timestamp.fromDate(data.lectureDate);
    }
    await updateDoc(docRef, updateData);
  }

  // ==================== 그로스톡 ====================

  async addGrowthTalk(data: Omit<GrowthTalkActivity, "id" | "category" | "createdAt" | "updatedAt" | "eventDate"> & { eventDate: Date }): Promise<string> {
    const docRef = await addDoc(this.collectionRef, {
      ...data,
      eventDate: Timestamp.fromDate(data.eventDate),
      category: "growth-talk",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async updateGrowthTalk(id: string, data: Partial<Omit<GrowthTalkActivity, "id" | "category" | "createdAt" | "updatedAt" | "eventDate"> & { eventDate?: Date }>): Promise<void> {
    const docRef = doc(this.collectionRef, id);
    const updateData: Record<string, unknown> = { ...data, updatedAt: serverTimestamp() };
    if (data.eventDate) {
      updateData.eventDate = Timestamp.fromDate(data.eventDate);
    }
    await updateDoc(docRef, updateData);
  }

  // ==================== 클럽 활동 ====================

  async addClub(data: Omit<ClubActivity, "id" | "category" | "createdAt" | "updatedAt">): Promise<string> {
    const docRef = await addDoc(this.collectionRef, {
      ...data,
      category: "club",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async updateClub(id: string, data: Partial<Omit<ClubActivity, "id" | "category" | "createdAt" | "updatedAt">>): Promise<void> {
    const docRef = doc(this.collectionRef, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  // ==================== 공통 ====================

  /**
   * 활동 삭제
   */
  async deleteActivity(id: string): Promise<void> {
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

export const activityAdminRepository = new ActivityAdminRepository();
