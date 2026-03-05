import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { CommunityBlog } from "@/domain/entities";

/**
 * 커뮤니티 블로그 Repository (읽기 전용)
 */
export class CommunityBlogRepository {
  private collectionRef = collection(db, COLLECTIONS.COMMUNITY_BLOGS);

  /**
   * 활성화된 커뮤니티 블로그 목록 조회
   */
  async getBlogs(limitCount?: number): Promise<CommunityBlog[]> {
    let q = query(
      this.collectionRef,
      where("isActive", "==", true),
      orderBy("publishedAt", "desc")
    );

    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CommunityBlog[];
  }

  /**
   * 기수별 커뮤니티 블로그 목록 조회
   */
  async getBlogsByGeneration(generation: number): Promise<CommunityBlog[]> {
    const q = query(
      this.collectionRef,
      where("isActive", "==", true),
      where("generation", "==", generation),
      orderBy("publishedAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CommunityBlog[];
  }
}

export const communityBlogRepository = new CommunityBlogRepository();
