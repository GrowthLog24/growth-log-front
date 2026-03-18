import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { Activity, ActivityCategory } from "@/domain/entities";

/**
 * 활동 Repository (읽기 전용)
 * 홈페이지 및 Activity 페이지에서 사용
 */
export class ActivityRepository {
  private collectionRef = collection(db, COLLECTIONS.ACTIVITIES);

  /**
   * 전체 활동 목록 조회 (활성화된 것만)
   */
  async getAllActivities(): Promise<Activity[]> {
    try {
      const q = query(
        this.collectionRef,
        where("isActive", "==", true),
        orderBy("order", "asc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Activity[];
    } catch (error) {
      console.error("Failed to fetch activities:", error);
      return [];
    }
  }

  /**
   * 카테고리별 활동 목록 조회 (활성화된 것만)
   */
  async getActivitiesByCategory(category: ActivityCategory): Promise<Activity[]> {
    try {
      const q = query(
        this.collectionRef,
        where("category", "==", category),
        where("isActive", "==", true),
        orderBy("generation", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Activity[];
    } catch (error) {
      console.error(`Failed to fetch activities for category ${category}:`, error);
      return [];
    }
  }
}

export const activityRepository = new ActivityRepository();
