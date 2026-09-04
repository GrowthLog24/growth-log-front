import { describe, it, expect } from "vitest";
import { isInGangnam, GANGNAM_BBOX } from "./geo";

/**
 * 강남구 좌표 판정(bounding-box) 동결 테스트.
 *
 * 실내 GPS 오차를 감안해 강남구를 넉넉히 감싸는 사각형으로 판정한다.
 * 라운지(강남대로84길 23, 약 37.497 / 127.028)는 반드시 내부여야 한다.
 */
describe("isInGangnam", () => {
  it("라운지 좌표(강남대로84길 23)는 내부로 판정한다", () => {
    expect(isInGangnam(37.497, 127.028)).toBe(true);
  });

  it("강남구 북쪽(청담 부근)도 내부로 판정한다", () => {
    expect(isInGangnam(37.523, 127.053)).toBe(true);
  });

  it("부산 좌표는 외부로 판정한다", () => {
    expect(isInGangnam(35.1796, 129.0756)).toBe(false);
  });

  it("서울 강북(광화문 부근)은 외부로 판정한다", () => {
    expect(isInGangnam(37.5759, 126.9769)).toBe(false);
  });

  it("경계 바로 안쪽은 내부, 바로 바깥은 외부로 판정한다", () => {
    expect(isInGangnam(GANGNAM_BBOX.latMin, GANGNAM_BBOX.lngMin)).toBe(true);
    expect(isInGangnam(GANGNAM_BBOX.latMax, GANGNAM_BBOX.lngMax)).toBe(true);
    expect(isInGangnam(GANGNAM_BBOX.latMin - 0.001, 127.03)).toBe(false);
    expect(isInGangnam(37.5, GANGNAM_BBOX.lngMax + 0.001)).toBe(false);
  });

  it("NaN·무한대 좌표는 외부로 판정한다", () => {
    expect(isInGangnam(Number.NaN, 127.03)).toBe(false);
    expect(isInGangnam(37.5, Number.POSITIVE_INFINITY)).toBe(false);
  });
});
