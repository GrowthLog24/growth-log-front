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
 * 홈페이지에 노출할 활동인지 판정합니다.
 *
 * `showOnHome`이 명시적으로 false인 경우에만 제외하므로,
 * 필드가 없는 기존 문서는 그대로 노출됩니다.
 */
function isVisibleOnHome(activity: Activity): boolean {
  return activity.showOnHome !== false;
}

/**
 * 활동 Repository (읽기 전용)
 * 홈페이지 및 Activity 페이지에서 사용
 */
export class ActivityRepository {
  private collectionRef = collection(db, COLLECTIONS.ACTIVITIES);

  /**
   * 전체 활동 목록 조회 (홈페이지 노출 대상만)
   */
  async getAllActivities(): Promise<Activity[]> {
    try {
      const q = query(
        this.collectionRef,
        where("isActive", "==", true),
        orderBy("order", "asc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }) as Activity)
        .filter(isVisibleOnHome);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
      return [];
    }
  }

  /**
   * 카테고리별 활동 목록 조회 (홈페이지 노출 대상만)
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
      return snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }) as Activity)
        .filter(isVisibleOnHome);
    } catch (error) {
      console.error(`Failed to fetch activities for category ${category}:`, error);
      return [];
    }
  }

  /**
   * 특정 회원이 제출한 성장일지 목록 조회
   *
   * `memberId`로 명시적으로 연결된 글만 조회합니다.
   * 이름 매칭 폴백을 두면 홈페이지용으로 등록된 글이 동명의 회원
   * 페이지에 의도치 않게 노출되므로, 공개 페이지에서는 사용하지 않습니다.
   * (관리자 화면은 미연결 글을 찾기 위해 이름 매칭을 계속 사용합니다)
   *
   * @param {MemberIdentity} member - 회원 식별 정보
   * @returns {Promise<GrowthLogActivity[]>} 회차 내림차순 성장일지 목록
   */
  async getGrowthLogsByMember(member: MemberIdentity): Promise<GrowthLogActivity[]> {
    try {
      const logs = (await this.queryActivities([
        where("category", "==", "growth-log"),
        where("memberId", "==", member.memberId),
      ])) as GrowthLogActivity[];

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
   * 참여자 배열(`participantMemberIds`)에 명시적으로 포함된 것만 조회합니다.
   * 성장일지와 같은 이유로 프로젝트장 이름 매칭 폴백은 사용하지 않습니다.
   *
   * @param {MemberIdentity} member - 회원 식별 정보
   * @returns {Promise<ProjectActivity[]>} 참여 프로젝트 목록
   */
  async getProjectsByMember(member: MemberIdentity): Promise<ProjectActivity[]> {
    try {
      const projects = (await this.queryActivities([
        where("category", "==", "project"),
        where("participantMemberIds", "array-contains", member.memberId),
      ])) as ProjectActivity[];

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
