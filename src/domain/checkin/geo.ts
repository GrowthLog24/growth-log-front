/**
 * 강남구 좌표 판정용 bounding-box.
 *
 * 라운지(서울 강남구 강남대로84길 23, 약 37.497 / 127.028)를 포함하도록,
 * 실내 GPS 오차를 감안해 강남구를 넉넉히 감싸는 사각형으로 정의한다.
 * (운영 방침: 실내 오차 때문에 '임의로 강남구' 범위로 검증)
 */
export const GANGNAM_BBOX = {
  latMin: 37.45,
  latMax: 37.55,
  lngMin: 127.0,
  lngMax: 127.12,
} as const;

/**
 * 좌표가 강남구(근사 bounding-box) 안에 있는지 판정한다.
 *
 * @param {number} lat - 위도
 * @param {number} lng - 경도
 * @returns {boolean} 강남구 범위 내이면 true. 유효하지 않은 좌표(NaN·무한대)는 false.
 */
export function isInGangnam(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;

  return (
    lat >= GANGNAM_BBOX.latMin &&
    lat <= GANGNAM_BBOX.latMax &&
    lng >= GANGNAM_BBOX.lngMin &&
    lng <= GANGNAM_BBOX.lngMax
  );
}
