"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HackathonSubmission } from "@/domain/hackathon/types";

/** 카드 강조 애니메이션 유지 시간 */
const FLASH_MS = 2_400;
/** 제출 알림 토스트 표시 시간 */
const TOAST_MS = 4_000;

/** 새로 들어오거나 수정된 제출 */
export interface SubmissionArrival {
  teamId: string;
  teamName: string;
  isUpdate: boolean;
}

/** 화면 상단 제출 알림 */
export interface ArrivalToast {
  token: number;
  message: string;
}

/**
 * 이전 스냅샷(teamId → submittedAt)과 비교해 새 제출·수정을 찾습니다.
 * 첫 스냅샷(prev가 null)은 화면 진입 시점의 기존 데이터이므로 알리지 않습니다.
 *
 * @param {ReadonlyMap<string, number> | null} prev - 이전 스냅샷
 * @param {readonly HackathonSubmission[]} next - 새 스냅샷
 * @returns {SubmissionArrival[]} 변경된 제출 목록
 */
export function detectArrivals(
  prev: ReadonlyMap<string, number> | null,
  next: readonly HackathonSubmission[]
): SubmissionArrival[] {
  if (!prev) return [];
  const arrivals: SubmissionArrival[] = [];
  for (const submission of next) {
    const previousAt = prev.get(submission.teamId);
    if (previousAt === submission.submittedAt) continue;
    arrivals.push({
      teamId: submission.teamId,
      teamName: submission.teamName,
      isUpdate: previousAt !== undefined || submission.submitCount > 1,
    });
  }
  return arrivals;
}

/**
 * 제출 알림 문구를 만듭니다.
 *
 * @param {readonly SubmissionArrival[]} arrivals - 변경된 제출
 * @returns {string} 예: "3팀 제출 완료!", "2팀 · 4팀 제출 수정!"
 */
export function buildArrivalMessage(arrivals: readonly SubmissionArrival[]): string {
  const names = arrivals.map((a) => a.teamName).join(" · ");
  const isAllUpdate = arrivals.every((a) => a.isUpdate);
  return `${names} ${isAllUpdate ? "제출 수정!" : "제출 완료!"}`;
}

/**
 * 제출 도착 시 카드 강조와 토스트를 관리합니다. 타이머는 언마운트 시 정리합니다.
 *
 * @returns {{ highlights: Record<string, number>; toast: ArrivalToast | null; announce: (arrivals: readonly SubmissionArrival[]) => void }}
 */
export function useSubmissionHighlights() {
  const [highlights, setHighlights] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<ArrivalToast | null>(null);
  const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>());
  const tokenRef = useRef(0);

  const schedule = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      callback();
    }, delay);
    timersRef.current.add(timer);
  }, []);

  const announce = useCallback(
    (arrivals: readonly SubmissionArrival[]) => {
      if (arrivals.length === 0) return;
      tokenRef.current += 1;
      const token = tokenRef.current;
      const added = Object.fromEntries(arrivals.map((a) => [a.teamId, token]));
      setHighlights((prev) => ({ ...prev, ...added }));
      setToast({ token, message: buildArrivalMessage(arrivals) });

      schedule(() => {
        setHighlights((prev) => removeExpired(prev, token));
      }, FLASH_MS);
      schedule(() => {
        setToast((prev) => (prev?.token === token ? null : prev));
      }, TOAST_MS);
    },
    [schedule]
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
    };
  }, []);

  return { highlights, toast, announce };
}

function removeExpired(
  highlights: Record<string, number>,
  token: number
): Record<string, number> {
  const next: Record<string, number> = {};
  for (const [teamId, value] of Object.entries(highlights)) {
    if (value !== token) next[teamId] = value;
  }
  return next;
}
