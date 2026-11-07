import { HACKATHON_TRACKS } from "@/domain/hackathon/constants";
import type {
  Hackathon,
  HackathonScore,
  HackathonSubmission,
  HackathonTeam,
  HackathonVote,
} from "@/domain/hackathon/types";

/** KST(UTC+9) 오프셋 (밀리초) */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 값이 비었을 때 표시 문자열 */
const EMPTY_MARK = "-";

/**
 * epoch ms를 KST 기준 "YYYY-MM-DD HH:mm:ss" 문자열로 바꿉니다.
 * 실행 환경의 타임존과 무관하게 항상 KST로 표시합니다.
 *
 * @param {number} ms - epoch milliseconds
 * @returns {string} 예: "2026-11-07 17:05:12"
 */
export function formatKstDateTime(ms: number): string {
  const iso = new Date(ms + KST_OFFSET_MS).toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 19)}`;
}

/**
 * epoch ms를 KST 기준 "HH:mm:ss" 문자열로 바꿉니다.
 *
 * @param {number} ms - epoch milliseconds
 * @returns {string} 예: "17:05:12"
 */
export function formatKstTime(ms: number): string {
  return new Date(ms + KST_OFFSET_MS).toISOString().slice(11, 19);
}

/**
 * 팀 구성원 이름을 쉼표로 이어 붙입니다.
 *
 * @param {HackathonTeam | undefined} team - 팀 (없으면 빈 목록)
 * @returns {string} 예: "홍길동, 김철수" (없으면 "-")
 */
export function formatTeamMembers(team: HackathonTeam | undefined): string {
  if (!team || team.members.length === 0) return EMPTY_MARK;
  return team.members.map((member) => member.name).join(", ");
}

function orEmpty(value: string): string {
  const trimmed = value.trim();
  return trimmed ? trimmed : EMPTY_MARK;
}

function formatTrack(track: HackathonSubmission["track"]): string {
  const info = HACKATHON_TRACKS[track];
  return info ? `${track} (${info.name} — ${info.description})` : orEmpty(track);
}

function buildPlanSection(title: string, body: string): string[] {
  return [`### ${title}`, "", orEmpty(body), ""];
}

/**
 * 한 팀의 제출물을 Markdown 섹션으로 만듭니다. 미제출 팀은 "(미제출)"로 표시합니다.
 * AI 채점 세션에 그대로 붙여 넣을 수 있도록 팀 ID·링크·기획 3항목을 모두 포함합니다.
 *
 * @param {HackathonTeam | undefined} team - 팀 정보 (설정에서 삭제된 팀이면 undefined)
 * @param {HackathonSubmission | undefined} submission - 제출물 (미제출이면 undefined)
 * @returns {string} Markdown 문자열 (끝에 개행 포함)
 */
export function buildTeamMarkdown(
  team: HackathonTeam | undefined,
  submission: HackathonSubmission | undefined
): string {
  const teamName = team?.name ?? submission?.teamName ?? "알 수 없는 팀";
  const teamId = team?.id ?? submission?.teamId ?? EMPTY_MARK;

  if (!submission) {
    return [
      `## ${teamName} — (미제출)`,
      "",
      `- 팀 ID: ${teamId}`,
      `- 팀원: ${formatTeamMembers(team)}`,
      "",
    ].join("\n");
  }

  const lines = [
    `## ${teamName} — ${orEmpty(submission.projectName)}`,
    "",
    `- 팀 ID: ${teamId}`,
    `- 팀원: ${formatTeamMembers(team)}`,
    `- 트랙: ${formatTrack(submission.track)}`,
    `- 프로젝트: ${orEmpty(submission.projectName)}`,
    `- 한 줄 소개: ${orEmpty(submission.oneLiner)}`,
    `- GitHub: ${orEmpty(submission.githubUrl)}`,
    `- 배포 링크: ${orEmpty(submission.deployUrl)}`,
    `- 시연 자료: ${orEmpty(submission.demoUrl)}`,
    `- PRD·기획 문서: ${orEmpty(submission.prdUrl)}`,
    `- 제출 시각: ${formatKstDateTime(submission.submittedAt)} (KST) · 제출 ${submission.submitCount}회`,
    `- 마감 후 제출: ${submission.isLate ? "예 (지각 제출)" : "아니오"}`,
    "",
    ...buildPlanSection("기획 — 목적", submission.planPurpose),
    ...buildPlanSection("기획 — 핵심 기능·비즈니스 로직", submission.planFeatures),
    ...buildPlanSection("기획 — 예상 결과", submission.planExpected),
  ];
  return lines.join("\n");
}

/**
 * 팀 순서대로 (팀, 제출물) 쌍을 만듭니다. 설정에 없는 팀의 제출물은 뒤에 붙입니다.
 *
 * @param {readonly HackathonTeam[]} teams - 설정의 팀 목록
 * @param {readonly HackathonSubmission[]} submissions - 제출물 목록
 * @returns {{ team: HackathonTeam | undefined; submission: HackathonSubmission | undefined }[]}
 */
export function pairTeamsWithSubmissions(
  teams: readonly HackathonTeam[],
  submissions: readonly HackathonSubmission[]
): { team: HackathonTeam | undefined; submission: HackathonSubmission | undefined }[] {
  const byTeamId = new Map(submissions.map((s) => [s.teamId, s]));
  const knownTeamIds = new Set(teams.map((team) => team.id));
  const pairs: {
    team: HackathonTeam | undefined;
    submission: HackathonSubmission | undefined;
  }[] = teams.map((team) => ({ team, submission: byTeamId.get(team.id) }));
  for (const submission of submissions) {
    if (!knownTeamIds.has(submission.teamId)) {
      pairs.push({ team: undefined, submission });
    }
  }
  return pairs;
}

/**
 * 전체 제출물 Markdown 문서를 만듭니다. AI 채점 세션에 붙여 넣는 용도입니다.
 *
 * @param {object} params - 문서 생성에 필요한 값
 * @param {Hackathon} params.hackathon - 행사 설정
 * @param {readonly HackathonSubmission[]} params.submissions - 제출물 목록
 * @param {number} params.generatedAt - 문서 생성 시각 (epoch ms)
 * @returns {string} Markdown 문서
 *
 * @example
 * buildSubmissionsMarkdown({ hackathon, submissions, generatedAt: Date.now() });
 * // => "# 100분 해커톤 제출물\n\n- 행사 ID: ..."
 */
export function buildSubmissionsMarkdown(params: {
  hackathon: Hackathon;
  submissions: readonly HackathonSubmission[];
  generatedAt: number;
}): string {
  const { hackathon, submissions, generatedAt } = params;
  const pairs = pairTeamsWithSubmissions(hackathon.teams, submissions);
  const submittedCount = pairs.filter((pair) => pair.submission).length;
  const header = [
    `# ${hackathon.title || "해커톤"} 제출물`,
    "",
    `- 행사 ID: ${hackathon.id}`,
    `- 제작 시간: ${formatKstDateTime(hackathon.startAt)} ~ ${formatKstDateTime(hackathon.endAt)} (KST)`,
    `- 제출 팀: ${submittedCount} / ${pairs.length}`,
    `- 문서 생성: ${formatKstDateTime(generatedAt)} (KST)`,
    "",
  ].join("\n");
  const sections = pairs.map(({ team, submission }) =>
    buildTeamMarkdown(team, submission)
  );
  return [header, ...sections].join("\n---\n\n");
}

/** JSON 내보내기 문서 형태 (팀 제출 코드는 포함하지 않음) */
export interface HackathonExportJson {
  exportedAt: number;
  hackathon: Hackathon;
  submissions: HackathonSubmission[];
  scores: HackathonScore[];
  votes: HackathonVote[];
}

/**
 * JSON 다운로드용 문서를 만듭니다. 팀 제출 코드(secrets)는 의도적으로 제외합니다.
 *
 * @param {object} params - 내보낼 데이터
 * @returns {HackathonExportJson} 직렬화 가능한 객체 (입력 배열은 복사됨)
 */
export function buildExportJson(params: {
  hackathon: Hackathon;
  submissions: readonly HackathonSubmission[];
  scores: readonly HackathonScore[];
  votes: readonly HackathonVote[];
  exportedAt: number;
}): HackathonExportJson {
  return {
    exportedAt: params.exportedAt,
    hackathon: params.hackathon,
    submissions: [...params.submissions],
    scores: [...params.scores],
    votes: [...params.votes],
  };
}
