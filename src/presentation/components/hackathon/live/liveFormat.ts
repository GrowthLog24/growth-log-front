import { HACKATHON_NOTICE_MINUTES } from "@/domain/hackathon/constants";
import { compareScores } from "@/domain/hackathon/rules";
import type {
  HackathonCriterionScore,
  HackathonScore,
  HackathonSubmission,
  HackathonTeam,
} from "@/domain/hackathon/types";

const MINUTE_MS = 60_000;

/** 빨간 경고 단계로 바뀌는 남은 시간 (분) */
const CRITICAL_MINUTES = 1;
/** 주황 경고 단계로 바뀌는 남은 시간 (분) */
const WARNING_MINUTES = 10;

const KST_CLOCK = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Seoul",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

const KST_HOUR_MINUTE = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Seoul",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/**
 * epoch ms를 KST 기준 HH:MM:SS로 바꿉니다.
 *
 * @param {number} ms - epoch ms
 * @returns {string} 예: "15:42:07"
 */
export function formatKstClock(ms: number): string {
  return KST_CLOCK.format(ms);
}

/**
 * epoch ms를 KST 기준 HH:MM으로 바꿉니다.
 *
 * @param {number} ms - epoch ms
 * @returns {string} 예: "17:10"
 */
export function formatKstHourMinute(ms: number): string {
  return KST_HOUR_MINUTE.format(ms);
}

/** 남은 시간에 따른 화면 긴장도 */
export type UrgencyTone = "calm" | "notice" | "warning" | "critical";

/** 종료 임박 공지 */
export interface DeadlineNotice {
  /** 공지 기준 분 (20 / 10 / 1) */
  minutes: number;
  tone: UrgencyTone;
}

/**
 * 남은 시간으로 종료 임박 공지 단계를 구합니다. 공지 구간이 아니면 null.
 *
 * @param {number} remainingMs - 마감까지 남은 밀리초
 * @returns {DeadlineNotice | null} 가장 가까운 공지 단계
 */
export function getDeadlineNotice(remainingMs: number): DeadlineNotice | null {
  if (remainingMs <= 0) return null;
  const sorted = [...HACKATHON_NOTICE_MINUTES].sort((a, b) => a - b);
  const minutes = sorted.find((m) => remainingMs <= m * MINUTE_MS);
  if (minutes === undefined) return null;
  return { minutes, tone: getUrgencyTone(remainingMs) };
}

/**
 * 남은 시간으로 색 단계를 구합니다. (≤1분 빨강, ≤10분 주황, ≤20분 공지)
 *
 * @param {number} remainingMs - 마감까지 남은 밀리초
 * @returns {UrgencyTone} 색 단계
 */
export function getUrgencyTone(remainingMs: number): UrgencyTone {
  const noticeMax = Math.max(...HACKATHON_NOTICE_MINUTES);
  if (remainingMs <= CRITICAL_MINUTES * MINUTE_MS) return "critical";
  if (remainingMs <= WARNING_MINUTES * MINUTE_MS) return "warning";
  if (remainingMs <= noticeMax * MINUTE_MS) return "notice";
  return "calm";
}

/**
 * 제작 구간 경과 비율(0~1)을 구합니다.
 *
 * @param {number} now - 현재 시각 (epoch ms)
 * @param {number} startAt - 시작 시각
 * @param {number} endAt - 마감 시각
 * @returns {number} 0 이상 1 이하
 */
export function getElapsedRatio(now: number, startAt: number, endAt: number): number {
  const total = endAt - startAt;
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, (now - startAt) / total));
}

/**
 * URL에서 프로토콜을 떼어 화면 표시용으로 줄입니다.
 *
 * @param {string} url - 전체 URL
 * @returns {string} 예: "growthlog.kr/hackathon"
 */
export function toDisplayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/** 결과 화면 한 줄 */
export interface ResultRow {
  team: HackathonTeam;
  submission: HackathonSubmission | null;
  score: HackathonScore | null;
  /** 채점된 팀만 1부터 시작, 채점 중이면 null */
  rank: number | null;
}

/**
 * 팀별 점수를 총점 내림차순으로 정렬합니다. 동점은 같은 순위, 채점 전 팀은 맨 뒤.
 *
 * @param {readonly HackathonTeam[]} teams - 팀 목록
 * @param {readonly HackathonScore[]} scores - 채점 결과
 * @param {readonly HackathonSubmission[]} submissions - 제출물
 * @returns {ResultRow[]} 순위표
 */
export function rankTeams(
  teams: readonly HackathonTeam[],
  scores: readonly HackathonScore[],
  submissions: readonly HackathonSubmission[]
): ResultRow[] {
  const scoreByTeam = new Map(scores.map((s) => [s.teamId, s]));
  const submissionByTeam = new Map(submissions.map((s) => [s.teamId, s]));
  const rows = teams.map((team, index) => ({
    team,
    index,
    submission: submissionByTeam.get(team.id) ?? null,
    score: scoreByTeam.get(team.id) ?? null,
  }));
  rows.sort((a, b) => {
    if (a.score && b.score) return compareScores(a.score, b.score) || a.index - b.index;
    if (a.score || b.score) return a.score ? -1 : 1;
    return a.index - b.index;
  });

  const result: ResultRow[] = [];
  for (const [position, row] of rows.entries()) {
    const previous = result[position - 1];
    let rank: number | null = null;
    if (row.score) {
      // 총점·핵심 기능 점수가 모두 같을 때만 공동 순위 (그 이후는 운영진 판단)
      const isTie = previous?.score && compareScores(previous.score, row.score) === 0;
      rank = isTie && previous.rank !== null ? previous.rank : position + 1;
    }
    result.push({ team: row.team, submission: row.submission, score: row.score, rank });
  }
  return result;
}

/**
 * 만점 대비 비율이 높은 채점 항목을 고릅니다.
 *
 * @param {readonly HackathonCriterionScore[]} criteria - 채점 항목
 * @param {number} count - 고를 개수
 * @returns {HackathonCriterionScore[]} 상위 항목
 */
export function pickTopCriteria(
  criteria: readonly HackathonCriterionScore[],
  count: number
): HackathonCriterionScore[] {
  const ratio = (c: HackathonCriterionScore) => (c.max > 0 ? c.score / c.max : 0);
  return [...criteria].sort((a, b) => ratio(b) - ratio(a)).slice(0, count);
}
