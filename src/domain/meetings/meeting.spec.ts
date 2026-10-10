import { describe, it, expect } from "vitest";
import {
  normalizeMeetingType,
  buildMeetingTitle,
  isRegularMeeting,
  pickDefaultMeetingId,
} from "./meeting";

/**
 * 회차 종류(정기모임/그로스톡) 도메인 헬퍼 동결 테스트.
 *
 * 기존 회차 문서에는 type 필드가 없으므로(legacy),
 * 값이 없으면 "정기모임"으로 간주한다.
 */
describe("normalizeMeetingType", () => {
  it("그로스톡은 그대로", () => {
    expect(normalizeMeetingType("그로스톡")).toBe("그로스톡");
  });
  it("정기모임은 그대로", () => {
    expect(normalizeMeetingType("정기모임")).toBe("정기모임");
  });
  it("undefined/null/빈값/미지값은 정기모임", () => {
    expect(normalizeMeetingType(undefined)).toBe("정기모임");
    expect(normalizeMeetingType(null)).toBe("정기모임");
    expect(normalizeMeetingType("")).toBe("정기모임");
    expect(normalizeMeetingType("something")).toBe("정기모임");
  });
});

describe("buildMeetingTitle", () => {
  it("정기모임 제목", () => {
    expect(buildMeetingTitle(6, 1, "정기모임")).toBe("6기 1회차 정기모임");
  });
  it("그로스톡 제목", () => {
    expect(buildMeetingTitle(6, 2, "그로스톡")).toBe("6기 2회차 그로스톡");
  });
  it("타입 없으면 정기모임으로", () => {
    expect(buildMeetingTitle(5, 3)).toBe("5기 3회차 정기모임");
  });
});

describe("isRegularMeeting", () => {
  it("정기모임/legacy는 true, 그로스톡은 false", () => {
    expect(isRegularMeeting("정기모임")).toBe(true);
    expect(isRegularMeeting(undefined)).toBe(true);
    expect(isRegularMeeting("그로스톡")).toBe(false);
  });
});

/**
 * 출석 통계 화면의 기본 회차 선택 동결 테스트.
 *
 * 체크인이 열려 있는 회차를 최우선으로, 없으면 가장 최신(기수·회차 최대) 회차를 고른다.
 */
describe("pickDefaultMeetingId", () => {
  const MEETINGS = [
    { id: "m-5-3", generation: 5, round: 3 },
    { id: "m-6-1", generation: 6, round: 1 },
    { id: "m-5-10", generation: 5, round: 10 },
  ];

  it("체크인이 열린 회차가 목록에 있으면 그 회차를 고른다", () => {
    expect(pickDefaultMeetingId(MEETINGS, "m-5-3")).toBe("m-5-3");
  });

  it("체크인이 열려 있지 않으면 최신 회차(기수 우선)를 고른다", () => {
    expect(pickDefaultMeetingId(MEETINGS, null)).toBe("m-6-1");
  });

  it("열린 회차가 목록에 없으면(다른 종류) 최신 회차로 대체한다", () => {
    expect(pickDefaultMeetingId(MEETINGS, "talk-1")).toBe("m-6-1");
  });

  it("같은 기수면 회차 번호가 큰 쪽을 고른다", () => {
    const sameGen = [
      { id: "a", generation: 5, round: 2 },
      { id: "b", generation: 5, round: 10 },
    ];
    expect(pickDefaultMeetingId(sameGen, null)).toBe("b");
  });

  it("입력 정렬 순서와 무관하게 최신을 고른다", () => {
    const reversed = [...MEETINGS].reverse();
    expect(pickDefaultMeetingId(reversed, null)).toBe("m-6-1");
  });

  it("목록이 비면 빈 문자열", () => {
    expect(pickDefaultMeetingId([], "m-6-1")).toBe("");
  });
});
