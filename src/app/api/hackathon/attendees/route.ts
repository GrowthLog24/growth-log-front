import { NextResponse } from "next/server";
import { CURRENT_HACKATHON_ID } from "@/domain/hackathon/constants";
import { hackathonRepository } from "@/infrastructure/repositories/hackathonRepository";
import { memberRepository } from "@/infrastructure/repositories/memberRepository";
import { getAttendedMemberIds } from "../vote/attendance";
import {
  sortAttendees,
  VOTE_NOT_READY_MESSAGE,
  type ApiErrorResponse,
  type AttendeeSummary,
  type AttendeesResponse,
} from "../vote/contracts";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

async function loadAttendee(memberId: string): Promise<AttendeeSummary | null> {
  const [member, hasVoted] = await Promise.all([
    memberRepository.findById(memberId),
    hackathonRepository.hasVoted(CURRENT_HACKATHON_ID, memberId),
  ]);
  if (!member) return null;
  return {
    memberId,
    name: member.memberName,
    generation: member.generation,
    hasVoted,
  };
}

/**
 * 투표 자격이 있는 출석 회원 목록을 반환합니다.
 *
 * 설정된 회차(config.meetingId)에 출석·지각으로 기록된 회원만 포함하며,
 * 회원 정보는 이름·기수·투표 여부만 내보냅니다. 투표 대상(팀)은 내보내지 않습니다.
 *
 * 응답: 200 { attendees } (이름순) | 409 투표 준비 중 | 500 서버 오류
 *
 * @returns {Promise<NextResponse>} 응답
 */
export async function GET() {
  try {
    const config = await hackathonRepository.getConfig(CURRENT_HACKATHON_ID);
    if (!config || !config.meetingId) {
      return NextResponse.json<ApiErrorResponse>(
        { error: VOTE_NOT_READY_MESSAGE },
        { status: 409, headers: NO_STORE }
      );
    }

    const memberIds = await getAttendedMemberIds(config.meetingId);
    const loaded = await Promise.all([...memberIds].map(loadAttendee));
    const attendees = loaded.filter(
      (attendee): attendee is AttendeeSummary => attendee !== null
    );

    return NextResponse.json<AttendeesResponse>(
      { attendees: sortAttendees(attendees) },
      { headers: NO_STORE }
    );
  } catch (error) {
    console.error("Hackathon attendees API error:", error);
    return NextResponse.json<ApiErrorResponse>(
      { error: "출석 명단을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500, headers: NO_STORE }
    );
  }
}
