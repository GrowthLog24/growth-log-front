/**
 * 100분 해커톤 도메인 타입
 *
 * 시각은 모두 epoch milliseconds(number)로 저장한다.
 * 서버 컴포넌트·API route·로컬 채점 스크립트가 같은 값을 직렬화 없이 공유하기 위해서다.
 *
 * Firestore 구조
 * - hackathons/{hackathonId}                         : 행사 설정 (공개)
 * - hackathonSecrets/{hackathonId}                   : 팀 제출 코드 (공개 화면에서 읽지 않음)
 * - hackathonSubmissions/{hackathonId}_{teamId}      : 팀 제출물
 * - hackathonScores/{hackathonId}_{teamId}           : AI 채점 결과
 * - hackathonVotes/{hackathonId}_{memberId}          : 휴먼 인정상 투표 (회원당 1표)
 */

/** 해커톤 트랙 */
export type HackathonTrack = "A" | "B" | "C" | "D";

/** 팀 구성원 */
export interface HackathonTeamMember {
  /** members 컬렉션 문서 ID (매칭 실패 시 null) */
  memberId: string | null;
  name: string;
}

/** 팀 */
export interface HackathonTeam {
  /** 팀 식별자 (예: "team-1") */
  id: string;
  /** 표시 이름 (예: "1팀") */
  name: string;
  members: HackathonTeamMember[];
}

/** 행사 설정 문서: hackathons/{hackathonId} */
export interface Hackathon {
  id: string;
  title: string;
  /** 제작 시작 시각 (epoch ms) */
  startAt: number;
  /** 제출 마감 시각 (epoch ms) */
  endAt: number;
  teams: HackathonTeam[];
  /** 투표 자격 판정에 쓰는 정기모임 회차 ID (QR 출석 체크 대상) */
  meetingId: string | null;
  /** AI 채점 결과 공개 여부 (대시보드 결과 화면) */
  scoresPublic: boolean;
  /** 휴먼 인정상 투표 개방 여부 */
  votingOpen: boolean;
  updatedAt: number;
}

/** 팀 제출 코드 문서: hackathonSecrets/{hackathonId} */
export interface HackathonSecrets {
  /** teamId → 4자리 코드 */
  codes: Record<string, string>;
}

/** 제출 폼 입력값 */
export interface HackathonSubmissionInput {
  /** 프로젝트(서비스) 이름 */
  projectName: string;
  track: HackathonTrack;
  /** public GitHub 저장소 URL */
  githubUrl: string;
  /** 한 줄 소개 */
  oneLiner: string;
  /** 배포 링크 (선택) */
  deployUrl: string;
  /** 시연 자료 링크 (영상·슬라이드 등, 선택) */
  demoUrl: string;
  /** 기획 문서 — 목적 */
  planPurpose: string;
  /** 기획 문서 — 핵심 기능·비즈니스 로직 */
  planFeatures: string;
  /** 기획 문서 — 예상 결과 */
  planExpected: string;
  /** PRD·기획 문서 링크 (선택, Notion/Docs 등) */
  prdUrl: string;
}

/** 제출 문서: hackathonSubmissions/{hackathonId}_{teamId} */
export interface HackathonSubmission extends HackathonSubmissionInput {
  id: string;
  hackathonId: string;
  teamId: string;
  teamName: string;
  /** 최초 제출 시각 */
  firstSubmittedAt: number;
  /** 마지막 제출(수정) 시각 */
  submittedAt: number;
  /** 제출 횟수 (재제출 포함) */
  submitCount: number;
  /** 마감 이후 제출 여부 */
  isLate: boolean;
}

/** 채점 항목별 점수 */
export interface HackathonCriterionScore {
  key: string;
  label: string;
  score: number;
  max: number;
  comment: string;
}

/** AI 채점 결과: hackathonScores/{hackathonId}_{teamId} */
export interface HackathonScore {
  id: string;
  hackathonId: string;
  teamId: string;
  total: number;
  max: number;
  criteria: HackathonCriterionScore[];
  /** 총평 (2~3문장) */
  summary: string;
  /** 채점한 세션 표시 (예: "claude-session-team-1") */
  gradedBy: string;
  /** 채점 대상 제출의 submittedAt (재제출 후 재채점 필요 여부 판단용) */
  submissionVersion: number;
  gradedAt: number;
}

/** 투표 문서: hackathonVotes/{hackathonId}_{memberId} */
export interface HackathonVote {
  id: string;
  hackathonId: string;
  memberId: string;
  memberName: string;
  teamId: string;
  createdAt: number;
}

/** 진행 단계 */
export type HackathonPhase = "before" | "building" | "ended";
