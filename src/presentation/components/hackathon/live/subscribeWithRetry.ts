import type { Unsubscribe } from "firebase/firestore";

/** onSnapshot 오류 후 다시 구독하기까지 기다리는 시간 */
const RETRY_DELAY_MS = 5_000;

/**
 * onSnapshot 구독을 오류 시 자동으로 다시 시작합니다.
 *
 * Firestore 리스너는 권한·네트워크 오류로 한 번 끊기면 다시 붙지 않으므로,
 * 빔 화면이 멈추지 않도록 일정 시간 뒤 새로 구독합니다.
 *
 * @param {(onError: (error: Error) => void) => Unsubscribe} start - 구독 시작 함수
 * @param {(error: Error) => void} onFailure - 오류 알림 (연결 끊김 표시용)
 * @returns {Unsubscribe} 재시도 타이머까지 정리하는 해제 함수
 */
export function subscribeWithRetry(
  start: (onError: (error: Error) => void) => Unsubscribe,
  onFailure: (error: Error) => void
): Unsubscribe {
  let unsubscribe: Unsubscribe | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let isDisposed = false;

  const run = () => {
    unsubscribe = start((error) => {
      onFailure(error);
      unsubscribe?.();
      unsubscribe = null;
      if (!isDisposed) retryTimer = setTimeout(run, RETRY_DELAY_MS);
    });
  };
  run();

  return () => {
    isDisposed = true;
    if (retryTimer) clearTimeout(retryTimer);
    unsubscribe?.();
  };
}
