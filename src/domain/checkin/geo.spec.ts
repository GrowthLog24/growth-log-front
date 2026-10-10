import { describe, it, expect } from "vitest";
import {
  isInGangnam,
  GANGNAM_BBOX,
  distanceMeters,
  isInCheckinArea,
} from "./geo";

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

/**
 * 커스텀 장소 반경 판정 동결 테스트.
 *
 * 운영자가 어드민에서 모임 장소(좌표)와 반경을 지정하면
 * 강남구 대신 그 장소 반경 안에서만 출석을 허용한다.
 */
describe("distanceMeters", () => {
  it("같은 좌표 사이 거리는 0이다", () => {
    expect(distanceMeters(37.5, 127.0, 37.5, 127.0)).toBe(0);
  });

  it("위도 0.01도 차이는 약 1.11km다", () => {
    const d = distanceMeters(37.5, 127.0, 37.51, 127.0);
    expect(d).toBeGreaterThan(1100);
    expect(d).toBeLessThan(1125);
  });
});

describe("isInCheckinArea", () => {
  const MAPO = {
    address: "서울 마포구 마포대로 122",
    lat: 37.5465,
    lng: 126.9523,
    radiusMeters: 1000,
  };

  it("장소 설정이 없으면 강남구 판정을 그대로 쓴다", () => {
    expect(isInCheckinArea(37.497, 127.028, null)).toBe(true);
    expect(isInCheckinArea(37.5465, 126.9523, undefined)).toBe(false);
  });

  it("장소 설정이 있으면 반경 안은 허용한다", () => {
    expect(isInCheckinArea(37.5465, 126.9523, MAPO)).toBe(true);
    // 약 550m 북쪽
    expect(isInCheckinArea(37.5515, 126.9523, MAPO)).toBe(true);
  });

  it("장소 설정이 있으면 강남 라운지라도 반경 밖은 차단한다", () => {
    expect(isInCheckinArea(37.497, 127.028, MAPO)).toBe(false);
  });

  it("반경 바로 바깥(약 1.1km)은 차단한다", () => {
    expect(isInCheckinArea(37.5565, 126.9523, MAPO)).toBe(false);
  });

  it("유효하지 않은 현재 좌표는 차단한다", () => {
    expect(isInCheckinArea(Number.NaN, 126.9523, MAPO)).toBe(false);
  });

  it("장소 좌표나 반경이 비정상이면 강남구 판정으로 폴백한다", () => {
    const broken = { ...MAPO, lat: Number.NaN };
    expect(isInCheckinArea(37.497, 127.028, broken)).toBe(true);
    const zeroRadius = { ...MAPO, radiusMeters: 0 };
    expect(isInCheckinArea(37.5465, 126.9523, zeroRadius)).toBe(false);
  });
});
