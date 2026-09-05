"use client";

import { useEffect, useState } from "react";
import type { Meeting } from "@/domain/entities";
import { resolveCheckinAvailability } from "@/domain/checkin/availability";
import {
  checkinConfigRepository,
  meetingRepository,
  attendanceRepository,
} from "@/infrastructure/repositories";
import { MemberCheckIn } from "./MemberCheckIn";

/**
 * 체크인 배너 게이트 Props
 */
interface MemberCheckInGateProps {
  /** 회원 문서 ID */
  memberId: string;
  /** 회원 이름 */
  memberName: string;
  /** 회원 활성 여부 (비활성 회원은 체크인 불가) */
  memberIsActive: boolean;
  /** 회원 가입 기수 (회차 기수보다 높으면 부적격) */
  memberGeneration: number;
}

/**
 * 해석된 배너 데이터 (표시할 게 없으면 null)
 */
interface Resolved {
  meeting: Meeting;
  alreadyAttended: boolean;
}

/**
 * 체크인 배너 게이트.
 *
 * 업적 페이지의 캐싱 특성과 무관하게 "지금 체크인이 열려 있는지"를
 * 매 방문마다 클라이언트에서 실시간으로 확인합니다.
 * 열려 있고 대상 회차가 유효할 때만 출석 배너를 노출합니다.
 */
export function MemberCheckInGate({
  memberId,
  memberName,
  memberIsActive,
  memberGeneration,
}: MemberCheckInGateProps) {
  const [resolved, setResolved] = useState<Resolved | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      const config = await checkinConfigRepository.getCurrent();
      if (!config || !config.open || !config.meetingId) return;

      const [meeting, existingStatus] = await Promise.all([
        meetingRepository.getById(config.meetingId),
        attendanceRepository.getStatus(config.meetingId, memberId),
      ]);
      if (!active || !meeting) return;

      // 집계 제외(비활성) 회차는 출석이 집계되지 않으므로 체크인 대상 아님
      if (!meeting.isActive) return;

      // 관리자 출결 대상과 동일 조건: 활성 회원 && 가입 기수 ≤ 회차 기수
      if (!memberIsActive || memberGeneration > meeting.generation) return;

      const availability = resolveCheckinAvailability(
        { open: config.open, meetingId: config.meetingId },
        existingStatus
      );
      if (availability === "closed") return;

      setResolved({
        meeting,
        alreadyAttended: availability === "already-attended",
      });
    })();

    return () => {
      active = false;
    };
  }, [memberId, memberIsActive, memberGeneration]);

  if (!resolved) return null;

  return (
    <MemberCheckIn
      meetingId={resolved.meeting.id}
      meetingTitle={resolved.meeting.title}
      meetingGeneration={resolved.meeting.generation}
      meetingRound={resolved.meeting.round}
      memberId={memberId}
      memberName={memberName}
      alreadyAttended={resolved.alreadyAttended}
    />
  );
}
