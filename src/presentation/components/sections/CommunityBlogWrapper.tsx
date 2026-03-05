import { communityBlogRepository } from "@/infrastructure/repositories/communityBlogRepository";
import { CommunityBlogSection } from "./CommunityBlogSection";

/**
 * Community Blog 서버 래퍼 컴포넌트
 * Firestore에서 블로그 목록을 가져와 클라이언트 컴포넌트에 전달
 */
export async function CommunityBlogWrapper() {
  const blogs = await communityBlogRepository.getBlogs();

  return <CommunityBlogSection initialBlogs={blogs} />;
}
