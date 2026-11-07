import type {
  Hackathon,
  HackathonScore,
  HackathonSubmission,
  HackathonTeam,
} from "@/domain/hackathon/types";
import type { LiveData } from "./useLiveData";

/**
 * 개발 환경 전용 미리보기 (`/hackathon/live?preview=building` 등).
 * Firestore 없이 각 화면 상태를 리허설·스크린샷하기 위한 고정 데이터입니다.
 */
export const LIVE_PREVIEW_KINDS = [
  "empty",
  "before",
  "building",
  "notice20",
  "notice10",
  "notice1",
  "ended",
  "voting",
  "results",
] as const;

export type LivePreviewKind = (typeof LIVE_PREVIEW_KINDS)[number];

const MINUTE_MS = 60_000;

/**
 * 문자열이 미리보기 종류인지 확인합니다.
 *
 * @param {string | null} value - 쿼리 값
 * @returns {boolean} 미리보기 종류이면 true
 */
export function isLivePreviewKind(value: string | null): value is LivePreviewKind {
  return LIVE_PREVIEW_KINDS.some((kind) => kind === value);
}

const TEAMS: HackathonTeam[] = [
  ["김하늘", "이도윤", "박서연"],
  ["최민준", "정유나", "한지호", "오세린"],
  ["윤태오", "강다은", "임재현"],
  ["서지민", "조하람", "신예준"],
  ["문가온", "배수아", "황준서", "송채원"],
].map((names, i) => ({
  id: `team-${i + 1}`,
  name: `${i + 1}팀`,
  members: names.map((name) => ({ memberId: null, name })),
}));

const PROJECTS = [
  ["스터디 메이트", "출석 체크 기반으로 스터디 짝을 매칭해 주는 서비스"],
  ["그로스 퀴즈", "정기모임 발표 내용을 퀴즈로 복습하는 웹앱"],
  ["모각코 지도", "근처에서 모각코 중인 회원을 지도에서 찾아보세요"],
];

function buildSubmission(index: number, at: number, endAt: number): HackathonSubmission {
  const team = TEAMS[index];
  const [projectName, oneLiner] = PROJECTS[index % PROJECTS.length];
  return {
    id: `preview_${team.id}`,
    hackathonId: "preview",
    teamId: team.id,
    teamName: team.name,
    projectName,
    track: "A",
    githubUrl: "https://github.com/growthlog/preview",
    oneLiner,
    deployUrl: "",
    demoUrl: "https://example.com",
    planPurpose: "",
    planFeatures: "",
    planExpected: "",
    prdUrl: "",
    firstSubmittedAt: at,
    submittedAt: at,
    submitCount: index === 1 ? 3 : 1,
    isLate: at > endAt,
  };
}

function buildScore(index: number, total: number): HackathonScore {
  const team = TEAMS[index];
  return {
    id: `preview_${team.id}`,
    hackathonId: "preview",
    teamId: team.id,
    total,
    max: 100,
    criteria: [
      { key: "idea", label: "문제 정의", score: Math.round(total * 0.3), max: 30, comment: "" },
      { key: "impl", label: "구현 완성도", score: Math.round(total * 0.25), max: 30, comment: "" },
      { key: "ux", label: "사용성", score: Math.round(total * 0.22), max: 20, comment: "" },
      { key: "biz", label: "비즈니스 로직", score: Math.round(total * 0.18), max: 20, comment: "" },
    ],
    summary: "",
    gradedBy: "preview",
    submissionVersion: 0,
    gradedAt: 0,
  };
}

/** 미리보기 종류별 (시작, 마감) 시각 오프셋 (분, 현재 기준) */
const WINDOW_OFFSETS: Record<LivePreviewKind, [number, number]> = {
  empty: [10, 110],
  before: [75, 175],
  building: [-55, 45],
  notice20: [-84, 16],
  notice10: [-93, 7],
  notice1: [-99.5, 0.5],
  ended: [-130, -30],
  voting: [-150, -50],
  results: [-170, -70],
};

/**
 * 미리보기 데이터를 만듭니다.
 *
 * @param {LivePreviewKind} kind - 미리보기 종류
 * @param {number} base - 기준 시각 (페이지 진입 시각)
 * @returns {LiveData} 대시보드 데이터
 */
export function buildLivePreview(kind: LivePreviewKind, base: number): LiveData {
  if (kind === "empty") {
    return { config: null, submissions: [], scores: [], isDisconnected: false };
  }
  const [startOffset, endOffset] = WINDOW_OFFSETS[kind];
  const startAt = base + startOffset * MINUTE_MS;
  const endAt = base + endOffset * MINUTE_MS;
  const config: Hackathon = {
    id: "preview",
    title: "100분 해커톤",
    startAt,
    endAt,
    teams: TEAMS,
    meetingId: null,
    scoresPublic: kind === "results",
    votingOpen: kind === "voting",
    updatedAt: base,
  };
  const submitted = kind === "before" ? [] : [0, 1, 3];
  const submissions = submitted.map((i, order) =>
    buildSubmission(i, startAt + (10 + order * 12) * MINUTE_MS, endAt)
  );
  if (kind === "ended" || kind === "voting" || kind === "results") {
    submissions.push(buildSubmission(2, endAt + 2 * MINUTE_MS, endAt));
  }
  const scores = [buildScore(0, 82), buildScore(1, 91), buildScore(3, 76), buildScore(2, 82)];
  return { config, submissions, scores, isDisconnected: kind === "notice10" };
}
