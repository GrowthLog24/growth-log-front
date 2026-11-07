import { describe, expect, it } from "vitest";
import type { HackathonTeam } from "@/domain/hackathon/types";
import type { AttendeeSummary } from "@/app/api/hackathon/vote/contracts";
import { filterAttendees, isOwnTeam, parseStoredVote } from "./voteView";

const attendees: AttendeeSummary[] = [
  { memberId: "a", name: "김철수", generation: 6, hasVoted: false },
  { memberId: "b", name: "홍 길동", generation: 5, hasVoted: true },
  { memberId: "c", name: "Alice", generation: 6, hasVoted: false },
];

describe("filterAttendees", () => {
  it("빈 검색어는 전체를 새 배열로 반환", () => {
    const result = filterAttendees(attendees, "  ");
    expect(result).toEqual(attendees);
    expect(result).not.toBe(attendees);
  });

  it("공백·대소문자 무시 부분 일치", () => {
    expect(filterAttendees(attendees, "길동").map((a) => a.memberId)).toEqual(["b"]);
    expect(filterAttendees(attendees, "홍길").map((a) => a.memberId)).toEqual(["b"]);
    expect(filterAttendees(attendees, "ali").map((a) => a.memberId)).toEqual(["c"]);
  });

  it("일치 없음은 빈 배열", () => {
    expect(filterAttendees(attendees, "이영희")).toEqual([]);
  });
});

describe("isOwnTeam", () => {
  const team: HackathonTeam = {
    id: "team-1",
    name: "1팀",
    members: [
      { memberId: "a", name: "김철수" },
      { memberId: null, name: "외부 참가자" },
    ],
  };

  it("구성원이면 true, 아니면 false", () => {
    expect(isOwnTeam(team, "a")).toBe(true);
    expect(isOwnTeam(team, "b")).toBe(false);
  });
});

describe("parseStoredVote", () => {
  it("정상 JSON 해석", () => {
    expect(parseStoredVote('{"memberId":"a","name":"김철수"}')).toEqual({
      memberId: "a",
      name: "김철수",
    });
  });

  it("손상·빈 값은 null", () => {
    expect(parseStoredVote(null)).toBeNull();
    expect(parseStoredVote("{")).toBeNull();
    expect(parseStoredVote('{"name":"x"}')).toBeNull();
    expect(parseStoredVote("123")).toBeNull();
  });
});
