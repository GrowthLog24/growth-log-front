import type {
  HackathonSubmission,
  HackathonSubmissionInput,
} from "@/domain/hackathon/types";
import type { SubmissionErrors } from "@/domain/hackathon/rules";

/** 팀 인증 정보 (sessionStorage에 보관) */
export interface TeamAuth {
  teamId: string;
  code: string;
}

/** API 호출 결과 */
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; errors?: SubmissionErrors };

const NETWORK_ERROR = "네트워크 연결을 확인한 뒤 다시 시도해 주세요.";
const UNKNOWN_ERROR = "알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function toFailure<T>(status: number, payload: unknown): ApiResult<T> {
  const source = isRecord(payload) ? payload : {};
  const error = typeof source.error === "string" ? source.error : UNKNOWN_ERROR;
  const errors = isRecord(source.errors)
    ? (source.errors as SubmissionErrors)
    : undefined;
  return { ok: false, status, error, errors };
}

/**
 * JSON POST 요청을 보내고 결과를 성공/실패 유니온으로 돌려줍니다.
 *
 * @template R - 성공 응답 타입
 * @param {string} url - 요청 경로
 * @param {unknown} body - 요청 본문
 * @param {(payload: unknown) => payload is R} isValid - 성공 응답 형태 검사
 * @returns {Promise<ApiResult<R>>} 호출 결과
 */
async function postJson<R>(
  url: string,
  body: unknown,
  isValid: (payload: unknown) => payload is R
): Promise<ApiResult<R>> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error(`POST ${url} network error:`, error);
    return { ok: false, status: 0, error: NETWORK_ERROR };
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) return toFailure(response.status, payload);
  if (!isValid(payload)) return { ok: false, status: response.status, error: UNKNOWN_ERROR };
  return { ok: true, data: payload };
}

/** 팀 확인 응답 */
export interface VerifyTeamResponse {
  team: { id: string; name: string };
  submission: HackathonSubmission | null;
}

function isVerifyTeamResponse(payload: unknown): payload is VerifyTeamResponse {
  return isRecord(payload) && isRecord(payload.team) && "submission" in payload;
}

function isSubmitResponse(
  payload: unknown
): payload is { submission: HackathonSubmission } {
  return isRecord(payload) && isRecord(payload.submission);
}

/**
 * 팀 코드를 확인하고 기존 제출물을 받아옵니다.
 *
 * @param {TeamAuth} auth - 팀 ID와 4자리 코드
 * @returns {Promise<ApiResult<VerifyTeamResponse>>} 401이면 코드 불일치
 */
export function verifyTeam(auth: TeamAuth): Promise<ApiResult<VerifyTeamResponse>> {
  return postJson("/api/hackathon/submission", auth, isVerifyTeamResponse);
}

/**
 * 팀 제출물을 저장합니다. (재제출 시 덮어쓰기)
 *
 * @param {TeamAuth} auth - 팀 ID와 4자리 코드
 * @param {HackathonSubmissionInput} input - 정규화된 제출 입력값
 * @returns {Promise<ApiResult<{ submission: HackathonSubmission }>>} 저장된 제출물
 */
export function submitSubmission(
  auth: TeamAuth,
  input: HackathonSubmissionInput
): Promise<ApiResult<{ submission: HackathonSubmission }>> {
  return postJson("/api/hackathon/submit", { ...auth, ...input }, isSubmitResponse);
}
