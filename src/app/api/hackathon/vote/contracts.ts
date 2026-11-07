import type { AttendanceStatus } from "@/domain/entities";
import type { VoteRejection } from "@/domain/hackathon/rules";

/**
 * 휴먼 인정상 투표 API 계약 (클라이언트·서버 공용, 순수 모듈)
 *
 * - GET  /api/hackathon/attendees → AttendeesResponse | ApiErrorResponse
 * - POST /api/hackathon/vote      → VoteSuccessResponse | ApiErrorResponse
 */

/** 투표 화면에 노출하는 출석 회원 요약 (이 외의 회원 정보는 내보내지 않음) */
export interface AttendeeSummary {
  memberId: string;
  name: string;
  generation: number;
  hasVoted: boolean;
}

/** GET /api/hackathon/attendees 성공 응답 */
export interface AttendeesResponse {
  attendees: AttendeeSummary[];
}

/** POST /api/hackathon/vote 요청 본문 */
export interface VoteRequestBody {
  memberId: string;
  teamId: string;
}

/** POST /api/hackathon/vote 성공 응답 */
export interface VoteSuccessResponse {
  ok: true;
}

/** 실패 응답 공통 형태 */
export interface ApiErrorResponse {
  error: string;
  /** 투표 거부 사유 (투표 자격 판정에서 거부된 경우에만) */
  reason?: VoteRejection;
}

/** 투표 자격으로 인정하는 출결 상태 (QR 출석 체크 = 출석·지각) */
export const ATTENDED_STATUSES: readonly AttendanceStatus[] = ["present", "late"];

/** 문서 ID 입력 최대 길이 (비정상 입력 차단용) */
const MAX_ID_LENGTH = 128;

/** 투표 준비 전(설정·회차 미지정) 안내 문구 */
export const VOTE_NOT_READY_MESSAGE = "투표 준비 중입니다. 잠시 후 다시 시도해 주세요.";

/**
 * 출결 상태가 "오늘 출석"에 해당하는지 판정합니다.
 *
 * @param {AttendanceStatus | null | undefined} status - 출결 상태
 * @returns {boolean} 출석·지각이면 true
 */
export function isAttendedStatus(
  status: AttendanceStatus | null | undefined
): boolean {
  return status != null && ATTENDED_STATUSES.includes(status);
}

/**
 * 투표 거부 사유를 HTTP 상태 코드로 변환합니다.
 *
 * @param {VoteRejection} rejection - 거부 사유
 * @returns {400 | 403 | 409} 상태 코드
 */
export function rejectionToHttpStatus(rejection: VoteRejection): 400 | 403 | 409 {
  switch (rejection) {
    case "unknown-team":
      return 400;
    case "already-voted":
      return 409;
    case "voting-closed":
    case "not-attended":
    case "own-team":
      return 403;
  }
}

/**
 * 요청 본문(unknown)을 검증해 투표 요청으로 변환합니다. 유효하지 않으면 null.
 *
 * @param {unknown} raw - 요청 본문
 * @returns {VoteRequestBody | null} 검증된 요청 또는 null
 */
export function parseVoteRequest(raw: unknown): VoteRequestBody | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  const memberId = typeof source.memberId === "string" ? source.memberId.trim() : "";
  const teamId = typeof source.teamId === "string" ? source.teamId.trim() : "";
  const isValidId = (value: string) =>
    value.length > 0 && value.length <= MAX_ID_LENGTH && !value.includes("/");
  if (!isValidId(memberId) || !isValidId(teamId)) return null;
  return { memberId, teamId };
}

/**
 * 출석 회원 목록을 이름 가나다순(같으면 기수순)으로 정렬한 새 배열을 반환합니다.
 *
 * @param {readonly AttendeeSummary[]} attendees - 출석 회원 목록
 * @returns {AttendeeSummary[]} 정렬된 새 배열
 */
export function sortAttendees(
  attendees: readonly AttendeeSummary[]
): AttendeeSummary[] {
  return [...attendees].sort(
    (a, b) => a.name.localeCompare(b.name, "ko") || a.generation - b.generation
  );
}
