"use client";

import { useCallback, useEffect, useState } from "react";
import type { Hackathon, HackathonSubmission } from "@/domain/hackathon/types";
import { hackathonRepository } from "@/infrastructure/repositories/hackathonRepository";
import type { AttendeeSummary } from "@/app/api/hackathon/vote/contracts";
import { fetchAttendees } from "./voteApi";

/** 행사 설정 구독 상태 */
export type ConfigState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; config: Hackathon | null };

/**
 * 행사 설정을 실시간 구독합니다. 투표 개방 여부가 바뀌면 화면이 즉시 갱신됩니다.
 *
 * @param {string} hackathonId - 행사 ID
 * @returns {{ state: ConfigState; retry: () => void }} 구독 상태와 재구독 함수
 */
export function useHackathonConfig(hackathonId: string) {
  const [state, setState] = useState<ConfigState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    return hackathonRepository.subscribeConfig(
      hackathonId,
      (config) => setState({ status: "ready", config }),
      (error) => {
        console.error("해커톤 설정 구독 실패:", error);
        setState({ status: "error" });
      }
    );
  }, [hackathonId, attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((value) => value + 1);
  }, []);

  return { state, retry };
}

/** 출석 명단 조회 상태 */
export interface AttendeesState {
  isLoading: boolean;
  attendees: AttendeeSummary[];
  error: string | null;
}

/**
 * 투표 가능한 출석 명단을 불러옵니다. enabled가 켜질 때마다 새로 불러옵니다.
 *
 * @param {boolean} enabled - 조회 여부 (투표 개방 중일 때만 true)
 * @returns {{ state: AttendeesState; reload: () => void }} 조회 상태와 새로고침 함수
 */
export function useAttendees(enabled: boolean) {
  const [state, setState] = useState<AttendeesState>({
    isLoading: true,
    attendees: [],
    error: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let isCancelled = false;
    fetchAttendees().then((result) => {
      if (isCancelled) return;
      setState((previous) =>
        result.ok
          ? { isLoading: false, attendees: result.data, error: null }
          : { isLoading: false, attendees: previous.attendees, error: result.error }
      );
    });
    return () => {
      isCancelled = true;
    };
  }, [enabled, attempt]);

  const reload = useCallback(() => {
    setState((previous) => ({ ...previous, isLoading: true, error: null }));
    setAttempt((value) => value + 1);
  }, []);

  return { state, reload };
}

/**
 * 팀 제출물을 teamId 기준으로 실시간 구독합니다.
 * 제출물은 카드의 보조 정보이므로 실패해도 팀 이름만으로 투표할 수 있게 둡니다.
 *
 * @param {string} hackathonId - 행사 ID
 * @returns {Record<string, HackathonSubmission>} teamId → 제출물
 */
export function useTeamSubmissions(hackathonId: string) {
  const [byTeam, setByTeam] = useState<Record<string, HackathonSubmission>>({});

  useEffect(() => {
    return hackathonRepository.subscribeSubmissions(
      hackathonId,
      (submissions) => {
        const next: Record<string, HackathonSubmission> = {};
        for (const submission of submissions) next[submission.teamId] = submission;
        setByTeam(next);
      },
      (error) => console.error("해커톤 제출물 구독 실패:", error)
    );
  }, [hackathonId]);

  return byTeam;
}
