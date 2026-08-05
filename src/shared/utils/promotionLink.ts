import { SITE_METADATA } from "@/shared/constants";

/** 키워드에 허용되는 문자 (소문자 영숫자, 하이픈, 언더스코어) */
const KEYWORD_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;

/** 키워드 최소 길이 */
const KEYWORD_MIN_LENGTH = 2;

/** 키워드 최대 길이 */
const KEYWORD_MAX_LENGTH = 40;

/**
 * 홍보물 QR 링크의 키워드를 정규화합니다.
 *
 * 인쇄된 QR을 사람이 직접 입력하는 경우도 있어, 대소문자와 공백 차이로
 * 링크를 못 찾는 일이 없도록 소문자·하이픈으로 통일합니다.
 *
 * @param {string} keyword - 입력된 키워드
 * @returns {string} 정규화된 키워드
 *
 * @example
 * normalizeKeyword("  Spring Poster  ");
 * // => "spring-poster"
 */
export function normalizeKeyword(keyword: string): string {
  return keyword
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}

/**
 * 키워드가 QR 주소로 쓸 수 있는 형식인지 검사합니다.
 *
 * @param {string} keyword - 정규화된 키워드
 * @returns {string | null} 문제가 없으면 null, 있으면 사용자에게 보여줄 메시지
 */
export function validateKeyword(keyword: string): string | null {
  if (keyword.length < KEYWORD_MIN_LENGTH) {
    return `키워드는 ${KEYWORD_MIN_LENGTH}자 이상이어야 합니다.`;
  }
  if (keyword.length > KEYWORD_MAX_LENGTH) {
    return `키워드는 ${KEYWORD_MAX_LENGTH}자 이하여야 합니다.`;
  }
  if (!KEYWORD_PATTERN.test(keyword)) {
    return "키워드는 영문 소문자, 숫자, -, _ 만 사용할 수 있고 영문·숫자로 시작해야 합니다.";
  }
  return null;
}

/**
 * 이동할 주소가 사용할 수 있는 형식인지 검사합니다.
 *
 * QR은 인쇄 후 되돌릴 수 없으므로, 리디렉트가 실패할 형식은 저장 전에 막습니다.
 *
 * @param {string} targetUrl - 입력된 이동 주소
 * @returns {string | null} 문제가 없으면 null, 있으면 사용자에게 보여줄 메시지
 */
export function validateTargetUrl(targetUrl: string): string | null {
  const trimmed = targetUrl.trim();
  if (!trimmed) {
    return "이동할 주소를 입력해주세요.";
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return "이동할 주소는 http:// 또는 https:// 로 시작하는 전체 주소여야 합니다.";
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "이동할 주소는 http:// 또는 https:// 로 시작해야 합니다.";
  }
  return null;
}

/**
 * QR이 가리킬 기준 주소를 반환합니다.
 *
 * 관리자 페이지는 admin 서브도메인에서도 열리기 때문에 현재 주소를 그대로
 * 쓰면 안 되고, 실제 공개 사이트 주소를 사용해야 합니다.
 * 다만 로컬 개발 중에는 만들어진 링크를 바로 눌러 확인할 수 있도록
 * 현재 주소를 사용합니다.
 *
 * @returns {string} 기준 주소 (뒤에 / 없음)
 */
export function getPromotionLinkBaseUrl(): string {
  if (typeof window !== "undefined") {
    const { hostname, origin } = window.location;
    if (hostname === "localhost" || hostname.endsWith(".localhost")) {
      return origin;
    }
  }
  return SITE_METADATA.url;
}

/**
 * 키워드로 QR에 담길 전체 주소를 만듭니다.
 *
 * @param {string} keyword - 정규화된 키워드
 * @param {string} [baseUrl] - 기준 주소 (기본값: 공개 사이트 주소)
 * @returns {string} `{baseUrl}/links/{keyword}` 형태의 주소
 *
 * @example
 * buildPromotionLinkUrl("spring-poster", "https://www.growthlog.org");
 * // => "https://www.growthlog.org/links/spring-poster"
 */
export function buildPromotionLinkUrl(
  keyword: string,
  baseUrl: string = getPromotionLinkBaseUrl()
): string {
  return `${baseUrl.replace(/\/$/, "")}/links/${keyword}`;
}
