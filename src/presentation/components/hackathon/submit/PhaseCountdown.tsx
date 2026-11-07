"use client";

import { formatRemaining, getHackathonPhase } from "@/domain/hackathon/rules";
import {
  HACKATHON_LATE_GRACE_MS,
  isSubmissionClosed,
} from "@/app/api/hackathon/submit/submitPolicy";
import { cn } from "@/lib/utils";
import { formatKstTime } from "./formatTime";

/** 마감 임박 강조 기준: 10분 */
const URGENT_MS = 10 * 60 * 1000;

type Tone = "calm" | "live" | "urgent" | "closed";

interface CountdownView {
  badge: string;
  caption: string;
  remainingMs: number;
  tone: Tone;
}

function buildView(now: number, startAt: number, endAt: number): CountdownView {
  const phase = getHackathonPhase(now, { startAt, endAt });
  if (phase === "before") {
    return { badge: "제작 시작 전", caption: "제작 시작까지", remainingMs: startAt - now, tone: "calm" };
  }
  if (phase === "building") {
    const remainingMs = endAt - now;
    return {
      badge: "제작 중",
      caption: "제출 마감까지",
      remainingMs,
      tone: remainingMs <= URGENT_MS ? "urgent" : "live",
    };
  }
  if (!isSubmissionClosed(now, endAt)) {
    return {
      badge: "마감 · 지각 접수 중",
      caption: "지각 제출 가능 시간",
      remainingMs: endAt + HACKATHON_LATE_GRACE_MS - now,
      tone: "urgent",
    };
  }
  return { badge: "제출 마감", caption: "제출이 마감되었습니다", remainingMs: 0, tone: "closed" };
}

const TONE_STYLES: Record<Tone, { badge: string; digits: string; dot: string }> = {
  calm: { badge: "bg-gray-6 text-gray-1", digits: "text-gray-black", dot: "bg-gray-2" },
  live: { badge: "bg-green-9/40 text-green-1", digits: "text-green-1", dot: "bg-green-1 animate-pulse" },
  urgent: { badge: "bg-red-50 text-red-600", digits: "text-red-600", dot: "bg-red-500 animate-pulse" },
  closed: { badge: "bg-gray-6 text-gray-1", digits: "text-gray-2", dot: "bg-gray-3" },
};

interface PhaseCountdownProps {
  startAt: number;
  endAt: number;
  now: number;
}

/**
 * 진행 단계 배지와 실시간 남은 시간을 보여주는 상단 고정 바.
 */
export function PhaseCountdown({ startAt, endAt, now }: PhaseCountdownProps) {
  const view = buildView(now, startAt, endAt);
  const styles = TONE_STYLES[view.tone];

  return (
    <div
      className="sticky top-0 z-20 border-b border-gray-5 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75"
      role="timer"
      aria-label={`${view.caption} ${formatRemaining(view.remainingMs)}`}
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0 space-y-1">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
              styles.badge
            )}
          >
            <span className={cn("size-1.5 rounded-full", styles.dot)} aria-hidden />
            {view.badge}
          </span>
          <p className="truncate text-xs text-gray-1">
            {formatKstTime(startAt)} 시작 · {formatKstTime(endAt)} 마감
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-medium text-gray-1">{view.caption}</p>
          <p
            className={cn(
              "font-mono text-2xl font-bold leading-none tabular-nums sm:text-3xl",
              styles.digits
            )}
            aria-hidden
          >
            {formatRemaining(view.remainingMs)}
          </p>
        </div>
      </div>
    </div>
  );
}
