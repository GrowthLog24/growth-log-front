"use client";

import { useCallback, useState } from "react";
import type { HackathonTeam } from "@/domain/hackathon/types";
import type { AttendeeSummary } from "@/app/api/hackathon/vote/contracts";
import { submitVote } from "./voteApi";
import type { StoredVote } from "./voteView";

interface VoteFlowOptions {
  /** 투표 성공 시 이 기기에 기록 */
  onVoted: (vote: StoredVote) => void;
  /** 명단이 바뀌었을 수 있는 실패(이미 투표·미출석) 후 명단 새로고침 */
  onStaleAttendees: () => void;
}

/**
 * 이름 선택 → 팀 선택 → 확인 → 제출로 이어지는 투표 흐름 상태를 관리합니다.
 *
 * @param {VoteFlowOptions} options - 성공·명단 갱신 콜백
 * @returns 흐름 상태와 단계 전환 함수
 */
export function useVoteFlow({ onVoted, onStaleAttendees }: VoteFlowOptions) {
  const [voter, setVoter] = useState<AttendeeSummary | null>(null);
  const [pendingTeam, setPendingTeam] = useState<HackathonTeam | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectVoter = useCallback((next: AttendeeSummary | null) => {
    setVoter(next);
    setError(null);
  }, []);

  const pickTeam = useCallback((team: HackathonTeam) => {
    setPendingTeam(team);
    setIsConfirmOpen(true);
  }, []);

  const cancelConfirm = useCallback(() => setIsConfirmOpen(false), []);

  const confirm = useCallback(async () => {
    if (!voter || !pendingTeam || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    const result = await submitVote({ memberId: voter.memberId, teamId: pendingTeam.id });
    setIsSubmitting(false);
    setIsConfirmOpen(false);
    if (result.ok) {
      onVoted({ memberId: voter.memberId, name: voter.name });
      return;
    }
    setError(result.error);
    if (result.reason === "already-voted" || result.reason === "not-attended") {
      onStaleAttendees();
    }
  }, [voter, pendingTeam, isSubmitting, onVoted, onStaleAttendees]);

  return {
    voter,
    pendingTeam,
    isConfirmOpen,
    isSubmitting,
    error,
    selectVoter,
    pickTeam,
    cancelConfirm,
    confirm,
  };
}
