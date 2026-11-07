import { NextResponse } from "next/server";
import { CURRENT_HACKATHON_ID } from "@/domain/hackathon/constants";
import {
  buildTeamDocId,
  normalizeSubmissionInput,
  validateSubmission,
} from "@/domain/hackathon/rules";
import { hackathonRepository } from "@/infrastructure/repositories/hackathonRepository";
import { authorizeTeam, jsonError, readJsonBody } from "./teamAuth";
import {
  SUBMISSION_CLOSED_MESSAGE,
  buildSubmissionRecord,
  isSubmissionClosed,
} from "./submitPolicy";

export const dynamic = "force-dynamic";

/** 팀당 1회 제출 — 이미 제출한 팀의 재제출 거부 문구 */
const ALREADY_SUBMITTED_MESSAGE =
  "이미 제출했습니다. 제출은 팀당 1회만 가능해요. 수정이 필요하면 운영진에게 말씀해 주세요.";

/**
 * 팀 제출 (팀당 1회 — 재제출·수정 불가)
 *
 * POST { teamId, code, ...HackathonSubmissionInput }
 * - 200 { submission: HackathonSubmission }
 * - 400 { error, errors } 검증 실패 / 401 코드 불일치 / 403 마감(+15분 유예) 이후
 * - 409 이미 제출함 (수정은 운영진에게 요청)
 * - 404 행사 없음 / 500 서버 오류
 *
 * 시작 전 제출도 허용합니다(미리 작성). 마감 후 15분까지는 isLate=true로 받습니다.
 */
export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    if (!body) return jsonError("요청 형식이 올바르지 않습니다.", 400);

    const auth = await authorizeTeam(body);
    if (!auth.ok) return auth.response;

    const now = Date.now();
    if (isSubmissionClosed(now, auth.config.endAt)) {
      return jsonError(SUBMISSION_CLOSED_MESSAGE, 403);
    }

    const input = normalizeSubmissionInput(body);
    const errors = validateSubmission(input);
    if (Object.keys(errors).length > 0) {
      return jsonError("입력 내용을 확인해 주세요.", 400, { errors });
    }

    const existing = await hackathonRepository.getSubmission(
      CURRENT_HACKATHON_ID,
      auth.team.id
    );
    if (existing) return jsonError(ALREADY_SUBMITTED_MESSAGE, 409);
    const record = buildSubmissionRecord({
      hackathonId: CURRENT_HACKATHON_ID,
      team: auth.team,
      input,
      existing: null,
      now,
      endAt: auth.config.endAt,
    });
    const isCreated = await hackathonRepository.createSubmission(record);
    if (!isCreated) return jsonError(ALREADY_SUBMITTED_MESSAGE, 409);
    return NextResponse.json({
      submission: { id: buildTeamDocId(CURRENT_HACKATHON_ID, auth.team.id), ...record },
    });
  } catch (error) {
    console.error("Hackathon submit error:", error);
    return jsonError("제출 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.", 500);
  }
}
