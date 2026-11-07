import type { VoteRejection } from "@/domain/hackathon/rules";
import type {
  AttendeeSummary,
  AttendeesResponse,
  VoteRequestBody,
  VoteSuccessResponse,
} from "@/app/api/hackathon/vote/contracts";

/** API 호출 결과 */
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; reason?: VoteRejection };

const NETWORK_ERROR_MESSAGE =
  "네트워크 연결이 불안정해요. 연결을 확인한 뒤 다시 시도해 주세요.";

function readErrorBody(body: unknown): { error?: string; reason?: VoteRejection } {
  if (!body || typeof body !== "object") return {};
  const source = body as Record<string, unknown>;
  return {
    error: typeof source.error === "string" ? source.error : undefined,
    reason: typeof source.reason === "string" ? (source.reason as VoteRejection) : undefined,
  };
}

async function requestJson<T>(input: string, init?: RequestInit): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(input, { ...init, cache: "no-store" });
  } catch {
    return { ok: false, error: NETWORK_ERROR_MESSAGE };
  }
  const body: unknown = await response.json().catch(() => null);
  if (response.ok && body) return { ok: true, data: body as T };
  const { error, reason } = readErrorBody(body);
  return {
    ok: false,
    error: error ?? `요청을 처리하지 못했어요. (${response.status})`,
    reason,
  };
}

/**
 * 투표 가능한 출석 회원 목록을 불러옵니다.
 *
 * @returns {Promise<ApiResult<AttendeeSummary[]>>} 출석 회원 목록 (이름순)
 */
export async function fetchAttendees(): Promise<ApiResult<AttendeeSummary[]>> {
  const result = await requestJson<AttendeesResponse>("/api/hackathon/attendees");
  if (!result.ok) return result;
  return { ok: true, data: result.data.attendees ?? [] };
}

/**
 * 휴먼 인정상 투표를 제출합니다.
 *
 * @param {VoteRequestBody} body - 투표자 회원 ID와 대상 팀 ID
 * @returns {Promise<ApiResult<VoteSuccessResponse>>} 성공 여부와 오류 메시지
 */
export async function submitVote(
  body: VoteRequestBody
): Promise<ApiResult<VoteSuccessResponse>> {
  return requestJson<VoteSuccessResponse>("/api/hackathon/vote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
