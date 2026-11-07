import { NextResponse } from "next/server";
import { CURRENT_HACKATHON_ID } from "@/domain/hackathon/constants";
import type { Hackathon, HackathonTeam } from "@/domain/hackathon/types";
import { hackathonRepository } from "@/infrastructure/repositories/hackathonRepository";

/** 팀 인증 결과 */
export type TeamAuthResult =
  | { ok: true; config: Hackathon; team: HackathonTeam }
  | { ok: false; response: NextResponse };

/**
 * JSON 오류 응답을 만듭니다.
 *
 * @param {string} error - 사용자에게 보여줄 한국어 메시지
 * @param {number} status - HTTP 상태 코드
 * @param {Record<string, unknown>} [extra] - 추가 필드 (예: errors)
 * @returns {NextResponse} JSON 응답
 */
export function jsonError(
  error: string,
  status: number,
  extra: Record<string, unknown> = {}
): NextResponse {
  return NextResponse.json({ ...extra, error }, { status });
}

/**
 * 요청 본문을 JSON 객체로 읽습니다. 파싱 실패나 객체가 아니면 null.
 *
 * @param {Request} request - 들어온 요청
 * @returns {Promise<Record<string, unknown> | null>} 본문 객체
 */
export async function readJsonBody(
  request: Request
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return null;
    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * 본문의 teamId·code를 행사 설정·팀 코드와 대조해 팀을 인증합니다.
 * 실패하면 그대로 돌려줄 오류 응답을 담아 반환합니다.
 *
 * @param {Record<string, unknown>} body - 요청 본문
 * @returns {Promise<TeamAuthResult>} 인증 결과
 */
export async function authorizeTeam(
  body: Record<string, unknown>
): Promise<TeamAuthResult> {
  const teamId = typeof body.teamId === "string" ? body.teamId.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!teamId || !code) {
    return { ok: false, response: jsonError("팀과 팀 코드를 입력해 주세요.", 400) };
  }

  const [config, secrets] = await Promise.all([
    hackathonRepository.getConfig(CURRENT_HACKATHON_ID),
    hackathonRepository.getSecrets(CURRENT_HACKATHON_ID),
  ]);
  if (!config) {
    return { ok: false, response: jsonError("행사 정보를 찾을 수 없습니다.", 404) };
  }

  const team = config.teams.find((candidate) => candidate.id === teamId);
  const expected = secrets?.codes?.[teamId];
  if (!team || !expected || expected !== code) {
    return { ok: false, response: jsonError("팀 코드가 올바르지 않습니다.", 401) };
  }
  return { ok: true, config, team };
}
