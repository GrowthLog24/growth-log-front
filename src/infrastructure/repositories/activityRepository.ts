import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
} from "firebase/firestore";
import { db, COLLECTIONS, DOCUMENT_IDS, getSubCollection } from "@/infrastructure/firebase";
import type { IActivityRepository } from "@/domain/repositories";
import type { Activity, ActivityDetail, ActivityBody } from "@/domain/entities";

/**
 * 활동 Repository Firestore 구현체
 */
export class ActivityRepository implements IActivityRepository {
  private activitiesRef = collection(db, COLLECTIONS.ACTIVITIES);

  async getActivities(options?: {
    limit?: number;
    category?: string;
    startAfter?: string;
  }): Promise<Activity[]> {
    try {
      let q = query(this.activitiesRef, orderBy("publishedAt", "desc"));

      if (options?.category) {
        q = query(q, where("category", "==", options.category));
      }

      if (options?.limit) {
        q = query(q, firestoreLimit(options.limit));
      }

      if (options?.startAfter) {
        const lastDoc = await getDoc(doc(this.activitiesRef, options.startAfter));
        if (lastDoc.exists()) {
          q = query(q, startAfter(lastDoc));
        }
      }

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

  async getActivityById(id: string): Promise<ActivityDetail | null> {
    try {
      const activityDoc = await getDoc(doc(this.activitiesRef, id));

      if (!activityDoc.exists()) {
        return null;
      }

      const activity = {
        id: activityDoc.id,
        ...activityDoc.data(),
      } as Activity;

      // 본문 가져오기
      const bodyRef = doc(
        db,
        getSubCollection.activityBody(id),
        DOCUMENT_IDS.BODY_MAIN
      );
      const bodyDoc = await getDoc(bodyRef);

      const body: ActivityBody = bodyDoc.exists()
        ? (bodyDoc.data() as ActivityBody)
        : { contentMd: "", updatedAt: activity.updatedAt };

      return {
        ...activity,
        body,
      };
    } catch (error) {
      console.error("Failed to fetch activity by id:", error);
      return null;
    }
  }

  async getActivitiesByCategory(category: string): Promise<Activity[]> {
    try {
      const q = query(
        this.activitiesRef,
        where("category", "==", category),
        orderBy("publishedAt", "desc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Activity[];
    } catch (error) {
      console.error("Failed to fetch activities by category:", error);
      return [];
    }
  }

  async getFeaturedActivities(): Promise<Activity[]> {
    try {
      const q = query(
        this.activitiesRef,
        where("isFeatured", "==", true),
        orderBy("publishedAt", "desc"),
        firestoreLimit(9)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Activity[];
    } catch (error) {
      console.error("Failed to fetch featured activities:", error);
      return [];
    }
  }
}

export const activityRepository = new ActivityRepository();
