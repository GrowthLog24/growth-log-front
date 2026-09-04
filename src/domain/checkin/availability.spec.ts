import { describe, it, expect } from "vitest";
import { resolveCheckinAvailability } from "./availability";

/**
 * 체크인 가용성 판정 동결 테스트.
 *
 * 체크인 설정(checkinConfig)과 회원의 기존 출결 상태를 받아
 * 배너를 어떤 상태로 보여줄지 결정한다.
 */
describe("resolveCheckinAvailability", () => {
  it("설정이 없으면 closed", () => {
    expect(resolveCheckinAvailability(null, null)).toBe("closed");
  });

  it("open=false면 closed", () => {
    expect(
      resolveCheckinAvailability({ open: false, meetingId: "m1" }, null)
    ).toBe("closed");
  });

  it("open=true여도 meetingId가 없으면 closed", () => {
    expect(
      resolveCheckinAvailability({ open: true, meetingId: null }, null)
    ).toBe("closed");
  });

  it("열려 있고 기존 기록이 없으면 open", () => {
    expect(
      resolveCheckinAvailability({ open: true, meetingId: "m1" }, null)
    ).toBe("open");
  });

  it("이미 present면 already-attended", () => {
    expect(
      resolveCheckinAvailability({ open: true, meetingId: "m1" }, "present")
    ).toBe("already-attended");
  });

  it("이미 late면 already-attended", () => {
    expect(
      resolveCheckinAvailability({ open: true, meetingId: "m1" }, "late")
    ).toBe("already-attended");
  });

  it("excused(사유결석) 상태면 다시 출석 가능(open)", () => {
    expect(
      resolveCheckinAvailability({ open: true, meetingId: "m1" }, "excused")
    ).toBe("open");
  });
});
