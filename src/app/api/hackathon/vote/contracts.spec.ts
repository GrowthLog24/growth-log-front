import { describe, expect, it } from "vitest";
import {
  isAttendedStatus,
  parseVoteRequest,
  rejectionToHttpStatus,
  sortAttendees,
  type AttendeeSummary,
} from "./contracts";

describe("isAttendedStatus", () => {
  it("출석·지각만 출석으로 인정", () => {
    expect(isAttendedStatus("present")).toBe(true);
    expect(isAttendedStatus("late")).toBe(true);
  });

  it("사유 결석·결석·기록 없음은 미출석", () => {
    expect(isAttendedStatus("excused")).toBe(false);
    expect(isAttendedStatus("absent")).toBe(false);
    expect(isAttendedStatus(null)).toBe(false);
    expect(isAttendedStatus(undefined)).toBe(false);
  });
});

describe("rejectionToHttpStatus", () => {
  it("사유별 상태 코드", () => {
    expect(rejectionToHttpStatus("unknown-team")).toBe(400);
    expect(rejectionToHttpStatus("voting-closed")).toBe(403);
    expect(rejectionToHttpStatus("not-attended")).toBe(403);
    expect(rejectionToHttpStatus("own-team")).toBe(403);
    expect(rejectionToHttpStatus("already-voted")).toBe(409);
  });
});

describe("parseVoteRequest", () => {
  it("정상 요청은 trim하여 반환", () => {
    expect(parseVoteRequest({ memberId: " m1 ", teamId: "team-1" })).toEqual({
      memberId: "m1",
      teamId: "team-1",
    });
  });

  it("객체가 아니거나 필드가 비면 null", () => {
    expect(parseVoteRequest(null)).toBeNull();
    expect(parseVoteRequest("m1")).toBeNull();
    expect(parseVoteRequest({ memberId: "m1" })).toBeNull();
    expect(parseVoteRequest({ memberId: "", teamId: "team-1" })).toBeNull();
    expect(parseVoteRequest({ memberId: 1, teamId: "team-1" })).toBeNull();
  });

  it("경로 구분자나 과도한 길이는 거부", () => {
    expect(parseVoteRequest({ memberId: "a/b", teamId: "team-1" })).toBeNull();
    expect(parseVoteRequest({ memberId: "x".repeat(129), teamId: "team-1" })).toBeNull();
  });
});

describe("sortAttendees", () => {
  const make = (name: string, generation: number): AttendeeSummary => ({
    memberId: `${name}-${generation}`,
    name,
    generation,
    hasVoted: false,
  });

  it("이름 가나다순, 동명이인은 기수순, 원본은 변경하지 않음", () => {
    const input = [make("홍길동", 6), make("김철수", 5), make("홍길동", 3)];
    const sorted = sortAttendees(input);
    expect(sorted.map((a) => a.memberId)).toEqual(["김철수-5", "홍길동-3", "홍길동-6"]);
    expect(input[0].memberId).toBe("홍길동-6");
  });
});
