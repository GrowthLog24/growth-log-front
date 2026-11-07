import type { HackathonTeam } from "@/domain/hackathon/types";
import type { AttendeeSummary } from "@/app/api/hackathon/vote/contracts";

/** 이 기기에서 투표를 마친 회원 기록 (재방문 시 완료 화면 표시용) */
export interface StoredVote {
  memberId: string;
  name: string;
}

function normalizeSearchText(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

/**
 * 검색어로 출석 회원을 거릅니다. 공백·대소문자를 무시하고 이름 부분 일치로 찾습니다.
 *
 * @param {readonly AttendeeSummary[]} attendees - 출석 회원 목록
 * @param {string} keyword - 검색어 (빈 문자열이면 전체)
 * @returns {AttendeeSummary[]} 일치하는 회원 (원래 순서 유지)
 */
export function filterAttendees(
  attendees: readonly AttendeeSummary[],
  keyword: string
): AttendeeSummary[] {
  const needle = normalizeSearchText(keyword);
  if (!needle) return [...attendees];
  return attendees.filter((attendee) =>
    normalizeSearchText(attendee.name).includes(needle)
  );
}

/**
 * 회원이 해당 팀 구성원인지 판정합니다.
 *
 * @param {HackathonTeam} team - 팀
 * @param {string} memberId - 회원 문서 ID
 * @returns {boolean} 본인 팀이면 true
 */
export function isOwnTeam(team: HackathonTeam, memberId: string): boolean {
  return team.members.some((member) => member.memberId === memberId);
}

/**
 * localStorage 원시 값을 투표 기록으로 해석합니다. 형식이 맞지 않으면 null.
 *
 * @param {string | null} raw - 저장된 JSON 문자열
 * @returns {StoredVote | null} 투표 기록 또는 null
 */
export function parseStoredVote(raw: string | null): StoredVote | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const { memberId, name } = value as Record<string, unknown>;
    if (typeof memberId !== "string" || !memberId) return null;
    return { memberId, name: typeof name === "string" ? name : "" };
  } catch {
    return null;
  }
}
