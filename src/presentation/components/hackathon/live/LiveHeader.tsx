"use client";

import type { HackathonPhase } from "@/domain/hackathon/types";
import { formatKstClock } from "./liveFormat";
import { FullscreenButton } from "./FullscreenButton";

/** 헤더에 표시할 진행 모드 */
export type LiveMode = HackathonPhase | "voting" | "results";

interface LiveHeaderProps {
  now: number;
  mode: LiveMode | null;
  isDisconnected: boolean;
}

const MODE_BADGES: Record<LiveMode, { label: string; className: string; isLive: boolean }> = {
  before: {
    label: "시작 전",
    className: "border-[var(--hl-line-strong)] text-[var(--hl-mint)]",
    isLive: false,
  },
  building: {
    label: "제작 중",
    className: "border-transparent bg-[var(--hl-green)] text-white",
    isLive: true,
  },
  ended: {
    label: "제출 마감",
    className: "border-[var(--hl-dim)] text-[var(--hl-muted)]",
    isLive: false,
  },
  voting: {
    label: "투표 진행 중",
    className: "border-transparent bg-[var(--hl-mint)] text-[var(--hl-bg)]",
    isLive: true,
  },
  results: {
    label: "결과 발표",
    className: "border-transparent bg-[var(--hl-green-bright)] text-[var(--hl-bg)]",
    isLive: false,
  },
};

function ModeBadge({ mode }: { mode: LiveMode }) {
  const badge = MODE_BADGES[mode];
  return (
    <span
      className={`hl-t-sm inline-flex items-center gap-3 rounded-full border-2 px-5 py-1.5 font-bold ${badge.className}`}
    >
      {badge.isLive && (
        <span className="relative inline-flex size-[calc(var(--u)*1.1)]">
          <span className="hl-live-ring absolute inset-0 rounded-full bg-current" />
          <span className="relative size-full rounded-full bg-current" />
        </span>
      )}
      {badge.label}
    </span>
  );
}

function ConnectionPill() {
  return (
    <span
      role="status"
      className="hl-t-micro inline-flex items-center gap-2 rounded-full border border-[var(--hl-amber)] px-4 py-1 font-semibold text-[var(--hl-amber)]"
    >
      <span className="hl-pulse size-[calc(var(--u)*0.9)] rounded-full bg-[var(--hl-amber)]" />
      연결 끊김 · 재시도 중
    </span>
  );
}

/**
 * 빔 대시보드 상단 띠: 행사명, 연결 상태, 진행 배지, KST 시계.
 *
 * @param {LiveHeaderProps} props - 현재 시각·모드·연결 상태
 */
export function LiveHeader({ now, mode, isDisconnected }: LiveHeaderProps) {
  return (
    <header className="relative z-10 flex items-center justify-between gap-8 border-b border-[var(--hl-line)] px-12 py-5">
      <div className="flex items-baseline gap-5">
        <span className="hl-t-md font-black tracking-tight text-[var(--hl-green-bright)]">
          GROWTH LOG
        </span>
        <span className="hl-t-md font-bold text-[var(--hl-text)]">6기 · 100분 해커톤</span>
      </div>
      <div className="flex items-center gap-6">
        {isDisconnected && <ConnectionPill />}
        {mode && <ModeBadge mode={mode} />}
        <time
          className="hl-t-lg font-mono font-semibold tabular-nums text-[var(--hl-text)]"
          dateTime={now ? new Date(now).toISOString() : undefined}
        >
          {now ? formatKstClock(now) : "--:--:--"}
        </time>
        <FullscreenButton />
      </div>
    </header>
  );
}
