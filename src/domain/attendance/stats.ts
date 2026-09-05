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

/** 지각 일괄 저장 대상 한 명의 현재 상태 */
export interface AttendanceRowInput {
  /** 회원 문서 ID */
  memberId: string;
  /** 체크인 시각(epoch ms). 없으면 null */
  checkedInAtMs: number | null;
  /** 현재 출결 상태(출석/지각만 대상) */
  status: "present" | "late";
}

/** 저장이 필요한 상태 변경 한 건 */
export interface StatusUpdate {
  memberId: string;
  status: "present" | "late";
}

/**
 * 지각 기준으로 출석자별 목표 상태를 계산해, 현재와 다른 것만 반환합니다.
 *
 * 기준 이후 체크인은 "late", 기준 이하(또는 시각 없음)는 "present"가 목표입니다.
 * 이미 목표와 같은 사람은 제외해 불필요한 쓰기를 줄입니다. 기준을 당기면
 * 지각이었던 사람이 다시 정시("present")로 되돌아갑니다.
 *
 * @param {readonly AttendanceRowInput[]} rows - 출석(present/late) 명단
 * @param {number | null} thresholdMs - 지각 기준 시각(epoch ms). 없으면 변경 없음
 * @returns {StatusUpdate[]} 상태가 바뀌는 회원의 목표 상태 목록
 */
export function computeLateUpdates(
  rows: readonly AttendanceRowInput[],
  thresholdMs: number | null
): StatusUpdate[] {
  if (thresholdMs == null) return [];
  const updates: StatusUpdate[] = [];
  for (const row of rows) {
    const target = isLate(row.checkedInAtMs, thresholdMs) ? "late" : "present";
    if (target !== row.status) {
      updates.push({ memberId: row.memberId, status: target });
    }
  }
  return updates;
}
