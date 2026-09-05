import { describe, it, expect } from "vitest";
import { summarizeAttendance } from "./index";

/**
 * 출결 집계 동결 테스트.
 *
 * 회차는 (기수, 회차 번호) 복합키로 식별해야 한다.
 * 서로 다른 기수의 같은 회차 번호(예: 5기 1회차 vs 6기 1회차)가
 * 섞이거나 중복 집계되면 안 된다.
 */
describe("summarizeAttendance", () => {
  it("기수가 다르면 같은 회차 번호도 별개로 집계한다 (5기1 ≠ 6기1)", () => {
    const meetings = [
      { generation: 5, round: 1 },
      { generation: 6, round: 1 },
    ];
    const records = [{ generation: 6, round: 1, status: "present" as const }];

    const s = summarizeAttendance(meetings, records);

    expect(s.totalMeetings).toBe(2);
    expect(s.timeline).toHaveLength(2);
    expect(s.timeline[0]).toEqual({ generation: 5, round: 1, status: "absent" });
    expect(s.timeline[1]).toEqual({ generation: 6, round: 1, status: "present" });
    expect(s.presentCount).toBe(1);
    expect(s.absentCount).toBe(1);
  });

  it("기수 → 회차 순으로 정렬한다", () => {
    const meetings = [
      { generation: 6, round: 2 },
      { generation: 5, round: 3 },
      { generation: 5, round: 1 },
    ];

    const s = summarizeAttendance(meetings, []);

    expect(s.timeline.map((t) => `${t.generation}-${t.round}`)).toEqual([
      "5-1",
      "5-3",
      "6-2",
    ]);
  });

  it("출석률은 사유 결석을 모수에서 제외한다", () => {
    const meetings = [
      { generation: 5, round: 1 },
      { generation: 5, round: 2 },
      { generation: 5, round: 3 },
    ];
    const records = [
      { generation: 5, round: 1, status: "present" as const },
      { generation: 5, round: 2, status: "excused" as const },
    ];

    const s = summarizeAttendance(meetings, records);

    // 참석 1 / (총 3 - 사유결석 1 = 2) = 50%
    expect(s.attendanceRate).toBe(50);
    expect(s.excusedCount).toBe(1);
  });
});
