"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { hackathonRepository } from "@/infrastructure/repositories/hackathonRepository";
import type {
  Hackathon,
  HackathonScore,
  HackathonSubmission,
} from "@/domain/hackathon/types";
import { subscribeWithRetry } from "./subscribeWithRetry";
import { detectArrivals, type SubmissionArrival } from "./useSubmissionHighlights";

/** 대시보드가 그리는 실시간 데이터 */
export interface LiveData {
  /** undefined: 불러오는 중, null: 설정 문서 없음 */
  config: Hackathon | null | undefined;
  submissions: HackathonSubmission[];
  scores: HackathonScore[];
  isDisconnected: boolean;
}

type Source = "config" | "submissions" | "scores";
type FailureState = Record<Source, boolean>;

const NO_FAILURE: FailureState = { config: false, submissions: false, scores: false };

/**
 * 행사 설정·제출물·(공개 시) 채점 결과를 onSnapshot으로 구독합니다.
 * 채점 결과는 config.scoresPublic이 true일 때만 구독합니다.
 *
 * @param {string | null} hackathonId - 행사 ID, null이면 구독하지 않음 (미리보기)
 * @param {(arrivals: SubmissionArrival[]) => void} onArrivals - 새 제출·수정 알림
 * @returns {LiveData} 실시간 데이터와 연결 상태
 */
export function useLiveData(
  hackathonId: string | null,
  onArrivals: (arrivals: SubmissionArrival[]) => void
): LiveData {
  const [config, setConfig] = useState<Hackathon | null | undefined>(undefined);
  const [submissions, setSubmissions] = useState<HackathonSubmission[]>([]);
  const [scores, setScores] = useState<HackathonScore[]>([]);
  const [failures, setFailures] = useState<FailureState>(NO_FAILURE);
  const previousRef = useRef<Map<string, number> | null>(null);
  const scoresPublic = config?.scoresPublic === true;

  const markFailure = useEffectEvent((source: Source, isFailed: boolean) => {
    setFailures((prev) =>
      prev[source] === isFailed ? prev : { ...prev, [source]: isFailed }
    );
  });

  const handleSubmissions = useEffectEvent((next: HackathonSubmission[]) => {
    markFailure("submissions", false);
    onArrivals(detectArrivals(previousRef.current, next));
    previousRef.current = new Map(next.map((s) => [s.teamId, s.submittedAt]));
    setSubmissions(next);
  });

  useEffect(() => {
    if (!hackathonId) return;
    previousRef.current = null;
    const stopConfig = subscribeWithRetry(
      (onError) =>
        hackathonRepository.subscribeConfig(
          hackathonId,
          (next) => {
            markFailure("config", false);
            setConfig(next);
          },
          onError
        ),
      () => markFailure("config", true)
    );
    const stopSubmissions = subscribeWithRetry(
      (onError) =>
        hackathonRepository.subscribeSubmissions(
          hackathonId,
          (next) => handleSubmissions(next),
          onError
        ),
      () => markFailure("submissions", true)
    );
    return () => {
      stopConfig();
      stopSubmissions();
    };
  }, [hackathonId]);

  useEffect(() => {
    if (!hackathonId || !scoresPublic) return;
    return subscribeWithRetry(
      (onError) =>
        hackathonRepository.subscribeScores(
          hackathonId,
          (next) => {
            markFailure("scores", false);
            setScores(next);
          },
          onError
        ),
      () => markFailure("scores", true)
    );
  }, [hackathonId, scoresPublic]);

  const isDisconnected =
    failures.config || failures.submissions || (scoresPublic && failures.scores);
  return { config, submissions, scores, isDisconnected };
}
