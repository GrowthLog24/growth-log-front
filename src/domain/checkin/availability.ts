import type { AttendanceStatus } from "@/domain/entities";

/**
 * 체크인 배너 가용성 상태.
 * - closed: 체크인이 열려 있지 않음 (배너 미표시)
 * - already-attended: 이미 출석/지각으로 기록됨
 * - open: 지금 출석 체크 가능
 */
export type CheckinAvailability = "closed" | "already-attended" | "open";

/**
 * 체크인 설정과 회원의 기존 출결 상태로부터 배너 가용성을 판정한다.
 *
 * @param {{ open: boolean; meetingId: string | null } | null} config - 현재 체크인 설정
 * @param {AttendanceStatus | null} existingStatus - 해당 회차에 대한 회원의 기존 출결(없으면 null)
 * @returns {CheckinAvailability} 배너 상태
 */
export function resolveCheckinAvailability(
  config: { open: boolean; meetingId: string | null } | null,
  existingStatus: AttendanceStatus | null
): CheckinAvailability {
  if (!config || !config.open || !config.meetingId) return "closed";
  if (existingStatus === "present" || existingStatus === "late") {
    return "already-attended";
  }
  return "open";
}
