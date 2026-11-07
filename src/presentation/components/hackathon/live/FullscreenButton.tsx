"use client";

import { useFullscreenState } from "./useBrowserState";

/**
 * 전체 화면 전환 버튼입니다. 전체 화면이거나 지원하지 않으면 숨깁니다.
 */
export function FullscreenButton() {
  const { isFullscreen, isSupported } = useFullscreenState();
  if (isFullscreen || !isSupported) return null;

  const handleClick = () => {
    document.documentElement.requestFullscreen().catch((error: unknown) => {
      console.error("[hackathon-live] 전체 화면 전환 실패", error);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="hl-t-micro rounded-md border border-[var(--hl-line-strong)] px-3 py-1.5 font-semibold text-[var(--hl-muted)] opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-[var(--hl-green-bright)]"
    >
      전체 화면
    </button>
  );
}
