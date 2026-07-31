import type { AttendanceStatus } from "@/domain/entities";
import {
  BADGE_DEFINITIONS,
  LEVEL_TIERS,
  XP_PER_EXTRA_LEVEL,
  XP_RULES,
  type AchievementContext,
  type BadgeTier,
} from "./rules";

export * from "./rules";

/**
 * 출결 집계에 사용하는 최소 단위 기록
 */
export interface AttendanceRecord {
  /** 회차 번호 */
  round: number;
  /** 출결 상태 */
  status: AttendanceStatus;
}

/**
 * 회원 출결 요약
 */
export interface AttendanceSummary {
  /** 집계 대상 회차 수 */
  totalMeetings: number;
  /** 출석 횟수 */
  presentCount: number;
  /** 지각 횟수 */
  lateCount: number;
  /** 사유 결석 횟수 (출석률 모수에서 제외) */
  excusedCount: number;
  /** 결석 횟수 (기록이 없는 회차 포함) */
  absentCount: number;
  /** 참석 횟수 (출석 + 지각) */
  attendedCount: number;
  /** 출석률 (0~100, 소수점 없이 반올림) */
  attendanceRate: number;
  /** 현재 이어지고 있는 연속 참석 횟수 */
  currentStreak: number;
  /** 최장 연속 참석 횟수 */
  longestStreak: number;
  /** 회차별 상태 (회차 오름차순) */
  timeline: readonly AttendanceRecord[];
}

/**
 * 레벨 진행 상황
 */
export interface LevelProgress {
  /** 현재 레벨 */
  level: number;
  /** 레벨 칭호 */
  title: string;
  /** 누적 경험치 */
  totalXp: number;
  /** 현재 레벨 진입에 필요했던 누적 경험치 */
  currentLevelXp: number;
  /** 다음 레벨 진입에 필요한 누적 경험치 */
  nextLevelXp: number;
  /** 현재 레벨 구간에서의 진행률 (0~100) */
  progressRate: number;
  /** 다음 레벨까지 남은 경험치 */
  xpToNextLevel: number;
}

/**
 * 획득 여부가 판정된 배지
 */
export interface EvaluatedBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: BadgeTier;
  /** 획득 여부 */
  earned: boolean;
  /** 진행률 (0~100) */
  progressRate: number;
}

/**
 * 회원의 출결 기록을 요약합니다.
 *
 * 기록이 존재하지 않는 회차는 결석으로 처리합니다.
 * 관리자가 참석자만 체크하는 운영 방식을 그대로 지원하기 위함입니다.
 *
 * @param {readonly number[]} meetingRounds - 집계 대상 회차 번호 목록
 * @param {readonly AttendanceRecord[]} records - 해당 회원의 출결 기록
 * @returns {AttendanceSummary} 출결 요약
 *
 * @example
 * summarizeAttendance([1, 2, 3], [{ round: 1, status: "present" }]);
 * // => { totalMeetings: 3, attendedCount: 1, attendanceRate: 33, ... }
 */
export function summarizeAttendance(
  meetingRounds: readonly number[],
  records: readonly AttendanceRecord[]
): AttendanceSummary {
  const statusByRound = new Map<number, AttendanceStatus>();
  for (const record of records) {
    statusByRound.set(record.round, record.status);
  }

  const sortedRounds = [...meetingRounds].sort((a, b) => a - b);

  const timeline: AttendanceRecord[] = [];
  let presentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;
  let absentCount = 0;
  let currentStreak = 0;
  let longestStreak = 0;

  for (const round of sortedRounds) {
    const status = statusByRound.get(round) ?? "absent";
    timeline.push({ round, status });

    switch (status) {
      case "present":
        presentCount += 1;
        break;
      case "late":
        lateCount += 1;
        break;
      case "excused":
        excusedCount += 1;
        break;
      case "absent":
        absentCount += 1;
        break;
    }

    // 사유 결석은 연속 기록을 끊지 않고 건너뜁니다.
    if (status === "present" || status === "late") {
      currentStreak += 1;
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
    } else if (status === "absent") {
      currentStreak = 0;
    }
  }

  const attendedCount = presentCount + lateCount;
  const denominator = sortedRounds.length - excusedCount;
  const attendanceRate =
    denominator > 0 ? Math.round((attendedCount / denominator) * 100) : 0;

  return {
    totalMeetings: sortedRounds.length,
    presentCount,
    lateCount,
    excusedCount,
    absentCount,
    attendedCount,
    attendanceRate,
    currentStreak,
    longestStreak,
    timeline,
  };
}

/**
 * 활동 실적으로부터 누적 경험치를 계산합니다.
 *
 * @param {AttendanceSummary} attendance - 출결 요약
 * @param {number} growthLogCount - 성장일지 제출 수
 * @param {number} projectCount - 참여 프로젝트 수
 * @returns {number} 누적 경험치
 */
export function calculateTotalXp(
  attendance: AttendanceSummary,
  growthLogCount: number,
  projectCount: number
): number {
  const attendanceXp =
    attendance.presentCount * XP_RULES.attendance.present +
    attendance.lateCount * XP_RULES.attendance.late;

  return (
    attendanceXp +
    growthLogCount * XP_RULES.growthLog +
    projectCount * XP_RULES.project
  );
}

/**
 * 누적 경험치로부터 레벨과 진행률을 계산합니다.
 *
 * 최고 구간을 넘어서면 `XP_PER_EXTRA_LEVEL`마다 레벨이 1씩 오르며,
 * 칭호는 최고 구간의 칭호를 유지합니다.
 *
 * @param {number} totalXp - 누적 경험치 (음수는 0으로 처리)
 * @returns {LevelProgress} 레벨 진행 상황
 */
export function calculateLevel(totalXp: number): LevelProgress {
  const xp = Math.max(0, Math.floor(totalXp));
  const topTier = LEVEL_TIERS[LEVEL_TIERS.length - 1];

  // 구간 테이블 내부에 위치하는 경우
  for (let i = LEVEL_TIERS.length - 1; i >= 0; i -= 1) {
    const tier = LEVEL_TIERS[i];
    if (xp < tier.requiredXp) continue;

    // 최고 구간을 넘어선 경우: 고정 간격으로 레벨을 연장합니다.
    if (i === LEVEL_TIERS.length - 1) {
      const extraLevels = Math.floor((xp - topTier.requiredXp) / XP_PER_EXTRA_LEVEL);
      const currentLevelXp = topTier.requiredXp + extraLevels * XP_PER_EXTRA_LEVEL;
      const nextLevelXp = currentLevelXp + XP_PER_EXTRA_LEVEL;
      return buildLevelProgress({
        level: topTier.level + extraLevels,
        title: topTier.title,
        xp,
        currentLevelXp,
        nextLevelXp,
      });
    }

    const nextTier = LEVEL_TIERS[i + 1];
    return buildLevelProgress({
      level: tier.level,
      title: tier.title,
      xp,
      currentLevelXp: tier.requiredXp,
      nextLevelXp: nextTier.requiredXp,
    });
  }

  const firstTier = LEVEL_TIERS[0];
  return buildLevelProgress({
    level: firstTier.level,
    title: firstTier.title,
    xp,
    currentLevelXp: firstTier.requiredXp,
    nextLevelXp: LEVEL_TIERS[1].requiredXp,
  });
}

function buildLevelProgress(params: {
  level: number;
  title: string;
  xp: number;
  currentLevelXp: number;
  nextLevelXp: number;
}): LevelProgress {
  const { level, title, xp, currentLevelXp, nextLevelXp } = params;
  const span = nextLevelXp - currentLevelXp;
  const gained = xp - currentLevelXp;

  return {
    level,
    title,
    totalXp: xp,
    currentLevelXp,
    nextLevelXp,
    progressRate: span > 0 ? Math.min(Math.round((gained / span) * 100), 100) : 100,
    xpToNextLevel: Math.max(nextLevelXp - xp, 0),
  };
}

/**
 * 모든 배지의 획득 여부와 진행률을 판정합니다.
 *
 * 획득한 배지가 앞쪽에 오도록 정렬하며,
 * 같은 그룹 안에서는 정의 순서를 유지합니다.
 *
 * @param {AchievementContext} context - 회원 활동 요약
 * @returns {EvaluatedBadge[]} 판정된 배지 목록
 */
export function evaluateBadges(context: AchievementContext): EvaluatedBadge[] {
  const evaluated = BADGE_DEFINITIONS.map((badge) => {
    const earned = badge.isEarned(context);
    return {
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      tier: badge.tier,
      earned,
      progressRate: earned ? 100 : Math.round(badge.progress(context) * 100),
    };
  });

  return evaluated.sort((a, b) => Number(b.earned) - Number(a.earned));
}
