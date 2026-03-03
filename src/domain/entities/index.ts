import { Timestamp } from "firebase/firestore";

/**
 * 사용자 역할
 */
export type UserRole = "admin" | "editor" | "viewer";

/**
 * 사용자
 * Collection: users/{email}
 */
export interface User {
  email: string;
  name: string;
  image?: string;
  role: UserRole;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 사이트 전역 설정
 * Collection: siteConfig/{docId}
 */
export interface SiteConfig {
  currentGeneration: number;
  navCtaText: string;
  navCtaLink: string;
  chatLink: string;
  /** 모집 활성화 여부 */
  isRecruitmentOpen: boolean;
  /** 모집 대상 기수 */
  recruitmentGeneration: number;
  /** 구글폼 링크 */
  recruitmentFormLink: string;
  updatedAt: Timestamp;
}

/**
 * 통계 데이터
 * Collection: stats/{docId}
 */
export interface Stats {
  operatingYears: number;
  activeMembers: number;
  projectsCount: number;
  generationsCount: number;
  totalMembers: number;
  growthPostsCount: number;
  updatedAt: Timestamp;
}

/**
 * 공지사항
 * Collection: notices/{noticeId}
 */
export interface Notice {
  id: string;
  title: string;
  summary: string;
  contentMd: string;
  isPinned: boolean;
  publishedAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * FAQ 카테고리 아이템
 * Collection: faqCategories/{categoryId}
 */
export interface FAQCategoryItem {
  id: string;
  name: string;
  order: number;
  createdAt: Timestamp;
}

/**
 * FAQ
 * Collection: faqs/{faqId}
 */
export interface FAQ {
  id: string;
  category: string;
  question: string;
  answerMd: string;
  order: number;
  isActive: boolean;
  updatedAt: Timestamp;
}

/**
 * 모집 상태
 */
export type RecruitmentStatus = "OPEN" | "CLOSED";

/**
 * OT 일정
 * SubCollection: recruitments/{generationId}/otSchedules/{otId}
 */
export interface OTSchedule {
  id: string;
  round: number;
  dateAt: Timestamp;
  timeText: string;
  locationText: string;
  note: string;
}

/**
 * 모집 정보
 * Collection: recruitments/{generationId}
 */
export interface Recruitment {
  id: string;
  generation: number;
  status: RecruitmentStatus;
  applyLink: string;
  deadlineAt: Timestamp;
  contactPhone: string;
  contactEmail: string;
  introMd: string;
  feeAmount: number;
  feeDescriptionMd: string;
  bankAccountText: string;
  regularMeetingsMd: string;
  updatedAt: Timestamp;
  otSchedules?: OTSchedule[];
}

/**
 * 활동 카테고리
 */
export type ActivityCategory =
  | "프로젝트"
  | "학사 스터디"
  | "성장일지"
  | "전문가 특강"
  | "그로스톡"
  | "클럽 활동";

/**
 * 썸네일 정보
 */
export interface Thumbnail {
  storagePath: string;
  url?: string;
}

/**
 * 외부 링크 플랫폼
 */
export type ExternalPlatform = "blog" | "instagram" | "youtube" | "notion" | "other";

/**
 * 활동
 * Collection: activities/{activityId}
 */
export interface Activity {
  id: string;
  category: ActivityCategory;
  title: string;
  summary: string;
  thumbnail: Thumbnail;
  tags: string[];
  generation: number;
  eventDateAt: Timestamp;
  publishedAt: Timestamp;
  isFeatured: boolean;
  /** 외부 링크 URL (블로그, 인스타그램 등) */
  externalUrl?: string;
  /** 외부 링크 플랫폼 유형 */
  externalPlatform?: ExternalPlatform;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 활동 본문
 * SubCollection: activities/{activityId}/body/main
 */
export interface ActivityBody {
  contentMd: string;
  updatedAt: Timestamp;
}

/**
 * 활동 상세 (활동 + 본문)
 */
export interface ActivityDetail extends Activity {
  body: ActivityBody;
}

/**
 * 미디어 타입
 */
export type MediaType = "image" | "file";

/**
 * 미디어
 * Collection: media/{mediaId}
 */
export interface Media {
  id: string;
  type: MediaType;
  storagePath: string;
  url: string;
  width?: number;
  height?: number;
  createdAt: Timestamp;
  ref?: {
    collection: string;
    documentId: string;
  };
}

/**
 * 멤버 후기
 * Collection: testimonials/{testimonialId}
 */
export interface Testimonial {
  id: string;
  /** 직무 카테고리 (예: "Back-End", "Front-End", "Mobile App") */
  category: string;
  /** 후기 내용 */
  content: string;
  /** 멤버 이름 */
  name: string;
  /** 기수 */
  generation: number;
  /** 프로필 이미지 Storage 경로 (선택) */
  avatarPath?: string;
  /** 노출 순서 */
  order: number;
  /** 활성화 여부 */
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 사전등록 폼 필드 타입
 */
export type PreRegistrationFieldType = "text" | "email" | "phone" | "select" | "textarea";

/**
 * 사전등록 폼 필드 설정
 */
export interface PreRegistrationField {
  id: string;
  /** 필드 타입 */
  type: PreRegistrationFieldType;
  /** 라벨 */
  label: string;
  /** 플레이스홀더 */
  placeholder?: string;
  /** 필수 여부 */
  required: boolean;
  /** select 타입일 경우 옵션 */
  options?: string[];
  /** 표시 순서 */
  order: number;
}

/**
 * 사전등록 폼 설정
 * Collection: preRegistrationConfig/{generationId}
 */
export interface PreRegistrationConfig {
  id: string;
  /** 대상 기수 */
  generation: number;
  /** 폼 제목 */
  title: string;
  /** 폼 설명 */
  description?: string;
  /** 폼 필드 목록 */
  fields: PreRegistrationField[];
  /** 활성화 여부 */
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 사전등록 제출 데이터
 * Collection: preRegistrations/{registrationId}
 */
export interface PreRegistration {
  id: string;
  /** 순차적 고유 번호 */
  seq: number;
  /** 대상 기수 */
  generation: number;
  /** 신청자 이름 (검색/정렬용) */
  name: string;
  /** 제출된 폼 데이터 (필드ID: 값) */
  formData: Record<string, string>;
  /** 제출 시간 */
  submittedAt: Timestamp;
}
