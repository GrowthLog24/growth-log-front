/**
 * epoch ms를 한국 시간 "15:30" 형식으로 바꿉니다.
 *
 * @param {number} ms - 시각 (epoch ms)
 * @returns {string} 예: "15:30"
 */
export function formatKstTime(ms: number): string {
  return new Date(ms).toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * epoch ms를 한국 시간 "15:42:10" 형식으로 바꿉니다.
 *
 * @param {number} ms - 시각 (epoch ms)
 * @returns {string} 예: "15:42:10"
 */
export function formatKstTimeWithSeconds(ms: number): string {
  return new Date(ms).toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}
