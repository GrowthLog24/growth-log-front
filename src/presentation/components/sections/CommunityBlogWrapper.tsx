import { communityBlogRepository } from "@/infrastructure/repositories/communityBlogRepository";
import { CommunityBlogSection } from "./CommunityBlogSection";
import { serializeFirestoreData } from "@/shared/utils/serialize";

/**
 * Community Blog 서버 래퍼 컴포넌트
 * Firestore에서 블로그 목록을 가져와 클라이언트 컴포넌트에 전달
 */
export async function CommunityBlogWrapper() {
  const blogs = await communityBlogRepository.getBlogs();

  // Client Component로 전달하기 위해 Plain Object로 직렬화
  const serializedBlogs = serializeFirestoreData(blogs);

  return <CommunityBlogSection initialBlogs={serializedBlogs} />;
}
