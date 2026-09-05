/**
 * 체크인 시각이 지각 기준을 넘었는지 판정합니다.
 *
 * @param {number | null} checkedInAtMs - 체크인 시각(epoch ms). 없으면 null
 * @param {number | null} thresholdMs - 지각 기준 시각(epoch ms). 없으면 null
 * @returns {boolean} 기준보다 늦게 체크인했으면 true. 값이 없으면 false
 */
export function isLate(
  checkedInAtMs: number | null,
  thresholdMs: number | null
): boolean {
  if (checkedInAtMs == null || thresholdMs == null) return false;
  return checkedInAtMs > thresholdMs;
}

/**
 * 출석 통계 요약
 */
export interface CheckinStat {
  /** 총 출석 인원 */
  total: number;
  /** 지각 인원 */
  lateCount: number;
  /** 정시 인원 */
  onTimeCount: number;
}

/**
 * 체크인 시각 목록과 지각 기준으로 출석 통계를 요약합니다.
 *
 * @param {readonly (number | null)[]} checkedInAtMsList - 출석자별 체크인 시각(epoch ms)
 * @param {number | null} thresholdMs - 지각 기준 시각(epoch ms). 없으면 지각 0
 * @returns {CheckinStat} 총원·지각·정시 인원
 */
export function summarizeCheckinStats(
  checkedInAtMsList: readonly (number | null)[],
  thresholdMs: number | null
): CheckinStat {
  const total = checkedInAtMsList.length;
  const lateCount = checkedInAtMsList.filter((ms) =>
    isLate(ms, thresholdMs)
  ).length;
  return { total, lateCount, onTimeCount: total - lateCount };
}
