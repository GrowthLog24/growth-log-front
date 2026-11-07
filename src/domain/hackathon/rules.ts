import { HACKATHON_TEXT_LIMITS, HACKATHON_TRACK_KEYS } from "./constants";
import type {
  HackathonPhase,
  HackathonSubmissionInput,
  HackathonTeam,
  HackathonVote,
} from "./types";

/**
 * 현재 시각의 진행 단계를 판정합니다.
 *
 * @param {number} now - 현재 시각 (epoch ms)
 * @param {{ startAt: number; endAt: number }} window - 제작 시작·마감 시각
 * @returns {HackathonPhase} before | building | ended
 */
export function getHackathonPhase(
  now: number,
  window: { startAt: number; endAt: number }
): HackathonPhase {
  if (now < window.startAt) return "before";
  if (now < window.endAt) return "building";
  return "ended";
}

/**
 * 남은 밀리초를 HH:MM:SS 또는 MM:SS 문자열로 바꿉니다. 음수는 0으로 취급합니다.
 *
 * @param {number} ms - 남은 시간 (밀리초)
 * @returns {string} 예: "1:39:59", "09:05", "00:00"
 */
export function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * http(s) 절대 URL인지 확인합니다.
 *
 * @param {string} value - 검사할 문자열
 * @returns {boolean} http/https URL이면 true
 */
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * github.com 저장소 URL인지 확인합니다. (https://github.com/{owner}/{repo})
 *
 * @param {string} value - 검사할 문자열
 * @returns {boolean} 저장소 URL이면 true
 */
export function isGithubRepoUrl(value: string): boolean {
  if (!isHttpUrl(value)) return false;
  const url = new URL(value.trim());
  if (url.hostname !== "github.com" && url.hostname !== "www.github.com") {
    return false;
  }
  const segments = url.pathname.split("/").filter(Boolean);
  return segments.length >= 2;
}

/** 제출 검증 오류: 필드명 → 메시지 */
export type SubmissionErrors = Partial<
  Record<keyof HackathonSubmissionInput, string>
>;

/**
 * 제출 입력값을 검증합니다. 필수: 프로젝트명, 트랙, GitHub, 한 줄 소개, 기획 3항목.
 * 시연 자료는 배포 링크나 시연 링크 중 하나 이상이 필요합니다.
 *
 * @param {HackathonSubmissionInput} input - 정규화(trim)된 입력값
 * @returns {SubmissionErrors} 오류가 없으면 빈 객체
 */
export function validateSubmission(
  input: HackathonSubmissionInput
): SubmissionErrors {
  const errors: SubmissionErrors = {};
  const limits = HACKATHON_TEXT_LIMITS;

  if (!input.projectName) errors.projectName = "프로젝트 이름을 입력해 주세요.";
  else if (input.projectName.length > limits.projectName)
    errors.projectName = `${limits.projectName}자 이내로 입력해 주세요.`;

  if (!HACKATHON_TRACK_KEYS.includes(input.track))
    errors.track = "트랙을 선택해 주세요.";

  if (!input.githubUrl) errors.githubUrl = "GitHub 저장소 링크를 입력해 주세요.";
  else if (!isGithubRepoUrl(input.githubUrl))
    errors.githubUrl = "https://github.com/계정/저장소 형식의 링크를 입력해 주세요.";

  if (!input.oneLiner) errors.oneLiner = "한 줄 소개를 입력해 주세요.";
  else if (input.oneLiner.length > limits.oneLiner)
    errors.oneLiner = `${limits.oneLiner}자 이내로 입력해 주세요.`;

  const optionalUrls = ["deployUrl", "demoUrl", "prdUrl"] as const;
  for (const key of optionalUrls) {
    const value = input[key];
    if (value && (!isHttpUrl(value) || value.length > limits.url)) {
      errors[key] = "http(s)로 시작하는 올바른 링크를 입력해 주세요.";
    }
  }
  if (!input.deployUrl && !input.demoUrl) {
    errors.demoUrl = "배포 링크 또는 시연 자료 링크 중 하나는 필요합니다.";
  }

  const planFields = [
    ["planPurpose", "목적"],
    ["planFeatures", "핵심 기능·비즈니스 로직"],
    ["planExpected", "예상 결과"],
  ] as const;
  for (const [key, label] of planFields) {
    if (!input[key]) errors[key] = `기획 문서의 ${label}을(를) 입력해 주세요.`;
    else if (input[key].length > limits.plan)
      errors[key] = `${limits.plan}자 이내로 입력해 주세요.`;
  }

  return errors;
}

/**
 * 원시 입력(unknown)을 trim된 제출 입력값으로 정규화합니다. 문자열이 아니면 빈 문자열.
 *
 * @param {unknown} raw - 요청 본문 등 외부 입력
 * @returns {HackathonSubmissionInput} 정규화된 입력값
 */
export function normalizeSubmissionInput(raw: unknown): HackathonSubmissionInput {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const text = (key: string) =>
    typeof source[key] === "string" ? (source[key] as string).trim() : "";
  return {
    projectName: text("projectName"),
    track: text("track") as HackathonSubmissionInput["track"],
    githubUrl: text("githubUrl"),
    oneLiner: text("oneLiner"),
    deployUrl: text("deployUrl"),
    demoUrl: text("demoUrl"),
    planPurpose: text("planPurpose"),
    planFeatures: text("planFeatures"),
    planExpected: text("planExpected"),
    prdUrl: text("prdUrl"),
  };
}

/** 투표 거부 사유 */
export type VoteRejection =
  | "voting-closed"
  | "not-attended"
  | "already-voted"
  | "own-team"
  | "unknown-team";

/**
 * 투표 가능 여부를 판정합니다. 가능하면 null을 반환합니다.
 *
 * @param {object} params - 판정에 필요한 상태
 * @returns {VoteRejection | null} 거부 사유, 가능하면 null
 */
export function checkVoteEligibility(params: {
  votingOpen: boolean;
  hasAttended: boolean;
  hasVoted: boolean;
  memberId: string;
  targetTeamId: string;
  teams: readonly HackathonTeam[];
}): VoteRejection | null {
  if (!params.votingOpen) return "voting-closed";
  const target = params.teams.find((team) => team.id === params.targetTeamId);
  if (!target) return "unknown-team";
  if (!params.hasAttended) return "not-attended";
  if (params.hasVoted) return "already-voted";
  const isOwnTeam = target.members.some(
    (member) => member.memberId === params.memberId
  );
  if (isOwnTeam) return "own-team";
  return null;
}

/** 투표 거부 사유별 안내 문구 */
export const VOTE_REJECTION_MESSAGES: Record<VoteRejection, string> = {
  "voting-closed": "지금은 투표 시간이 아닙니다.",
  "not-attended": "오늘 QR 출석 체크를 한 회원만 투표할 수 있습니다.",
  "already-voted": "이미 투표하셨습니다. 투표는 1인 1표입니다.",
  "own-team": "본인 팀에는 투표할 수 없습니다.",
  "unknown-team": "존재하지 않는 팀입니다.",
};

/**
 * 팀별 득표 수를 집계합니다. 득표 내림차순, 같으면 팀 순서를 유지합니다.
 *
 * @param {readonly HackathonTeam[]} teams - 팀 목록
 * @param {readonly Pick<HackathonVote, "teamId">[]} votes - 투표 목록
 * @returns {{ team: HackathonTeam; count: number }[]} 집계 결과
 */
export function tallyVotes(
  teams: readonly HackathonTeam[],
  votes: readonly Pick<HackathonVote, "teamId">[]
): { team: HackathonTeam; count: number }[] {
  const counts = new Map<string, number>();
  for (const vote of votes) {
    counts.set(vote.teamId, (counts.get(vote.teamId) ?? 0) + 1);
  }
  const rows = teams.map((team, index) => ({
    team,
    count: counts.get(team.id) ?? 0,
    index,
  }));
  rows.sort((a, b) => b.count - a.count || a.index - b.index);
  return rows.map(({ team, count }) => ({ team, count }));
}

/**
 * 제출 문서 ID를 만듭니다.
 *
 * @param {string} hackathonId - 행사 ID
 * @param {string} teamId - 팀 ID
 * @returns {string} `${hackathonId}_${teamId}`
 */
export function buildTeamDocId(hackathonId: string, teamId: string): string {
  return `${hackathonId}_${teamId}`;
}

/**
 * 투표 문서 ID를 만듭니다. 회원당 1표를 문서 ID로 보장합니다.
 *
 * @param {string} hackathonId - 행사 ID
 * @param {string} memberId - 회원 문서 ID
 * @returns {string} `${hackathonId}_${memberId}`
 */
export function buildVoteDocId(hackathonId: string, memberId: string): string {
  return `${hackathonId}_${memberId}`;
}
