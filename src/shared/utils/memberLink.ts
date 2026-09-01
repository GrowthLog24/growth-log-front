import { SITE_METADATA } from "@/shared/constants";

/**
 * 회원 업적 페이지 경로를 만듭니다.
 *
 * 이름은 경로에 그대로 들어가므로 반드시 인코딩합니다.
 *
 * @param {number} generation - 가입 기수
 * @param {string} memberName - 회원 이름
 * @returns {string} `/member/{기수}/{이름}` 형태의 경로
 *
 * @example
 * buildMemberAchievementPath(2, "박예승");
 * // => "/member/2/%EB%B0%95%EC%98%88%EC%8A%B9"
 */
export function buildMemberAchievementPath(
  generation: number,
  memberName: string
): string {
  return `/member/${generation}/${encodeURIComponent(memberName)}`;
}

/**
 * 회원 업적 페이지의 전체 주소를 만듭니다.
 *
 * 인쇄물(명찰·명함)에 넣는 QR은 인쇄된 뒤에 바꿀 수 없으므로,
 * 기본값으로 개발 환경 주소가 아닌 공개 사이트 주소를 사용합니다.
 *
 * @param {number} generation - 가입 기수
 * @param {string} memberName - 회원 이름
 * @param {string} [baseUrl] - 기준 주소 (기본값: 공개 사이트 주소)
 * @returns {string} 회원 업적 페이지 주소
 *
 * @example
 * buildMemberAchievementUrl(2, "박예승");
 * // => "https://www.growthlog.org/member/2/%EB%B0%95%EC%98%88%EC%8A%B9"
 */
export function buildMemberAchievementUrl(
  generation: number,
  memberName: string,
  baseUrl: string = SITE_METADATA.url
): string {
  return `${baseUrl.replace(/\/$/, "")}${buildMemberAchievementPath(generation, memberName)}`;
}
