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
 * CTA 설정 모드
 * - auto: 모집 상태 기반 자동 생성
 * - manual: 어드민에서 설정한 텍스트/링크 사용
 */
export type CtaMode = "auto" | "manual";

/**
 * 사이트 전역 설정
 * Collection: siteConfig/{docId}
 */
export interface SiteConfig {
  currentGeneration: number;
  /** @deprecated 사용하지 않음. ctaMode와 primaryCtaText를 사용하세요. */
  navCtaText: string;
  /** @deprecated 사용하지 않음. ctaMode와 primaryCtaLink를 사용하세요. */
  navCtaLink: string;
  chatLink: string;
  /** 모집 활성화 여부 */
  isRecruitmentOpen: boolean;
  /** 모집 대상 기수 */
  recruitmentGeneration: number;
  /** 구글폼 링크 - 방송대 컴퓨터과학과 학우용 지원서 */
  recruitmentFormLink: string;
  /** 구글폼 링크 - 방송대 그 외 학과 학우용 지원서 (미설정 시 DEFAULT_KNOU_OTHER_FORM_LINK 폴백) */
  recruitmentFormLinkOther?: string;
  /** 그로스로그 주소 (지도용) */
  address?: string;
  /** 상세 주소 */
  addressDetail?: string;
  /** 오시는 길 안내 텍스트 */
  directionsText?: string;
  /** CTA 설정 모드 - auto: 모집상태 기반 자동, manual: 수동 설정 */
  ctaMode?: CtaMode;
  /** 메인 CTA 텍스트 (manual 모드에서 사용) */
  primaryCtaText?: string;
  /** 메인 CTA 링크 (manual 모드에서 사용) */
  primaryCtaLink?: string;
  /** 보조 CTA 텍스트 (HeroSection 두번째 버튼, manual 모드에서 사용) */
  secondaryCtaText?: string;
  /** 보조 CTA 링크 (HeroSection 두번째 버튼, manual 모드에서 사용) */
  secondaryCtaLink?: string;
  /** 인스타그램 링크 */
  instagramLink?: string;
  /** 블로그 링크 (티스토리) */
  blogLink?: string;
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
  /** 행사 날짜 (공지 목록 정렬 기준) */
  eventDate: Timestamp;
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
  /** 프로필 이미지 URL (선택) */
  profileImageUrl?: string;
  /** 한 줄 소개 (선택, 최대 100자) */
  bio?: string;
  /** 기술 분야 (예: Frontend, Backend) */
  field?: string;
  /**
   * @deprecated 리디렉트 기능이 제거되었습니다.
   * QR 코드는 회원 업적 페이지(/member/{기수}/{이름})로 직접 연결됩니다.
   * 기존 문서에 남아 있는 값을 읽을 수 있도록 타입만 유지합니다.
   */
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
  /**
   * 홈페이지(활동 기록 트랙 페이지) 노출 여부
   *
   * 회원 개인 업적 페이지와 노출 대상을 분리하기 위한 값입니다.
   * `false`일 때만 홈에서 숨기며, 값이 없는 기존 문서는 계속 노출됩니다.
   * (Firestore는 존재하지 않는 필드를 동등 비교에서 제외하므로,
   *  쿼리 조건이 아닌 결과 필터로 판정합니다)
   */
  showOnHome?: boolean;
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
  /** 프로젝트 블로그 링크 URL */
  blogUrl?: string;
  /**
   * 참여 회원 ID 목록 (members 컬렉션 문서 ID)
   * 회원 업적 페이지의 "참여 프로젝트" 집계에 사용합니다.
   */
  participantMemberIds?: string[];
  /** 참여 회원 이름 목록 (표시 전용 비정규화 필드) */
  participantNames?: string[];
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
  /**
   * 작성자 회원 ID (members 컬렉션 문서 ID)
   *
   * 신규 등록 건은 이 필드로 회원과 연결합니다.
   * 값이 없는 기존 데이터는 authorName + generation 매칭으로 폴백 조회합니다.
   */
  memberId?: string;
  /** 제출한 정기모임 회차 문서 ID */
  meetingId?: string;
  /** 제출 회차 번호 (정렬·표시를 위한 비정규화 필드) */
  round?: number;
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
  /**
   * 구분 (개발, 커리어, 학사) - 그로스톡의 field와 동일 규약
   * 트랙 페이지 분기에 사용하며, 값이 없으면 Dev×AI로 분류합니다.
   */
  field?: string;
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

/**
 * 수상 내역
 * Collection: awards/{awardId}
 */
export interface Award {
  id: string;
  /** 연결된 프로젝트 ID (activities 컬렉션의 project) */
  projectId: string;
  /** 수상명 (대상, 최우수상, 우수상 등) */
  awardTitle: string;
  /** 대회명 */
  competitionName: string;
  /** 수상 프로젝트명 (projectId로 자동 채워지거나 직접 입력) */
  projectName: string;
  /** 수상일 */
  awardDate: Timestamp;
  /** 기수 */
  generation: number;
  /** 정렬 순서 */
  order: number;
  /** 활성화 여부 */
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 방송대 홍보 게시판 확인 상태
 */
export type PromotionBoardStatus = "준비됨" | "확인 필요" | "게시판 없음";

/**
 * 방송대 홍보 게시 대상 구분
 */
export type PromotionBoardType = "학과" | "지역대학";

/**
 * 방송대 홍보 게시판 데이터 출처
 */
export type PromotionBoardSourceKind = "excel-snapshot" | "google-sheets";

/** 운영 시트 D열의 `1p 게시여부` 값 */
export type PromotionBoardFirstPageStatus = "O" | "X";

/**
 * 방송대 홍보 게시 회차 결과
 */
export interface PromotionPostingRound {
  round: number;
  postedAt: string;
  postUrl: string;
  count: number | null;
}

/**
 * 방송대 홍보 게시 대상(학과·지역대학 게시판)
 * 출처: Google Sheets 운영 시트 (자체 저장소 없음)
 */
export interface PromotionBoard {
  id: string;
  group: string;
  name: string;
  type: PromotionBoardType;
  firstPageStatus: PromotionBoardFirstPageStatus;
  boardName: string;
  status: PromotionBoardStatus;
  homepageUrl: string;
  boardUrl: string;
  lastChecked: string;
  note: string;
  totalPosts: number | null;
  postings: PromotionPostingRound[];
}

/**
 * 방송대 홍보 게시 대상 스냅샷 (Google Sheets 동기화 결과)
 */
export interface PromotionBoardSnapshot {
  source: PromotionBoardSourceKind;
  sourceLabel: string;
  syncedAt: string;
  postRounds: number[];
  boards: PromotionBoard[];
}

/**
 * 정기모임 (회차)
 * Collection: meetings/{meetingId}
 *
 * 회원 업적 페이지의 출결 기록은 이 회차를 기준으로 집계됩니다.
 */
export interface Meeting {
  id: string;
  /** 기수 */
  generation: number;
  /** 회차 (기수 내에서 1부터 증가) */
  round: number;
  /** 회차 제목 (예: "5기 3회차 정기모임") */
  title: string;
  /** 모임 일자 */
  meetingDate: Timestamp;
  /** 출결 집계 대상 여부 (false면 출석률 계산에서 제외) */
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 출결 상태
 * - present: 출석
 * - late: 지각
 * - excused: 사유 결석 (출석률 모수에서 제외)
 * - absent: 결석
 */
export type AttendanceStatus = "present" | "late" | "excused" | "absent";

/**
 * 출결 상태 라벨
 */
export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "출석",
  late: "지각",
  excused: "사유 결석",
  absent: "결석",
};

/**
 * 정기모임 출결 기록
 * Collection: attendances/{meetingId}_{memberId}
 *
 * 문서 ID를 `${meetingId}_${memberId}`로 고정해 같은 회차·회원의
 * 중복 기록이 생기지 않도록 합니다.
 */
export interface Attendance {
  id: string;
  /** 정기모임 회차 문서 ID */
  meetingId: string;
  /** 회원 문서 ID */
  memberId: string;
  /** 기수 (회원별 조회 최적화를 위한 비정규화 필드) */
  generation: number;
  /** 회차 번호 (정렬·표시를 위한 비정규화 필드) */
  round: number;
  /** 출결 상태 */
  status: AttendanceStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 홍보물 QR 링크
 * Collection: promotionLinks/{docId}
 *
 * 발급된 QR은 `{사이트 주소}/apply/{keyword}`를 가리키고,
 * 해당 경로는 서버에서 `targetUrl`로 리디렉트합니다.
 * 목적지가 바뀌어도 이미 인쇄된 QR을 그대로 쓸 수 있습니다.
 */
export interface PromotionLink {
  id: string;
  /** QR 코드 이름 (예: "2026 봄 학기 모집 포스터") */
  name: string;
  /** QR 주소에 사용되는 키워드 (소문자 영숫자와 -, _ 만 허용, 전체에서 유일) */
  keyword: string;
  /** 어느 홍보물에 사용했는지 기록하는 노트 */
  note: string;
  /** QR을 찍었을 때 이동할 주소 */
  targetUrl: string;
  /** 활성 여부 (false면 스캔 시 404) */
  isActive: boolean;
  /** 누적 스캔 수 */
  scanCount: number;
  /** 마지막 스캔 시각 (한 번도 스캔되지 않았으면 없음) */
  lastScannedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 홍보물 QR 스캔 기록
 * Collection: promotionLinkScans/{docId}
 *
 * 스캔 1회당 문서 1개를 남겨 기간별 추이를 집계합니다.
 * 링크가 삭제된 뒤에도 어떤 QR이었는지 알 수 있도록 keyword를 함께 저장합니다.
 */
export interface PromotionLinkScan {
  id: string;
  /** 스캔된 링크 문서 ID */
  linkId: string;
  /** 스캔된 링크의 키워드 (비정규화 필드) */
  keyword: string;
  /** 스캔 시각 */
  scannedAt: Timestamp;
}

/**
 * 라운지 QR 체크인 설정
 * Collection: checkinConfig/current (단일 문서)
 *
 * 운영자가 admin에서 특정 정기모임 회차의 체크인을 열고 닫습니다.
 * 회원이 명찰 QR로 업적 페이지에 진입하면 이 설정을 읽어
 * 체크인 배너 표시 여부를 결정합니다.
 */
export interface CheckinConfig {
  /** 현재 체크인을 받는 정기모임 회차 문서 ID. 닫혀 있으면 null */
  meetingId: string | null;
  /** 체크인 개방 여부 */
  open: boolean;
  /** 마지막으로 체크인을 연 시각 */
  openedAt?: Timestamp;
  updatedAt: Timestamp;
}
