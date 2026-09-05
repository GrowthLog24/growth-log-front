import type { AttendanceStatus, MemberType } from "@/domain/entities";
import type { BadgeTier } from "@/domain/achievements";

/**
 * 회원 업적 페이지 DTO
 *
 * Firestore Timestamp 같은 클래스 인스턴스는 서버 컴포넌트에서
 * 클라이언트 컴포넌트로 전달할 수 없으므로, 날짜는 모두
 * epoch 밀리초(number)로 변환해 담습니다.
 */
export interface MemberAchievementDto {
  member: MemberProfileDto;
  level: LevelProgressDto;
  attendance: AttendanceSummaryDto;
  badges: readonly BadgeDto[];
  growthLogs: readonly GrowthLogSummaryDto[];
  projects: readonly ProjectSummaryDto[];
}

/**
 * 회원 기본 정보
 */
export interface MemberProfileDto {
  id: string;
  memberName: string;
  generation: number;
  memberType: MemberType;
  isActive: boolean;
  /** 프로필 이미지 URL. 없으면 null */
  profileImageUrl: string | null;
  /** 한 줄 소개. 없으면 null */
  bio: string | null;
  /** 기술 분야. 없으면 null */
  field: string | null;
}

/**
 * 레벨 진행 상황
 */
export interface LevelProgressDto {
  level: number;
  title: string;
  totalXp: number;
  nextLevelXp: number;
  currentLevelXp: number;
  progressRate: number;
  xpToNextLevel: number;
}

/**
 * 출결 요약
 */
export interface AttendanceSummaryDto {
  totalMeetings: number;
  presentCount: number;
  lateCount: number;
  excusedCount: number;
  absentCount: number;
  attendedCount: number;
  attendanceRate: number;
  currentStreak: number;
  longestStreak: number;
  timeline: readonly AttendanceTimelineItemDto[];
}

/**
 * 회차별 출결 항목
 */
export interface AttendanceTimelineItemDto {
  /** 기수 (같은 회차 번호라도 기수가 다르면 다른 회차) */
  generation: number;
  round: number;
  status: AttendanceStatus;
  meetingTitle: string;
  /** 모임 일자 (epoch ms). 값이 없으면 null */
  meetingDateMs: number | null;
}

/**
 * 배지
 */
export interface BadgeDto {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: BadgeTier;
  earned: boolean;
  progressRate: number;
}

/**
 * 성장일지 요약
 */
export interface GrowthLogSummaryDto {
  id: string;
  title: string;
  field: string;
  excerpt: string;
  blogUrl: string;
  thumbnailUrl: string;
  /** 제출 회차. 연결된 회차가 없으면 null */
  round: number | null;
  /** 제출 회차명. 연결된 회차가 없으면 null */
  meetingTitle: string | null;
  /** 제출 회차 일자 (epoch ms) */
  meetingDateMs: number | null;
}

/**
 * 참여 프로젝트 요약
 */
export interface ProjectSummaryDto {
  id: string;
  projectName: string;
  platform: string;
  description: string;
  thumbnailUrl: string;
  blogUrl: string;
  generation: number;
  /** 프로젝트 내 역할 */
  role: "리더" | "팀원";
}
