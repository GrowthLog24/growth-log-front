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

/** 기본 선택 후보 회차 (정렬·식별에 필요한 최소 필드) */
export interface MeetingChoice {
  id: string;
  generation: number;
  round: number;
}

/**
 * 화면에 기본으로 선택할 회차를 고릅니다.
 *
 * 체크인이 열려 있는 회차가 목록에 있으면 그 회차를, 없으면 가장 최신
 * 회차(기수 우선, 같으면 회차 번호가 큰 것)를 고릅니다. 입력 배열의
 * 정렬 순서에 의존하지 않습니다.
 *
 * @param {readonly MeetingChoice[]} meetings - 선택 가능한 회차 목록
 * @param {string | null} openCheckinMeetingId - 체크인이 열린 회차 ID. 없으면 null
 * @returns {string} 기본 선택할 회차 ID. 목록이 비면 빈 문자열
 */
export function pickDefaultMeetingId(
  meetings: readonly MeetingChoice[],
  openCheckinMeetingId: string | null
): string {
  if (meetings.length === 0) return "";

  if (openCheckinMeetingId) {
    const open = meetings.find(
      (meeting) => meeting.id === openCheckinMeetingId
    );
    if (open) return open.id;
  }

  let latest = meetings[0];
  for (const meeting of meetings) {
    const isNewer =
      meeting.generation > latest.generation ||
      (meeting.generation === latest.generation &&
        meeting.round > latest.round);
    if (isNewer) latest = meeting;
  }
  return latest.id;
}
