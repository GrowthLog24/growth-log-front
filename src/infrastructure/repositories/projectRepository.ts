import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { ProjectActivity } from "@/domain/entities";

/**
 * Project Repository (읽기 전용)
 * 공개 Projects 페이지에서 프로젝트 목록 표시에 사용
 */
export class ProjectRepository {
  private collectionRef = collection(db, COLLECTIONS.ACTIVITIES);

  /**
   * 활성화된 프로젝트 목록 조회
   * 정렬: 기수 내림차순 (최신 기수 먼저)
   */
  async getActiveProjects(): Promise<ProjectActivity[]> {
    try {
      const q = query(
        this.collectionRef,
        where("category", "==", "project"),
        where("isActive", "==", true),
        orderBy("generation", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ProjectActivity[];
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      return [];
    }
  }
}

export const projectRepository = new ProjectRepository();
