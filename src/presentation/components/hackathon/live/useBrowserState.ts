"use client";

import { useSyncExternalStore } from "react";

/** 시계 갱신 주기 */
const TICK_MS = 1_000;

function subscribeTick(onChange: () => void) {
  const timer = setInterval(onChange, TICK_MS);
  return () => clearInterval(timer);
}

/** 같은 초 안에서는 같은 값을 돌려줘 getSnapshot 캐싱 조건을 지킵니다. */
function getSecondSnapshot() {
  return Math.floor(Date.now() / TICK_MS) * TICK_MS;
}

function getZero() {
  return 0;
}

/**
 * 1초마다 갱신되는 현재 시각(epoch ms)입니다. 서버 렌더와 hydration 중에는 0입니다.
 *
 * @returns {number} 초 단위로 내림한 현재 시각, 또는 0
 */
export function useNow(): number {
  return useSyncExternalStore(subscribeTick, getSecondSnapshot, getZero);
}

function subscribeNothing() {
  return () => {};
}

/**
 * 현재 페이지의 origin입니다. 서버 렌더 중에는 빈 문자열입니다.
 *
 * @returns {string} 예: "https://growthlog.kr"
 */
export function useOrigin(): string {
  return useSyncExternalStore(
    subscribeNothing,
    () => window.location.origin,
    () => ""
  );
}

/**
 * 쿼리스트링 값 하나를 읽습니다. (Suspense 없이 쓰기 위해 useSearchParams 대신 사용)
 *
 * @param {string} key - 쿼리 키
 * @returns {string | null} 값, 없으면 null
 */
export function useQueryParam(key: string): string | null {
  return useSyncExternalStore(
    subscribeNothing,
    () => new URLSearchParams(window.location.search).get(key),
    () => null
  );
}

function subscribeOnline(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/**
 * 브라우저 온라인 여부입니다.
 *
 * @returns {boolean} 오프라인이면 false
 */
export function useIsOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true
  );
}

function subscribeFullscreen(onChange: () => void) {
  document.addEventListener("fullscreenchange", onChange);
  return () => document.removeEventListener("fullscreenchange", onChange);
}

/**
 * 전체 화면 상태와 지원 여부입니다.
 *
 * @returns {{ isFullscreen: boolean; isSupported: boolean }}
 */
export function useFullscreenState(): { isFullscreen: boolean; isSupported: boolean } {
  const isFullscreen = useSyncExternalStore(
    subscribeFullscreen,
    () => document.fullscreenElement !== null,
    () => false
  );
  const isSupported = useSyncExternalStore(
    subscribeNothing,
    () => document.fullscreenEnabled,
    () => false
  );
  return { isFullscreen, isSupported };
}
