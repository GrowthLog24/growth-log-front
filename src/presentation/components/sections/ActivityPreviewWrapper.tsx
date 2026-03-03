import { activityRepository } from "@/infrastructure/repositories";
import { ActivityPreviewSection } from "./ActivityPreviewSection";

/**
 * Activity Preview 서버 래퍼 컴포넌트
 * Firestore에서 활동 데이터를 가져와 클라이언트 컴포넌트에 전달
 */
export async function ActivityPreviewWrapper() {
  // Firestore에서 Featured 활동 가져오기
  const activities = await activityRepository.getFeaturedActivities();

  return <ActivityPreviewSection initialActivities={activities} />;
}
