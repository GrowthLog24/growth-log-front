import { describe, it, expect } from "vitest";
import {
  normalizeMeetingType,
  buildMeetingTitle,
  isRegularMeeting,
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
