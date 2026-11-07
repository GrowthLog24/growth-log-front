import type {
  Hackathon,
  HackathonTeam,
  HackathonTeamMember,
} from "@/domain/hackathon/types";

/** KST(UTC+9) 오프셋 (밀리초) */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 제출 코드 자릿수 */
const CODE_LENGTH = 4;

/** 제출 코드 경우의 수 (0000~9999) */
const CODE_SPACE = 10 ** CODE_LENGTH;

/** 기본 설정 시작·마감 시각 (KST, HH:mm) */
export const DEFAULT_START_TIME = "15:30";
export const DEFAULT_END_TIME = "17:10";

/** 참가자 제출 페이지 경로 */
export const HACKATHON_SUBMIT_PATH = "/hackathon";

/**
 * epoch ms를 KST 기준 datetime-local 입력값("YYYY-MM-DDTHH:mm")으로 바꿉니다.
 *
 * @param {number} ms - epoch milliseconds
 * @returns {string} 예: "2026-11-07T15:30"
 */
export function toKstInputValue(ms: number): string {
  return new Date(ms + KST_OFFSET_MS).toISOString().slice(0, 16);
}

/**
 * KST 기준 datetime-local 입력값을 epoch ms로 바꿉니다.
 *
 * @param {string} value - "YYYY-MM-DDTHH:mm" 형식
 * @returns {number | null} 형식이 잘못되면 null
 */
export function fromKstInputValue(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const ms = Date.parse(`${value}:00+09:00`);
  return Number.isNaN(ms) ? null : ms;
}

/**
 * 주어진 시각이 속한 KST 날짜의 특정 시각(HH:mm)을 epoch ms로 만듭니다.
 *
 * @param {number} now - 기준 시각 (epoch ms)
 * @param {string} time - "HH:mm"
 * @returns {number} 같은 KST 날짜의 해당 시각
 */
export function kstTodayAt(now: number, time: string): number {
  const date = new Date(now + KST_OFFSET_MS).toISOString().slice(0, 10);
  return Date.parse(`${date}T${time}:00+09:00`);
}

/**
 * 빈 행사 설정을 만듭니다. (오늘 15:30~17:10 KST, 팀 없음, 투표·점수 비공개)
 *
 * @param {object} params - 생성 기준값
 * @returns {Omit<Hackathon, "id" | "updatedAt">} 저장할 설정
 */
export function buildDefaultConfig(params: {
  now: number;
  meetingId: string | null;
}): Omit<Hackathon, "id" | "updatedAt"> {
  return {
    title: "100분 해커톤",
    startAt: kstTodayAt(params.now, DEFAULT_START_TIME),
    endAt: kstTodayAt(params.now, DEFAULT_END_TIME),
    teams: [],
    meetingId: params.meetingId,
    scoresPublic: false,
    votingOpen: false,
  };
}

/**
 * 기존 코드와 겹치지 않는 4자리 제출 코드를 만듭니다.
 *
 * @param {readonly string[]} existing - 이미 쓰는 코드 목록
 * @param {() => number} random - [0, 1) 난수 생성기 (테스트 주입용)
 * @returns {string} 예: "0427"
 * @throws {Error} 사용할 수 있는 코드가 없을 때
 */
export function generateUniqueCode(
  existing: readonly string[],
  random: () => number = secureRandom
): string {
  const used = new Set(existing);
  if (used.size >= CODE_SPACE) {
    throw new Error("사용할 수 있는 4자리 코드가 없습니다.");
  }
  for (let attempt = 0; attempt < 1000; attempt++) {
    const code = formatCode(Math.floor(random() * CODE_SPACE));
    if (!used.has(code)) return code;
  }
  for (let n = 0; n < CODE_SPACE; n++) {
    const code = formatCode(n);
    if (!used.has(code)) return code;
  }
  throw new Error("사용할 수 있는 4자리 코드가 없습니다.");
}

function formatCode(n: number): string {
  return String(n).padStart(CODE_LENGTH, "0");
}

function secureRandom(): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] / 2 ** 32;
}

/**
 * 코드 표에서 한 팀의 코드를 새로 발급한 새 객체를 반환합니다.
 *
 * @param {Readonly<Record<string, string>>} codes - 현재 코드 표
 * @param {string} teamId - 재발급할 팀
 * @returns {Record<string, string>} 새 코드 표
 */
export function reissueCode(
  codes: Readonly<Record<string, string>>,
  teamId: string
): Record<string, string> {
  const others = Object.entries(codes)
    .filter(([id]) => id !== teamId)
    .map(([, code]) => code);
  return { ...codes, [teamId]: generateUniqueCode(others) };
}

/**
 * 코드가 없는 팀에만 코드를 발급한 새 코드 표를 반환합니다.
 *
 * @param {Readonly<Record<string, string>>} codes - 현재 코드 표
 * @param {readonly HackathonTeam[]} teams - 팀 목록
 * @returns {Record<string, string>} 새 코드 표
 */
export function fillMissingCodes(
  codes: Readonly<Record<string, string>>,
  teams: readonly HackathonTeam[]
): Record<string, string> {
  const result: Record<string, string> = { ...codes };
  for (const team of teams) {
    if (!result[team.id]) {
      result[team.id] = generateUniqueCode(Object.values(result));
    }
  }
  return result;
}

/** 이름 매칭용 회원 최소 정보 */
export interface MemberCandidate {
  id: string;
  memberName: string;
  generation: number;
  isActive: boolean;
}

/** 회원 매칭 결과 */
export type MemberMatch = "matched" | "ambiguous" | "unmatched";

/** 매칭 결과가 붙은 팀원 */
export interface ResolvedMember extends HackathonTeamMember {
  match: MemberMatch;
}

/**
 * 쉼표로 구분된 이름 문자열을 이름 배열로 나눕니다. 빈 항목은 버립니다.
 *
 * @param {string} text - 예: "홍길동, 김철수,"
 * @returns {string[]} 예: ["홍길동", "김철수"]
 */
export function parseMemberNames(text: string): string[] {
  return text
    .split(/[,，\n]/)
    .map((name) => name.trim())
    .filter(Boolean);
}

/**
 * 이름으로 회원 ID를 찾습니다. 기존 팀원과 이름이 같으면 저장된 memberId를 유지하고,
 * 아니면 members 컬렉션의 memberName 정확 일치로 찾습니다.
 * 동명이인은 가입 중인 회원 → 최신 기수 순으로 하나를 고르고 ambiguous로 표시합니다.
 *
 * @param {string} name - 팀원 이름
 * @param {readonly HackathonTeamMember[]} previous - 기존 팀원 (ID 보존용)
 * @param {readonly MemberCandidate[]} members - 회원 목록
 * @returns {ResolvedMember} 매칭 결과
 */
export function resolveMember(
  name: string,
  previous: readonly HackathonTeamMember[],
  members: readonly MemberCandidate[]
): ResolvedMember {
  const kept = previous.find((p) => p.name === name && p.memberId);
  const candidates = members.filter((m) => m.memberName.trim() === name);
  if (kept) {
    const match = candidates.length > 1 ? "ambiguous" : "matched";
    return { memberId: kept.memberId, name, match };
  }
  if (candidates.length === 0) return { memberId: null, name, match: "unmatched" };
  const sorted = [...candidates].sort(
    (a, b) => Number(b.isActive) - Number(a.isActive) || b.generation - a.generation
  );
  return {
    memberId: sorted[0].id,
    name,
    match: candidates.length > 1 ? "ambiguous" : "matched",
  };
}

/**
 * 쉼표 문자열을 매칭 결과가 붙은 팀원 목록으로 바꿉니다.
 *
 * @param {string} text - 쉼표로 구분된 이름
 * @param {readonly HackathonTeamMember[]} previous - 기존 팀원
 * @param {readonly MemberCandidate[]} members - 회원 목록
 * @returns {ResolvedMember[]} 팀원 목록
 */
export function resolveMembersText(
  text: string,
  previous: readonly HackathonTeamMember[],
  members: readonly MemberCandidate[]
): ResolvedMember[] {
  return parseMemberNames(text).map((name) => resolveMember(name, previous, members));
}

/**
 * 기존 팀 ID와 겹치지 않는 다음 팀을 만듭니다. (team-N / N팀)
 *
 * @param {readonly { id: string }[]} teams - 현재 팀 목록
 * @returns {{ id: string; name: string }} 새 팀 ID·이름
 */
export function nextTeamIdentity(teams: readonly { id: string }[]): {
  id: string;
  name: string;
} {
  const ids = new Set(teams.map((team) => team.id));
  let n = teams.length + 1;
  while (ids.has(`team-${n}`)) n++;
  return { id: `team-${n}`, name: `${n}팀` };
}
