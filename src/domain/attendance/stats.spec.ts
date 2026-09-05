import { describe, it, expect } from "vitest";
import { isLate, summarizeCheckinStats, computeLateUpdates } from "./stats";

/**
 * 출석 통계(지각 판정) 동결 테스트.
 *
 * 지각 기준 시각(threshold)을 기준으로, 그보다 늦게 체크인한 사람을 지각으로 센다.
 */
describe("isLate", () => {
  it("기준보다 늦으면 지각", () => {
    expect(isLate(1000, 900)).toBe(true);
  });
  it("기준과 같거나 빠르면 정상", () => {
    expect(isLate(900, 900)).toBe(false);
    expect(isLate(800, 900)).toBe(false);
  });
  it("체크인 시각이나 기준이 없으면 지각 아님", () => {
    expect(isLate(null, 900)).toBe(false);
    expect(isLate(1000, null)).toBe(false);
    expect(isLate(null, null)).toBe(false);
  });
});

describe("summarizeCheckinStats", () => {
  it("총원·지각·정시 수를 센다", () => {
    const s = summarizeCheckinStats([800, 900, 1000, 1200], 950);
    expect(s.total).toBe(4);
    expect(s.lateCount).toBe(2); // 1000, 1200
    expect(s.onTimeCount).toBe(2);
  });
  it("기준이 없으면 지각 0", () => {
    const s = summarizeCheckinStats([800, 1000], null);
    expect(s.total).toBe(2);
    expect(s.lateCount).toBe(0);
    expect(s.onTimeCount).toBe(2);
  });
});

describe("computeLateUpdates", () => {
  it("기준 이후 체크인은 지각으로, 이전은 정시로 목표 상태를 정한다", () => {
    const updates = computeLateUpdates(
      [
        { memberId: "a", checkedInAtMs: 800, status: "present" }, // 유지
        { memberId: "b", checkedInAtMs: 1000, status: "present" }, // → 지각
        { memberId: "c", checkedInAtMs: 1200, status: "late" }, // 유지
      ],
      950
    );
    // 상태가 바뀌는 사람만 반환
    expect(updates).toEqual([{ memberId: "b", status: "late" }]);
  });

  it("기준이 당겨져 지각이 정시로 바뀌면 present로 되돌린다", () => {
    const updates = computeLateUpdates(
      [{ memberId: "b", checkedInAtMs: 1000, status: "late" }],
      1500
    );
    expect(updates).toEqual([{ memberId: "b", status: "present" }]);
  });

  it("기준이 없으면 아무것도 바꾸지 않는다", () => {
    const updates = computeLateUpdates(
      [{ memberId: "a", checkedInAtMs: 1000, status: "present" }],
      null
    );
    expect(updates).toEqual([]);
  });

  it("체크인 시각이 없는 사람은 정시로 취급한다", () => {
    const updates = computeLateUpdates(
      [{ memberId: "a", checkedInAtMs: null, status: "late" }],
      950
    );
    expect(updates).toEqual([{ memberId: "a", status: "present" }]);
  });
});
