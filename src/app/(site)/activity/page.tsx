import type { Metadata } from "next";
import { ACTIVITY_CATEGORIES } from "@/shared/constants";
import { activityRepository } from "@/infrastructure/repositories";
import type { Activity } from "@/domain/entities";
import { ActivityCategorySection } from "./components/ActivityCategorySection";

export const metadata: Metadata = {
  title: "Activity",
  description: "그로스로그의 다양한 활동을 확인하세요. 프로젝트, 스터디, 특강 등.",
};

export default async function ActivityPage() {
  // 카테고리별로 활동 가져오기
  const activitiesByCategory: Record<string, Activity[]> = {};

  for (const category of ACTIVITY_CATEGORIES) {
    const activities = await activityRepository.getActivitiesByCategory(category);
    if (activities.length > 0) {
      activitiesByCategory[category] = activities;
    }
  }

  const hasActivities = Object.keys(activitiesByCategory).length > 0;

  return (
    <>
      {/* Page Header */}
      <section className="section-padding bg-white pb-8">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            모든활동
          </h1>
          <p className="mt-4 text-muted-foreground">
            그로스로그의 다양한 활동들을 확인해보세요.
          </p>
        </div>
      </section>

      {/* 활동이 없을 때 */}
      {!hasActivities && (
        <section className="py-24 bg-gray-6">
          <div className="container-custom text-center">
            <p className="text-muted-foreground">
              아직 등록된 활동이 없습니다.
            </p>
          </div>
        </section>
      )}

      {/* Activity Sections by Category */}
      {ACTIVITY_CATEGORIES.map((category, index) => {
        const activities = activitiesByCategory[category];
        if (!activities || activities.length === 0) return null;

        return (
          <ActivityCategorySection
            key={category}
            category={category}
            activities={activities}
            isOdd={index % 2 === 1}
          />
        );
      })}
    </>
  );
}
