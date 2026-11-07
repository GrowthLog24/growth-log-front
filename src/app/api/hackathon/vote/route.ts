import { NextRequest, NextResponse } from "next/server";
import { CURRENT_HACKATHON_ID } from "@/domain/hackathon/constants";
import {
  checkVoteEligibility,
  VOTE_REJECTION_MESSAGES,
  type VoteRejection,
} from "@/domain/hackathon/rules";
import { hackathonRepository } from "@/infrastructure/repositories/hackathonRepository";
import { memberRepository } from "@/infrastructure/repositories/memberRepository";
import { getAttendedMemberIds } from "./attendance";
import {
  parseVoteRequest,
  rejectionToHttpStatus,
  VOTE_NOT_READY_MESSAGE,
  type ApiErrorResponse,
  type VoteRequestBody,
  type VoteSuccessResponse,
} from "./contracts";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

function errorResponse(status: number, body: ApiErrorResponse) {
  return NextResponse.json<ApiErrorResponse>(body, { status, headers: NO_STORE });
}

function rejectionResponse(reason: VoteRejection) {
  return errorResponse(rejectionToHttpStatus(reason), {
    error: VOTE_REJECTION_MESSAGES[reason],
    reason,
  });
}

async function readBody(request: NextRequest): Promise<VoteRequestBody | null> {
  try {
    return parseVoteRequest(await request.json());
  } catch {
    return null;
  }
}

/**
 * 휴먼 인정상 투표를 기록합니다.
 *
 * 요청: { memberId, teamId }
 * 응답: 200 { ok: true } | 400 잘못된 요청·없는 팀 | 403 투표 마감·미출석·본인 팀
 *       | 409 이미 투표함·투표 준비 중 | 500 서버 오류
 *
 * @param {NextRequest} request - 요청
 * @returns {Promise<NextResponse>} 응답
 */
export async function POST(request: NextRequest) {
  const body = await readBody(request);
  if (!body) return errorResponse(400, { error: "잘못된 요청입니다." });

  try {
    const config = await hackathonRepository.getConfig(CURRENT_HACKATHON_ID);
    if (!config || !config.meetingId) {
      return errorResponse(409, { error: VOTE_NOT_READY_MESSAGE });
    }

    const [attendedIds, member, hasVoted] = await Promise.all([
      getAttendedMemberIds(config.meetingId),
      memberRepository.findById(body.memberId),
      hackathonRepository.hasVoted(CURRENT_HACKATHON_ID, body.memberId),
    ]);

    const rejection = checkVoteEligibility({
      votingOpen: config.votingOpen,
      hasAttended: member !== null && attendedIds.has(body.memberId),
      hasVoted,
      memberId: body.memberId,
      targetTeamId: body.teamId,
      teams: config.teams ?? [],
    });
    if (rejection || !member) return rejectionResponse(rejection ?? "not-attended");

    const created = await hackathonRepository.createVote({
      hackathonId: CURRENT_HACKATHON_ID,
      memberId: body.memberId,
      memberName: member.memberName,
      teamId: body.teamId,
      createdAt: Date.now(),
    });
    if (!created) return rejectionResponse("already-voted");

    return NextResponse.json<VoteSuccessResponse>({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    console.error("Hackathon vote API error:", error);
    return errorResponse(500, {
      error: "투표 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    });
  }
}
