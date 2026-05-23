import type { Metadata } from "next";
import { ACTIVITY_CATEGORIES } from "@/shared/constants";
import { activityRepository } from "@/infrastructure/repositories/activityRepository";
import type { Activity, ActivityCategory } from "@/domain/entities";
import { ActivityCategorySection } from "./components/ActivityCategorySection";
import { serializeFirestoreData, type SerializedFirestoreData } from "@/shared/utils/serialize";

export const metadata: Metadata = {
  title: "Activity",
  description: "그로스로그의 다양한 활동을 확인하세요. 스터디, 성장일지, 특강, 그로스톡, 클럽 활동.",
};

/** 매 요청마다 최신 데이터 조회 (인덱스 안정화 후 revalidate = 3600으로 전환) */
export const dynamic = "force-dynamic";

/** Activity 페이지에서 사용하는 카테고리 (project 제외) */
type ActivityPageCategory = Exclude<ActivityCategory, "project">;

export default async function ActivityPage() {
  // 카테고리별로 활동 가져오기 (project는 /projects 페이지로 분리)
  const activitiesByCategory: Record<ActivityPageCategory, SerializedFirestoreData<Activity>[]> = {
    study: [],
    "growth-log": [],
    lecture: [],
    "growth-talk": [],
    club: [],
  };

  // 병렬로 모든 카테고리의 활동을 가져옴
  const results = await Promise.all(
    ACTIVITY_CATEGORIES.map((category) =>
      activityRepository.getActivitiesByCategory(category as ActivityCategory)
    )
  );

  // 결과를 카테고리별로 매핑 (Timestamp를 직렬화하여 Client Component에 전달)
  ACTIVITY_CATEGORIES.forEach((category, index) => {
    activitiesByCategory[category as ActivityPageCategory] = serializeFirestoreData(results[index]);
  });

  return (
    <>
      {/* Activity Sections by Category - project를 제외한 카테고리를 순서대로 표시 */}
      {ACTIVITY_CATEGORIES.map((category, index) => (
        <ActivityCategorySection
          key={category}
          category={category as ActivityCategory}
          activities={activitiesByCategory[category as ActivityPageCategory]}
          isOdd={index % 2 === 1}
        />
      ))}
    </>
  );
}
