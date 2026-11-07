import { describe, it, expect } from "vitest";
import {
  buildDefaultConfig,
  fillMissingCodes,
  fromKstInputValue,
  generateUniqueCode,
  kstTodayAt,
  nextTeamIdentity,
  parseMemberNames,
  reissueCode,
  resolveMember,
  toKstInputValue,
  type MemberCandidate,
} from "./hackathonAdminUtils";

const MEMBERS: MemberCandidate[] = [
  { id: "m1", memberName: "홍길동", generation: 6, isActive: true },
  { id: "m2", memberName: "김철수", generation: 5, isActive: true },
  { id: "m3", memberName: "김철수", generation: 6, isActive: true },
];

describe("KST 입력값 변환", () => {
  it("epoch ↔ datetime-local 왕복", () => {
    const ms = Date.UTC(2026, 10, 7, 6, 30);
    expect(toKstInputValue(ms)).toBe("2026-11-07T15:30");
    expect(fromKstInputValue("2026-11-07T15:30")).toBe(ms);
  });

  it("잘못된 형식은 null", () => {
    expect(fromKstInputValue("")).toBeNull();
    expect(fromKstInputValue("2026-11-07 15:30")).toBeNull();
  });

  it("kstTodayAt은 KST 날짜 기준", () => {
    // UTC 11-06 20:00 = KST 11-07 05:00
    const now = Date.UTC(2026, 10, 6, 20, 0);
    expect(kstTodayAt(now, "15:30")).toBe(Date.UTC(2026, 10, 7, 6, 30));
  });

  it("기본 설정은 15:30~17:10, 팀 없음", () => {
    const config = buildDefaultConfig({ now: Date.UTC(2026, 10, 7, 1), meetingId: "mt" });
    expect(config.endAt - config.startAt).toBe(100 * 60 * 1000);
    expect(config.teams).toEqual([]);
    expect(config.meetingId).toBe("mt");
    expect(config.votingOpen).toBe(false);
  });
});

describe("제출 코드", () => {
  it("4자리로 패딩한다", () => {
    expect(generateUniqueCode([], () => 0.0042)).toBe("0042");
  });

  it("기존 코드와 겹치지 않는다", () => {
    let calls = 0;
    const random = () => (calls++ === 0 ? 0.1234 : 0.5678);
    expect(generateUniqueCode(["1234"], random)).toBe("5678");
  });

  it("모두 사용 중이면 에러", () => {
    const all = Array.from({ length: 10000 }, (_, n) => String(n).padStart(4, "0"));
    expect(() => generateUniqueCode(all)).toThrow();
  });

  it("reissueCode는 원본을 바꾸지 않고 다른 팀 코드와 겹치지 않는다", () => {
    const codes = { "team-1": "1111", "team-2": "2222" };
    const next = reissueCode(codes, "team-1");
    expect(codes["team-1"]).toBe("1111");
    expect(next["team-2"]).toBe("2222");
    expect(next["team-1"]).toMatch(/^\d{4}$/);
    expect(next["team-1"]).not.toBe("2222");
  });

  it("fillMissingCodes는 없는 팀만 채운다", () => {
    const teams = [
      { id: "team-1", name: "1팀", members: [] },
      { id: "team-2", name: "2팀", members: [] },
    ];
    const next = fillMissingCodes({ "team-1": "1111" }, teams);
    expect(next["team-1"]).toBe("1111");
    expect(next["team-2"]).toMatch(/^\d{4}$/);
    expect(next["team-2"]).not.toBe("1111");
  });
});

describe("팀원 매칭", () => {
  it("쉼표·줄바꿈으로 나누고 빈 값은 버린다", () => {
    expect(parseMemberNames(" 홍길동, 김철수,,\n이영희 ")).toEqual([
      "홍길동",
      "김철수",
      "이영희",
    ]);
  });

  it("정확히 일치하면 matched", () => {
    expect(resolveMember("홍길동", [], MEMBERS)).toEqual({
      memberId: "m1",
      name: "홍길동",
      match: "matched",
    });
  });

  it("없으면 unmatched", () => {
    expect(resolveMember("없는사람", [], MEMBERS).match).toBe("unmatched");
    expect(resolveMember("없는사람", [], MEMBERS).memberId).toBeNull();
  });

  it("동명이인은 최신 기수를 고르고 ambiguous", () => {
    expect(resolveMember("김철수", [], MEMBERS)).toEqual({
      memberId: "m3",
      name: "김철수",
      match: "ambiguous",
    });
  });

  it("기존 팀원의 memberId를 보존한다", () => {
    const previous = [{ memberId: "seeded", name: "외부인" }];
    expect(resolveMember("외부인", previous, MEMBERS)).toEqual({
      memberId: "seeded",
      name: "외부인",
      match: "matched",
    });
  });
});

describe("nextTeamIdentity", () => {
  it("겹치지 않는 다음 번호", () => {
    expect(nextTeamIdentity([])).toEqual({ id: "team-1", name: "1팀" });
    expect(nextTeamIdentity([{ id: "team-1" }, { id: "team-3" }])).toEqual({
      id: "team-4",
      name: "4팀",
    });
  });
});
