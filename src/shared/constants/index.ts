/**
 * 활동 카테고리 (영문 slug)
 */
export const ACTIVITY_CATEGORIES = [
  "project",
  "study",
  "growth-log",
  "lecture",
  "growth-talk",
  "club",
] as const;

/**
 * 활동 카테고리 영문 서브타이틀
 */
export const ACTIVITY_CATEGORY_SUBTITLES: Record<string, string> = {
  project: "TEAM PROJECT",
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
  description: "함께 성장하는 IT 커뮤니티, 그로스로그",
  url: "https://www.growthlog.org",
  slogan: "{CODE} {GROW}",
} as const;
