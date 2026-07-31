import type { AttendanceStatus } from "@/domain/entities";

/**
 * 활동별 경험치 배점
 *
 * 값을 조정하면 레벨 산정 결과가 전체적으로 바뀝니다.
 * 운영 정책이 바뀔 때 이 상수만 수정하면 됩니다.
 */
export const XP_RULES = {
  /** 출결 상태별 경험치 */
  attendance: {
    present: 20,
    late: 10,
    excused: 0,
    absent: 0,
  } satisfies Record<AttendanceStatus, number>,
  /** 성장일지 1편당 경험치 */
  growthLog: 50,
  /** 프로젝트 1건 참여당 경험치 */
  project: 150,
} as const;

/**
 * 레벨 구간 정의
 *
 * `requiredXp`는 해당 레벨에 진입하기 위한 누적 경험치입니다.
 * 마지막 구간을 넘어서면 `XP_PER_EXTRA_LEVEL`씩 레벨이 오릅니다.
 */
export const LEVEL_TIERS: readonly { level: number; requiredXp: number; title: string }[] = [
  { level: 1, requiredXp: 0, title: "씨앗" },
  { level: 2, requiredXp: 100, title: "새싹" },
  { level: 3, requiredXp: 250, title: "떡잎" },
  { level: 4, requiredXp: 450, title: "잎새" },
  { level: 5, requiredXp: 700, title: "가지" },
  { level: 6, requiredXp: 1000, title: "줄기" },
  { level: 7, requiredXp: 1400, title: "나무" },
  { level: 8, requiredXp: 1900, title: "고목" },
  { level: 9, requiredXp: 2500, title: "숲" },
  { level: 10, requiredXp: 3200, title: "생태계" },
];

/** 최고 레벨 구간을 넘어선 뒤 레벨 1당 필요한 경험치 */
export const XP_PER_EXTRA_LEVEL = 800;

/**
 * 배지 등급
 * - bronze < silver < gold < platinum 순으로 희소합니다.
 */
export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";

/**
 * 배지 등급 라벨
 */
export const BADGE_TIER_LABELS: Record<BadgeTier, string> = {
  bronze: "브론즈",
  silver: "실버",
  gold: "골드",
  platinum: "플래티넘",
};

/**
 * 배지 판정에 필요한 회원 활동 요약
 */
export interface AchievementContext {
  /** 집계 대상 정기모임 회차 수 */
  totalMeetings: number;
  /** 출석 + 지각 횟수 */
  attendedCount: number;
  /** 출석률 (0~100) */
  attendanceRate: number;
  /** 최장 연속 참석 횟수 */
  longestStreak: number;
  /** 제출한 성장일지 수 */
  growthLogCount: number;
  /** 참여한 프로젝트 수 */
  projectCount: number;
}

/**
 * 배지 정의
 *
 * `icon`은 lucide-react 아이콘 이름 문자열입니다.
 * 도메인 레이어가 UI 라이브러리에 의존하지 않도록 식별자만 보관하고,
 * 실제 아이콘 매핑은 presentation 레이어에서 수행합니다.
 */
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: BadgeTier;
  /** 획득 조건 판정 */
  isEarned: (ctx: AchievementContext) => boolean;
  /** 진행률 계산 (0~1). 미획득 배지의 달성 정도 표시에 사용 */
  progress: (ctx: AchievementContext) => number;
}

/**
 * 0~1 범위로 진행률을 정규화합니다.
 */
function ratio(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(current / target, 1);
}

/**
 * 배지 목록
 *
 * 배열 순서가 UI 노출 순서입니다.
 */
export const BADGE_DEFINITIONS: readonly BadgeDefinition[] = [
  {
    id: "first-attendance",
    name: "첫 발걸음",
    description: "정기모임에 처음 참석했습니다.",
    icon: "Footprints",
    tier: "bronze",
    isEarned: (ctx) => ctx.attendedCount >= 1,
    progress: (ctx) => ratio(ctx.attendedCount, 1),
  },
  {
    id: "streak-3",
    name: "리듬 만들기",
    description: "정기모임에 3회 연속 참석했습니다.",
    icon: "Flame",
    tier: "bronze",
    isEarned: (ctx) => ctx.longestStreak >= 3,
    progress: (ctx) => ratio(ctx.longestStreak, 3),
  },
  {
    id: "streak-5",
    name: "꾸준함의 증명",
    description: "정기모임에 5회 연속 참석했습니다.",
    icon: "Zap",
    tier: "silver",
    isEarned: (ctx) => ctx.longestStreak >= 5,
    progress: (ctx) => ratio(ctx.longestStreak, 5),
  },
  {
    id: "streak-10",
    name: "무결의 기록",
    description: "정기모임에 10회 연속 참석했습니다.",
    icon: "Trophy",
    tier: "gold",
    isEarned: (ctx) => ctx.longestStreak >= 10,
    progress: (ctx) => ratio(ctx.longestStreak, 10),
  },
  {
    id: "perfect-attendance",
    name: "개근왕",
    description: "3회차 이상 진행된 정기모임에 100% 참석했습니다.",
    icon: "Crown",
    tier: "platinum",
    isEarned: (ctx) => ctx.totalMeetings >= 3 && ctx.attendanceRate >= 100,
    progress: (ctx) => (ctx.totalMeetings >= 3 ? ratio(ctx.attendanceRate, 100) : 0),
  },
  {
    id: "first-growth-log",
    name: "기록의 시작",
    description: "첫 성장일지를 제출했습니다.",
    icon: "PenLine",
    tier: "bronze",
    isEarned: (ctx) => ctx.growthLogCount >= 1,
    progress: (ctx) => ratio(ctx.growthLogCount, 1),
  },
  {
    id: "growth-log-5",
    name: "쌓이는 문장",
    description: "성장일지를 5편 제출했습니다.",
    icon: "BookOpen",
    tier: "silver",
    isEarned: (ctx) => ctx.growthLogCount >= 5,
    progress: (ctx) => ratio(ctx.growthLogCount, 5),
  },
  {
    id: "growth-log-10",
    name: "기록 장인",
    description: "성장일지를 10편 제출했습니다.",
    icon: "Library",
    tier: "gold",
    isEarned: (ctx) => ctx.growthLogCount >= 10,
    progress: (ctx) => ratio(ctx.growthLogCount, 10),
  },
  {
    id: "project-participant",
    name: "함께 만든 것",
    description: "프로젝트에 참여했습니다.",
    icon: "Rocket",
    tier: "silver",
    isEarned: (ctx) => ctx.projectCount >= 1,
    progress: (ctx) => ratio(ctx.projectCount, 1),
  },
  {
    id: "project-veteran",
    name: "빌더",
    description: "프로젝트에 3회 이상 참여했습니다.",
    icon: "Hammer",
    tier: "gold",
    isEarned: (ctx) => ctx.projectCount >= 3,
    progress: (ctx) => ratio(ctx.projectCount, 3),
  },
  {
    id: "all-rounder",
    name: "올라운더",
    description: "출석, 성장일지, 프로젝트를 모두 경험했습니다.",
    icon: "Sparkles",
    tier: "platinum",
    isEarned: (ctx) =>
      ctx.attendedCount >= 1 && ctx.growthLogCount >= 1 && ctx.projectCount >= 1,
    progress: (ctx) => {
      const done = [ctx.attendedCount, ctx.growthLogCount, ctx.projectCount].filter(
        (count) => count >= 1
      ).length;
      return ratio(done, 3);
    },
  },
];
