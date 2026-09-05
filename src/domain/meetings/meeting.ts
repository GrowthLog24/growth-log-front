import type { MeetingType } from "@/domain/entities";

/**
 * 회차 종류 값을 정규화합니다.
 *
 * 기존 문서에는 type 필드가 없을 수 있으므로(legacy), 값이
 * "그로스톡"이 아니면 모두 "정기모임"으로 간주합니다.
 *
 * @param {string | null | undefined} type - 저장된 회차 종류 값
 * @returns {MeetingType} 정규화된 회차 종류
 */
export function normalizeMeetingType(
  type: string | null | undefined
): MeetingType {
  return type === "그로스톡" ? "그로스톡" : "정기모임";
}

/**
 * 회차 제목을 생성합니다. (예: "6기 1회차 정기모임")
 *
 * @param {number} generation - 기수
 * @param {number} round - 회차 번호
 * @param {string | null | undefined} [type] - 회차 종류(없으면 정기모임)
 * @returns {string} 회차 제목
 */
export function buildMeetingTitle(
  generation: number,
  round: number,
  type?: string | null
): string {
  return `${generation}기 ${round}회차 ${normalizeMeetingType(type)}`;
}

/**
 * 정기모임 회차인지 여부(그로스톡이 아니면 true).
 *
 * @param {string | null | undefined} type - 회차 종류 값
 * @returns {boolean} 정기모임(또는 legacy)이면 true
 */
export function isRegularMeeting(type: string | null | undefined): boolean {
  return normalizeMeetingType(type) === "정기모임";
}
