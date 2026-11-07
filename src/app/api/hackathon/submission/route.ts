import { NextResponse } from "next/server";
import { CURRENT_HACKATHON_ID } from "@/domain/hackathon/constants";
import { hackathonRepository } from "@/infrastructure/repositories/hackathonRepository";
import {
  authorizeTeam,
  jsonError,
  readJsonBody,
} from "@/app/api/hackathon/submit/teamAuth";

export const dynamic = "force-dynamic";

/**
 * 팀 코드 확인 + 현재 팀 제출물 조회
 *
 * POST { teamId, code }
 * - 200 { team: { id, name }, submission: HackathonSubmission | null }
 * - 400 본문 누락 / 401 코드 불일치 / 404 행사 없음 / 500 서버 오류
 */
export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    if (!body) return jsonError("요청 형식이 올바르지 않습니다.", 400);

    const auth = await authorizeTeam(body);
    if (!auth.ok) return auth.response;

    const submission = await hackathonRepository.getSubmission(
      CURRENT_HACKATHON_ID,
      auth.team.id
    );
    return NextResponse.json({
      team: { id: auth.team.id, name: auth.team.name },
      submission,
    });
  } catch (error) {
    console.error("Hackathon submission lookup error:", error);
    return jsonError("팀 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.", 500);
  }
}
