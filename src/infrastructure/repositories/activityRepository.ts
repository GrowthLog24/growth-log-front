import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  type QueryConstraint,
} from "firebase/firestore";
import { db, COLLECTIONS } from "@/infrastructure/firebase";
import type {
  Activity,
  ActivityCategory,
  GrowthLogActivity,
  ProjectActivity,
} from "@/domain/entities";

/**
 * 회원 식별 정보
 *
 * memberId가 없는 과거 데이터를 이름 기준으로 폴백 조회하기 위해
 * 이름과 기수를 함께 전달받습니다.
 */
export interface MemberIdentity {
  memberId: string;
  memberName: string;
  generation: number;
}

/**
 * 문서 ID 기준으로 중복을 제거합니다.
 */
function dedupeById<T extends { id: string }>(items: readonly T[]): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    map.set(item.id, item);
  }
  return [...map.values()];
}

/**
 * 활동 Repository (읽기 전용)
 * 홈페이지 및 Activity 페이지에서 사용
 */
export class ActivityRepository {
  private collectionRef = collection(db, COLLECTIONS.ACTIVITIES);

  /**
   * 전체 활동 목록 조회 (활성화된 것만)
   */
  async getAllActivities(): Promise<Activity[]> {
    try {
      const q = query(
        this.collectionRef,
        where("isActive", "==", true),
        orderBy("order", "asc")
      );
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

  /**
   * 카테고리별 활동 목록 조회 (활성화된 것만)
   */
  async getActivitiesByCategory(category: ActivityCategory): Promise<Activity[]> {
    try {
      const orderField = this.getOrderField(category);
      const q = query(
        this.collectionRef,
        where("category", "==", category),
        where("isActive", "==", true),
        orderBy(orderField, "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Activity[];
    } catch (error) {
      console.error(`Failed to fetch activities for category ${category}:`, error);
      return [];
    }
  }

  /**
   * 특정 회원이 제출한 성장일지 목록 조회
   *
   * memberId로 조회한 결과와, memberId가 없는 과거 데이터를 위한
   * 이름 + 기수 매칭 결과를 합칩니다.
   *
   * @param {MemberIdentity} member - 회원 식별 정보
   * @returns {Promise<GrowthLogActivity[]>} 회차 내림차순 성장일지 목록
   */
  async getGrowthLogsByMember(member: MemberIdentity): Promise<GrowthLogActivity[]> {
    try {
      const [byId, byName] = await Promise.all([
        this.queryActivities([
          where("category", "==", "growth-log"),
          where("memberId", "==", member.memberId),
        ]),
        this.queryActivities([
          where("category", "==", "growth-log"),
          where("authorName", "==", member.memberName),
          where("generation", "==", member.generation),
        ]),
      ]);

      const logs = dedupeById([...byId, ...byName]) as GrowthLogActivity[];

      return logs
        .filter((log) => log.isActive)
        .sort((a, b) => (b.round ?? 0) - (a.round ?? 0));
    } catch (error) {
      console.error(`Failed to fetch growth logs for member ${member.memberId}:`, error);
      return [];
    }
  }

  /**
   * 특정 회원이 참여한 프로젝트 목록 조회
   *
   * 참여자 배열(participantMemberIds)에 포함된 프로젝트와,
   * 참여자 정보가 없는 과거 데이터를 위해 프로젝트장 이름이 일치하는
   * 같은 기수 프로젝트를 함께 조회합니다.
   *
   * @param {MemberIdentity} member - 회원 식별 정보
   * @returns {Promise<ProjectActivity[]>} 참여 프로젝트 목록
   */
  async getProjectsByMember(member: MemberIdentity): Promise<ProjectActivity[]> {
    try {
      const [byParticipant, byLeader] = await Promise.all([
        this.queryActivities([
          where("category", "==", "project"),
          where("participantMemberIds", "array-contains", member.memberId),
        ]),
        this.queryActivities([
          where("category", "==", "project"),
          where("leaderName", "==", member.memberName),
          where("generation", "==", member.generation),
        ]),
      ]);

      const projects = dedupeById([
        ...byParticipant,
        ...byLeader,
      ]) as ProjectActivity[];

      return projects
        .filter((project) => project.isActive)
        .sort((a, b) => b.generation - a.generation || a.order - b.order);
    } catch (error) {
      console.error(`Failed to fetch projects for member ${member.memberId}:`, error);
      return [];
    }
  }

  /**
   * 조건 목록으로 활동을 조회합니다.
   *
   * 개별 쿼리 실패가 전체 집계를 막지 않도록 빈 배열로 흡수합니다.
   * (예: 색인 미생성, 신규 필드 미존재)
   */
  private async queryActivities(
    constraints: QueryConstraint[]
  ): Promise<Activity[]> {
    try {
      const snapshot = await getDocs(query(this.collectionRef, ...constraints));
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Activity[];
    } catch (error) {
      console.error("Activity query failed:", error);
      return [];
    }
  }

  /**
   * 카테고리별 정렬 기준 필드 반환
   */
  private getOrderField(category: ActivityCategory): string {
    switch (category) {
      case "lecture":
        return "lectureDate";
      case "growth-talk":
        return "eventDate";
      default:
        return "generation";
    }
  }
}

export const activityRepository = new ActivityRepository();
