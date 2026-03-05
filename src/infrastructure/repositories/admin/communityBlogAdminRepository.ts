import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type { CommunityBlog, CommunityBlogPlatform } from "@/domain/entities";

/**
 * 커뮤니티 블로그 관리자 Repository
 */
export class CommunityBlogAdminRepository {
  private collectionRef = collection(db, COLLECTIONS.COMMUNITY_BLOGS);

  /**
   * 전체 커뮤니티 블로그 목록 조회 (관리자용)
   */
  async getAllBlogs(): Promise<CommunityBlog[]> {
    const q = query(this.collectionRef, orderBy("publishedAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CommunityBlog[];
  }

  /**
   * 커뮤니티 블로그 상세 조회
   */
  async getBlog(id: string): Promise<CommunityBlog | null> {
    const docRef = doc(this.collectionRef, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as CommunityBlog;
  }

  /**
   * 커뮤니티 블로그 추가
   */
  async addBlog(data: {
    title: string;
    url: string;
    platform: CommunityBlogPlatform;
    thumbnailUrl: string;
    generation: number;
    publishedAt: Date;
  }): Promise<string> {
    const docRef = await addDoc(this.collectionRef, {
      title: data.title,
      url: data.url,
      platform: data.platform,
      thumbnailUrl: data.thumbnailUrl,
      generation: data.generation,
      publishedAt: data.publishedAt,
      order: 0,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  /**
   * 커뮤니티 블로그 수정
   */
  async updateBlog(
    id: string,
    data: Partial<{
      title: string;
      url: string;
      platform: CommunityBlogPlatform;
      thumbnailUrl: string;
      generation: number;
      publishedAt: Date;
      order: number;
      isActive: boolean;
    }>
  ): Promise<void> {
    const docRef = doc(this.collectionRef, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * 커뮤니티 블로그 삭제
   */
  async deleteBlog(id: string): Promise<void> {
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

export const communityBlogAdminRepository = new CommunityBlogAdminRepository();
