import { describe, it, expect } from "vitest";
import {
  checkVoteEligibility,
  formatRemaining,
  getHackathonPhase,
  isGithubRepoUrl,
  normalizeSubmissionInput,
  tallyVotes,
  validateSubmission,
} from "./rules";
import type { HackathonSubmissionInput, HackathonTeam } from "./types";

const TEAMS: HackathonTeam[] = [
  { id: "team-1", name: "1팀", members: [{ memberId: "m1", name: "가" }] },
  { id: "team-2", name: "2팀", members: [{ memberId: "m2", name: "나" }] },
  { id: "team-3", name: "3팀", members: [{ memberId: null, name: "다" }] },
];

const VALID_INPUT: HackathonSubmissionInput = {
  projectName: "그로스봇",
  track: "C",
  githubUrl: "https://github.com/growthlog/bot",
  oneLiner: "출석을 자동으로 챙겨주는 봇",
  deployUrl: "https://bot.vercel.app",
  demoUrl: "",
  planPurpose: "운영 부담 줄이기",
  planFeatures: "출석 알림",
  planExpected: "운영 시간 절반",
  prdUrl: "",
};

describe("getHackathonPhase", () => {
  const window = { startAt: 1000, endAt: 2000 };
  it("시작 전이면 before", () => {
    expect(getHackathonPhase(999, window)).toBe("before");
  });
  it("시작 시각부터 building", () => {
    expect(getHackathonPhase(1000, window)).toBe("building");
  });
  it("마감 시각부터 ended", () => {
    expect(getHackathonPhase(2000, window)).toBe("ended");
  });
});

describe("formatRemaining", () => {
  it("1시간 이상이면 H:MM:SS", () => {
    expect(formatRemaining(100 * 60 * 1000)).toBe("1:40:00");
  });
  it("1시간 미만이면 MM:SS", () => {
    expect(formatRemaining(9 * 60 * 1000 + 5000)).toBe("09:05");
  });
  it("남은 초는 올림 처리", () => {
    expect(formatRemaining(500)).toBe("00:01");
  });
  it("음수는 00:00", () => {
    expect(formatRemaining(-5000)).toBe("00:00");
  });
});

describe("isGithubRepoUrl", () => {
  it("저장소 URL 허용", () => {
    expect(isGithubRepoUrl("https://github.com/a/b")).toBe(true);
  });
  it("계정 URL만 있으면 거부", () => {
    expect(isGithubRepoUrl("https://github.com/a")).toBe(false);
  });
  it("github가 아닌 호스트 거부", () => {
    expect(isGithubRepoUrl("https://gitlab.com/a/b")).toBe(false);
  });
  it("URL이 아니면 거부", () => {
    expect(isGithubRepoUrl("github.com/a/b")).toBe(false);
  });
});

describe("validateSubmission", () => {
  it("올바른 입력은 오류 없음", () => {
    expect(validateSubmission(VALID_INPUT)).toEqual({});
  });
  it("배포·시연 링크가 모두 없으면 demoUrl 오류", () => {
    const errors = validateSubmission({ ...VALID_INPUT, deployUrl: "" });
    expect(errors.demoUrl).toBeDefined();
  });
  it("잘못된 선택 링크는 오류", () => {
    const errors = validateSubmission({ ...VALID_INPUT, prdUrl: "notion" });
    expect(errors.prdUrl).toBeDefined();
  });
  it("필수 항목 누락 시 각각 오류", () => {
    const errors = validateSubmission(normalizeSubmissionInput({}));
    expect(Object.keys(errors)).toEqual(
      expect.arrayContaining([
        "projectName",
        "track",
        "githubUrl",
        "oneLiner",
        "demoUrl",
        "planPurpose",
        "planFeatures",
        "planExpected",
      ])
    );
  });
});

describe("normalizeSubmissionInput", () => {
  it("문자열은 trim, 문자열이 아니면 빈 문자열", () => {
    const result = normalizeSubmissionInput({ projectName: "  봇 ", oneLiner: 3 });
    expect(result.projectName).toBe("봇");
    expect(result.oneLiner).toBe("");
  });
  it("객체가 아니면 모두 빈 값", () => {
    expect(normalizeSubmissionInput(null).githubUrl).toBe("");
  });
});

describe("checkVoteEligibility", () => {
  const base = {
    votingOpen: true,
    hasAttended: true,
    hasVoted: false,
    memberId: "m9",
    targetTeamId: "team-1",
    teams: TEAMS,
  };
  it("조건을 모두 만족하면 null", () => {
    expect(checkVoteEligibility(base)).toBeNull();
  });
  it("투표가 닫혀 있으면 voting-closed", () => {
    expect(checkVoteEligibility({ ...base, votingOpen: false })).toBe("voting-closed");
  });
  it("없는 팀이면 unknown-team", () => {
    expect(checkVoteEligibility({ ...base, targetTeamId: "x" })).toBe("unknown-team");
  });
  it("출석하지 않았으면 not-attended", () => {
    expect(checkVoteEligibility({ ...base, hasAttended: false })).toBe("not-attended");
  });
  it("이미 투표했으면 already-voted", () => {
    expect(checkVoteEligibility({ ...base, hasVoted: true })).toBe("already-voted");
  });
  it("본인 팀이면 own-team", () => {
    expect(checkVoteEligibility({ ...base, memberId: "m1" })).toBe("own-team");
  });
});

describe("tallyVotes", () => {
  it("득표 내림차순, 동률은 팀 순서 유지", () => {
    const result = tallyVotes(TEAMS, [
      { teamId: "team-2" },
      { teamId: "team-3" },
      { teamId: "team-3" },
      { teamId: "team-1" },
    ]);
    expect(result.map((row) => [row.team.id, row.count])).toEqual([
      ["team-3", 2],
      ["team-1", 1],
      ["team-2", 1],
    ]);
  });
  it("표가 없으면 모두 0", () => {
    expect(tallyVotes(TEAMS, []).every((row) => row.count === 0)).toBe(true);
  });
});
