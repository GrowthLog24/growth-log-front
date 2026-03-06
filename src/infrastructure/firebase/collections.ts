/**
 * Firestore 컬렉션 경로 상수
 * PRD 문서 기반 컬렉션 구조
 */
export const COLLECTIONS = {
  /** 사용자 */
  USERS: "users",

  /** 사이트 전역 설정 */
  SITE_CONFIG: "siteConfig",

  /** 통계 데이터 */
  STATS: "stats",

  /** 공지사항 */
  NOTICES: "notices",

  /** FAQ */
  FAQS: "faqs",

  /** FAQ 카테고리 */
  FAQ_CATEGORIES: "faqCategories",

  /** 모집 정보 (기수별) */
  RECRUITMENTS: "recruitments",

  /** 활동 */
  ACTIVITIES: "activities",

  /** 미디어 라이브러리 */
  MEDIA: "media",

  /** 멤버 후기 */
  TESTIMONIALS: "testimonials",

  /** 사전등록 폼 설정 */
  PRE_REGISTRATION_CONFIG: "preRegistrationConfig",

  /** 사전등록 폼 필드 */
  PRE_REGISTRATION_FORM_FIELDS: "preRegistrationFormFields",

  /** 사전등록 제출 데이터 */
  PRE_REGISTRATIONS: "preRegistrations",

  /** 월별 일정 */
  MONTHLY_SCHEDULES: "monthlySchedules",

  /** 커뮤니티 블로그 */
  COMMUNITY_BLOGS: "communityBlogs",

  /** 멤버 */
  MEMBERS: "members",

  /** 행사 */
  EVENTS: "events",
} as const;

/**
 * 서브컬렉션 경로 생성 헬퍼
 */
export const getSubCollection = {
  /** 활동 본문: activities/{activityId}/body/main */
  activityBody: (activityId: string) =>
    `${COLLECTIONS.ACTIVITIES}/${activityId}/body`,

  /** OT 일정: recruitments/{generationId}/otSchedules */
  otSchedules: (generationId: string | number) =>
    `${COLLECTIONS.RECRUITMENTS}/${generationId}/otSchedules`,
} as const;

/**
 * 문서 ID 상수
 */
export const DOCUMENT_IDS = {
  /** siteConfig 메인 문서 */
  SITE_CONFIG_MAIN: "main",

  /** stats 메인 문서 */
  STATS_MAIN: "main",

  /** 활동 본문 메인 문서 */
  BODY_MAIN: "main",
} as const;
