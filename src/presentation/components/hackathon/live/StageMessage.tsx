"use client";

import type { ArrivalToast } from "./useSubmissionHighlights";

interface StageMessageProps {
  title: string;
  description: string;
}

/**
 * 데이터가 없을 때(연결 중·행사 준비 중) 가운데에 띄우는 큰 안내문.
 *
 * @param {StageMessageProps} props - 제목과 설명
 */
export function StageMessage({ title, description }: StageMessageProps) {
  return (
    <div className="hl-rise flex h-full flex-col items-center justify-center gap-6 text-center">
      <p className="hl-t-2xl font-black tracking-tight">{title}</p>
      <p className="hl-t-md font-semibold text-[var(--hl-muted)]">{description}</p>
    </div>
  );
}

/**
 * 제출 도착 알림 토스트. token이 바뀌면 애니메이션을 처음부터 다시 재생합니다.
 *
 * @param {{ toast: ArrivalToast | null }} props - 표시할 토스트
 */
export function ArrivalToastView({ toast }: { toast: ArrivalToast | null }) {
  if (!toast) return null;
  return (
    <div
      key={toast.token}
      role="status"
      aria-live="polite"
      className="hl-toast pointer-events-none absolute left-1/2 top-[calc(var(--u)*11)] z-30 flex items-center gap-5 rounded-full border-2 border-[var(--hl-green-bright)] bg-[var(--hl-green)] px-12 py-5 shadow-[0_calc(var(--u)*1)_calc(var(--u)*8)_rgb(0_150_43/0.55)]"
    >
      <span className="grid size-[calc(var(--u)*5)] place-items-center rounded-full bg-white font-black text-[var(--hl-green)] hl-t-md">
        ✓
      </span>
      <span className="hl-t-xl font-black text-white">{toast.message}</span>
    </div>
  );
}
