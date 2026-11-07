"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { hackathonRepository } from "@/infrastructure/repositories/hackathonRepository";
import { meetingAdminRepository } from "@/infrastructure/repositories/admin/meetingAdminRepository";
import { memberAdminRepository } from "@/infrastructure/repositories/admin/memberAdminRepository";
import { checkinConfigRepository } from "@/infrastructure/repositories/checkinConfigRepository";
import type { Meeting, Member } from "@/domain/entities";
import type {
  Hackathon,
  HackathonScore,
  HackathonSecrets,
  HackathonSubmission,
  HackathonVote,
} from "@/domain/hackathon/types";

/** 실시간 구독 데이터 */
export interface HackathonLiveData {
  /** undefined = 로딩 중, null = 설정 문서 없음 */
  config: Hackathon | null | undefined;
  submissions: HackathonSubmission[];
  scores: HackathonScore[];
  votes: HackathonVote[];
}

/** 1회 조회 데이터 */
export interface HackathonReferenceData {
  members: Member[];
  meetings: Meeting[];
  /** QR 체크인이 열려 있는 회차 ID */
  checkinMeetingId: string | null;
  referenceLoading: boolean;
}

/** 코드 표 갱신 함수: 서버 최신 코드 표 → 새 코드 표 */
export type CodesUpdater = (
  latest: Readonly<Record<string, string>>
) => Record<string, string>;

/** 팀 제출 코드 상태 */
export interface HackathonSecretsState {
  /** undefined = 로딩 중, null = 조회 실패 */
  secrets: HackathonSecrets | null | undefined;
  /** 서버 최신 코드 표를 다시 읽어 updater를 적용한 뒤 저장합니다. (다른 관리자가 넣은 코드 덮어쓰기 방지) */
  updateCodes: (updater: CodesUpdater) => Promise<void>;
  /** 서버에서 코드 표를 다시 읽습니다. */
  reloadSecrets: () => Promise<void>;
}

function reportError(label: string) {
  return (error: Error) => {
    console.error(`[hackathon-admin] ${label}`, error);
    toast.error(`${label}을(를) 불러오지 못했습니다.`);
  };
}

/**
 * 해커톤 설정·제출물·채점·투표를 실시간 구독합니다.
 *
 * @param {string} hackathonId - 행사 ID
 * @returns {HackathonLiveData} 구독 중인 데이터
 */
export function useHackathonLiveData(hackathonId: string): HackathonLiveData {
  const [config, setConfig] = useState<Hackathon | null | undefined>(undefined);
  const [submissions, setSubmissions] = useState<HackathonSubmission[]>([]);
  const [scores, setScores] = useState<HackathonScore[]>([]);
  const [votes, setVotes] = useState<HackathonVote[]>([]);

  useEffect(() => {
    const unsubscribers = [
      hackathonRepository.subscribeConfig(hackathonId, setConfig, (error) => {
        reportError("행사 설정")(error);
        setConfig(null);
      }),
      hackathonRepository.subscribeSubmissions(
        hackathonId,
        setSubmissions,
        reportError("제출물")
      ),
      hackathonRepository.subscribeScores(hackathonId, setScores, reportError("채점 결과")),
      hackathonRepository.subscribeVotes(hackathonId, setVotes, reportError("투표")),
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [hackathonId]);

  return { config, submissions, scores, votes };
}

/**
 * 회원·회차·QR 체크인 설정을 한 번 조회합니다.
 *
 * @returns {HackathonReferenceData} 조회 결과와 로딩 상태
 */
export function useHackathonReferenceData(): HackathonReferenceData {
  const [state, setState] = useState<HackathonReferenceData>({
    members: [],
    meetings: [],
    checkinMeetingId: null,
    referenceLoading: true,
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      memberAdminRepository.getAll(),
      meetingAdminRepository.getAll(),
      checkinConfigRepository.getCurrent(),
    ])
      .then(([members, meetings, checkin]) => {
        if (cancelled) return;
        setState({
          members,
          meetings,
          checkinMeetingId: checkin?.open ? checkin.meetingId : null,
          referenceLoading: false,
        });
      })
      .catch((error: unknown) => {
        console.error("[hackathon-admin] reference data", error);
        toast.error("회원·회차 목록을 불러오지 못했습니다.");
        if (!cancelled) setState((prev) => ({ ...prev, referenceLoading: false }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/**
 * 팀 제출 코드(hackathonSecrets)를 조회하고 갱신 함수를 제공합니다.
 * 문서는 실시간 구독하지 않으므로, 쓰기 직전에 항상 서버 값을 다시 읽어 병합합니다.
 *
 * @param {string} hackathonId - 행사 ID
 * @returns {HackathonSecretsState} 코드 상태와 갱신 함수
 */
export function useHackathonSecrets(hackathonId: string): HackathonSecretsState {
  const [secrets, setSecrets] = useState<HackathonSecrets | null | undefined>(undefined);

  const fetchLatest = useCallback(async (): Promise<HackathonSecrets> => {
    const result = await hackathonRepository.getSecrets(hackathonId);
    return { codes: { ...(result?.codes ?? {}) } };
  }, [hackathonId]);

  const reloadSecrets = useCallback(async () => {
    try {
      setSecrets(await fetchLatest());
    } catch (error) {
      console.error("[hackathon-admin] secrets", error);
      toast.error("팀 제출 코드를 불러오지 못했습니다. 새로고침해 주세요.");
      setSecrets(null);
    }
  }, [fetchLatest]);

  useEffect(() => {
    let cancelled = false;
    fetchLatest()
      .then((result) => {
        if (!cancelled) setSecrets(result);
      })
      .catch((error: unknown) => {
        console.error("[hackathon-admin] secrets", error);
        toast.error("팀 제출 코드를 불러오지 못했습니다. 새로고침해 주세요.");
        if (!cancelled) setSecrets(null);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchLatest]);

  const updateCodes = useCallback(
    async (updater: CodesUpdater) => {
      const latest = await fetchLatest();
      const next: HackathonSecrets = { codes: updater(latest.codes) };
      await hackathonRepository.saveSecrets(hackathonId, next);
      setSecrets(next);
    },
    [fetchLatest, hackathonId]
  );

  return { secrets, updateCodes, reloadSecrets };
}

/**
 * 1초마다 갱신되는 현재 시각을 반환합니다.
 *
 * @param {number} intervalMs - 갱신 주기 (기본 1000ms)
 * @returns {number} 현재 시각 (epoch ms)
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
