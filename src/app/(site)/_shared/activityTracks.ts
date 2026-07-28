import { activityRepository } from "@/infrastructure/repositories/activityRepository";
import type { Activity, ActivityCategory } from "@/domain/entities";
import {
  serializeFirestoreData,
  type SerializedFirestoreData,
} from "@/shared/utils/serialize";

/**
 * 트랙 페이지 (5기 리뉴얼)
 *
 * Activity 한 페이지에 쌓여 있던 카테고리를 사용자 트랙별로 나눕니다.
 * - activity : 소속과 무관한 공통 활동 (성장일지, 클럽)
 * - dev-ai   : 개발/AI/커리어 (전문가 특강, 그로스톡)
 * - knou-cs  : 방송대 전공 (학사 스터디 + 학사 성격의 특강/그로스톡)
 */
export type TrackPage = "activity" | "dev-ai" | "knou-cs";

/** 활동을 KNOU CS 트랙으로 보내는 `field` 값 */
const KNOU_FIELD = "학사";

/**
 * 카테고리가 아니라 `field` 값으로 트랙이 갈리는 카테고리.
 * 같은 '전문가 특강'이라도 CS 주제면 KNOU CS, 그 외는 Dev×AI 로 갑니다.
 */
const FIELD_SPLIT_CATEGORIES: readonly ActivityCategory[] = ["lecture", "growth-talk"];

/** 페이지별로 조회할 카테고리 (표시 순서와 동일) */
const PAGE_CATEGORIES: Record<TrackPage, readonly ActivityCategory[]> = {
  activity: ["growth-log", "club"],
  "dev-ai": ["lecture", "growth-talk"],
  "knou-cs": ["study", "lecture", "growth-talk"],
};

export interface TrackSection {
  category: ActivityCategory;
  activities: SerializedFirestoreData<Activity>[];
}

/** 학사 성격 활동인지 판별 (판별 유니온으로 좁혀 캐스팅 없이 접근) */
function isKnouTrack(activity: Activity): boolean {
  if (activity.category === "growth-talk") return activity.field === KNOU_FIELD;
  if (activity.category === "lecture") return activity.field === KNOU_FIELD;
  return false;
}

function isSplitCategory(category: ActivityCategory): boolean {
  return FIELD_SPLIT_CATEGORIES.includes(category);
}

/** 해당 활동을 이 페이지에 노출할지 결정 */
function belongsToPage(page: TrackPage, category: ActivityCategory, activity: Activity): boolean {
  if (!isSplitCategory(category)) return true;
  // field 가 비어 있으면 Dev×AI 가 기본값 (기존 데이터 백필 없이 동작)
  return page === "knou-cs" ? isKnouTrack(activity) : !isKnouTrack(activity);
}

/**
 * 트랙 페이지에 표시할 카테고리 섹션을 조회합니다.
 *
 * `field` 로 갈리는 카테고리는 남는 항목이 없으면 섹션 자체를 생략해,
 * "아직 등록된 전문가 특강이 없습니다" 같은 빈 섹션이 뜨지 않게 합니다.
 *
 * @param page - 트랙 페이지
 * @returns 표시 순서대로 정렬된 섹션 목록
 */
export async function getTrackSections(page: TrackPage): Promise<TrackSection[]> {
  const categories = PAGE_CATEGORIES[page];

  const results = await Promise.all(
    categories.map((category) => activityRepository.getActivitiesByCategory(category))
  );

  const sections: TrackSection[] = [];
  categories.forEach((category, index) => {
    const kept = results[index].filter((activity) => belongsToPage(page, category, activity));
    if (kept.length === 0 && isSplitCategory(category)) return;
    sections.push({ category, activities: serializeFirestoreData(kept) });
  });

  return sections;
}
