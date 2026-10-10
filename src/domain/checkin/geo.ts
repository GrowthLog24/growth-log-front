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

/** 지구 평균 반지름(m) — 하버사인 거리 계산용 */
const EARTH_RADIUS_METERS = 6_371_000;

/**
 * 운영자가 지정한 체크인 장소(외부 모임용).
 * `CheckinConfig.location`과 같은 형태.
 */
export interface CheckinArea {
  lat: number;
  lng: number;
  radiusMeters: number;
}

/**
 * 두 좌표 사이의 대원 거리(m)를 하버사인 공식으로 계산한다.
 */
export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}

/**
 * 지정 장소 설정이 판정에 쓸 수 있을 만큼 유효한지 확인한다.
 */
export function isValidCheckinArea(
  area: CheckinArea | null | undefined
): area is CheckinArea {
  return (
    !!area &&
    Number.isFinite(area.lat) &&
    Number.isFinite(area.lng) &&
    Number.isFinite(area.radiusMeters) &&
    area.radiusMeters > 0
  );
}

/**
 * 현재 좌표가 체크인 허용 범위 안인지 판정한다.
 *
 * 운영자가 장소를 지정했으면 그 장소 반경 안인지, 지정하지 않았거나
 * 설정이 비정상이면 기본값(강남구 라운지 bounding-box)으로 판정한다.
 *
 * @returns {boolean} 허용 범위 내이면 true. 유효하지 않은 현재 좌표는 false.
 */
export function isInCheckinArea(
  lat: number,
  lng: number,
  area: CheckinArea | null | undefined
): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (!isValidCheckinArea(area)) return isInGangnam(lat, lng);

  return distanceMeters(lat, lng, area.lat, area.lng) <= area.radiusMeters;
}
