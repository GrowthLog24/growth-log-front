/**
 * 활동 카테고리 영문 서브타이틀
 *
 * Note: 카테고리를 어느 페이지에 노출할지는 app/(site)/_shared/activityTracks.ts 가 결정합니다.
 */
export const ACTIVITY_CATEGORY_SUBTITLES: Record<string, string> = {
  study: "COMPUTER SCIENCE STUDY",
  "growth-log": "TECH BLOG CURATION",
  lecture: "GROWTH PRIME",
  "growth-talk": "GROWTH TALK",
  club: "GROWTH CLUB",
};

/**
 * FAQ 카테고리
 */
export const FAQ_CATEGORIES = [
  "가입 및 등록",
  "회비 및 환불",
  "활동 및 참여",
  "프로젝트 및 스터디",
  "그로스로그란",
] as const;

/**
 * 네비게이션 메뉴
 */
export const NAV_ITEMS = [
  { label: "About us", href: "/about-us" },
  { label: "Activity", href: "/activity" },
  { label: "Dev×AI", href: "/dev-ai" },
  { label: "Projects", href: "/projects" },
  { label: "KNOU CS", href: "/knou-cs" },
  { label: "Recruit", href: "/recruit" },
  { label: "Support", href: "/support" },
] as const;

/**
 * 소셜 링크
 */
export const SOCIAL_LINKS = {
  kakaoChannel: "https://pf.kakao.com/_xgxkxkxj", // 예시 URL
  instagram: "https://instagram.com/growth_log",
  email: "contact@growthlog.org",
} as const;

/**
 * 사이트 메타데이터
 */
export const SITE_METADATA = {
  title: "Growth Log",
  description: "AI와 함께 성장하는 개발 커뮤니티, 그로스로그",
  url: "https://www.growthlog.org",
  slogan: "{LEARN} {CONNECT} {BUILD}",
} as const;
