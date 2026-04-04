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
  /** 그로스로그 주소 (지도용) */
  address?: string;
  /** 상세 주소 */
  addressDetail?: string;
  /** 오시는 길 안내 텍스트 */
  directionsText?: string;
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
  /** 정렬 순서 (낮을수록 먼저 표시) */
  sortOrder: number;
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
  updatedAt: Timestamp;

  // ===== 섹션 1: 신입회원 가입 안내 =====
  applyLink: string;              // 가입 신청서 링크
  deadlineAt: Timestamp;          // 마감 일시
  applyGuideMd: string;           // 가입 안내 문구 (메시지 템플릿, 카카오 채널 안내 등)

  // ===== 섹션 2: OT 안내 =====
  otSchedules?: OTSchedule[];     // OT 일정 목록
  otLocationMd: string;           // OT 장소 안내 문구
  otGuideMd: string;              // OT 참석/가입 안내 문구

  // ===== 섹션 3: 등록 입금 안내 =====
  feeAmount: number;              // 총 납부 금액
  feeDetailMd: string;            // 회비 상세 (회비, 보증금, 가입비 내역)
  bankAccountText: string;        // 납부 계좌
  feeDescriptionMd: string;       // 회비 안내 문구 (투명 공개, 보증금 환불 등)

  // ===== 섹션 4: 정기 모임 안내 =====
  firstMeetingAt?: Timestamp;     // 첫 정기 모임 일시
  regularMeetingsMd: string;      // 정기 모임 일정 안내
  activityScheduleMd: string;     // 월별 활동 일정
  meetingGuideMd: string;         // 정기 모임 안내 문구

  // ===== 기타 =====
  contactPhone: string;
  contactEmail: string;
  introMd: string;                // 인트로 문구 (기존)
  kakaoMessageTemplate: string;   // 카카오톡 문자 양식
}

/**
 * 회원 구분
 */
export type MemberType = "신입회원" | "정회원";

/**
 * 멤버
 * Collection: members/{memberId}
 */
export interface Member {
  id: string;
  /** 멤버 이름 */
  memberName: string;
  /** 가입 기수 */
  generation: number;
  /** 회원 구분 (현재기수 - 가입기수 >= 1 이면 정회원, 아니면 신입회원) */
  memberType: MemberType;
  /** 가입 여부 */
  isActive: boolean;
  /** 리디렉트 URL (선택) */
  redirectUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 활동 카테고리
 */
export type ActivityCategory =
  | "project"      // 프로젝트
  | "study"        // 학사 스터디
  | "growth-log"   // 성장일지
  | "lecture"      // 전문가 특강
  | "growth-talk"  // 그로스톡
  | "club";        // 클럽 활동

/**
 * 활동 카테고리 라벨
 */
export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
  project: "프로젝트",
  study: "학사 스터디",
  "growth-log": "성장일지",
  lecture: "전문가 특강",
  "growth-talk": "그로스톡",
  club: "클럽 활동",
};

/**
 * 활동 공통 필드
 */
interface ActivityBase {
  id: string;
  category: ActivityCategory;
  thumbnailUrl: string;
  generation: number;
  order: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 프로젝트
 * - 클릭 시 PDF Viewer 표시
 */
export interface ProjectActivity extends ActivityBase {
  category: "project";
  /** 프로젝트명 */
  projectName: string;
  /** 플랫폼 (Web, App, Embedded, Game 등) */
  platform: string;
  /** 프로젝트장명 */
  leaderName: string;
  /** 간단한 한줄 프로젝트 설명 */
  description: string;
  /** 발표 자료 PDF URL */
  pdfUrl: string;
}

/**
 * 학사 스터디
 * - 클릭 불가
 */
export interface StudyActivity extends ActivityBase {
  category: "study";
  /** 과목명 */
  subjectName: string;
  /** 학년 및 학기 */
  semester: string;
  /** 스터디장명 */
  leaderName: string;
}

/**
 * 성장일지
 * - 클릭 시 블로그 이동
 */
export interface GrowthLogActivity extends ActivityBase {
  category: "growth-log";
  /** 글 제목 */
  title: string;
  /** 구분 (Backend, Frontend 등) */
  field: string;
  /** 작성자명 */
  authorName: string;
  /** 블로그 글 일부 (최대 200자) */
  excerpt: string;
  /** 블로그 글 URL */
  blogUrl: string;
}

/**
 * 전문가 특강
 * - 클릭 불가
 */
export interface LectureActivity extends ActivityBase {
  category: "lecture";
  /** 특강명 */
  lectureName: string;
  /** 연사 소속 */
  speakerOrganization: string;
  /** 연사명 및 직함 */
  speakerTitle: string;
  /** 특강 일자 */
  lectureDate: Timestamp;
}

/**
 * 그로스톡
 * - 클릭 불가
 */
export interface GrowthTalkActivity extends ActivityBase {
  category: "growth-talk";
  /** 회차 */
  round: number;
  /** 제목 */
  title: string;
  /** 구분 (개발, 커리어, 학사) */
  field: string;
  /** 진행자명 */
  hostName: string;
  /** 날짜 */
  eventDate: Timestamp;
}

/**
 * 클럽 활동
 * - 클릭 불가
 */
export interface ClubActivity extends ActivityBase {
  category: "club";
  /** 클럽명 */
  clubName: string;
  /** 클럽장명 */
  leaderName: string;
  /** 클럽 소개글 (100자 이내) */
  description: string;
}

/**
 * 활동 통합 타입
 * Collection: activities/{activityId}
 */
export type Activity =
  | ProjectActivity
  | StudyActivity
  | GrowthLogActivity
  | LectureActivity
  | GrowthTalkActivity
  | ClubActivity;

/**
 * 클릭 가능한 활동인지 확인
 */
export function isClickableActivity(activity: Activity): boolean {
  return activity.category === "project" || activity.category === "growth-log";
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

/**
 * 월별 일정
 * Collection: monthlySchedules/{phase}
 */
export interface MonthlySchedule {
  /** 개월차 (0~6), 7은 정기 프로그램 */
  phase: number;
  /** 해당 월 표시 (예: "2월", "4월, 5월", "All") - 고정값 */
  months: string;
  /** 활동 내용 리스트 */
  activities: string[];
}

/**
 * 커뮤니티 블로그 플랫폼 타입
 */
export type CommunityBlogPlatform = "tistory" | "instagram" | "youtube";

/**
 * 커뮤니티 블로그
 * Collection: communityBlogs/{blogId}
 */
export interface CommunityBlog {
  id: string;
  /** 제목 */
  title: string;
  /** 외부 URL (티스토리, 인스타그램, 유튜브) */
  url: string;
  /** 플랫폼 타입 */
  platform: CommunityBlogPlatform;
  /** 썸네일 이미지 URL */
  thumbnailUrl: string;
  /** 기수 */
  generation: number;
  /** 게시 날짜 */
  publishedAt: Timestamp;
  /** 노출 순서 */
  order: number;
  /** 활성화 여부 */
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 행사 타임테이블 서브 아이템
 */
export interface EventTimeBlockSubItem {
  /** 제목 */
  title: string;
  /** 내용 (선택) */
  description?: string;
  /** 시작 시간 (HH:mm) */
  startTime: string;
  /** 종료 시간 (HH:mm) */
  endTime: string;
}

/**
 * 행사 타임테이블 블록
 */
export interface EventTimeBlock {
  id: string;
  /** 제목 */
  title: string;
  /** 내용 (선택) */
  description?: string;
  /** 시작 시간 (HH:mm) */
  startTime: string;
  /** 종료 시간 (HH:mm) */
  endTime: string;
  /** 서브 아이템 */
  subItems: EventTimeBlockSubItem[];
  /** 표시 순서 */
  order: number;
}

/**
 * 행사
 * Collection: events/{eventId}
 */
export interface Event {
  id: string;
  /** 행사명 */
  name: string;
  /** 행사 날짜 (YYYY-MM-DD) */
  date: string;
  /** 시작 시간 (HH:mm) */
  startTime: string;
  /** 종료 시간 (HH:mm) */
  endTime: string;
  /** 타임테이블 블록 목록 */
  timeBlocks: EventTimeBlock[];
  /** 활성화 여부 (공개 페이지에 표시) */
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
